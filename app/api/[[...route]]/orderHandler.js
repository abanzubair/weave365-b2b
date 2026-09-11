/**
 * @file app/api/[[...route]]/orderHandler.js
 * @description Robust Server-Side Order Placement Handler for Weave365.
 * Safely inserts orders into Supabase using the Service Role Key (bypassing RLS),
 * ensuring 100% order capture for both authenticated members and guest buyers.
 * Automatically dispatches notification emails via Resend.
 */

import { createClient } from '@supabase/supabase-js';

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
      delivery_details = {},
      dropship_details = {},
      items = [],
      total_amount = 0,
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

    // 1. Initialize Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    // Format order narrative message
    const orderItemsSummary = items.map((it, idx) => 
      `${idx + 1}. ${it.product_title || 'Item'} (Code: ${it.variant_code || 'N/A'}, Color: ${it.color || 'Standard'}) x ${it.quantity} @ ₹${it.price || 0}`
    ).join('\n');

    const paymentLabel = payment_method === 'cod'
      ? 'Cash on Delivery (COD)'
      : payment_method === 'whatsapp'
      ? 'Direct WhatsApp Confirmation'
      : 'Instant UPI / QR Transfer';

    const orderMessage = isDropship
      ? `DIRECT DROPSHIP ORDER (BLIND PACKAGING)\nPayment: ${paymentLabel}\nTotal: ₹${Number(total_amount).toLocaleString('en-IN')}\n\nSender (Parcel Label):\nName: ${dropship_details.sender_name || 'Reseller'}\nPhone: ${dropship_details.sender_phone || 'N/A'}\nAddress: ${dropship_details.sender_address || ''}, ${dropship_details.sender_city || ''}, ${dropship_details.sender_state || ''} - ${dropship_details.sender_pincode || ''}\n\nDeliver To (Recipient):\nName: ${fullName}\nPhone: ${phone}\nAddress: ${addr1}${delivery_details.address_line2 ? ', ' + delivery_details.address_line2 : ''}\nCity: ${city}, ${state} - ${pincode}\nCountry: India\nPackaging: ${dropship_details.packing_preference || 'Blind Shipping'}\n\nItems:\n${orderItemsSummary}${notes ? '\n\nNotes: ' + notes : ''}`
      : `B2B ORDER (${paymentLabel})\nTotal: ₹${Number(total_amount).toLocaleString('en-IN')}\nShipping: ${shipping_speed === 'expedited' ? 'Expedited (2-3 Days)' : 'Standard Free (4-5 Days)'}\n\nDelivery Address:\nName: ${fullName}\nPhone: ${phone}\nEmail: ${email || 'N/A'}\nAddress: ${addr1}${delivery_details.address_line2 ? ', ' + delivery_details.address_line2 : ''}\nCity: ${city}, ${state} - ${pincode}\nCountry: India\n\nItems:\n${orderItemsSummary}${notes ? '\n\nNotes: ' + notes : ''}`;

    // Clean user_id (must be valid UUID or null)
    const validUserId = (user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id))
      ? user_id
      : null;

    // 2. Insert into Supabase Orders table
    const orderPayload = {
      user_id: validUserId,
      email: email || null,
      buyer_name: isDropship ? (dropship_details.sender_name || fullName) : fullName,
      business_name: isDropship ? (dropship_details.sender_name || null) : (delivery_details.business_name || null),
      phone: isDropship ? (dropship_details.sender_phone || phone) : phone,
      pincode: pincode,
      status: 'new',
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
      items: items.map(item => ({
        product_id: item.product_id || item.productGroupKey,
        product_title: item.product_title || item.title || '',
        variant_code: item.variant_code || '',
        color: item.color || item.selectedColorName || 'Standard',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
      })),
    };

    const { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('[orderHandler] Database insertion failed:', insertError);
      return Response.json(
        { success: false, error: 'Database order registration failed: ' + insertError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const orderId = insertedOrder?.id;

    // 3. Trigger Email Notification via Resend (Async / Non-blocking)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@updates.weave365.com';
      const targetEmail = process.env.NEXT_PUBLIC_STORE_EMAIL || 'weave365@gmail.com';

      const itemsRowsHtml = items.map((item, idx) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
            <strong>${item.product_title || 'Handloom Saree / Textile'}</strong>
            <br/><span style="font-size: 11px; color: #6b7280;">Color: ${item.color || 'Standard'} | Code: ${item.variant_code || 'N/A'}</span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${Number((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      const emailSubject = `🎉 New Order #${orderId?.slice(0, 8)}: ${fullName} (₹${Number(total_amount).toLocaleString('en-IN')}) - ${paymentLabel}`;
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 30px 15px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
            <div style="background: #0f172a; color: #ffffff; padding: 24px; text-align: center;">
              <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">NEW WEAVE 365 ORDER RECEIVED</h1>
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">Order ID: ${orderId}</p>
            </div>
            <div style="padding: 24px;">
              <div style="background: #f1f5f9; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Payment Method:</strong> ${paymentLabel}</p>
                <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Order Total:</strong> ₹${Number(total_amount).toLocaleString('en-IN')}</p>
                <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Shipping Mode:</strong> ${isDropship ? 'White-Label Dropship' : 'Standard Delivery'}</p>
                ${notes ? `<p style="margin: 0; font-size: 14px; color: #0369a1;"><strong>Payment Reference / Notes:</strong> ${notes}</p>` : ''}
              </div>

              <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin: 0 0 10px 0; letter-spacing: 0.5px;">Delivery Address</h3>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155; background: #fafafa; padding: 12px; border-radius: 6px; border: 1px solid #f1f5f9;">
                <strong>${fullName}</strong><br/>
                Phone: ${phone}<br/>
                ${email ? 'Email: ' + email + '<br/>' : ''}
                ${addr1}${delivery_details.address_line2 ? ', ' + delivery_details.address_line2 : ''}<br/>
                ${city}, ${state} - ${pincode}<br/>
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
    }

    return Response.json(
      {
        success: true,
        orderId: orderId,
        orderNumber: orderId ? orderId.slice(0, 8).toUpperCase() : 'ORD',
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
