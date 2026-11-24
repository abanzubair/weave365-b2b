/**
 * @file app/api/[[...route]]/bankTransferHandler.js
 * @description Server-side handler for International Direct Bank Transfer (SBI SWIFT / Wire).
 *
 * Handles:
 * 1. POST /api/bank-transfer/create-order -> Creates international order with status 'awaiting_bank_transfer',
 *    returns Proforma Invoice + SBI SWIFT details + mandatory export purpose string, and emails Proforma Invoice.
 * 2. POST /api/bank-transfer/submit-proof -> Records customer's SWIFT / wire reference number for admin verification.
 *
 * Environment Variables Required to Activate:
 * - NEXT_PUBLIC_BANK_TRANSFER_ENABLED=true
 * - SBI_BENEFICIARY_NAME
 * - SBI_ACCOUNT_NUMBER
 * - SBI_IFSC_CODE
 * - SBI_SWIFT_CODE
 * - SBI_BRANCH_NAME (optional)
 * - SBI_BANK_ADDRESS (optional)
 * - SBI_IEC_CODE (optional, printed on Proforma Invoice for export compliance)
 */

import { createClient } from '@supabase/supabase-js';
import { formatCurrency } from '../../../src/services/pricingService.js';

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

export function getSbiBankConfig() {
  const beneficiaryName = (process.env.SBI_BENEFICIARY_NAME || '').trim();
  const accountNumber = (process.env.SBI_ACCOUNT_NUMBER || '').trim();
  const ifscCode = (process.env.SBI_IFSC_CODE || '').trim().toUpperCase();
  const swiftCode = (process.env.SBI_SWIFT_CODE || '').trim().toUpperCase();
  const branchName = (process.env.SBI_BRANCH_NAME || 'State Bank of India').trim();
  const bankAddress = (process.env.SBI_BANK_ADDRESS || '').trim();
  const iecCode = (process.env.SBI_IEC_CODE || '').trim().toUpperCase();

  return {
    isConfigured: Boolean(beneficiaryName && accountNumber && swiftCode),
    bankName: 'State Bank of India (SBI)',
    beneficiaryName,
    accountNumber,
    ifscCode,
    swiftCode,
    branchName,
    bankAddress,
    iecCode,
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

async function sendProformaInvoiceEmail({ email, fullName, orderNumber, totalFormatted, orderCurrency, purposeNote, bankDetails, countryName }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey || !email) return;

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'orders@weave365.com';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #0f172a; color: #ffffff; padding: 24px;">
        <div style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #d4af37;">Weave 365 &middot; Export Proforma Invoice</div>
        <h2 style="margin: 6px 0 0; font-size: 20px;">Order #${orderNumber} &mdash; Awaiting Bank Transfer</h2>
      </div>
      <div style="padding: 24px; line-height: 1.55; font-size: 14px;">
        <p>Hello ${fullName},</p>
        <p>Thank you for your international order (${countryName}). Please complete your wire transfer using the State Bank of India (SBI) details below. Your order will be processed as soon as funds clear (typically 1&ndash;3 business days).</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <div><strong>Amount Due:</strong> ${totalFormatted} (${orderCurrency})</div>
          <div><strong>Bank:</strong> ${bankDetails.bankName}</div>
          <div><strong>Beneficiary Name:</strong> ${bankDetails.beneficiaryName}</div>
          <div><strong>Account Number:</strong> ${bankDetails.accountNumber}</div>
          <div><strong>SWIFT / BIC Code:</strong> ${bankDetails.swiftCode}</div>
          ${bankDetails.ifscCode ? `<div><strong>IFSC Code:</strong> ${bankDetails.ifscCode}</div>` : ''}
          ${bankDetails.branchName ? `<div><strong>Branch:</strong> ${bankDetails.branchName}</div>` : ''}
          ${bankDetails.bankAddress ? `<div><strong>Bank Address:</strong> ${bankDetails.bankAddress}</div>` : ''}
          ${bankDetails.iecCode ? `<div><strong>Exporter IEC Code:</strong> ${bankDetails.iecCode}</div>` : ''}
        </div>
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin: 16px 0;">
          <div style="font-weight: 700; color: #92400e; margin-bottom: 4px;">Mandatory Payment Purpose / Remittance Note:</div>
          <div style="font-family: monospace; font-size: 13px; color: #78350f;">${purposeNote}</div>
          <div style="font-size: 12px; color: #92400e; margin-top: 6px;">Please paste this exact note into your bank's Purpose / Remarks field and choose "OUR" (sender pays transfer fees) so the full invoice amount is received.</div>
        </div>
        <p style="font-size: 13px; color: #475569;">Once transferred, reply to this email or share your SWIFT receipt on WhatsApp with Order #${orderNumber}.</p>
      </div>
    </div>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Weave 365 <${fromEmail}>`,
        to: [email],
        subject: `Proforma Invoice & Bank Wire Details — Order #${orderNumber}`,
        html,
      }),
    });
  } catch (err) {
    console.warn('[BankTransfer] Proforma email send note:', err?.message);
  }
}

/**
 * POST /api/bank-transfer/create-order
 */
export async function handleCreateOrder(request) {
  const corsHeaders = getCorsHeaders(request);
  const bankConfig = getSbiBankConfig();

  if (!bankConfig.isConfigured) {
    return Response.json(
      { success: false, error: 'International bank transfer is coming soon. SBI wire details are not configured yet.' },
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
    const orderCurrency = String(currency || 'USD').trim().toUpperCase();

    if (resolvedCountryCode === 'IN' || orderCurrency === 'INR') {
      return Response.json(
        { success: false, error: 'International bank transfer is only for non-Indian orders. Please use PhonePe or Cashfree for Indian (INR) orders.' },
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

    const isDropship = shipping_mode === 'dropship';
    const supabase = getSupabaseAdmin();
    const validUserId = (user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id))
      ? user_id
      : null;
    const orderNumber = `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const purposeNote = `Export of Banarasi Silk Sarees & Handloom Textiles - Order #${orderNumber}`;
    const totalFormatted = formatCurrency(Number(total_amount), orderCurrency, { currencySymbol: currency_symbol });
    const resolvedCountryName = delivery_details.country || country_name || resolvedCountryCode;

    const orderPayload = {
      order_number: orderNumber,
      user_id: validUserId,
      email: email || null,
      buyer_name: isDropship ? (dropship_details.sender_name || fullName) : fullName,
      business_name: isDropship ? (dropship_details.sender_name || null) : (delivery_details.business_name || null),
      phone: isDropship ? (dropship_details.sender_phone || phone) : phone,
      pincode,
      status: 'awaiting_bank_transfer',
      payment_method: 'bank_transfer',
      cf_order_id: `SWIFT_${orderNumber}`,
      total_amount: Number(total_amount),
      coupon_code: coupon_code ? String(coupon_code).trim().toUpperCase() : null,
      coupon_discount: Number(coupon_discount) || 0,
      message: `SBI INTERNATIONAL BANK TRANSFER (SWIFT/WIRE)\nTotal: ${totalFormatted} (${orderCurrency})\nMarked-up INR Reference: ₹${Number(base_inr_total || 0).toLocaleString('en-IN')}\nCurrency: ${orderCurrency}\nCountry: ${resolvedCountryName}\nPurpose Note: ${purposeNote}\nShipping: ${shipping_speed === 'expedited' ? `Expedited (2-3 Days) (+${formatCurrency(shipping_amount, orderCurrency)})` : (Number(shipping_amount) > 0 ? `Standard (+${formatCurrency(shipping_amount, orderCurrency)})` : 'Standard')}${coupon_code ? `\nCoupon: ${String(coupon_code).trim().toUpperCase()} (-${formatCurrency(coupon_discount, orderCurrency)})` : ''}\nStatus: Awaiting Bank Wire Transfer\nNotes: ${notes || 'None'}`,
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
        currency: orderCurrency,
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
      console.error('[BankTransfer createOrder] Supabase insert error:', dbError);
      return Response.json(
        { success: false, error: 'Failed to create bank transfer order: ' + dbError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const resolvedOrderNumber = dbOrder.order_number || orderNumber;
    const bankDetails = {
      bankName: bankConfig.bankName,
      beneficiaryName: bankConfig.beneficiaryName,
      accountNumber: bankConfig.accountNumber,
      ifscCode: bankConfig.ifscCode,
      swiftCode: bankConfig.swiftCode,
      branchName: bankConfig.branchName,
      bankAddress: bankConfig.bankAddress,
      iecCode: bankConfig.iecCode,
    };

    await sendProformaInvoiceEmail({
      email,
      fullName,
      orderNumber: resolvedOrderNumber,
      totalFormatted,
      orderCurrency,
      purposeNote,
      bankDetails,
      countryName: resolvedCountryName,
    });

    return Response.json(
      {
        success: true,
        db_order_id: dbOrder.id,
        order_number: resolvedOrderNumber,
        order_amount: Number(total_amount),
        order_currency: orderCurrency,
        purpose_note: purposeNote,
        bank_details: bankDetails,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('[BankTransfer createOrder] Exception:', err);
    return Response.json(
      { success: false, error: err.message || 'Internal server error creating bank transfer order.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/bank-transfer/submit-proof
 * Records the buyer's wire/SWIFT transaction reference for admin verification
 */
export async function handleSubmitProof(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const body = await request.json();
    const orderId = String(body.db_order_id || '').trim();
    const orderNumber = String(body.order_number || '').trim();
    const wireReference = String(body.wire_reference || '').trim();
    const senderBank = String(body.sender_bank || '').trim();

    if ((!orderId && !orderNumber) || !wireReference) {
      return Response.json(
        { success: false, error: 'Order reference and wire/SWIFT transaction reference are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = getSupabaseAdmin();
    let query = supabase.from('orders').select('id, status, message');
    query = orderId ? query.eq('id', orderId) : query.eq('order_number', orderNumber);
    const { data: order, error } = await query.maybeSingle();

    if (error || !order) {
      return Response.json(
        { success: false, error: 'Order not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    const proofNote = `\n\n[Bank Wire Proof Submitted] Ref: ${wireReference}${senderBank ? ` | Sender Bank: ${senderBank}` : ''} at ${new Date().toISOString()}`;
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: order.status === 'paid' ? 'paid' : 'payment_proof_submitted',
        cf_payment_id: wireReference,
        message: `${order.message || ''}${proofNote}`,
      })
      .eq('id', order.id);

    if (updateErr) {
      throw updateErr;
    }

    return Response.json(
      { success: true, message: 'Transfer reference submitted. Our team will verify the credit with SBI and confirm your order.' },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('[BankTransfer submitProof] Exception:', err);
    return Response.json(
      { success: false, error: err.message || 'Failed to submit transfer proof.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
