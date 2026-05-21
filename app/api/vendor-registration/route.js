/**
 * @file API route for Vendor Partner Registration and Product Review submissions.
 * Proxies the request server-side to Google Apps Script to avoid
 * browser CORS and opaque response silent failure issues.
 */

export async function POST(request) {
  try {
    const submissionData = await request.json();
    const endpoint = process.env.NEXT_PUBLIC_VENDOR_REGISTRATION_SHEET_URL;

    if (!endpoint) {
      return Response.json(
        { status: 'error', error: 'Google Sheets Apps Script endpoint is not configured in environment variables.' },
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

    // Google Apps Script can return success status wrapped in JSON
    if (data.status === 'error') {
      return Response.json(data, { status: 400 });
    }

    return Response.json(data);
  } catch (err) {
    console.error('[vendor-registration API] Error:', err);
    return Response.json(
      { status: 'error', error: err.message || 'Server proxy encountered a runtime crash.' },
      { status: 500 }
    );
  }
}
