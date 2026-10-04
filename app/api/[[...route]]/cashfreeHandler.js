/**
 * @file app/api/[[...route]]/cashfreeHandler.js
 * @description Industry-Standard Server-Side Cashfree Payment Gateway Handler for Weave365.
 * Handles:
 * 1. Order Creation (/api/cashfree/create-order) -> Creates Cashfree PG order & returns payment_session_id
 * 2. Order Verification (/api/cashfree/verify-order) -> Server-side status check against Cashfree API
 * 3. Webhook Handler (/api/cashfree/webhook) -> Cryptographically verified event processing (HMAC-SHA256)
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-webhook-signature, x-webhook-timestamp',
  };
}

function getCashfreeConfig() {
  const env = (process.env.CASHFREE_ENVIRONMENT || process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT || 'SANDBOX').toUpperCase();
  const isProd = env === 'PRODUCTION' || env === 'PROD';
  const baseUrl = isProd ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
  const appId = process.env.CASHFREE_APP_ID || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || '';

  return {
    env,
    isProd,
    baseUrl,
    appId,
    secretKey,
    apiVersion: '2025-01-01',
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

/**
 * Verifies Cashfree HMAC-SHA256 signature using Edge-compatible Web Crypto API.
 */
async function verifyCashfreeSignature(timestamp, rawBody, receivedSignature, secretKey) {
  if (!timestamp || !rawBody || !receivedSignature || !secretKey) {
    return false;
  }

  try {
    const signedPayload = `${timestamp}${rawBody}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );

    const binary = String.fromCharCode(...new Uint8Array(signatureBuffer));
    const expectedSignature = btoa(binary);

    return expectedSignature === receivedSignature;
  } catch (err) {
    console.error('[Cashfree] Signature verification failed with error:', err);
    return false;
  }
}

/**
 * POST /api/cashfree/create-order
 */
export async function handleCreateOrder(request) {
  const corsHeaders = getCorsHeaders(request);
  const cf = getCashfreeConfig();

  if (!cf.appId || !cf.secretKey) {
    return Response.json(
      {
        success: false,
        error: 'Cashfree credentials (CASHFREE_APP_ID and CASHFREE_SECRET_KEY) are not configured on the server.',
      },
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
      currency_symbol = '',
      base_inr_total = 0,
      shipping_mode = 'standard',
      shipping_speed = 'standard',
      notes = '',
    } = body;

    const fullName = String(delivery_details.full_name || '').trim();
    let phone = String(delivery_details.phone_number || '').trim().replace(/[^0-9]/g, '');
    if (phone.length > 10) phone = phone.slice(-10); // Standardize 10-digit Indian phone
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

    const orderCurrency = String(currency || 'INR').toUpperCase();
    const currencySymbol = currency_symbol || (orderCurrency === 'INR' ? '₹' : orderCurrency === 'USD' ? '$' : orderCurrency === 'EUR' ? '€' : orderCurrency === 'GBP' ? '£' : `${orderCurrency} `);
    const requestedAmount = Number(Number(total_amount).toFixed(2));
    const fallbackInrAmount = Number(Number(base_inr_total || total_amount).toFixed(2));

    const isDropship = shipping_mode === 'dropship';
    const supabase = getSupabaseAdmin();

    // 1. Pre-insert order in Supabase with 'pending_payment'
    const validUserId = (user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id))
      ? user_id
      : null;

    const orderPayload = {
      user_id: validUserId,
      email: email || null,
      buyer_name: isDropship ? (dropship_details.sender_name || fullName) : fullName,
      business_name: isDropship ? (dropship_details.sender_name || null) : (delivery_details.business_name || null),
      phone: isDropship ? (dropship_details.sender_phone || phone) : phone,
      pincode: pincode,
      status: 'pending_payment',
      payment_method: 'cashfree',
      total_amount: requestedAmount,
      message: `CASHFREE CHECKOUT ORDER\nTotal: ${currencySymbol}${requestedAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${orderCurrency})\nCurrency: ${orderCurrency}\nStatus: Pending Cashfree Payment\nNotes: ${notes || 'None'}`,
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
      items: items.map(item => ({
        product_id: item.product_id || item.productGroupKey,
        product_title: item.product_title || item.title || '',
        variant_code: item.variant_code || '',
        color: item.color || item.selectedColorName || 'Standard',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        currency: orderCurrency,
      })),
    };

    let dbOrderId = null;

    // Check if there is an existing pending_payment order for this user/phone created in the last 2 hours
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
      await supabase
        .from('orders')
        .update(orderPayload)
        .eq('id', dbOrderId);
    } else {
      const { data: dbOrder, error: dbError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id')
        .single();

      if (dbError) {
        console.error('[Cashfree createOrder] Supabase insert error:', dbError);
        return Response.json(
          { success: false, error: 'Failed to initialize order record: ' + dbError.message },
          { status: 500, headers: corsHeaders }
        );
      }
      dbOrderId = dbOrder.id;
    }
    // Cashfree order_id max 45 chars alphanumeric, underscore, hyphen
    const cleanDbId = dbOrderId.replace(/-/g, '').slice(0, 16);
    const cfOrderId = `CF_${cleanDbId}_${Date.now().toString().slice(-6)}`;

    // 2. Call Cashfree PG /orders API with dynamic order_currency
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com';
    const cfReqBody = {
      order_id: cfOrderId,
      order_amount: requestedAmount,
      order_currency: orderCurrency,
      customer_details: {
        customer_id: validUserId || `cust_${phone}_${cleanDbId.slice(0, 6)}`,
        customer_name: fullName.slice(0, 50),
        customer_phone: phone.length === 10 ? phone : '9999999999',
        customer_email: (email && email.includes('@')) ? email : 'support@weave365.com',
      },
      order_meta: {
        return_url: `${siteUrl}/checkout?order_id={order_id}`,
        notify_url: `${siteUrl}/api/cashfree/webhook`,
      },
      order_note: `Weave365 Order #${dbOrderId.slice(0, 8)} (${orderCurrency} ${requestedAmount})`,
    };

    let cfResponse = await fetch(`${cf.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': cf.appId,
        'x-client-secret': cf.secretKey,
        'x-api-version': cf.apiVersion,
      },
      body: JSON.stringify(cfReqBody),
    });

    let cfData = await cfResponse.json();

    // If the currency is not enabled on the merchant account, fallback gracefully to base INR amount
    let finalCurrency = orderCurrency;
    let finalAmount = requestedAmount;

    if (!cfResponse.ok && orderCurrency !== 'INR' && cfData.message && cfData.message.toLowerCase().includes('currency')) {
      console.warn(`[Cashfree createOrder] Gateway rejected currency ${orderCurrency} (${cfData.message}). Falling back to INR amount (₹${fallbackInrAmount})...`);
      finalCurrency = 'INR';
      finalAmount = fallbackInrAmount;

      const fallbackReqBody = {
        ...cfReqBody,
        order_amount: fallbackInrAmount,
        order_currency: 'INR',
        order_note: `Weave365 Order #${dbOrderId.slice(0, 8)} (INR ${fallbackInrAmount} fallback from ${orderCurrency} ${requestedAmount})`,
      };

      cfResponse = await fetch(`${cf.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': cf.appId,
          'x-client-secret': cf.secretKey,
          'x-api-version': cf.apiVersion,
        },
        body: JSON.stringify(fallbackReqBody),
      });

      cfData = await cfResponse.json();
    }

    if (!cfResponse.ok || !cfData.payment_session_id) {
      console.error('[Cashfree createOrder] PG API error:', cfData);
      return Response.json(
        {
          success: false,
          error: cfData.message || 'Payment gateway order initialization failed.',
          details: cfData,
        },
        { status: cfResponse.status || 500, headers: corsHeaders }
      );
    }

    // 3. Update Supabase with cf_order_id & session
    await supabase
      .from('orders')
      .update({
        cf_order_id: cfOrderId,
        total_amount: finalAmount,
        message: `${orderPayload.message}\nCashfree Order ID: ${cfOrderId}\nSession: ${cfData.payment_session_id}`,
      })
      .eq('id', dbOrderId);

    return Response.json(
      {
        success: true,
        payment_session_id: cfData.payment_session_id,
        order_id: cfOrderId,
        db_order_id: dbOrderId,
        order_currency: cfData.order_currency || finalCurrency,
        order_amount: cfData.order_amount || finalAmount,
        environment: cf.env,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('[Cashfree createOrder] Exception:', err);
    return Response.json(
      { success: false, error: err.message || 'Server error creating Cashfree order.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/cashfree/verify-order
 */
export async function handleVerifyOrder(request) {
  const corsHeaders = getCorsHeaders(request);
  const cf = getCashfreeConfig();

  try {
    const { order_id, db_order_id } = await request.json();

    if (!order_id) {
      return Response.json(
        { success: false, error: 'Missing order_id for verification.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Query Cashfree Server-to-Server
    const cfRes = await fetch(`${cf.baseUrl}/orders/${encodeURIComponent(order_id)}`, {
      method: 'GET',
      headers: {
        'x-client-id': cf.appId,
        'x-client-secret': cf.secretKey,
        'x-api-version': cf.apiVersion,
      },
    });

    const cfOrder = await cfRes.json();
    if (!cfRes.ok) {
      return Response.json(
        { success: false, error: cfOrder.message || 'Failed to fetch order status from Cashfree.' },
        { status: cfRes.status || 500, headers: corsHeaders }
      );
    }

    const orderStatus = cfOrder.order_status; // 'PAID', 'ACTIVE', 'EXPIRED', 'FAILED'
    const isPaid = orderStatus === 'PAID';

    if (isPaid) {
      const supabase = getSupabaseAdmin();
      const updatePayload = {
        status: 'paid',
        payment_method: 'cashfree',
      };
      if (order_id) {
        updatePayload.cf_order_id = order_id;
      }

      let targetOrderId = db_order_id;
      if (db_order_id) {
        await supabase.from('orders').update(updatePayload).eq('id', db_order_id);
      } else if (order_id) {
        const { data: updatedRows } = await supabase
          .from('orders')
          .update(updatePayload)
          .eq('cf_order_id', order_id)
          .select('id');
        if (updatedRows && updatedRows.length > 0) {
          targetOrderId = updatedRows[0].id;
        }
      }

      // Automatically dispatch minimal confirmation email to buyer
      if (targetOrderId) {
        try {
          await sendBuyerOrderConfirmationEmail({
            orderId: targetOrderId,
            supabase,
          });
        } catch (emailErr) {
          console.error('[Cashfree verifyOrder] Error sending buyer confirmation email:', emailErr);
        }
      }
    }

    return Response.json(
      {
        success: true,
        order_status: orderStatus,
        is_paid: isPaid,
        order_amount: cfOrder.order_amount,
        order_currency: cfOrder.order_currency || 'INR',
        cf_order: cfOrder,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('[Cashfree verifyOrder] Exception:', err);
    return Response.json(
      { success: false, error: err.message || 'Verification failed.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/cashfree/webhook
 */
export async function handleWebhook(request) {
  const cf = getCashfreeConfig();
  const signature = request.headers.get('x-webhook-signature');
  const timestamp = request.headers.get('x-webhook-timestamp');

  const rawBody = await request.text();

  // Verify HMAC-SHA256 signature
  const isValid = await verifyCashfreeSignature(timestamp, rawBody, signature, cf.secretKey);
  if (!isValid) {
    console.warn('[Cashfree Webhook] Invalid signature received.');
    return new Response('Invalid webhook signature', { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const eventType = payload.type;
    console.log(`[Cashfree Webhook] Verified event received: ${eventType}`);

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderData = payload.data?.order;
      const paymentData = payload.data?.payment;
      const cfOrderId = orderData?.order_id;
      const paymentId = paymentData?.cf_payment_id;

      if (cfOrderId) {
        const supabase = getSupabaseAdmin();
        // 1. Instant indexed lookup via cf_order_id
        let target = null;
        const { data: indexedOrders } = await supabase
          .from('orders')
          .select('id, status, message, cf_order_id, cf_payment_id')
          .eq('cf_order_id', cfOrderId)
          .limit(1);

        if (indexedOrders && indexedOrders.length > 0) {
          target = indexedOrders[0];
        } else {
          // Fallback to message search for legacy orders created before migration
          const { data: legacyOrders } = await supabase
            .from('orders')
            .select('id, status, message, cf_order_id, cf_payment_id')
            .ilike('message', `%${cfOrderId}%`)
            .limit(1);
          if (legacyOrders && legacyOrders.length > 0) {
            target = legacyOrders[0];
          }
        }

        if (target) {
          await supabase
            .from('orders')
            .update({
              status: 'paid',
              payment_method: 'cashfree',
              cf_order_id: cfOrderId,
              cf_payment_id: paymentId ? String(paymentId) : (target.cf_payment_id || null),
              message: `${target.message || ''}\n\n[Webhook Confirmed] Payment ID: ${paymentId || 'N/A'} at ${new Date().toISOString()}`,
            })
            .eq('id', target.id);

          // Automatically dispatch minimal confirmation email to buyer (idempotency prevents double send)
          try {
            await sendBuyerOrderConfirmationEmail({
              orderId: target.id,
              supabase,
            });
          } catch (emailErr) {
            console.error('[Cashfree Webhook] Error sending buyer confirmation email:', emailErr);
          }
        }
      }
    }

    return Response.json({ status: 'OK' }, { status: 200 });
  } catch (err) {
    console.error('[Cashfree Webhook] Error processing event payload:', err);
    return Response.json({ status: 'Error', message: err.message }, { status: 500 });
  }
}
