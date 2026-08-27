/**
 * @file checkEmailHandler.js
 * @description Verifies whether a user email address exists in the Supabase database
 * (profiles table and auth.users) before sending password reset links.
 */

let supabaseInstance = null;

async function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const { createClient } = await import('@supabase/supabase-js');
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = body?.email || '';
    const cleanEmail = String(rawEmail).trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return Response.json({ exists: false, error: 'Invalid email address' }, { status: 400 });
    }

    const supabase = await getSupabase();
    if (!supabase) {
      // In demo mode without Supabase credentials
      return Response.json({ exists: true, demo: true });
    }

    // 1. Check profiles table (case-insensitive query)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (profile) {
      return Response.json({ exists: true });
    }

    // 2. Check auth.users via admin API if service role key is configured
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey && supabase.auth?.admin?.listUsers) {
      try {
        const { data: authData } = await supabase.auth.admin.listUsers();
        const authUser = authData?.users?.find(
          (u) => String(u.email || '').trim().toLowerCase() === cleanEmail
        );
        if (authUser) {
          return Response.json({ exists: true });
        }
      } catch (authErr) {
        console.warn('[Check Email] Auth admin list fallback failed:', authErr);
      }
    }

    return Response.json({ exists: false });
  } catch (err) {
    console.error('[Check Email] Server error:', err);
    return Response.json({ exists: false, error: err.message }, { status: 500 });
  }
}

