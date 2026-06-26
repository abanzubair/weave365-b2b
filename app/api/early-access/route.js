/**
 * @file API route for Early Access form submissions.
 * Saves submission data directly to Supabase `early_access_submissions` table.
 * Google Sheets integration has been removed in favour of the Admin panel.
 */

import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Lazy singleton to avoid build-time crash when env vars are absent
let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return {
        from: () => ({
          insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
          update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        }),
      };
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export async function POST(request) {
  try {
    const body = await request.json();
    // Strip the client-only slider flag before persisting
    const { sliderVerified, ...submissionData } = body;

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('early_access_submissions')
      .insert({
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
      });

    if (error) {
      console.error('[early-access API] Supabase insert error:', error);
      return Response.json(
        { status: 'error', error: error.message || 'Failed to save submission.' },
        { status: 500 }
      );
    }

    return Response.json({ status: 'success', data });
  } catch (err) {
    console.error('[early-access API] Error:', err);
    return Response.json(
      { status: 'error', error: err.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status'); // optional: 'pending_review' | 'approved' | 'rejected'

    const supabase = getSupabase();

    let query = supabase
      .from('early_access_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(500);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[early-access API GET] Error:', error);
      return Response.json({ status: 'error', error: error.message }, { status: 500 });
    }

    return Response.json({ status: 'success', data: data || [] });
  } catch (err) {
    console.error('[early-access API GET] Crash:', err);
    return Response.json({ status: 'error', error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return Response.json({ status: 'error', error: 'id and status are required.' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('early_access_submissions')
      .update({ status })
      .eq('id', id);

    if (error) {
      return Response.json({ status: 'error', error: error.message }, { status: 500 });
    }

    return Response.json({ status: 'success', data });
  } catch (err) {
    console.error('[early-access API PATCH] Crash:', err);
    return Response.json({ status: 'error', error: err.message }, { status: 500 });
  }
}
