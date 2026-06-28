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
    if (Array.isArray(items) && items.length > 0) {
      itemsTableRowsHtml = items.map((item, idx) => {
        const qty = Number(item.quantity) || 1;
        const priceStr = item.price ? `₹${Number(item.price).toLocaleString('en-IN')}` : 'N/A';
        const lineTotalStr = item.price ? `₹${(Number(item.price) * qty).toLocaleString('en-IN')}` : 'N/A';

        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
              <strong>${item.product_title || 'General Product'}</strong>
              <br/><span style="font-size: 11px; color: #6b7280;">Color: ${item.color || 'Standard'} | Code: ${item.variant_code || 'N/A'}</span>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${qty}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${priceStr}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>${lineTotalStr}</strong></td>
          </tr>
        `;
      }).join('');
    } else {
      itemsTableRowsHtml = `
        <tr>
          <td colspan="5" style="padding: 15px; text-align: center; color: #6b7280;">No items in cart details.</td>
        </tr>
      `;
    }

    const emailSubject = `🛍️ New B2B Wholesale Enquiry: ${buyer_name}`;
    const emailBodyHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New B2B Wholesale Enquiry</title>
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
          <div class="email-header">
            <h1>Weave 365 B2B</h1>
            <p>New Wholesale Customer Enquiry</p>
          </div>
          
          <div class="email-body">
            <div class="section-title">Customer Contact Details</div>
            <div class="info-grid">
              <div class="field-group">
                <div class="field-label">Customer Name</div>
                <div class="field-value">${buyer_name || 'Guest Buyer'}</div>
              </div>
              <div class="field-group">
                <div class="field-label">Phone Number</div>
                <div class="field-value">${phone || 'N/A'}</div>
              </div>
              <div class="field-group">
                <div class="field-label">Email Address</div>
                <div class="field-value">${email || 'N/A'}</div>
              </div>
              <div class="field-group">
                <div class="field-label">Pincode</div>
                <div class="field-value">${pincode || 'N/A'}</div>
              </div>
            </div>

            <div class="field-group" style="margin-top: 10px;">
              <div class="field-label">Enquiry Message / Notes</div>
              <div class="field-value" style="background-color: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">${message || 'No additional message.'}</div>
            </div>

            <div class="section-title">Enquired Items List</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 5%;">#</th>
                  <th style="width: 55%;">Product details</th>
                  <th style="width: 10%; text-align: center;">Qty</th>
                  <th style="width: 15%; text-align: right;">Unit Price</th>
                  <th style="width: 15%; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTableRowsHtml}
              </tbody>
            </table>
          </div>
          
          <div class="email-footer">
            This is an automated notification from your Weave 365 B2B Wholesale Portal.
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
        from: `Weave365 B2B <${fromEmail}>`,
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
