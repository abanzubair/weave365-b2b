/**
 * @file API route for Contact Page form submissions.
 * Sends the contact message via Resend API to weave365@gmail.com.
 */

export const runtime = 'edge';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validation
    if (!name || !email || !message) {
      return Response.json(
        { status: 'error', error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('[contact API] RESEND_API_KEY is not configured.');
      return Response.json(
        { status: 'error', error: 'Email service is not configured.' },
        { status: 500 }
      );
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const targetEmail = 'weave365@gmail.com';

    const emailBody = {
      from: `Weave365 Contact <${fromEmail}>`,
      to: targetEmail,
      reply_to: email,
      subject: `✉️ New Contact Message: ${subject || 'Inquiry from ' + name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Contact Inquiry</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #FAF8F5;
              color: #1A1715;
              margin: 0;
              padding: 40px 20px;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #FFFFFF;
              border: 1px solid #EADECC;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
            }
            .email-header {
              background-color: #756F4F;
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
            .field-group {
              margin-bottom: 20px;
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
              white-space: pre-wrap;
            }
            .email-footer {
              background-color: #FAF8F5;
              color: #777777;
              padding: 24px;
              text-align: center;
              font-size: 12px;
              border-top: 1px solid #EADECC;
            }
            .email-footer p {
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>Weave 365</h1>
              <p>New Message from Contact Page</p>
            </div>
            <div class="email-body">
              <div class="field-group">
                <div class="field-label">Sender Name</div>
                <div class="field-value">${name}</div>
              </div>
              
              <div class="field-group">
                <div class="field-label">Sender Email</div>
                <div class="field-value"><a href="mailto:${email}">${email}</a></div>
              </div>
              
              ${phone ? `
              <div class="field-group">
                <div class="field-label">Phone Number</div>
                <div class="field-value">${phone}</div>
              </div>
              ` : ''}
              
              <div class="field-group">
                <div class="field-label">Subject</div>
                <div class="field-value">${subject || 'N/A'}</div>
              </div>
              
              <div class="field-group">
                <div class="field-label">Message</div>
                <div class="field-value" style="background-color: #FAF8F5; padding: 16px; border-radius: 6px; border: 1px solid #EADECC;">${message}</div>
              </div>
            </div>
            <div class="email-footer">
              <p>This email was sent from the contact form on your Weave 365 B2B storefront.</p>
              <p>&copy; ${new Date().getFullYear()} Weave 365. All Rights Reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify(emailBody),
      cache: 'no-store'
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[contact API] Resend email dispatch failed:', errText);
      return Response.json(
        { status: 'error', error: 'Failed to send message via email service.' },
        { status: 502 }
      );
    }

    return Response.json({ status: 'success' });
  } catch (err) {
    console.error('[contact API] Server Crash:', err);
    return Response.json(
      { status: 'error', error: err.message || 'Server encountered an error.' },
      { status: 500 }
    );
  }
}
