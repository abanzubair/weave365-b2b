/**
 * @file app/api/admin/sync/route.js
 * @description Secure administrative catalog syncing endpoint.
 * Fetches Google Sheet CSV configurations using server-only credentials,
 * and updates the Supabase cached sheet database.
 */

export const runtime = 'edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { email } = payload;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing authorized administrator email.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 1. Initialize Supabase Client securely
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configurations are missing on the server.');
    }

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing authentication token.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify token with Supabase Auth
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !authUser?.email) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session token.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const adminEmailsList = String(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = authUser.email.trim().toLowerCase();
    let isAuthorized = adminEmailsList.includes(userEmail);

    if (!isAuthorized) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin privileges required.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 3. Trigger central sync implementation with secure database client
    const { syncSheetsToSupabase } = await import('../../../src/productData.js');
    await syncSheetsToSupabase(supabase);
    const timestamp = new Date().toISOString();

    return new Response(JSON.stringify({ success: true, timestamp }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('[admin sync API POST] Sync error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Server encountered an error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
