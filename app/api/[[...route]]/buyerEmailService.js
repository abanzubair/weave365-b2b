/**
 * @file app/api/[[...route]]/buyerEmailService.js
 * @description Distilled, Minimal Buyer Order Confirmation Email Service for Weave 365.
 * Designed according to "impeccable distill & quieter" principles:
 * - Restrained palette: Neutral canvas, dark charcoal ink (#18181b), muted hairlines (#ebebeb).
 * - Refined typography: Single system stack, clean proportions, generous whitespace.
 * - Understated luxury: High-end Varanasi handloom atelier tone, zero visual clutter or marketing noise.
 * - Bulletproof idempotency: Prevents duplicate dispatches across verify-order & webhook invocations.
 * - Edge-runtime compatible: Zero external heavy dependencies, native Fetch to Resend API.
 */

export const runtime = 'edge';

/**
 * Format a UUID or string into a clean short order reference: ORD-XXXXXXXX
 */
export function formatOrderNumber(orderId) {
  if (!orderId) return 'ORD-WEAVE';
  const clean = String(orderId).replace(/[^a-zA-Z0-9]/g, '');
  return `ORD-${clean.slice(0, 8).toUpperCase()}`;
}

/**
 * Detect currency from order payload or message narrative
 */
export function detectOrderCurrency(order = {}) {
  if (order.currency) return String(order.currency).toUpperCase();
  if (order.message) {
    const match = order.message.match(/Currency:\s*([A-Z]{3})/i) || order.message.match(/\(([A-Z]{3})\)/);
    if (match) return match[1].toUpperCase();
  }
  if (Array.isArray(order.items) && order.items[0]?.currency) {
    return String(order.items[0].currency).toUpperCase();
  }
  return 'INR';
}

/**
 * Format amount into localized currency string (INR, USD, EUR, etc.)
 */
export function formatCurrency(amount, currency = 'INR', currencySymbol = null) {
  const num = Number(amount) || 0;
  const curr = String(currency || 'INR').toUpperCase();
  if (curr === 'INR') {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const symbolMap = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'A$',
    AED: 'AED ',
    QAR: 'QAR ',
    SAR: 'SAR ',
    SGD: 'S$',
    KWD: 'KWD ',
  };
  const sym = currencySymbol || symbolMap[curr] || `${curr} `;
  return `${sym}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Render the minimal, distilled buyer confirmation HTML email.
 */
export function renderBuyerConfirmationEmailHtml({
  order,
  orderNumber,
  trackingUrl,
  siteUrl = 'https://www.weave365.com',
  supportWhatsApp = '919919101369',
}) {
  const recipientName = order.buyer_name || order.dropship_recipient_name || 'Valued Buyer';
  const orderCurrency = detectOrderCurrency(order);
  const totalAmountFormatted = formatCurrency(order.total_amount, orderCurrency);
  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  const isDropship = Boolean(order.is_dropship);
  const destName = order.dropship_recipient_name || order.buyer_name || recipientName;
  const destPhone = order.dropship_recipient_phone || order.phone || '';
  const destAddress = order.dropship_recipient_address || '';
  const destCity = order.dropship_recipient_city || '';
  const destState = order.dropship_recipient_state || '';
  const destPincode = order.dropship_recipient_pincode || order.pincode || '';

  const items = Array.isArray(order.items) ? order.items : [];

  const itemsRowsHtml = items.length > 0
    ? items.map((item, idx) => {
        const title = item.product_title || item.title || 'Handloom Textile';
        const color = item.color || item.selectedColorName || 'Standard';
        const code = item.variant_code || 'N/A';
        const qty = item.quantity || 1;
        const lineTotal = formatCurrency((Number(item.price) || 0) * (Number(qty) || 1), orderCurrency);

        return `
          <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #f4f4f5; vertical-align: top;">
              <div style="font-size: 13px; font-weight: 500; color: #18181b; line-height: 1.4;">
                ${title}
              </div>
              <div style="font-size: 11px; color: #71717a; margin-top: 4px; letter-spacing: 0.01em;">
                ${color}${code !== 'N/A' ? ` &middot; Code: ${code}` : ''}
              </div>
            </td>
            <td style="padding: 16px 8px; border-bottom: 1px solid #f4f4f5; font-size: 13px; color: #52525b; text-align: center; vertical-align: top;">
              ${qty}
            </td>
            <td style="padding: 16px 0; border-bottom: 1px solid #f4f4f5; font-size: 13px; font-weight: 500; color: #18181b; text-align: right; vertical-align: top; font-variant-numeric: tabular-nums;">
              ${lineTotal}
            </td>
          </tr>
        `;
      }).join('')
    : `
      <tr>
        <td colspan="3" style="padding: 16px 0; border-bottom: 1px solid #f4f4f5; font-size: 13px; color: #52525b;">
          B2B Order Items Confirmed
        </td>
      </tr>
    `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Weave 365</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #18181b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; margin: 0; padding: 40px 20px;">
    <tr>
      <td align="center" style="padding: 0;">
        <!-- Main Content Area (Unboxed, Seamless, 640px) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px; background-color: #ffffff; text-align: left;">
          
          <!-- Header / Wordmark -->
          <tr>
            <td style="padding: 0 0 24px 0; border-bottom: 1px solid #f4f4f5;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #18181b;">
                      WEAVE 365
                    </div>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <span style="display: inline-block; font-size: 11px; font-weight: 500; color: #27272a; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 4px; padding: 4px 8px; letter-spacing: 0.04em;">
                      ${orderNumber}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Notice -->
          <tr>
            <td style="padding: 32px 0 24px 0;">
              <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 500; letter-spacing: -0.015em; color: #18181b; line-height: 1.3;">
                Order Confirmed
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #52525b;">
                Thank you for your order, ${recipientName}. Your payment has been received and verified. Our fulfillment team is now preparing your pieces for dispatch.
              </p>
            </td>
          </tr>

          <!-- Metadata Strip -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border: 1px solid #f0f0f0; border-radius: 4px;">
                <tr>
                  <td width="50%" style="padding: 14px 18px; border-right: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0;">
                    <div style="font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; margin-bottom: 3px;">
                      ORDER DATE
                    </div>
                    <div style="font-size: 13px; font-weight: 500; color: #18181b;">
                      ${orderDate}
                    </div>
                  </td>
                  <td width="50%" style="padding: 14px 18px; border-bottom: 1px solid #f0f0f0;">
                    <div style="font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; margin-bottom: 3px;">
                      PAYMENT STATUS
                    </div>
                    <div style="font-size: 13px; font-weight: 500; color: #18181b;">
                      Verified &middot; ${order.payment_method === 'phonepe' ? 'PhonePe' : 'Cashfree PG'} (${orderCurrency})
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 14px 18px; border-right: 1px solid #f0f0f0;">
                    <div style="font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; margin-bottom: 3px;">
                      TOTAL AMOUNT
                    </div>
                    <div style="font-size: 13px; font-weight: 600; color: #18181b; font-variant-numeric: tabular-nums;">
                      ${totalAmountFormatted}
                    </div>
                  </td>
                  <td width="50%" style="padding: 14px 18px;">
                    <div style="font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; margin-bottom: 3px;">
                      FULFILLMENT
                    </div>
                    <div style="font-size: 13px; font-weight: 500; color: #18181b;">
                      ${isDropship ? 'White-Label Dropship' : 'Direct Atelier Dispatch'}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 0 0 24px 0;">
              <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 12px;">
                SUMMARY OF PIECES
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <thead>
                  <tr>
                    <th align="left" style="font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; padding-bottom: 10px; border-bottom: 1px solid #e4e4e7;">Item</th>
                    <th align="center" style="font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; padding-bottom: 10px; border-bottom: 1px solid #e4e4e7; width: 48px;">Qty</th>
                    <th align="right" style="font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; padding-bottom: 10px; border-bottom: 1px solid #e4e4e7; width: 100px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRowsHtml}
                </tbody>
              </table>

              <!-- Totals Breakdown -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
                <tr>
                  <td align="right" style="font-size: 12px; color: #71717a; padding: 4px 0;">
                    Subtotal:
                  </td>
                  <td align="right" style="font-size: 12px; color: #52525b; width: 100px; padding: 4px 0; font-variant-numeric: tabular-nums;">
                    ${totalAmountFormatted}
                  </td>
                </tr>
                <tr>
                  <td align="right" style="font-size: 12px; color: #71717a; padding: 4px 0;">
                    Insured Shipping:
                  </td>
                  <td align="right" style="font-size: 12px; color: #52525b; width: 100px; padding: 4px 0;">
                    Complimentary
                  </td>
                </tr>
                <tr>
                  <td align="right" style="font-size: 14px; font-weight: 600; color: #18181b; padding: 10px 0 0 0; border-top: 1px solid #e4e4e7;">
                    Total:
                  </td>
                  <td align="right" style="font-size: 14px; font-weight: 600; color: #18181b; width: 100px; padding: 10px 0 0 0; border-top: 1px solid #e4e4e7; font-variant-numeric: tabular-nums;">
                    ${totalAmountFormatted}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${destAddress ? `
          <!-- Destination Details -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 8px;">
                DELIVERY DESTINATION
              </div>
              <div style="font-size: 13px; line-height: 1.6; color: #52525b; background-color: #fafafa; border: 1px solid #f0f0f0; border-radius: 4px; padding: 14px 18px;">
                <div style="font-weight: 500; color: #18181b;">${destName}</div>
                ${destPhone ? `<div>Phone: ${destPhone}</div>` : ''}
                <div>${destAddress}</div>
                <div>${[destCity, destState, destPincode].filter(Boolean).join(', ')}</div>
                <div>India</div>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Action Button -->
          <tr>
            <td style="padding: 8px 0 36px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${trackingUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 500; padding: 13px 28px; border-radius: 4px; letter-spacing: 0.02em;">
                      Track Consignment &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Quiet Help & Footnote -->
          <tr>
            <td style="padding: 28px 0 32px 0; border-top: 1px solid #f4f4f5; text-align: center;">
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #71717a;">
                Need assistance with your consignment? Reply directly to this email or message our concierge on WhatsApp at <a href="https://wa.me/${supportWhatsApp.replace(/\D/g, '')}" style="color: #18181b; text-decoration: underline;">+91 99191 01369</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Dispatch buyer confirmation email via Resend with idempotency protection.
 *
 * @param {Object} params
 * @param {string} [params.orderId] - Order UUID in Supabase
 * @param {Object} [params.order] - Order record if already fetched
 * @param {Object} [params.supabase] - Supabase Admin Client
 * @param {string} [params.overrideEmail] - Explicit recipient for testing
 * @param {boolean} [params.forceSend] - Bypass idempotency check (for manual tests)
 */
export async function sendBuyerOrderConfirmationEmail({
  orderId,
  order = null,
  supabase = null,
  overrideEmail = null,
  forceSend = false,
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('[buyerEmailService] RESEND_API_KEY is not configured in environment.');
    return { success: false, reason: 'missing_resend_api_key' };
  }

  let orderRecord = order;

  // If orderRecord not provided, query Supabase
  if (!orderRecord && orderId && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !data) {
      console.error('[buyerEmailService] Failed to fetch order record:', error);
      return { success: false, reason: 'order_not_found', error };
    }
    orderRecord = data;
  }

  if (!orderRecord) {
    console.warn('[buyerEmailService] No order record provided.');
    return { success: false, reason: 'no_order_record' };
  }

  const targetEmail = overrideEmail || orderRecord.email;
  if (!targetEmail || !targetEmail.includes('@')) {
    console.warn('[buyerEmailService] Order has no valid recipient email:', targetEmail);
    return { success: false, reason: 'invalid_email' };
  }

  const orderNumber = formatOrderNumber(orderRecord.id);

  // Idempotency check: don't double send if already confirmed and not forcing
  const emailSentTag = '[Buyer Confirmation Sent]';
  if (!forceSend && orderRecord.message && orderRecord.message.includes(emailSentTag)) {
    console.log(`[buyerEmailService] Confirmation email already sent for order ${orderRecord.id}. Skipping.`);
    return { success: true, skipped: true, reason: 'already_sent' };
  }

  // Idempotently mark order in DB before or right after sending
  if (!forceSend && supabase && orderRecord.id) {
    const nowIso = new Date().toISOString();
    const updatedMessage = `${orderRecord.message || ''}\n${emailSentTag}: ${nowIso}`;
    
    // We update the message in Supabase
    await supabase
      .from('orders')
      .update({ message: updatedMessage })
      .eq('id', orderRecord.id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com';
  const trackingUrl = `${siteUrl}/order-tracking/${orderRecord.id || ''}`;
  const fromEmail = process.env.RESEND_PAYMENTS_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'payments@updates.weave365.com';
  const replyToEmail = process.env.RESEND_PAYMENTS_REPLY_TO_EMAIL || process.env.RESEND_REPLY_TO_EMAIL || 'payments@weave365.com';
  const supportWhatsApp = process.env.NEXT_PUBLIC_STORE_WHATSAPP || '919919101369';

  const htmlContent = renderBuyerConfirmationEmailHtml({
    order: orderRecord,
    orderNumber,
    trackingUrl,
    siteUrl,
    supportWhatsApp,
  });

  const subject = `Order Confirmed: ${orderNumber} &middot; Weave 365`;

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Weave 365 <${fromEmail}>`,
        to: targetEmail,
        reply_to: replyToEmail,
        subject: subject,
        html: htmlContent,
      }),
    });

    const resData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('[buyerEmailService] Resend dispatch failed:', resData);
      return { success: false, reason: 'resend_error', details: resData };
    }

    console.log(`[buyerEmailService] Confirmation email sent successfully to ${targetEmail}. Resend ID: ${resData.id}`);
    return {
      success: true,
      resendId: resData.id,
      recipient: targetEmail,
      orderNumber,
    };
  } catch (err) {
    console.error('[buyerEmailService] Network or unexpected error during email dispatch:', err);
    return { success: false, reason: 'network_error', error: err.message };
  }
}
