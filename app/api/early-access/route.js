/**
 * @file API route for Early Access form submissions.
 * Proxies the request server-side to Google Apps Script to avoid
 * browser CORS and 302 redirect issues.
 */

export const runtime = 'edge';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sliderVerified, ...submissionData } = body;

    const endpoint = process.env.EARLY_ACCESS_SHEET_URL;

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
      cache: 'no-store',
    });

    const text = await res.text();

    if (!res.ok) {
      return Response.json(
        { status: 'error', error: `Google Sheets API returned status ${res.status}` },
        { status: res.status }
      );
    }

    // Google Apps Script redirects to a Google Login HTML page if permission is private
    if (text.includes('<!DOCTYPE html>') || text.includes('<html') || text.includes('You need access')) {
      return Response.json(
        { status: 'error', error: 'Google Apps Script deployment is set to private. Please check permissions and redeploy as "Anyone".' },
        { status: 403 }
      );
    }

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
