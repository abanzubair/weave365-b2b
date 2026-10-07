/**
 * @file app/api/[[...route]]/phonepeHandler.js
 * @description Server-side PhonePe Payment Gateway (Standard Checkout v2) handler for Weave365.
 * Runs alongside cashfreeHandler.js - the customer picks the gateway at checkout.
 *
 * Handles:
 * 1. Order Creation (/api/phonepe/create-order) -> Creates draft order + PhonePe payment, returns redirect_url
 * 2. Order Verification (/api/phonepe/verify-order) -> Server-to-server status check (never trust the browser)
 * 3. Webhook Handler (/api/phonepe/webhook) -> Authorization-verified event processing (SHA256 username:password)
 *
 * Notes:
 * - PhonePe only settles INR. Non-INR carts are charged at the marked-up INR total (base_inr_total).
 * - Amounts are sent to PhonePe in paise (INR x 100).
 * - The PhonePe merchantOrderId is stored in orders.cf_order_id (prefixed "PP_") and
 *   the PhonePe transactionId in orders.cf_payment_id, so no schema migration is needed.
 *   orders.payment_method = 'phonepe' tells the two gateways apart.
 */

import { createClient } from '@supabase/supabase-js';
import { sendBuyerOrderConfirmationEmail } from './buyerEmailService.js';

export const runtime = 'edge';

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

function getPhonePeConfig() {
  const env = (process.env.PHONEPE_ENVIRONMENT || 'SANDBOX').toUpperCase();
  const isProd = env === 'PRODUCTION' || env === 'PROD';

  return {
    env,
    isProd,
    tokenUrl: isProd
      ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
    apiBase: isProd
      ? 'https://api.phonepe.com/apis/pg'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox',
    clientId: process.env.PHONEPE_CLIENT_ID || '',
    clientSecret: process.env.PHONEPE_CLIENT_SECRET || '',
    clientVersion: process.env.PHONEPE_CLIENT_VERSION || '1',
    webhookUsername: process.env.PHONEPE_WEBHOOK_USERNAME || '',
    webhookPassword: process.env.PHONEPE_WEBHOOK_PASSWORD || '',
  };
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase server credentials missing in environment.');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// OAuth token (cached per isolate until ~1 minute before expiry)
// ---------------------------------------------------------------------------
let cachedToken = null; // { value, type, expiresAtMs, cacheKey }

async function getAccessToken(pp) {
  const cacheKey = `${pp.env}:${pp.clientId}`;
  if (cachedToken && cachedToken.cacheKey === cacheKey && cachedToken.expiresAtMs - 60_000 > Date.now()) {
    return cachedToken;
  }

  const res = await fetch(pp.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: pp.clientId,
      client_version: pp.clientVersion,
      client_secret: pp.clientSecret,
      grant_type: 'client_credentials',
    }).toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    console.error('[PhonePe] OAuth token error:', res.status, data);
    throw new Error(data.message || data.error_description || 'PhonePe authorization failed. Check PHONEPE_CLIENT_* credentials.');
  }

  cachedToken = {
    value: data.access_token,
    type: data.token_type || 'O-Bearer',
    // expires_at is epoch seconds; fall back to 10 minutes if absent
    expiresAtMs: data.expires_at ? Number(data.expires_at) * 1000 : Date.now() + 10 * 60_000,
    cacheKey,
  };
  return cachedToken;
}

async function phonepeFetch(pp, path, init = {}) {
  const token = await getAccessToken(pp);
  return fetch(`${pp.apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token.type} ${token.value}`,
      ...(init.headers || {}),
    },
  });
}

/** Server-to-server order status. state: PENDING | COMPLETED | FAILED */
async function fetchOrderStatus(pp, merchantOrderId) {
  const res = await phonepeFetch(
    pp,
    `/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`,
    { method: 'GET' }
  );
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ---------------------------------------------------------------------------
// Webhook authorization: PhonePe sends SHA256("username:password") in Authorization
// ---------------------------------------------------------------------------
async function sha256Hex(input) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyWebhookAuth(request, pp) {
  if (!pp.webhookUsername || !pp.webhookPassword) return false;
  const header = (request.headers.get('authorization') || '').trim().replace(/^SHA256\s+/i, '');
  if (!header) return false;
  const expected = await sha256Hex(`${pp.webhookUsername}:${pp.webhookPassword}`);
  return safeEqual(header.toLowerCase(), expected.toLowerCase());
}

// ---------------------------------------------------------------------------
// Shared "mark as paid" used by both verify-order and the webhook (idempotent)
// ---------------------------------------------------------------------------
async function markOrderPaid({ supabase, merchantOrderId, paidAmountPaise, transactionId, source }) {
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, message, total_amount')
    .eq('cf_order_id', merchantOrderId)
    .maybeSingle();

  if (error || !order) {
    console.warn(`[PhonePe ${source}] No order found for ${merchantOrderId}`, error || '');
    return { ok: false, reason: 'order_not_found' };
  }

  // Never accept a payment whose amount differs from what we asked for
  const expectedPaise = Math.round(Number(order.total_amount) * 100);
  if (Number.isFinite(paidAmountPaise) && paidAmountPaise !== expectedPaise) {
    console.error(`[PhonePe ${source}] Amount mismatch for ${merchantOrderId}: expected ${expectedPaise}, got ${paidAmountPaise}`);
    return { ok: false, reason: 'amount_mismatch', orderId: order.id };
  }

  // Only flip pending -> paid. Duplicate callbacks must not downgrade shipped/delivered orders.
  if (order.status === 'pending_payment') {
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_method: 'phonepe',
        cf_payment_id: transactionId || null,
        message: `${order.message || ''}\n\n[PhonePe ${source} Confirmed] Txn: ${transactionId || 'N/A'} at ${new Date().toISOString()}`,
      })
      .eq('id', order.id)
      .eq('status', 'pending_payment');
  }

  // Email service is idempotent (tags the order message once sent)
  try {
    await sendBuyerOrderConfirmationEmail({ orderId: order.id, supabase });
  } catch (emailErr) {
    console.error(`[PhonePe ${source}] Error sending buyer confirmation email:`, emailErr);
  }

  return { ok: true, orderId: order.id };
}

/**
 * POST /api/phonepe/create-order
 */
export async function handleCreateOrder(request) {
  const corsHeaders = getCorsHeaders(request);
  const pp = getPhonePeConfig();

  if (!pp.clientId || !pp.clientSecret) {
    return Response.json(
      { success: false, error: 'PhonePe credentials (PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET) are not configured on the server.' },
      { status: 500, headers: corsHeaders }
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
      currency = 'INR',
      base_inr_total = 0,
      shipping_mode = 'standard',
      notes = '',
    } = body;

    const fullName = String(delivery_details.full_name || '').trim();
    let phone = String(delivery_details.phone_number || '').trim().replace(/[^0-9]/g, '');
    if (phone.length > 10) phone = phone.slice(-10);
    const addr1 = String(delivery_details.address_line1 || '').trim();
    const city = String(delivery_details.city || '').trim();
    const state = String(delivery_details.state || '').trim();
    const pincode = String(delivery_details.pincode || '').trim();

    if (!fullName || !phone || !addr1 || !city || !state || !pincode) {
      return Response.json(
        { success: false, error: 'Recipient name, phone, address, city, state, and pincode are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Array.isArray(items) || items.length === 0 || total_amount <= 0) {
      return Response.json(
        { success: false, error: 'Invalid cart or order amount.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // PhonePe is INR-only: foreign-currency carts are charged at the marked-up INR total
    const requestedCurrency = String(currency || 'INR').toUpperCase();
    const isInr = requestedCurrency === 'INR';
    const chargeInr = Number(Number(isInr ? total_amount : (base_inr_total || 0)).toFixed(2));
    const amountPaise = Math.round(chargeInr * 100);

    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      return Response.json(
        { success: false, error: 'Order amount must be at least ₹1.00 for PhonePe.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const isDropship = shipping_mode === 'dropship';
    const supabase = getSupabaseAdmin();

    // 1. Auto-clean stale abandoned drafts older than 30 minutes
    try {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      await supabase.from('orders').delete().eq('status', 'pending_payment').lt('created_at', thirtyMinsAgo);
    } catch (cleanupErr) {
      console.warn('[PhonePe createOrder] Stale draft cleanup error:', cleanupErr);
    }

    // 2. Pre-insert (or refresh) the draft order as 'pending_payment'
    const validUserId = (user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id))
      ? user_id
      : null;

    const orderPayload = {
      user_id: validUserId,
      email: email || null,
      buyer_name: isDropship ? (dropship_details.sender_name || fullName) : fullName,
      business_name: isDropship ? (dropship_details.sender_name || null) : (delivery_details.business_name || null),
      phone: isDropship ? (dropship_details.sender_phone || phone) : phone,
      pincode,
      status: 'pending_payment',
      payment_method: 'phonepe',
      total_amount: chargeInr,
      message: `PHONEPE CHECKOUT ORDER\nTotal: ₹${chargeInr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (INR)\nCurrency: INR\nStatus: Pending PhonePe Payment\nNotes: ${notes || 'None'}`,
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
        // Stored in INR because that is what PhonePe actually charges
        price: isInr ? (Number(item.price) || 0) : (Number(item.base_inr_price) || Number(item.price) || 0),
        currency: 'INR',
        base_inr_price: Number(item.base_inr_price) || Number(item.price) || 0,
      })),
    };

    let dbOrderId = null;
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    let existingPendingQuery = supabase
      .from('orders')
      .select('id')
      .eq('status', 'pending_payment')
      .gt('created_at', twoHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (validUserId) {
      existingPendingQuery = existingPendingQuery.eq('user_id', validUserId);
    } else if (phone) {
      existingPendingQuery = existingPendingQuery.eq('phone', phone);
    }

    const { data: existingOrders } = await existingPendingQuery;

    if (existingOrders && existingOrders.length > 0) {
      dbOrderId = existingOrders[0].id;
      await supabase.from('orders').update(orderPayload).eq('id', dbOrderId);
    } else {
      const { data: dbOrder, error: dbError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id')
        .single();

      if (dbError) {
        console.error('[PhonePe createOrder] Supabase insert error:', dbError);
        return Response.json(
          { success: false, error: 'Failed to initialize order record: ' + dbError.message },
          { status: 500, headers: corsHeaders }
        );
      }
      dbOrderId = dbOrder.id;
    }

    // PhonePe merchantOrderId: max 63 chars, alphanumeric / underscore / hyphen
    const cleanDbId = dbOrderId.replace(/-/g, '').slice(0, 16);
    const merchantOrderId = `PP_${cleanDbId}_${Date.now().toString().slice(-8)}`;

    // 3. Create the PhonePe payment
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com';
    const ppRes = await phonepeFetch(pp, '/checkout/v2/pay', {
      method: 'POST',
      body: JSON.stringify({
        merchantOrderId,
        amount: amountPaise,
        expireAfter: 1200, // 20 min - shorter than the 30 min stale-draft cleanup
        paymentFlow: {
          type: 'PG_CHECKOUT',
          message: `Weave365 Order #${dbOrderId.slice(0, 8)}`,
          merchantUrls: {
            redirectUrl: `${siteUrl}/checkout?pp_order_id=${merchantOrderId}`,
          },
        },
        metaInfo: { udf1: dbOrderId },
      }),
    });

    const ppData = await ppRes.json().catch(() => ({}));

    if (!ppRes.ok || !ppData.redirectUrl) {
      console.error('[PhonePe createOrder] Pay API error:', ppRes.status, ppData);
      return Response.json(
        {
          success: false,
          error: ppData.message || ppData.code || 'PhonePe payment initialization failed.',
          details: ppData,
        },
        { status: ppRes.status || 500, headers: corsHeaders }
      );
    }

    // 4. Link the PhonePe order to our draft
    await supabase
      .from('orders')
      .update({
        cf_order_id: merchantOrderId,
        message: `${orderPayload.message}\nPhonePe Order ID: ${merchantOrderId}\nPhonePe Ref: ${ppData.orderId || 'N/A'}`,
      })
      .eq('id', dbOrderId);

    return Response.json(
      {
        success: true,
        redirect_url: ppData.redirectUrl,
        order_id: merchantOrderId,
        db_order_id: dbOrderId,
        order_currency: 'INR',
        order_amount: chargeInr,
        environment: pp.env,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('[PhonePe createOrder] Exception:', err);
    return Response.json(
      { success: false, error: err.message || 'Server error creating PhonePe order.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/phonepe/verify-order
 * Called when the customer lands back on /checkout?pp_order_id=...
 */
export async function handleVerifyOrder(request) {
  const corsHeaders = getCorsHeaders(request);
  const pp = getPhonePeConfig();

  try {
    const { order_id } = await request.json();

    if (!order_id || !/^PP_[A-Za-z0-9_-]{1,60}$/.test(order_id)) {
      return Response.json(
        { success: false, error: 'Missing or invalid order_id for verification.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const status = await fetchOrderStatus(pp, order_id);
    if (!status.ok) {
      return Response.json(
        { success: false, error: status.data?.message || 'Failed to fetch order status from PhonePe.' },
        { status: status.status || 500, headers: corsHeaders }
      );
    }

    const orderState = status.data.state; // 'COMPLETED' | 'PENDING' | 'FAILED'
    const isPaid = orderState === 'COMPLETED';
    let dbOrderId = null;

    if (isPaid) {
      const txn = status.data.paymentDetails?.[0]?.transactionId;
      const result = await markOrderPaid({
        supabase: getSupabaseAdmin(),
        merchantOrderId: order_id,
        paidAmountPaise: Number(status.data.amount),
        transactionId: txn,
        source: 'Verify',
      });
      if (!result.ok) {
        return Response.json(
          { success: false, error: 'Payment received but order could not be reconciled. Please contact support with order ref ' + order_id },
          { status: 409, headers: corsHeaders }
        );
      }
      dbOrderId = result.orderId;
    }

    return Response.json(
      {
        success: true,
        order_status: orderState,
        is_paid: isPaid,
        db_order_id: dbOrderId,
        order_amount: Number(status.data.amount) / 100,
        order_currency: 'INR',
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('[PhonePe verifyOrder] Exception:', err);
    return Response.json(
      { success: false, error: err.message || 'Verification failed.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/phonepe/webhook
 * Events: checkout.order.completed | checkout.order.failed
 */
export async function handleWebhook(request) {
  const pp = getPhonePeConfig();

  const isValid = await verifyWebhookAuth(request, pp);
  if (!isValid) {
    console.warn('[PhonePe Webhook] Invalid or missing Authorization header.');
    return new Response('Invalid webhook authorization', { status: 401 });
  }

  try {
    const body = await request.json();
    // Per PhonePe docs: use `event` (not `type`) and root-level `payload.state`
    const event = body.event;
    const payload = body.payload || {};
    const merchantOrderId = payload.merchantOrderId;
    console.log(`[PhonePe Webhook] Verified event received: ${event} (${merchantOrderId || 'no order id'})`);

    if (event === 'checkout.order.completed' && merchantOrderId && payload.state === 'COMPLETED') {
      // Defense in depth: confirm with PhonePe directly rather than trusting the callback body alone
      const status = await fetchOrderStatus(pp, merchantOrderId);
      if (status.ok && status.data.state === 'COMPLETED') {
        await markOrderPaid({
          supabase: getSupabaseAdmin(),
          merchantOrderId,
          paidAmountPaise: Number(status.data.amount),
          transactionId: status.data.paymentDetails?.[0]?.transactionId,
          source: 'Webhook',
        });
      } else {
        console.warn(`[PhonePe Webhook] Status re-check did not confirm ${merchantOrderId}:`, status.data);
      }
    }

    // Always ack with 2xx quickly so PhonePe does not retry; handling is idempotent
    return Response.json({ status: 'OK' }, { status: 200 });
  } catch (err) {
    console.error('[PhonePe Webhook] Error processing event payload:', err);
    return Response.json({ status: 'Error', message: err.message }, { status: 500 });
  }
}
