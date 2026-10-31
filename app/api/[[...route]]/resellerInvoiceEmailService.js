/**
 * @file app/api/[[...route]]/resellerInvoiceEmailService.js
 * @description Wholesale Reseller Order Invoice & Payment Link Email Service.
 * Dispatches an automated, minimal B2B invoice email to the reseller / API user
 * when an order is created, containing line items and a direct payment link.
 */

export const runtime = 'edge';

/**
 * Renders the clean, minimal HTML invoice email.
 */
export function renderResellerInvoiceEmailHtml({
  orderNumber,
  resellerOrderId,
  createdAt,
  items = [],
  totalWholesaleAmount = 0,
  recipientName = '',
  shippingAddress = '',
  paymentLink = '',
  supportWhatsApp = '919919101369',
}) {
  const formattedTotal = Number(totalWholesaleAmount).toLocaleString('en-IN');
  const dateStr = new Date(createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsRows = (items || []).map((it, idx) => {
    const title = it.product_title || it.title || 'Handloom Banarasi Saree';
    const sku = it.sku || it.code || 'N/A';
    const color = it.color || 'Standard';
    const qty = it.quantity || 1;
    const unitPrice = Number(it.wholesale_price || it.price || 0);
    const lineTotal = (unitPrice * qty).toLocaleString('en-IN');

    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 8px; font-size: 13px; color: #0f172a;">
          <div style="font-weight: 600;">${title}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">SKU: ${sku} &middot; Color: ${color}</div>
        </td>
        <td style="padding: 12px 8px; font-size: 13px; color: #334155; text-align: center;">${qty}</td>
        <td style="padding: 12px 8px; font-size: 13px; color: #334155; text-align: right;">₹${unitPrice.toLocaleString('en-IN')}</td>
        <td style="padding: 12px 8px; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">₹${lineTotal}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wholesale Order Invoice - Weave 365</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <div style="font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">Weave 365</div>
                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">B2B Wholesale Procurement</div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 10px; border-radius: 9999px;">
                      Payment Pending
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invoice Overview & Call to Action -->
          <tr>
            <td style="padding: 28px 32px 16px 32px;">
              <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 600; color: #0f172a;">Wholesale Order Invoice</h1>
              <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.5;">
                An order was submitted via your Developer API. Please review the itemized wholesale invoice below and complete payment to confirm fulfillment and release your order to the warehouse dispatch queue.
              </p>

              <!-- Payment CTA Box -->
              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;">Total Wholesale Amount Due</div>
                    <div style="font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 14px;">₹${formattedTotal}</div>
                    <div>
                      <a href="${paymentLink}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 24px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.08);">
                        Pay ₹${formattedTotal} &amp; Confirm Order &rarr;
                      </a>
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 10px;">
                      Secure instant payment via UPI, PhonePe, Cards, or NetBanking.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Order Metadata Grid -->
              <table role="presentation" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 12px;">
                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Order Details</div>
                    <div style="font-size: 13px; color: #0f172a; font-weight: 600;">#${orderNumber}</div>
                    ${resellerOrderId ? `<div style="font-size: 12px; color: #475569;">Reseller Ref: ${resellerOrderId}</div>` : ''}
                    <div style="font-size: 12px; color: #64748b;">${dateStr}</div>
                  </td>
                  <td width="50%" style="vertical-align: top; padding-left: 12px;">
                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Delivery Destination</div>
                    <div style="font-size: 13px; color: #0f172a; font-weight: 600;">${recipientName || 'B2B Partner Consignee'}</div>
                    <div style="font-size: 12px; color: #475569; line-height: 1.4;">${shippingAddress || 'India'}</div>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <div style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">Consignment Items</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #e2e8f0; background-color: #f8fafc;">
                    <th align="left" style="padding: 8px; font-size: 11px; text-transform: uppercase; color: #475569;">Item</th>
                    <th align="center" style="padding: 8px; font-size: 11px; text-transform: uppercase; color: #475569;">Qty</th>
                    <th align="right" style="padding: 8px; font-size: 11px; text-transform: uppercase; color: #475569;">Rate</th>
                    <th align="right" style="padding: 8px; font-size: 11px; text-transform: uppercase; color: #475569;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Financial Summary Table -->
              <table role="presentation" width="100%" style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 13px; color: #475569; padding: 4px 0;">Wholesale Subtotal</td>
                  <td align="right" style="font-size: 13px; color: #0f172a; font-weight: 600; padding: 4px 0;">₹${formattedTotal}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #475569; padding: 4px 0;">Packaging &amp; Warehouse Dispatch</td>
                  <td align="right" style="font-size: 13px; color: #10b981; font-weight: 600; padding: 4px 0;">Included</td>
                </tr>
                <tr style="border-top: 1px solid #e2e8f0;">
                  <td style="font-size: 14px; color: #0f172a; font-weight: 700; padding: 10px 0 0 0;">Total Payable</td>
                  <td align="right" style="font-size: 16px; color: #0f172a; font-weight: 800; padding: 10px 0 0 0;">₹${formattedTotal}</td>
                </tr>
              </table>

              <!-- Status Note -->
              <div style="background-color: #f1f5f9; border-radius: 6px; padding: 12px 16px; font-size: 12px; color: #475569; line-height: 1.5;">
                <strong>Next Step:</strong> Until payment is received, this order status remains <strong>Payment Pending</strong>. Upon successful payment verification, it will automatically update to <strong>Payment Received</strong> and enter the Varanasi quality inspection and packaging queue.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 28px 32px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; line-height: 1.5; text-align: center;">
              Need support with your consignment? Reply directly to this email or message our wholesale desk on WhatsApp at 
              <a href="https://wa.me/${supportWhatsApp.replace(/\D/g, '')}" style="color: #0f172a; text-decoration: underline;">+91 99191 01369</a>.<br>
              &copy; ${new Date().getFullYear()} Weave 365. Handloom Saree Procurement Network, Varanasi.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Dispatches the wholesale invoice and payment link email via Resend.
 */
export async function sendResellerInvoiceEmail({
  order,
  resellerOrderId,
  totalWholesaleAmount,
  items,
  recipientName,
  shippingAddress,
  recipientEmail,
  paymentLink,
  supabase,
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('[resellerInvoiceEmailService] RESEND_API_KEY is not configured in environment.');
    return { success: false, reason: 'missing_resend_api_key' };
  }

  const targetEmail = (recipientEmail || '').trim().toLowerCase();
  if (!targetEmail || !targetEmail.includes('@')) {
    console.warn('[resellerInvoiceEmailService] Invalid recipient email:', targetEmail);
    return { success: false, reason: 'invalid_recipient_email' };
  }

  const orderNumber = order?.order_number || (order?.id ? `ORD-${order.id.slice(0, 8).toUpperCase()}` : 'ORD-WEAVE');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com';
  const effectivePaymentLink = paymentLink || `${siteUrl}/order-tracking/${order?.id || ''}?pay=1`;
  const fromEmail = process.env.RESEND_NOTIFICATIONS_FROM_EMAIL || process.env.RESEND_DEFAULT_FROM_EMAIL || 'orders@updates.weave365.com';
  const replyToEmail = process.env.RESEND_REPLY_TO_EMAIL || 'support@weave365.com';
  const supportWhatsApp = process.env.NEXT_PUBLIC_STORE_WHATSAPP || '919919101369';

  const html = renderResellerInvoiceEmailHtml({
    orderNumber,
    resellerOrderId,
    createdAt: order?.created_at || new Date().toISOString(),
    items: items || order?.items || [],
    totalWholesaleAmount: totalWholesaleAmount || order?.total_amount || 0,
    recipientName,
    shippingAddress,
    paymentLink: effectivePaymentLink,
    supportWhatsApp,
  });

  const subject = `Invoice & Payment Link: Order #${orderNumber} (₹${Number(totalWholesaleAmount || 0).toLocaleString('en-IN')}) · Weave 365`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Weave 365 Wholesale <${fromEmail}>`,
        to: targetEmail,
        reply_to: replyToEmail,
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      console.error('[resellerInvoiceEmailService] Resend dispatch failed:', data);
      return { success: false, error: data.error || 'Resend dispatch failed' };
    }

    console.log(`[resellerInvoiceEmailService] Invoice & payment link email successfully dispatched to ${targetEmail}. Resend ID: ${data.id}`);

    // If supabase client provided, record email dispatch note in order message / shipping notes
    if (supabase && order?.id) {
      try {
        const emailNote = `[Invoice & Payment Link Dispatched to ${targetEmail} on ${new Date().toISOString()}]`;
        await supabase
          .from('api_orders')
          .update({
            shipping_notes: `${order.shipping_notes ? `${order.shipping_notes} | ` : ''}${emailNote}`,
          })
          .eq('id', order.id);
      } catch (logErr) {
        console.warn('[resellerInvoiceEmailService] Failed to record email note in DB:', logErr);
      }
    }

    return {
      success: true,
      emailId: data.id,
      recipient: targetEmail,
    };
  } catch (err) {
    console.error('[resellerInvoiceEmailService] Network or unexpected error during email dispatch:', err);
    return { success: false, error: err.message };
  }
}

