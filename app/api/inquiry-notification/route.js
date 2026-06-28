export const runtime = 'edge';

export async function POST(request) {
  try {
    const body = await request.json();
    const { buyer_name, email, phone, pincode, message, items } = body;

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('[inquiry-notification API] RESEND_API_KEY is not configured.');
      return Response.json(
        { status: 'error', error: 'Email service is not configured.' },
        { status: 500 }
      );
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const targetEmail = 'weave365@gmail.com';

    // Format the items into an HTML table for the email
    let itemsTableRowsHtml = '';
    let grandTotal = 0;
    if (Array.isArray(items) && items.length > 0) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com';
      itemsTableRowsHtml = items.map((item, idx) => {
        const qty = Number(item.quantity) || 1;
        const priceVal = Number(item.price) || 0;
        grandTotal += priceVal * qty;
        const priceStr = item.price ? `₹${priceVal.toLocaleString('en-IN')}` : 'N/A';
        const fullUrl = item.product_url && item.product_url !== '#' ? `${siteUrl}${item.product_url}` : null;

        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
              ${fullUrl ? `<a href="${fullUrl}" target="_blank" style="color: #0284c7; text-decoration: underline; font-weight: 700;">${item.product_title || 'General Product'}</a>` : `<strong>${item.product_title || 'General Product'}</strong>`}
              <br/><span style="font-size: 11px; color: #6b7280;">Color: ${item.color || 'Standard'} | Code: ${item.variant_code || 'N/A'}</span>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${qty}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${priceStr}</td>
          </tr>
        `;
      }).join('');
    } else {
      itemsTableRowsHtml = `
        <tr>
          <td colspan="4" style="padding: 15px; text-align: center; color: #6b7280;">No items in cart details.</td>
        </tr>
      `;
    }

    const emailSubject = `🛍️ Enquiry: ${buyer_name}`;
    const emailBodyHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Enquiry</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #FAF8F5;
            color: #1A1715;
            margin: 0;
            padding: 40px 20px;
          }
          .email-container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border: 1px solid #EADECC;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          }
          .email-header {
            background-color: #0284c7;
            color: #FFFFFF;
            padding: 30px;
            text-align: center;
          }
          .email-header h1 {
            margin: 0 0 5px 0;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .email-header p {
            margin: 0;
            font-size: 13px;
            opacity: 0.9;
          }
          .email-body {
            padding: 30px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0284c7;
            border-bottom: 2px solid #e0f2fe;
            padding-bottom: 6px;
            margin-top: 25px;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .field-group {
            margin-bottom: 15px;
            line-height: 1.5;
          }
          .field-label {
            font-weight: 600;
            color: #777777;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .field-value {
            color: #1A1715;
            font-size: 15px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 13px;
          }
          .items-table th {
            background-color: #f8fafc;
            padding: 10px;
            font-weight: 600;
            text-align: left;
            border-bottom: 2px solid #e2e8f0;
          }
          .email-footer {
            background-color: #FAF8F5;
            text-align: center;
            padding: 20px;
            font-size: 11px;
            color: #777777;
            border-top: 1px solid #EADECC;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          
          <div class="email-body">
            <div class="section-title">Customer Details</div>
            <div style="background-color: #faf8f6; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; width: 130px; font-weight: 600;">Customer Name</td>
                  <td style="padding: 6px 0; color: #111827;">${buyer_name || 'Guest Buyer'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-weight: 600;">Phone Number</td>
                  <td style="padding: 6px 0; color: #111827;">${phone || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-weight: 600;">Email Address</td>
                  <td style="padding: 6px 0; color: #111827;">${email || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-weight: 600;">Pincode</td>
                  <td style="padding: 6px 0; color: #111827;">${pincode || 'N/A'}</td>
                </tr>
              </table>
            </div>

            <div class="section-title">Enquired Items List</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 5%;">#</th>
                  <th style="width: 60%;">Product details</th>
                  <th style="width: 15%; text-align: center;">Qty</th>
                  <th style="width: 20%; text-align: right;">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTableRowsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 12px 10px; text-align: right; font-weight: 700; border-top: 2px solid #e2e8f0; font-size: 15px;">Total:</td>
                  <td style="padding: 12px 10px; text-align: right; font-weight: 700; border-top: 2px solid #e2e8f0; font-size: 15px; color: #111827;">₹${grandTotal.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: `Weave365 <${fromEmail}>`,
        to: targetEmail,
        reply_to: email || undefined,
        subject: emailSubject,
        html: emailBodyHtml
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[inquiry-notification API] Resend email dispatch failed:', errText);
      return Response.json(
        { status: 'error', error: 'Failed to send notification email.' },
        { status: 500 }
      );
    }

    return Response.json({ status: 'success', message: 'Notification email sent.' });
  } catch (err) {
    console.error('[inquiry-notification API] Error:', err);
    return Response.json(
      { status: 'error', error: err.message || 'Server encountered an error.' },
      { status: 500 }
    );
  }
}
