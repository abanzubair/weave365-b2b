/**
 * @file app/api/[[...route]]/resellerInvoiceEmailService.js
 * @description Reseller Order Invoice & Payment Link Email Service.
 * Dispatches an automated, minimal, mobile-responsive invoice email to the reseller / API user
 * when an order is created, containing line items and a direct payment link.
 */

export const runtime = 'edge';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toFiniteNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Renders the clean, minimal, mobile-responsive HTML invoice email.
 */
export function renderResellerInvoiceEmailHtml({
  orderNumber,
  resellerOrderId,
  createdAt,
  items = [],
  totalWholesaleAmount = 0,
  wholesaleSubtotalInr,
  shippingFeeInr = 0,
  totalPayableInr,
  isInternational = false,
  destinationCountry = '',
  billedWeightKg = 0,
  awaitingQuote = false,
  recipientName = '',
  shippingAddress = '',
  paymentLink = '',
  supportWhatsApp = '919919101369',
}) {
  const isIntl = Boolean(isInternational);
  const isAwaitingQuote = Boolean(awaitingQuote);

  const subtotalAmount = toFiniteNumber(
    wholesaleSubtotalInr,
    toFiniteNumber(totalWholesaleAmount, 0)
  );
  const shippingAmount = isAwaitingQuote ? 0 : Math.max(0, toFiniteNumber(shippingFeeInr, 0));
  const payableAmount = toFiniteNumber(
    totalPayableInr,
    subtotalAmount + shippingAmount
  );

  const formattedSubtotal = subtotalAmount.toLocaleString('en-IN');
  const formattedShipping = shippingAmount.toLocaleString('en-IN');
  const formattedTotal = payableAmount.toLocaleString('en-IN');

  const rawCountry = String(destinationCountry || '').trim();
  const safeCountry = isIntl
    ? (rawCountry || 'International Destination')
    : (rawCountry || 'India');
  const safeCountryHtml = escapeHtml(safeCountry);

  const rawAddress = String(shippingAddress || '').trim();
  let resolvedAddress = rawAddress || (isIntl ? safeCountry : 'India');
  if (
    isIntl &&
    rawAddress &&
    rawCountry &&
    !rawAddress.toLowerCase().includes(rawCountry.toLowerCase())
  ) {
    resolvedAddress = `${rawAddress}, ${rawCountry}`;
  }
  const resolvedAddressHtml = escapeHtml(resolvedAddress);

  const weightNum = toFiniteNumber(billedWeightKg, 0);
  const weightSuffix = weightNum > 0 ? ` &middot; ${escapeHtml(weightNum)} kg` : '';

  const dateStr = new Date(createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const safeOrderNumber = escapeHtml(orderNumber || 'ORD-WEAVE');
  const safeResellerOrderId = resellerOrderId ? escapeHtml(resellerOrderId) : '';
  const safeRecipientName = escapeHtml(recipientName || 'Consignee');
  const safePaymentLink = isAwaitingQuote ? '' : String(paymentLink || '').trim();

  const itemsRows = (items || []).map((it) => {
    const title = escapeHtml(it.product_title || it.title || 'Handloom Banarasi Saree');
    const sku = escapeHtml(it.sku || it.code || 'N/A');
    const color = escapeHtml(it.color || 'Standard');
    const qty = Math.max(1, parseInt(it.quantity || 1, 10) || 1);
    const unitPrice = toFiniteNumber(it.wholesale_price ?? it.price, 0);
    const lineTotal = (unitPrice * qty).toLocaleString('en-IN');

    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 0; vertical-align: top;">
          <div style="font-size: 13px; font-weight: 600; color: #0f172a; line-height: 1.35;">${title}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 3px;">
            Code: <span style="font-family: monospace; font-weight: 600; color: #334155;">${sku}</span> &middot; Color: ${color}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            Qty: ${qty} &times; ₹${unitPrice.toLocaleString('en-IN')}
          </div>
        </td>
        <td align="right" style="padding: 12px 0; vertical-align: top; white-space: nowrap; font-size: 13px; font-weight: 700; color: #0f172a;">
          ₹${lineTotal}
        </td>
      </tr>
    `;
  }).join('');

  const headerBadgeHtml = isAwaitingQuote
    ? `<span class="header-badge" style="display: inline-block; background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 10px; border-radius: 9999px; white-space: nowrap;">
        Awaiting Shipping Quote
      </span>`
    : `<span class="header-badge" style="display: inline-block; background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 10px; border-radius: 9999px; white-space: nowrap;">
        Payment Pending
      </span>`;

  const introCopy = isAwaitingQuote
    ? `An international dropship order was submitted via your Developer API. Weave365's export team is confirming the international courier quote for <strong>${safeCountryHtml}</strong> and will send your INR payment link shortly.`
    : `An order was submitted via your Developer API. Complete payment below to confirm fulfillment and release your order for Varanasi quality check &amp; dispatch.`;

  const topActionBoxHtml = isAwaitingQuote
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; margin-bottom: 22px;">
        <tr>
          <td class="cta-inner-box" style="padding: 20px; text-align: left;">
            <div style="font-size: 11px; color: #b45309; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 6px;">International Shipping Quote Pending</div>
            <div style="font-size: 14px; font-weight: 600; color: #78350f; line-height: 1.5; margin-bottom: 8px;">
              Weave365's export team is confirming the international courier quote for ${safeCountryHtml} and will send the INR payment link shortly.
            </div>
            <div style="font-size: 12px; color: #92400e; line-height: 1.45;">
              Items Subtotal: <strong>₹${formattedSubtotal} (INR)</strong> &middot; Shipping fee &amp; payment link will follow once the courier rate is finalized.
            </div>
          </td>
        </tr>
      </table>`
    : `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 22px;">
        <tr>
          <td class="cta-inner-box" style="padding: 20px; text-align: center;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 4px;">Total Amount Due (INR)</div>
            <div style="font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 12px; letter-spacing: -0.02em;">₹${formattedTotal}</div>
            ${safePaymentLink ? `<div style="margin-bottom: 8px;">
              <a href="${escapeHtml(safePaymentLink)}" target="_blank" class="mobile-btn" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 24px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.08);">
                Pay ₹${formattedTotal} &rarr;
              </a>
            </div>` : ''}
            <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
              Instant INR payment via UPI, PhonePe, Cards, or NetBanking.
            </div>
          </td>
        </tr>
      </table>`;

  let shippingRowHtml;
  if (isIntl && isAwaitingQuote) {
    shippingRowHtml = `
      <tr>
        <td style="font-size: 12px; color: #64748b; padding: 4px 0;">Shipping &amp; Delivery</td>
        <td align="right" style="font-size: 12px; color: #b45309; font-weight: 600; padding: 4px 0;">Pending Quote (${safeCountryHtml})</td>
      </tr>
    `;
  } else if (isIntl) {
    shippingRowHtml = `
      <tr>
        <td style="font-size: 12px; color: #64748b; padding: 4px 0;">
          Shipping &amp; Delivery
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">International Shipping (${safeCountryHtml}${weightSuffix})</div>
        </td>
        <td align="right" style="font-size: 12px; color: #0f172a; font-weight: 600; padding: 4px 0; vertical-align: top;">₹${formattedShipping}</td>
      </tr>
    `;
  } else if (shippingAmount > 0) {
    shippingRowHtml = `
      <tr>
        <td style="font-size: 12px; color: #64748b; padding: 4px 0;">
          Shipping &amp; Delivery
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Expedited Shipping</div>
        </td>
        <td align="right" style="font-size: 12px; color: #0f172a; font-weight: 600; padding: 4px 0; vertical-align: top;">₹${formattedShipping}</td>
      </tr>
    `;
  } else {
    shippingRowHtml = `
      <tr>
        <td style="font-size: 12px; color: #64748b; padding: 4px 0;">Shipping &amp; Delivery</td>
        <td align="right" style="font-size: 12px; color: #16a34a; font-weight: 600; padding: 4px 0;">FREE (Standard)</td>
      </tr>
    `;
  }

  const totalDueRowHtml = isAwaitingQuote
    ? `<tr style="border-top: 1px solid #e2e8f0;">
        <td style="font-size: 13px; color: #0f172a; font-weight: 700; padding: 10px 0 0 0;">Total Amount Due (INR)</td>
        <td align="right" style="font-size: 13px; color: #b45309; font-weight: 700; padding: 10px 0 0 0;">Pending Quote (Items ₹${formattedSubtotal})</td>
      </tr>`
    : `<tr style="border-top: 1px solid #e2e8f0;">
        <td style="font-size: 13px; color: #0f172a; font-weight: 700; padding: 10px 0 0 0;">Total Amount Due (INR)</td>
        <td align="right" style="font-size: 15px; color: #0f172a; font-weight: 800; padding: 10px 0 0 0;">₹${formattedTotal}</td>
      </tr>`;

  const statusNoteHtml = isAwaitingQuote
    ? `<div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #92400e; line-height: 1.45;">
        <strong style="color: #78350f;">Status:</strong> Awaiting shipping quote. Weave365's export team is confirming the international courier quote for ${safeCountryHtml} and will send the INR payment link shortly.
      </div>`
    : `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #64748b; line-height: 1.45;">
        <strong style="color: #0f172a;">Status:</strong> Payment pending. Upon payment, your order will automatically update to <strong>Payment Received</strong> and enter the Varanasi quality inspection and packaging queue.
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Invoice #${safeOrderNumber} - Weave 365</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    @media only screen and (max-width: 600px) {
      .email-outer-td {
        padding: 12px 8px !important;
      }
      .email-card-cell {
        padding: 20px 16px !important;
      }
      .email-header-cell {
        padding: 16px 16px 14px 16px !important;
      }
      .email-footer-cell {
        padding: 16px 16px 24px 16px !important;
      }
      .stack-col {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        padding-bottom: 14px !important;
      }
      .mobile-btn {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
        padding: 12px 20px !important;
      }
      .cta-inner-box {
        padding: 16px 14px !important;
      }
      .header-badge {
        font-size: 10px !important;
        padding: 3px 8px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; width: 100%;">
    <tr>
      <td align="center" class="email-outer-td" style="padding: 24px 12px;">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; width: 100%; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <!-- Header Banner -->
          <tr>
            <td class="email-header-cell" style="padding: 22px 28px 18px 28px; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">Weave 365</div>
                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">B2B Order Notification</div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    ${headerBadgeHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invoice Overview & Call to Action -->
          <tr>
            <td class="email-card-cell" style="padding: 24px 28px 16px 28px;">
              <h1 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em;">Order Invoice</h1>
              <p style="margin: 0 0 18px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                ${introCopy}
              </p>

              <!-- Payment CTA Box / Quote Pending Banner -->
              ${topActionBoxHtml}

              <!-- Order Metadata (Stacks cleanly on mobile) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 18px;">
                <tr>
                  <td class="stack-col" width="50%" style="vertical-align: top; padding-right: 12px; padding-bottom: 10px;">
                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em; margin-bottom: 4px;">Order Details</div>
                    <div style="font-size: 13px; color: #0f172a; font-weight: 600;">#${safeOrderNumber}</div>
                    ${safeResellerOrderId ? `<div style="font-size: 12px; color: #475569; margin-top: 2px;">Ref: ${safeResellerOrderId}</div>` : ''}
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${escapeHtml(dateStr)}</div>
                  </td>
                  <td class="stack-col" width="50%" style="vertical-align: top; padding-left: 12px; padding-bottom: 10px;">
                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em; margin-bottom: 4px;">Delivery Destination</div>
                    <div style="font-size: 13px; color: #0f172a; font-weight: 600;">${safeRecipientName}</div>
                    <div style="font-size: 12px; color: #475569; line-height: 1.45; margin-top: 2px;">${resolvedAddressHtml}</div>
                  </td>
                </tr>
              </table>

              <!-- Ordered Items Header & List -->
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em; margin-bottom: 4px;">
                Ordered Items (${(items && items.length) || 1})
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 16px;">
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Price Breakdown -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e2e8f0; padding-top: 10px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #64748b; padding: 4px 0;">Items Subtotal</td>
                  <td align="right" style="font-size: 12px; color: #0f172a; font-weight: 600; padding: 4px 0;">₹${formattedSubtotal}</td>
                </tr>
                ${shippingRowHtml}
                ${totalDueRowHtml}
              </table>

              <!-- Status Note -->
              ${statusNoteHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer-cell" style="padding: 18px 28px 24px 28px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; line-height: 1.5; text-align: center;">
              Need support? Reply directly to this email or message on WhatsApp at 
              <a href="https://wa.me/${supportWhatsApp.replace(/\D/g, '')}" style="color: #0f172a; font-weight: 600; text-decoration: underline;">+91 99191 01369</a>.<br>
              &copy; ${new Date().getFullYear()} Weave 365 &middot; Varanasi.
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
 * Dispatches the order invoice and payment link email via Resend.
 */
export async function sendResellerInvoiceEmail({
  order,
  resellerOrderId,
  totalWholesaleAmount,
  wholesaleSubtotalInr,
  shippingFeeInr,
  totalPayableInr,
  isInternational,
  destinationCountry,
  billedWeightKg,
  awaitingQuote,
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

  const resolvedIsInternational = Boolean(isInternational ?? order?.is_international ?? false);
  const resolvedAwaitingQuote = Boolean(
    awaitingQuote ?? (order?.status === 'awaiting_shipping_quote')
  );
  const resolvedDestinationCountry = String(
    destinationCountry || order?.recipient_country || ''
  ).trim();
  const resolvedBilledWeightKg = toFiniteNumber(
    billedWeightKg ?? order?.billed_weight_kg,
    0
  );
  const resolvedSubtotalInr = toFiniteNumber(
    wholesaleSubtotalInr ?? order?.wholesale_subtotal_inr ?? totalWholesaleAmount ?? order?.total_amount,
    0
  );
  const resolvedShippingFeeInr = resolvedAwaitingQuote
    ? 0
    : Math.max(0, toFiniteNumber(shippingFeeInr ?? order?.shipping_fee_inr, 0));
  const resolvedTotalPayableInr = toFiniteNumber(
    totalPayableInr ??
      (order?.total_wholesale_inr != null && Number(order.total_wholesale_inr) > 0
        ? order.total_wholesale_inr
        : undefined),
    resolvedSubtotalInr + resolvedShippingFeeInr
  );

  const orderNumber = order?.order_number || (order?.id ? `ORD-${order.id.slice(0, 8).toUpperCase()}` : 'ORD-WEAVE');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com';
  const effectivePaymentLink = resolvedAwaitingQuote
    ? ''
    : (paymentLink || `${siteUrl}/order-tracking/${order?.id || ''}?pay=1`);
  const fromEmail = process.env.RESEND_NOTIFICATIONS_FROM_EMAIL || process.env.RESEND_DEFAULT_FROM_EMAIL || 'orders@updates.weave365.com';
  const replyToEmail = process.env.RESEND_REPLY_TO_EMAIL || 'support@weave365.com';
  const supportWhatsApp = process.env.NEXT_PUBLIC_STORE_WHATSAPP || '919919101369';

  const html = renderResellerInvoiceEmailHtml({
    orderNumber,
    resellerOrderId,
    createdAt: order?.created_at || new Date().toISOString(),
    items: items || order?.items || [],
    totalWholesaleAmount: resolvedSubtotalInr,
    wholesaleSubtotalInr: resolvedSubtotalInr,
    shippingFeeInr: resolvedShippingFeeInr,
    totalPayableInr: resolvedTotalPayableInr,
    isInternational: resolvedIsInternational,
    destinationCountry: resolvedDestinationCountry,
    billedWeightKg: resolvedBilledWeightKg,
    awaitingQuote: resolvedAwaitingQuote,
    recipientName,
    shippingAddress,
    paymentLink: effectivePaymentLink,
    supportWhatsApp,
  });

  const subject = resolvedAwaitingQuote
    ? `Order Received (Shipping Quote Pending): Order #${orderNumber} · Weave 365`
    : `Invoice & Payment Link: Order #${orderNumber} (₹${resolvedTotalPayableInr.toLocaleString('en-IN')}) · Weave 365`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Weave 365 <${fromEmail}>`,
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
        const notePrefix = resolvedAwaitingQuote
          ? 'Quote Pending Notification Dispatched'
          : 'Invoice & Payment Link Dispatched';
        const emailNote = `[${notePrefix} to ${targetEmail} on ${new Date().toISOString()}]`;
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
