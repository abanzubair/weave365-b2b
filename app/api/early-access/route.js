/**
 * @file API route for Early Access form submissions.
 * Proxies the request server-side to Google Apps Script to avoid
 * browser CORS and 302 redirect issues.
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { captchaToken, ...submissionData } = body;

    // Verify Google reCAPTCHA if secret key is present in environment
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (recaptchaSecret) {
      if (!captchaToken) {
        return Response.json(
          { status: 'error', error: 'CAPTCHA verification is required.' },
          { status: 400 }
        );
      }

      const verifyRes = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${captchaToken}`,
        { method: 'POST' }
      );
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        return Response.json(
          { status: 'error', error: 'CAPTCHA verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    const endpoint = process.env.NEXT_PUBLIC_EARLY_ACCESS_SHEET_URL;

    if (!endpoint) {
      return Response.json(
        { status: 'error', error: 'Sheet endpoint not configured' },
        { status: 500 }
      );
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
      redirect: 'follow',
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { status: 'success', raw: text };
    }

    return Response.json(data);
  } catch (err) {
    console.error('[early-access API] Error:', err);
    return Response.json(
      { status: 'error', error: err.message },
      { status: 500 }
    );
  }
}
