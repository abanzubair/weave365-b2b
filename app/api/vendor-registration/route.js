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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gid = searchParams.get('gid') || '1133055182';
    const sheetId = process.env.NEXT_PUBLIC_SHEET_ID;

    if (!sheetId) {
      return Response.json(
        { status: 'error', error: 'Spreadsheet ID is not configured in backend environment variables.' },
        { status: 500 }
      );
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?gid=${gid}&single=true&output=csv&_t=${Date.now()}`;
    const res = await fetch(csvUrl);

    if (!res.ok) {
      return Response.json(
        { status: 'error', error: `Failed to fetch sheets data from Google. Status: ${res.status}` },
        { status: res.status }
      );
    }

    const csvText = await res.text();
    return new Response(csvText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (err) {
    console.error('[vendor-registration API GET] Error:', err);
    return Response.json(
      { status: 'error', error: err.message || 'Server proxy encountered a runtime crash.' },
      { status: 500 }
    );
  }
}

