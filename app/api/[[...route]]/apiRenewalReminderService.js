/**
 * @file app/api/[[...route]]/apiRenewalReminderService.js
 * @description Developer API 30-Day Subscription Renewal Reminder Email Service.
 * Ultra-minimal, modern notifications at:
 *  - 7 Days Remaining (Early Renewal Notice)
 *  - 3 Days Remaining (Final Notice before HTTP 403 pause)
 */

export const runtime = 'edge';

/**
 * 7-Day Renewal Reminder Email HTML Template (Ultra-Minimal)
 */
export function renderApiRenewalReminder7dHtml({
  clientName = 'Partner',
  planName = 'Growth Partner',
  planAmount = 299,
  expiresAtStr = '',
  renewalUrl = 'https://www.weave365.com/account?tab=developer',
  supportWhatsApp = '919919101369',
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Renewal Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 15px; font-weight: 700; color: #18181b; letter-spacing: -0.01em;">
                      WEAVE 365
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 600; color: #71717a; background: #f4f4f5; border-radius: 6px;">
                      7 Days Remaining
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <h1 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #18181b; letter-spacing: -0.02em;">
                API Subscription Renewal
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 13.5px; line-height: 1.6; color: #71717a;">
                Hi <strong>${clientName}</strong>, your Developer API subscription is set to complete in 7 days on <strong>${expiresAtStr}</strong>.
              </p>

              <!-- Minimal Summary Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 20px 0; border-top: 1px solid #f4f4f5; border-bottom: 1px solid #f4f4f5;">
                <tr>
                  <td style="padding: 11px 0; font-size: 13px; color: #71717a;">Current Plan</td>
                  <td align="right" style="padding: 11px 0; font-size: 13px; font-weight: 600; color: #18181b;">${planName}</td>
                </tr>
                <tr>
                  <td style="padding: 11px 0; font-size: 13px; color: #71717a; border-top: 1px solid #f4f4f5;">Valid Until</td>
                  <td align="right" style="padding: 11px 0; font-size: 13px; font-weight: 600; color: #18181b; border-top: 1px solid #f4f4f5;">${expiresAtStr}</td>
                </tr>
                <tr>
                  <td style="padding: 11px 0; font-size: 13px; color: #71717a; border-top: 1px solid #f4f4f5;">Renewal Amount</td>
                  <td align="right" style="padding: 11px 0; font-size: 13.5px; font-weight: 700; color: #18181b; border-top: 1px solid #f4f4f5;">₹${planAmount} / month</td>
                </tr>
              </table>

              <p style="margin: 0 0 24px 0; font-size: 12.5px; line-height: 1.55; color: #a1a1aa;">
                Renewing early extends your access by 30 days from your expiry date. Your API key and storefront syncing continue without interruption.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="${renewalUrl}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; box-sizing: border-box; text-align: center; background-color: #18181b; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 20px; border-radius: 8px;">
                      Renew Subscription (₹${planAmount}) &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Minimal Footer -->
          <tr>
            <td style="padding: 16px 32px 24px 32px; border-top: 1px solid #f4f4f5; text-align: center;">
              <p style="margin: 0; font-size: 11.5px; color: #a1a1aa;">
                Weave 365 &middot; Varanasi, India &middot; <a href="https://wa.me/${supportWhatsApp}?text=Hi%20Weave365,%20I%20have%20a%20question%20regarding%20my%20API%20subscription" style="color: #71717a; text-decoration: underline;">Support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 3-Day Final Notice Email HTML Template (Ultra-Minimal)
 */
export function renderApiRenewalReminder3dHtml({
  clientName = 'Partner',
  planName = 'Growth Partner',
  planAmount = 299,
  expiresAtStr = '',
  renewalUrl = 'https://www.weave365.com/account?tab=developer',
  supportWhatsApp = '919919101369',
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Final Notice: API Subscription Expires in 3 Days</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 15px; font-weight: 700; color: #18181b; letter-spacing: -0.01em;">
                      WEAVE 365
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 600; color: #b91c1c; background: #fef2f2; border-radius: 6px;">
                      Final 3 Days
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <h1 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #18181b; letter-spacing: -0.02em;">
                Action Required: 3 Days Remaining
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 13.5px; line-height: 1.6; color: #71717a;">
                Hi <strong>${clientName}</strong>, your Developer API subscription will expire on <strong>${expiresAtStr}</strong>.
              </p>

              <!-- Minimal Summary Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 20px 0; border-top: 1px solid #f4f4f5; border-bottom: 1px solid #f4f4f5;">
                <tr>
                  <td style="padding: 11px 0; font-size: 13px; color: #71717a;">Current Plan</td>
                  <td align="right" style="padding: 11px 0; font-size: 13px; font-weight: 600; color: #18181b;">${planName}</td>
                </tr>
                <tr>
                  <td style="padding: 11px 0; font-size: 13px; color: #71717a; border-top: 1px solid #f4f4f5;">Valid Until</td>
                  <td align="right" style="padding: 11px 0; font-size: 13px; font-weight: 600; color: #18181b; border-top: 1px solid #f4f4f5;">${expiresAtStr}</td>
                </tr>
                <tr>
                  <td style="padding: 11px 0; font-size: 13px; color: #71717a; border-top: 1px solid #f4f4f5;">Renewal Amount</td>
                  <td align="right" style="padding: 11px 0; font-size: 13.5px; font-weight: 700; color: #18181b; border-top: 1px solid #f4f4f5;">₹${planAmount} / month</td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="margin: 0 0 24px 0; padding: 12px 14px; background-color: #fafafa; border: 1px solid #f4f4f5; border-radius: 6px;">
                <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #71717a;">
                  <strong style="color: #b91c1c;">Please Note:</strong> If not renewed by ${expiresAtStr}, automated sync requests from your storefront will pause with HTTP 403 Forbidden until renewed.
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="${renewalUrl}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; box-sizing: border-box; text-align: center; background-color: #18181b; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 20px; border-radius: 8px;">
                      Renew Subscription (₹${planAmount}) &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Minimal Footer -->
          <tr>
            <td style="padding: 16px 32px 24px 32px; border-top: 1px solid #f4f4f5; text-align: center;">
              <p style="margin: 0; font-size: 11.5px; color: #a1a1aa;">
                Weave 365 &middot; Varanasi, India &middot; <a href="https://wa.me/${supportWhatsApp}?text=Hi%20Weave365,%20I%20am%20renewing%20my%20API%20subscription" style="color: #71717a; text-decoration: underline;">Support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatch an API renewal reminder email via Resend
 */
export async function sendApiRenewalEmail({
  type = '7d', // '7d' | '3d'
  recipientEmail,
  clientName = 'Partner',
  planName = 'Growth Partner',
  planAmount = 299,
  expiresAt = null,
  renewalUrl = 'https://www.weave365.com/account?tab=developer',
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('[apiRenewalReminderService] RESEND_API_KEY not configured.');
    return { success: false, reason: 'missing_resend_api_key' };
  }

  const targetEmail = (recipientEmail || '').trim().toLowerCase();
  if (!targetEmail || !targetEmail.includes('@')) {
    console.warn('[apiRenewalReminderService] Invalid recipient email:', targetEmail);
    return { success: false, reason: 'invalid_recipient_email' };
  }

  const expiresDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + (type === '7d' ? 7 : 3) * 24 * 60 * 60 * 1000);
  const expiresAtStr = expiresDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const fromEmail = process.env.RESEND_NOTIFICATIONS_FROM_EMAIL || process.env.RESEND_PAYMENTS_FROM_EMAIL || 'notifications@updates.weave365.com';
  const replyToEmail = process.env.RESEND_PAYMENTS_REPLY_TO_EMAIL || 'support@weave365.com';
  const supportWhatsApp = process.env.NEXT_PUBLIC_STORE_WHATSAPP || '919919101369';

  const is3d = type === '3d';
  const subject = is3d
    ? `Final Notice: Weave 365 Developer API Subscription Expires in 3 Days (${expiresAtStr})`
    : `Reminder: Your Weave 365 Developer API Subscription Renews in 7 Days (${expiresAtStr})`;

  const html = is3d
    ? renderApiRenewalReminder3dHtml({
        clientName,
        planName,
        planAmount,
        expiresAtStr,
        renewalUrl,
        supportWhatsApp,
      })
    : renderApiRenewalReminder7dHtml({
        clientName,
        planName,
        planAmount,
        expiresAtStr,
        renewalUrl,
        supportWhatsApp,
      });

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Weave 365 Developer <${fromEmail}>`,
        to: targetEmail,
        reply_to: replyToEmail,
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      console.error(`[apiRenewalReminderService] Resend dispatch failed for ${type} to ${targetEmail}:`, data);
      return { success: false, error: data.error || 'Resend error' };
    }

    console.log(`[apiRenewalReminderService] ${type} reminder dispatched to ${targetEmail}. Resend ID: ${data.id}`);
    return {
      success: true,
      emailId: data.id,
      recipient: targetEmail,
      type,
    };
  } catch (err) {
    console.error(`[apiRenewalReminderService] Network error dispatching ${type} to ${targetEmail}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Scan active keys and automatically dispatch 7d and 3d reminders.
 */
export async function checkAndSendRenewalReminders(supabase) {
  if (!supabase) return { count: 0, dispatched: [] };

  const now = new Date();
  const eightDaysFromNow = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString();

  // Find active keys expiring within the next 8 days
  const { data: keys, error } = await supabase
    .from('api_keys')
    .select(`
      id,
      user_id,
      client_name,
      subscription_plan,
      subscription_amount,
      subscription_expires_at,
      subscription_status,
      orders_enabled,
      profiles:user_id (
        email,
        full_name,
        business_name
      )
    `)
    .eq('is_active', true)
    .eq('subscription_status', 'active')
    .not('subscription_expires_at', 'is', null)
    .gte('subscription_expires_at', now.toISOString())
    .lte('subscription_expires_at', eightDaysFromNow);

  if (error || !Array.isArray(keys)) {
    console.warn('[apiRenewalReminderService] Error fetching keys for reminders:', error);
    return { count: 0, error: error?.message };
  }

  const dispatched = [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com';
  const renewalUrl = `${siteUrl}/account?tab=developer`;

  for (const k of keys) {
    const userEmail = k.profiles?.email;
    if (!userEmail) continue;

    const expiresAtMs = new Date(k.subscription_expires_at).getTime();
    const daysRemaining = Math.max(0, Math.ceil((expiresAtMs - now.getTime()) / (1000 * 60 * 60 * 24)));

    const isPro = k.subscription_plan === 'pro' || k.orders_enabled;
    const planName = isPro ? 'Pro Scale' : 'Growth Partner';
    const planAmount = isPro ? 499 : 299;
    const clientName = k.client_name || k.profiles?.business_name || k.profiles?.full_name || 'Partner';

    let reminderType = null;
    if (daysRemaining <= 3 && daysRemaining >= 1) {
      reminderType = '3d';
    } else if (daysRemaining <= 7 && daysRemaining > 3) {
      reminderType = '7d';
    }

    if (reminderType) {
      const result = await sendApiRenewalEmail({
        type: reminderType,
        recipientEmail: userEmail,
        clientName,
        planName,
        planAmount,
        expiresAt: k.subscription_expires_at,
        renewalUrl,
      });

      if (result.success) {
        dispatched.push({ keyId: k.id, userEmail, daysRemaining, type: reminderType });
      }
    }
  }

  return { count: dispatched.length, dispatched };
}
