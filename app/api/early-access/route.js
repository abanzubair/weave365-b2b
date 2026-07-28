/**
 * @file API route for Early Access form submissions.
 * Saves submission data directly to Supabase `early_access_submissions` table via REST.
 */

export const runtime = 'edge';

async function supabaseRest(path, { method = 'GET', body, headers = {} } = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !apiKey) {
    console.warn('[early-access API] Supabase env variables missing. Returning mock fallback.');
    return null;
  }

  try {
    const res = await fetch(`${baseUrl}/rest/v1/${path}`, {
      method,
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('[early-access API] Supabase query failed:', data.message || res.statusText);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('[early-access API] Supabase REST network error:', err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { sliderVerified, ...submissionData } = body;

    const row = {
      submitted_at: submissionData.submittedAt || new Date().toISOString(),
      full_name: submissionData.fullName || '',
      whatsapp_number: submissionData.whatsappNumber || '',
      buyer_type: submissionData.buyerType || '',
      buying_preference: submissionData.buyingPreference || '',
      monthly_budget: submissionData.monthlyBudget || '',
      city: submissionData.city || '',
      pincode: submissionData.pincode || '',
      store_link: submissionData.storeLink || '',
      status: submissionData.status || 'pending_review',
    };

    const data = await supabaseRest('early_access_submissions', {
      method: 'POST',
      body: row,
    });

    return Response.json({ status: 'success', data: data || row });
  } catch (err) {
    console.error('[early-access API POST] Error:', err);
    return Response.json({ status: 'error', error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let queryPath = 'early_access_submissions?select=*&order=submitted_at.desc&limit=500';
    if (statusFilter) {
      queryPath += `&status=eq.${encodeURIComponent(statusFilter)}`;
    }

    const data = await supabaseRest(queryPath, { method: 'GET' });
    return Response.json({ status: 'success', data: Array.isArray(data) ? data : [] });
  } catch (err) {
    console.error('[early-access API GET] Error:', err);
    return Response.json({ status: 'success', data: [] });
  }
}

export async function PATCH(request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return Response.json({ status: 'error', error: 'id and status are required.' }, { status: 400 });
    }

    const data = await supabaseRest(`early_access_submissions?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { status },
    });

    return Response.json({ status: 'success', data: data || { id, status } });
  } catch (err) {
    console.error('[early-access API PATCH] Error:', err);
    return Response.json({ status: 'error', error: err.message }, { status: 500 });
  }
}
