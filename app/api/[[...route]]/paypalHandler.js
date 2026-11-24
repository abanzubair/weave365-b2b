/**
 * @file app/api/[[...route]]/paypalHandler.js
 * @description Server-side PayPal Orders v2 REST API handler for Weave365 international payments.
 *
 * Handles:
 * 1. POST /api/paypal/create-order  -> Creates pending order in Supabase + PayPal Order, returns approve_url
 * 2. POST /api/paypal/capture-order -> Server-to-server capture & verification after customer returns from PayPal
 * 3. POST /api/paypal/cancel-order  -> Cleans up pending draft order if buyer cancels on PayPal
 * 4. POST /api/paypal/webhook       -> Verified PayPal webhook handler (idempotent)
 *
 * Environment Variables Required to Activate:
 * - NEXT_PUBLIC_PAYPAL_ENABLED=true
 * - PAYPAL_CLIENT_ID
 * - PAYPAL_CLIENT_SECRET
 * - PAYPAL_ENVIRONMENT = 'SANDBOX' | 'PRODUCTION' (defaults to 'SANDBOX')
 * - PAYPAL_WEBHOOK_ID (optional, required for webhook signature verification)
 *
 * Notes:
 * - Cashfree and PhonePe are reserved for domestic Indian (INR) payments.
 * - Cross-border PayPal currencies (USD, EUR, GBP, CAD, AUD, SGD, JPY, etc.) settle in the buyer's currency.
 * - Currencies not supported for cross-border India merchants (e.g. AED, QAR, SAR, KWD, OMR, BHD, BRL, MYR)
 *   automatically settle in USD using live exchange rates.
 */

import { createClient } from '@supabase/supabase-js';
import { sendBuyerOrderConfirmationEmail } from './buyerEmailService.js';
import { recordCouponUsage } from './couponsHandler.js';
import { getExchangeRates, DEFAULT_BASELINE_RATES } from '../../../src/services/exchangeRateService.js';
import { roundCurrency } from '../../../src/services/pricingService.js';

export const runtime = 'edge';

// PayPal Orders v2 cross-border supported currencies for Indian merchants
// (excludes INR and in-country-only BRL/MYR so those settle cleanly in USD)
export const PAYPAL_SUPPORTED_CURRENCIES = new Set([
  'USD', 'AUD', 'CAD', 'CZK', 'DKK', 'EUR', 'HKD', 'HUF',
  'ILS', 'JPY', 'MXN', 'TWD', 'NZD', 'NOK', 'PHP', 'PLN',
  'GBP', 'SGD', 'SEK', 'CHF', 'THB',
]);

// PayPal requires integer strings (no decimal places) for these currencies
const PAYPAL_ZERO_DECIMAL_CURRENCIES = new Set(['HUF', 'JPY', 'TWD']);

const ALLOWED_ORIGINS = [
  'https://www.weave365.com',
  'https://weave365.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function getCorsHeaders(request) {
  const origin = request?.headers?.get('origin');
  const isAllowed = origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.weave365.com'));

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://www.weave365.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function getPayPalConfig() {
  const env = (process.env.PAYPAL_ENVIRONMENT || 'SANDBOX').toUpperCase();
  const isProd = env === 'PRODUCTION' || env === 'PROD' || env === 'LIVE';

  return {
    env,
    isProd,
    apiBase: isProd ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
  };
}

let supabaseAdminInstance = null;
function getSupabaseAdmin() {
  if (supabaseAdminInstance) return supabaseAdminInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase server credentials missing in environment.');
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
  return supabaseAdminInstance;
}

export function formatPayPalAmount(amount, currency = 'USD') {
  const curr = String(currency || 'USD').toUpperCase();
  const num = Number(amount) || 0;
  if (PAYPAL_ZERO_DECIMAL_CURRENCIES.has(curr)) {
    return String(Math.round(num));
  }
  return num.toFixed(2);
}

export function resolvePayPalSettlement({
  requestedCurrency = 'USD',
  requestedAmount = 0,
  baseInrTotal = 0,
  rates = DEFAULT_BASELINE_RATES,
}) {
  const curr = String(requestedCurrency || 'USD').trim().toUpperCase();
  const amountNum = Number(requestedAmount) || 0;

  if (PAYPAL_SUPPORTED_CURRENCIES.has(curr)) {
    const settledAmount = PAYPAL_ZERO_DECIMAL_CURRENCIES.has(curr)
      ? Math.round(amountNum)
      : roundCurrency(amountNum, curr);
    return {
      settlementCurrency: curr,
      settlementAmount: settledAmount,
      formattedValue: formatPayPalAmount(settledAmount, curr),
      convertedToUsd: false,
    };
  }

  const usdRate = Number(rates?.USD || DEFAULT_BASELINE_RATES.USD || 0.0118);
  const localRate = Number(rates?.[curr] || DEFAULT_BASELINE_RATES[curr] || 0);

  let usdAmount = 0;
  if (Number(baseInrTotal) > 0 && usdRate > 0) {
    usdAmount = roundCurrency(Number(baseInrTotal) * usdRate, 'USD');
  } else if (amountNum > 0 && localRate > 0 && usdRate > 0) {
    usdAmount = roundCurrency((amountNum / localRate) * usdRate, 'USD');
  }

  return {
    settlementCurrency: 'USD',
    settlementAmount: usdAmount,
    formattedValue: formatPayPalAmount(usdAmount, 'USD'),
    convertedToUsd: true,
  };
}

let cachedToken = null;

async function getAccessToken(pp) {
  const cacheKey = `${pp.env}:${pp.clientId}`;
  if (cachedToken && cachedToken.cacheKey === cacheKey && cachedToken.expiresAtMs - 60_000 > Date.now()) {
    return cachedToken.value;
  }

  const credentials = btoa(`${pp.clientId}:${pp.clientSecret}`);
  const res = await fetch(`${pp.apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    console.error('[PayPal] OAuth token error:', res.status, data);
    throw new Error(data.error_description || data.message || 'PayPal authorization failed. Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
  }

  cachedToken = {
    value: data.access_token,
    expiresAtMs: Date.now() + (Number(data.expires_in) || 3000) * 1000,
    cacheKey,
  };
  return cachedToken.value;
}

async function paypalFetch(pp, path, init = {}) {
  const token = await getAccessToken(pp);
  return fetch(`${pp.apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
}

async function markPayPalOrderPaid({ supabase, paypalOrderId, captureId, paidValue, paidCurrency, source }) {
  const lookupId = `PAYPAL_${paypalOrderId}`;
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, order_delivery_addresses(*), order_dropship_senders(*), order_items(*), order_fulfillments(*)')
    .eq('cf_order_id', lookupId)
    .maybeSingle();

  if (error || !order) {
    console.warn(`[PayPal ${source}] No order found for ${lookupId}`, error || '');
    return { ok: false, reason: 'order_not_found' };
  }

  if (order.status === 'pending_payment') {
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_method: 'paypal',
        cf_payment_id: captureId || paypalOrderId,
        message: `${order.message || ''}\n\n[PayPal ${source} Confirmed] Capture: ${captureId || 'N/A'} (${paidCurrency || ''} ${paidValue || ''}) at ${new Date().toISOString()}`,
      })
      .eq('id', order.id)
      .eq('status', 'pending_payment');
  }

  try {
    await sendBuyerOrderConfirmationEmail({ orderId: order.id, order, supabase });
    if (order.coupon_code) {
      await recordCouponUsage(supabase, {
        couponCode: order.coupon_code,
        orderId: order.id,
        orderNumber: order.order_number,
        userId: order.user_id,
        email: order.email,
        phone: order.phone,
        discountAmount: order.coupon_discount,
        orderTotal: order.total_amount,
      });
    }
  } catch (emailErr) {
    console.error(`[PayPal ${source}] Post-payment email/coupon error:`, emailErr);
  }

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.order_number || (order.id ? `ORD-${order.id.slice(0, 8).toUpperCase()}` : null),
    orderAmount: Number(paidValue) || Number(order.total_amount) || 0,
    orderCurrency: paidCurrency || 'USD',
  };
}

export async function handleCreateOrder(request) {
  const corsHeaders = getCorsHeaders(request);
  const pp = getPayPalConfig();

  if (!pp.clientId || !pp.clientSecret) {
    return Response.json(
      { success: false, error: 'PayPal international payments are coming soon. PayPal credentials are not configured yet.' },
      { status: 503, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const {
      user_id,
      email,
      delivery_details = {},
      dropship_details = {},
      items = [],
      total_amount = 0,
      currency = 'USD',
      currency_symbol = '$',
      base_inr_total = 0,
      country_code = 'US',
      country_name = 'United States',
      shipping_mode = 'standard',
      shipping_speed = 'standard',
      shipping_amount = 0,
      coupon_code = null,
      coupon_discount = 0,
      notes = '',
    } = body;

    const resolvedCountryCode = String(delivery_details.country_code || country_code || 'US').trim().toUpperCase();
    const requestedCurrency = String(currency || 'USD').trim().toUpperCase();

    if (resolvedCountryCode === 'IN' || requestedCurrency === 'INR') {
      return Response.json(
        { success: false, error: 'PayPal is only available for international orders. Please use PhonePe or Cashfree for Indian (INR) orders.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const fullName = String(delivery_details.full_name || '').trim();
    const phone = String(delivery_details.phone_number || '').trim();
    const addr1 = String(delivery_details.address_line1 || '').trim();
    const city = String(delivery_details.city || '').trim();
    const state = String(delivery_details.state || '').trim();
    const pincode = String(delivery_details.pincode || '').trim();

    if (!fullName || !phone || !addr1 || !city || !state || !pincode) {
      return Response.json(
        { success: false, error: 'Recipient name, phone, address, city, state, and postal code are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Array.isArray(items) || items.length === 0 || Number(total_amount) <= 0) {
      return Response.json(
        { success: false, error: 'Invalid cart or order amount.' },
        { status: 400, headers: corsHeaders }
      );
    }

    let rates = DEFAULT_BASELINE_RATES;
    try {
      const rateRes = await getExchangeRates();
      if (rateRes?.rates) rates = rateRes.rates;
    } catch {
      // Fall back to baseline rates
    }

    const settlement = resolvePayPalSettlement({
      requestedCurrency,
      requestedAmount: Number(total_amount),
      baseInrTotal: Number(base_inr_total),
      rates,
    });

    if (!Number.isFinite(settlement.settlementAmount) || settlement.settlementAmount <= 0) {
      return Response.json(
        { success: false, error: 'Unable to calculate valid PayPal settlement amount.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const isDropship = shipping_mode === 'dropship';
    const supabase = getSupabaseAdmin();

    try {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      await supabase.from('orders').delete().eq('status', 'pending_payment').lt('created_at', thirtyMinsAgo);
    } catch (cleanupErr) {
      console.warn('[PayPal createOrder] Stale draft cleanup note:', cleanupErr);
    }

    const validUserId = (user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id))
      ? user_id
      : null;
    const generatedOrderNumber = `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const sym = currency_symbol || `${requestedCurrency} `;

    const conversionNote = settlement.convertedToUsd
      ? `\nPayPal Settlement: $${settlement.formattedValue} USD (converted from ${sym}${Number(total_amount).toFixed(2)} ${requestedCurrency})`
      : '';

    const orderPayload = {
      order_number: generatedOrderNumber,
      user_id: validUserId,
      email: email || null,
      buyer_name: isDropship ? (dropship_details.sender_name || fullName) : fullName,
      business_name: isDropship ? (dropship_details.sender_name || null) : (delivery_details.business_name || null),
      phone: isDropship ? (dropship_details.sender_phone || phone) : phone,
      pincode,
      status: 'pending_payment',
      payment_method: 'paypal',
      total_amount: Number(total_amount),
      coupon_code: coupon_code ? String(coupon_code).trim().toUpperCase() : null,
      coupon_discount: Number(coupon_discount) || 0,
      message: `PAYPAL INTERNATIONAL ORDER\nTotal: ${sym}${Number(total_amount).toFixed(2)} (${requestedCurrency})${conversionNote}\nCurrency: ${requestedCurrency}\nCountry: ${delivery_details.country || country_name || resolvedCountryCode}\nShipping: ${shipping_speed === 'expedited' ? `Expedited (2-3 Days)${Number(shipping_amount) > 0 ? ` (+${sym}${Number(shipping_amount).toFixed(2)})` : ''}` : (Number(shipping_amount) > 0 ? `Standard (+${sym}${Number(shipping_amount).toFixed(2)})` : 'Standard')}${coupon_code ? `\nCoupon: ${String(coupon_code).trim().toUpperCase()} (-${sym}${Number(coupon_discount) || 0})` : ''}\nStatus: Pending PayPal Payment\nNotes: ${notes || 'None'}`,
      is_dropship: isDropship,
      dropship_sender_name: isDropship ? (dropship_details.sender_name || null) : null,
      dropship_sender_phone: isDropship ? (dropship_details.sender_phone || null) : null,
      dropship_sender_address: isDropship ? (dropship_details.sender_address || null) : null,
      dropship_sender_city: isDropship ? (dropship_details.sender_city || null) : null,
      dropship_sender_state: isDropship ? (dropship_details.sender_state || null) : null,
      dropship_sender_pincode: isDropship ? (dropship_details.sender_pincode || null) : null,
      dropship_recipient_name: fullName,
      dropship_recipient_phone: phone,
      dropship_recipient_address: `${addr1}${delivery_details.address_line2 ? ', ' + delivery_details.address_line2 : ''}`,
      dropship_recipient_city: city,
      dropship_recipient_state: state,
      dropship_recipient_pincode: pincode,
      dropship_packing_preference: isDropship ? (dropship_details.packing_preference || 'Blind Packaging') : null,
      items: items.map((item) => ({
        product_id: item.product_id || item.productGroupKey,
        product_title: item.product_title || item.title || '',
        variant_code: item.variant_code || '',
        color: item.color || item.selectedColorName || 'Standard',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        currency: requestedCurrency,
        base_inr_price: Number(item.base_inr_price) || Number(item.price) || 0,
        custom_billed_price: item.custom_billed_price || dropship_details.custom_billed_price || null,
        custom_discount: item.custom_discount || dropship_details.custom_discount || null,
      })),
    };

    const { data: dbOrder, error: dbError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select('id, order_number')
      .single();

    if (dbError) {
      console.error('[PayPal createOrder] Supabase insert error:', dbError);
      return Response.json(
        { success: false, error: 'Failed to initialize order record: ' + dbError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const dbOrderId = dbOrder.id;
    const resolvedOrderNumber = dbOrder.order_number || generatedOrderNumber;
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com').replace(/\/$/, '');

    const ppRes = await paypalFetch(pp, '/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: resolvedOrderNumber,
            custom_id: dbOrderId,
            description: `Weave365 Order ${resolvedOrderNumber}`,
            amount: {
              currency_code: settlement.settlementCurrency,
              value: settlement.formattedValue,
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: 'Weave 365',
              shipping_preference: 'NO_SHIPPING',
              user_action: 'PAY_NOW',
              return_url: `${siteUrl}/checkout?paypal_order=${encodeURIComponent(dbOrderId)}`,
              cancel_url: `${siteUrl}/checkout?paypal_cancelled=1&paypal_order=${encodeURIComponent(dbOrderId)}`,
            },
          },
        },
      }),
    });

    const ppData = await ppRes.json().catch(() => ({}));
    const approveLink = (ppData.links || []).find((l) => l.rel === 'payer-action' || l.rel === 'approve')?.href;

    if (!ppRes.ok || !ppData.id || !approveLink) {
      console.error('[PayPal createOrder] PayPal API error:', ppRes.status, ppData);
      await supabase.from('orders').delete().eq('id', dbOrderId).eq('status', 'pending_payment');
      return Response.json(
        {
          success: false,
          error: ppData.message || ppData.details?.[0]?.description || 'PayPal order initialization failed.',
        },
        { status: ppRes.status || 500, headers: corsHeaders }
      );
    }

    await supabase
      .from('orders')
      .update({ cf_order_id: `PAYPAL_${ppData.id}` })
      .eq('id', dbOrderId);

    return Response.json(
      {
        success: true,
        paypal_order_id: ppData.id,
        db_order_id: dbOrderId,
        order_number: resolvedOrderNumber,
        approve_url: approveLink,
        settlement_currency: settlement.settlementCurrency,
        settlement_amount: settlement.settlementAmount,
        converted_to_usd: settlement.convertedToUsd,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('[PayPal createOrder] Exception:', err);
    return Response.json(
      { success: false, error: err.message || 'Internal server error during PayPal checkout.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function handleCaptureOrder(request) {
  const corsHeaders = getCorsHeaders(request);
  const pp = getPayPalConfig();

  if (!pp.clientId || !pp.clientSecret) {
    return Response.json(
      { success: false, error: 'PayPal credentials are not configured on the server.' },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const paypalOrderId = String(body.paypal_order_id || body.token || '').trim();
    if (!paypalOrderId) {
      return Response.json(
        { success: false, error: 'Missing paypal_order_id / token.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const capRes = await paypalFetch(pp, `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
      method: 'POST',
      body: '{}',
    });

    const capData = await capRes.json().catch(() => ({}));

    let finalData = capData;
    if (!capRes.ok && capData.details?.some((d) => d.issue === 'ORDER_ALREADY_CAPTURED')) {
      const checkRes = await paypalFetch(pp, `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, {
        method: 'GET',
      });
      finalData = await checkRes.json().catch(() => ({}));
    } else if (!capRes.ok) {
      console.error('[PayPal captureOrder] API error:', capRes.status, capData);
      return Response.json(
        {
          success: false,
          error: capData.message || capData.details?.[0]?.description || 'Failed to capture PayPal payment.',
        },
        { status: capRes.status || 500, headers: corsHeaders }
      );
    }

    const isCompleted = finalData.status === 'COMPLETED';
    const capture = finalData.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = capture?.id || paypalOrderId;
    const paidValue = capture?.amount?.value || finalData.purchase_units?.[0]?.amount?.value;
    const paidCurrency = capture?.amount?.currency_code || finalData.purchase_units?.[0]?.amount?.currency_code || 'USD';

    if (!isCompleted) {
      return Response.json(
        {
          success: true,
          is_paid: false,
          order_status: finalData.status || 'PENDING',
        },
        { status: 200, headers: corsHeaders }
      );
    }

    const supabase = getSupabaseAdmin();
    const marked = await markPayPalOrderPaid({
      supabase,
      paypalOrderId,
      captureId,
      paidValue,
      paidCurrency,
      source: 'Capture',
    });

    return Response.json(
      {
        success: true,
        is_paid: true,
        order_status: 'COMPLETED',
        db_order_id: marked.orderId,
        order_number: marked.orderNumber,
        order_amount: marked.orderAmount,
        order_currency: marked.orderCurrency,
        capture_id: captureId,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('[PayPal captureOrder] Exception:', err);
    return Response.json(
      { success: false, error: err.message || 'Internal server error during PayPal capture.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function handleCancelOrder(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const body = await request.json();
    const dbOrderId = String(body.db_order_id || '').trim();
    const paypalOrderId = String(body.paypal_order_id || '').trim();
    const supabase = getSupabaseAdmin();

    if (dbOrderId) {
      await supabase.from('orders').delete().eq('id', dbOrderId).eq('status', 'pending_payment');
    } else if (paypalOrderId) {
      await supabase.from('orders').delete().eq('cf_order_id', `PAYPAL_${paypalOrderId}`).eq('status', 'pending_payment');
    }

    return Response.json({ success: true }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[PayPal cancelOrder] Error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function handleWebhook(request) {
  const corsHeaders = getCorsHeaders(request);
  const pp = getPayPalConfig();

  try {
    const event = await request.json();

    if (pp.webhookId && pp.clientId && pp.clientSecret) {
      const verifyRes = await paypalFetch(pp, '/v1/notifications/verify-webhook-signature', {
        method: 'POST',
        body: JSON.stringify({
          auth_algo: request.headers.get('paypal-auth-algo') || '',
          cert_url: request.headers.get('paypal-cert-url') || '',
          transmission_id: request.headers.get('paypal-transmission-id') || '',
          transmission_sig: request.headers.get('paypal-transmission-sig') || '',
          transmission_time: request.headers.get('paypal-transmission-time') || '',
          webhook_id: pp.webhookId,
          webhook_event: event,
        }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok || verifyData.verification_status !== 'SUCCESS') {
        console.warn('[PayPal Webhook] Signature verification failed:', verifyData);
        return Response.json({ error: 'Invalid webhook signature' }, { status: 401, headers: corsHeaders });
      }
    }

    const eventType = event?.event_type || '';
    const resource = event?.resource || {};

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const paypalOrderId = resource?.supplementary_data?.related_ids?.order_id;
      const captureId = resource?.id;
      const paidValue = resource?.amount?.value;
      const paidCurrency = resource?.amount?.currency_code;

      if (paypalOrderId) {
        const supabase = getSupabaseAdmin();
        await markPayPalOrderPaid({
          supabase,
          paypalOrderId,
          captureId,
          paidValue,
          paidCurrency,
          source: 'Webhook',
        });
      }
    }

    return Response.json({ received: true }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[PayPal Webhook] Exception:', err);
    return Response.json({ error: err.message || 'Webhook processing error' }, { status: 500, headers: corsHeaders });
  }
}
