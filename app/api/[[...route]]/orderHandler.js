/**
 * @file app/api/[[...route]]/orderHandler.js
 * @description Robust Server-Side Order Placement Handler for Weave365.
 * Safely inserts orders into Supabase using the Service Role Key (bypassing RLS),
 * ensuring 100% order capture for both authenticated members and guest buyers.
 * Automatically dispatches notification emails via Resend.
 */

import { createClient } from '@supabase/supabase-js';
import { sendBuyerOrderConfirmationEmail } from './buyerEmailService.js';
import { recordCouponUsage } from './couponsHandler.js';
import { getExchangeRates, DEFAULT_BASELINE_RATES } from '../../../src/services/exchangeRateService.js';
import { getLocalizedPrice, roundCurrency, formatCurrency } from '../../../src/services/pricingService.js';

export const runtime = 'edge';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function POST(request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const body = await request.json();
    const {
      user_id,
      email,
      payment_method = 'upi',
      shipping_mode = 'standard',
      shipping_speed = 'standard',
      shipping_amount = 0,
      delivery_details = {},
      dropship_details = {},
      items = [],
      total_amount = 0,
      currency = 'INR',
      country_code = 'IN',
      country_name = 'India',
      markup_percent = 0,
      coupon_code = null,
      coupon_discount = 0,
      notes = '',
    } = body;

    // Validate required recipient details
    const fullName = String(delivery_details.full_name || '').trim();
    const phone = String(delivery_details.phone_number || '').trim();
    const addr1 = String(delivery_details.address_line1 || '').trim();
    const city = String(delivery_details.city || '').trim();
    const state = String(delivery_details.state || '').trim();
    const pincode = String(delivery_details.pincode || '').trim();

    if (!fullName || !phone || !addr1 || !city || !state || !pincode) {
      return Response.json(
        { success: false, error: 'Recipient full name, phone, address, city, state, and pincode are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json(
        { success: false, error: 'Cannot place an empty order. Cart has no items.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const isDropship = shipping_mode === 'dropship';

    // 1. Initialize Supabase Admin Client (strictly require service role key)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[orderHandler] Missing Supabase server credentials.');
      return Response.json(
        { success: false, error: 'Server database configuration is missing.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Verify authenticated user_id from Bearer JWT (never trust unverified body.user_id)
    let validUserId = null;
    const authHeader = request.headers.get('Authorization') || '';
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (bearerToken) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser(bearerToken);
        if (authUser?.id) validUserId = authUser.id;
      } catch (authErr) {
        console.warn('[orderHandler] Optional JWT check warning:', authErr?.message);
      }
    }

    // Recompute authoritative item prices from catalog
    let catalogList = [];
    try {
      const { data: sheetRow } = await supabase.from('sheet_data').select('csv_data').eq('id', 'products_json').single();
      if (sheetRow?.csv_data) {
        catalogList = typeof sheetRow.csv_data === 'string' ? JSON.parse(sheetRow.csv_data) : sheetRow.csv_data;
      }
    } catch (catErr) {
      console.error('[orderHandler] Failed to load catalog for price verification:', catErr);
    }

    // Resolve authoritative country config & exchange rates for international orders
    const orderCountryCode = String(delivery_details.country_code || country_code || 'IN').trim().toUpperCase();
    let orderCurrency = String(currency || 'INR').trim().toUpperCase();
    let resolvedMarkupPercent = Number(markup_percent) || 0;
    try {
      const { data: countryRow } = await supabase
        .from('country_pricing_configs')
        .select('code, name, currency, currency_symbol, markup_percent, enabled')
        .eq('code', orderCountryCode)
        .maybeSingle();
      if (countryRow && countryRow.enabled !== false) {
        orderCurrency = String(countryRow.currency || orderCurrency).toUpperCase();
        resolvedMarkupPercent = Number(countryRow.markup_percent) || 0;
      }
    } catch (countryErr) {
      console.warn('[orderHandler] Country pricing lookup notice:', countryErr?.message);
    }

    let exchangeRates = DEFAULT_BASELINE_RATES;
    if (orderCurrency !== 'INR') {
      try {
        const rateRes = await getExchangeRates();
        if (rateRes?.rates) exchangeRates = rateRes.rates;
      } catch (rateErr) {
        console.warn('[orderHandler] Exchange rate fallback notice:', rateErr?.message);
      }
    }

    const orderCountryConfig = {
      code: orderCountryCode,
      name: delivery_details.country || country_name || 'India',
      currency: orderCurrency,
      markupPercent: resolvedMarkupPercent,
    };

    const verifiedItems = [];
    for (const rawItem of items) {
      const skuRaw = String(rawItem.variant_code || rawItem.sku || rawItem.product_id || rawItem.productGroupKey || '').trim();
      const skuLower = skuRaw.toLowerCase();
      const baseSku = skuLower.includes('-') ? skuLower.split('-')[0].trim() : skuLower;
      const qty = Math.max(1, Math.min(500, parseInt(rawItem.quantity || 1, 10) || 1));

      const matchedProduct = (catalogList || []).find((p) => {
        const pId = String(p.id || '').toLowerCase();
        const pGroup = String(p.groupKey || '').toLowerCase();
        if (pId === skuLower || pGroup === skuLower || (baseSku && (pId === baseSku || pGroup === baseSku))) return true;
        return Array.isArray(p.variants) && p.variants.some((v) => String(v.code || '').toLowerCase() === skuLower);
      });

      const matchedVariant = matchedProduct?.variants?.find((v) => String(v.code || '').toLowerCase() === skuLower) || matchedProduct?.variants?.[0];
      const prices = matchedVariant?.prices || {};
      const catalogPriceInr = Number(prices.b2r || matchedProduct?.resellerPrice || prices.single || 0);

      if (!matchedProduct || catalogPriceInr <= 0) {
        return Response.json(
          { success: false, error: `Invalid or unpriced product SKU: ${skuRaw || 'unknown'}` },
          { status: 400, headers: corsHeaders }
        );
      }

      const localizedItemPrice = getLocalizedPrice(catalogPriceInr, orderCountryConfig, exchangeRates);
      orderCurrency = localizedItemPrice.currency;

      verifiedItems.push({
        ...rawItem,
        product_id: matchedProduct.id || rawItem.product_id || rawItem.productGroupKey,
        product_title: rawItem.product_title || rawItem.title || matchedProduct.title || matchedProduct.name || 'Handloom Textile',
        variant_code: matchedVariant?.code || rawItem.variant_code || '',
        color: rawItem.color || rawItem.selectedColorName || matchedVariant?.color || 'Standard',
        quantity: qty,
        price: localizedItemPrice.finalPrice,
        base_inr_price: localizedItemPrice.markedUpBasePrice,
        currency: orderCurrency,
      });
    }

    const verifiedSubtotal = roundCurrency(
      verifiedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0),
      orderCurrency
    );
    const verifiedShipping = roundCurrency(Math.max(0, Number(shipping_amount) || 0), orderCurrency);
    const fxRate = orderCurrency === 'INR'
      ? 1
      : (Number(exchangeRates?.[orderCurrency]) || Number(DEFAULT_BASELINE_RATES[orderCurrency]) || 1);
    const convertInrToOrder = (val) =>
      orderCurrency === 'INR' ? Number(val) : roundCurrency(Number(val) * fxRate, orderCurrency);

    let verifiedDiscount = 0;
    const normalizedCouponCode = coupon_code ? String(coupon_code).trim().toUpperCase() : null;
    if (normalizedCouponCode) {
      const { data: couponRow } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', normalizedCouponCode)
        .eq('is_active', true)
        .maybeSingle();

      const nowMs = Date.now();
      const notExpired = !couponRow?.expires_at || new Date(couponRow.expires_at).getTime() > nowMs;
      const underLimit = !couponRow?.usage_limit || (couponRow.times_used || 0) < couponRow.usage_limit;
      const minOrderLocalized = couponRow?.min_order_amount ? convertInrToOrder(Number(couponRow.min_order_amount)) : 0;
      const meetsMin = !minOrderLocalized || verifiedSubtotal >= minOrderLocalized;

      if (!couponRow || !notExpired || !underLimit || !meetsMin) {
        return Response.json(
          { success: false, error: 'Invalid, expired, or ineligible coupon code.' },
          { status: 400, headers: corsHeaders }
        );
      }

      if (couponRow.discount_type === 'percentage') {
        verifiedDiscount = roundCurrency((verifiedSubtotal * Number(couponRow.discount_value || 0)) / 100, orderCurrency);
        if (couponRow.max_discount_amount) {
          verifiedDiscount = Math.min(verifiedDiscount, convertInrToOrder(Number(couponRow.max_discount_amount)));
        }
      } else {
        verifiedDiscount = convertInrToOrder(Number(couponRow.discount_value || 0));
      }
      verifiedDiscount = roundCurrency(Math.max(0, Math.min(verifiedSubtotal, verifiedDiscount)), orderCurrency);
    }

    const verifiedTotalAmount = roundCurrency(
      Math.max(0, verifiedSubtotal + verifiedShipping - verifiedDiscount),
      orderCurrency
    );

    // Format order narrative message using server-verified items & totals
    const orderItemsSummary = verifiedItems.map((it, idx) => 
      `${idx + 1}. ${it.product_title || 'Item'} (Code: ${it.variant_code || 'N/A'}, Color: ${it.color || 'Standard'}) x ${it.quantity} @ ${formatCurrency(it.price || 0, orderCurrency)}`
    ).join('\n');

    const paymentLabel = payment_method === 'cod'
      ? 'Cash on Delivery (COD)'
      : payment_method === 'whatsapp'
      ? 'Direct WhatsApp Confirmation'
      : 'Instant UPI / QR Transfer';

    const dropshipPricingNote = isDropship && dropship_details.custom_billed_price
      ? `\nBilled Price on Parcel Slip: ₹${Number(dropship_details.custom_billed_price).toLocaleString('en-IN')}${dropship_details.custom_discount ? `\nDiscount on Slip: ₹${Number(dropship_details.custom_discount).toLocaleString('en-IN')}` : ''}`
      : '';

    const recipientCountry = delivery_details.country || country_name || 'India';
    const senderCountry = dropship_details.sender_country || 'India';

    const orderMessage = isDropship
      ? `DIRECT DROPSHIP ORDER (BLIND PACKAGING)\nPayment: ${paymentLabel}\nTotal: ${formatCurrency(verifiedTotalAmount, orderCurrency)} (${orderCurrency})\nCurrency: ${orderCurrency}${dropshipPricingNote}\n\nSender (Parcel Label):\nName: ${dropship_details.sender_name || 'Reseller'}\nPhone: ${dropship_details.sender_phone || 'N/A'}\nAddress: ${dropship_details.sender_address || ''}, ${dropship_details.sender_city || ''}, ${dropship_details.sender_state || ''} - ${dropship_details.sender_pincode || ''}\nCountry: ${senderCountry}\n\nDeliver To (Recipient):\nName: ${fullName}\nPhone: ${phone}\nAddress: ${addr1}${delivery_details.address_line2 ? ', ' + delivery_details.address_line2 : ''}\nCity: ${city}, ${state} - ${pincode}\nCountry: ${recipientCountry}\nPackaging: ${dropship_details.packing_preference || 'Blind Shipping'}\n\nItems:\n${orderItemsSummary}${notes ? '\n\nNotes: ' + notes : ''}`
      : `B2B ORDER (${paymentLabel})\nTotal: ${formatCurrency(verifiedTotalAmount, orderCurrency)} (${orderCurrency})\nCurrency: ${orderCurrency}\nShipping: ${shipping_speed === 'expedited' ? `Expedited (2-3 Days)${verifiedShipping > 0 ? ` (+${formatCurrency(verifiedShipping, orderCurrency)})` : ''}` : (verifiedShipping > 0 ? `Standard Delivery (+${formatCurrency(verifiedShipping, orderCurrency)})` : 'Standard Free (4-5 Days)')}\n\nDelivery Address:\nName: ${fullName}\nPhone: ${phone}\nEmail: ${email || 'N/A'}\nAddress: ${addr1}${delivery_details.address_line2 ? ', ' + delivery_details.address_line2 : ''}\nCity: ${city}, ${state} - ${pincode}\nCountry: ${recipientCountry}\n\nItems:\n${orderItemsSummary}${notes ? '\n\nNotes: ' + notes : ''}`;

    const orderNumber = `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    // 2. Insert into Supabase Orders table (dual-write trigger synchronizes 3NF entities)
    const orderPayload = {
      order_number: orderNumber,
      user_id: validUserId,
      email: email || null,
      buyer_name: isDropship ? (dropship_details.sender_name || fullName) : fullName,
      business_name: isDropship ? (dropship_details.sender_name || null) : (delivery_details.business_name || null),
      phone: isDropship ? (dropship_details.sender_phone || phone) : phone,
      pincode: pincode,
      status: 'new',
      total_amount: verifiedTotalAmount,
      coupon_code: normalizedCouponCode,
      coupon_discount: verifiedDiscount,
      message: orderMessage,
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
      items: verifiedItems.map(item => ({
        product_id: item.product_id,
        product_title: item.product_title,
        variant_code: item.variant_code,
        color: item.color,
        quantity: item.quantity,
        price: item.price,
        custom_billed_price: item.custom_billed_price || dropship_details.custom_billed_price || null,
        custom_discount: item.custom_discount || dropship_details.custom_discount || null,
      })),
    };

    const { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select('id, order_number, created_at')
      .single();

    if (insertError) {
      console.error('[orderHandler] Database insertion failed:', insertError);
      return Response.json(
        { success: false, error: 'Database order registration failed: ' + insertError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const orderId = insertedOrder?.id;
    const resolvedOrderNumber = insertedOrder?.order_number || orderNumber;

    if (normalizedCouponCode) {
      await recordCouponUsage(supabase, {
        couponCode: normalizedCouponCode,
        orderId,
        orderNumber: resolvedOrderNumber,
        userId: validUserId,
        email: email || null,
        phone,
        discountAmount: verifiedDiscount,
        orderTotal: verifiedTotalAmount,
      });
    }

    // Retrieve normalized 3NF order entities for downstream email and verification
    let normalizedOrder = null;
    try {
      const { data: fetched3NF } = await supabase
        .from('orders')
        .select('*, order_delivery_addresses(*), order_dropship_senders(*), order_items(*), order_fulfillments(*)')
        .eq('id', orderId)
        .maybeSingle();
      if (fetched3NF) normalizedOrder = fetched3NF;
    } catch (normErr) {
      console.warn('[orderHandler] 3NF fetch notice:', normErr);
    }

    // 3. Trigger Email Notification via Resend (Async / Non-blocking)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const fromEmail = process.env.RESEND_NOTIFICATIONS_FROM_EMAIL || process.env.RESEND_DEFAULT_FROM_EMAIL || 'notifications@updates.weave365.com';
      const targetEmail = process.env.NEXT_PUBLIC_STORE_EMAIL || 'weave365@gmail.com';

      const itemsRowsHtml = verifiedItems.map((item, idx) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
            <strong>${escapeHtml(item.product_title || 'Handloom Saree / Textile')}</strong>
            <br/><span style="font-size: 11px; color: #6b7280;">Color: ${escapeHtml(item.color || 'Standard')} | Code: ${escapeHtml(item.variant_code || 'N/A')}</span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${Number((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      const safeFullName = escapeHtml(fullName).replace(/[\r\n]/g, ' ');
      const emailSubject = `🎉 New Order #${resolvedOrderNumber || orderId?.slice(0, 8)}: ${fullName.replace(/[\r\n]/g, ' ')} (₹${verifiedTotalAmount.toLocaleString('en-IN')}) - ${paymentLabel}`;
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 30px 15px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
            <div style="background: #0f172a; color: #ffffff; padding: 24px; text-align: center;">
              <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">NEW WEAVE 365 ORDER RECEIVED</h1>
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">Order Ref: ${escapeHtml(resolvedOrderNumber)} &middot; ID: ${escapeHtml(orderId)}</p>
            </div>
            <div style="padding: 24px;">
              <div style="background: #f1f5f9; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Payment Method:</strong> ${escapeHtml(paymentLabel)}</p>
                <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Order Total:</strong> ₹${verifiedTotalAmount.toLocaleString('en-IN')}</p>
                <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Shipping Mode:</strong> ${isDropship ? 'White-Label Dropship' : 'Standard Delivery'}</p>
                ${notes ? `<p style="margin: 0; font-size: 14px; color: #0369a1;"><strong>Payment Reference / Notes:</strong> ${escapeHtml(notes)}</p>` : ''}
              </div>

              <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin: 0 0 10px 0; letter-spacing: 0.5px;">Delivery Address</h3>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155; background: #fafafa; padding: 12px; border-radius: 6px; border: 1px solid #f1f5f9;">
                <strong>${safeFullName}</strong><br/>
                Phone: ${escapeHtml(phone)}<br/>
                ${email ? 'Email: ' + escapeHtml(email) + '<br/>' : ''}
                ${escapeHtml(addr1)}${delivery_details.address_line2 ? ', ' + escapeHtml(delivery_details.address_line2) : ''}<br/>
                ${escapeHtml(city)}, ${escapeHtml(state)} - ${escapeHtml(pincode)}<br/>
                India
              </p>

              <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin: 0 0 10px 0; letter-spacing: 0.5px;">Ordered Items</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                    <th style="padding: 8px; text-align: left;">#</th>
                    <th style="padding: 8px; text-align: left;">Product</th>
                    <th style="padding: 8px; text-align: center;">Qty</th>
                    <th style="padding: 8px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRowsHtml}
                </tbody>
              </table>

              <div style="margin-top: 24px; text-align: center;">
                <a href="https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${fullName}, we have received your Weave365 order #${orderId?.slice(0, 8)}. We are preparing your handloom sarees for dispatch!`)}" 
                   style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  Message Customer on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: `Weave365 Orders <${fromEmail}>`,
          to: targetEmail,
          reply_to: email || undefined,
          subject: emailSubject,
          html: emailHtml,
        }),
      }).catch((err) => console.error('[orderHandler] Resend notification dispatch error:', err));

      // Also auto-dispatch minimal confirmation email to buyer if email address provided
      if (email && email.includes('@')) {
        sendBuyerOrderConfirmationEmail({
          orderId,
          order: normalizedOrder || { ...orderPayload, id: orderId, order_number: resolvedOrderNumber },
          supabase,
        }).catch((err) => console.error('[orderHandler] Buyer confirmation email dispatch error:', err));
      }
    }

    return Response.json(
      {
        success: true,
        orderId: orderId,
        orderNumber: resolvedOrderNumber,
        message: 'Order registered successfully.',
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('[orderHandler] Unexpected error:', err);
    return Response.json(
      { success: false, error: err.message || 'Internal server error processing order.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
