/**
 * @file presenceHandler.js
 * High-performance Edge handler for real-time buyer online presence and activity tracking.
 * - GET: Administrative endpoint returning recent auth presence & sign-in timestamps for all registered buyers.
 * - POST: Lightweight presence heartbeat for active buyers to maintain their online status.
 */

export const runtime = 'edge';

const ALLOWED_ORIGINS = [
  'https://www.weave365.com',
  'https://weave365.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function getCorsHeaders(request) {
  const origin = request?.headers?.get('origin');
  const isAllowed = origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.weave365.com'));

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

/**
 * GET /api/admin/presence
 * Retrieves a dictionary of auth presence for all users (Admin only)
 */
export async function GET(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase service configuration missing.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
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
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify calling user is an authorized admin
    const { data: { user: authUser }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !authUser?.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized or expired session.' }), {
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
      const { data: profile } = await adminClient
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

    // List users with auth timestamps
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const presence = {};
    (usersData?.users || []).forEach((u) => {
      presence[u.id] = {
        last_sign_in_at: u.last_sign_in_at || null,
        created_at: u.created_at || null,
        last_seen_at: u.user_metadata?.last_seen_at || null,
        acquisition: u.user_metadata?.acquisition || u.user_metadata?.buyer_profile?.acquisition || null,
      };
    });

    return new Response(JSON.stringify({ success: true, presence }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        ...corsHeaders,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * POST /api/presence
 * Lightweight heartbeat to record active online presence for the logged-in user
 */
export async function POST(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is okay
    }

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, serviceKey);

    let targetUserId = body?.userId;

    if (token) {
      const { data: { user } } = await adminClient.auth.getUser(token);
      if (user?.id) targetUserId = user.id;
    }

    if (targetUserId) {
      const nowIso = new Date().toISOString();
      // Touch profiles.updated_at
      await adminClient
        .from('profiles')
        .update({ updated_at: nowIso })
        .eq('id', targetUserId);

      // Also record in user_metadata for persistence
      try {
        await adminClient.auth.admin.updateUserById(targetUserId, {
          user_metadata: { last_seen_at: nowIso }
        });
      } catch {}
    }

    return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch {
    return new Response(JSON.stringify({ status: 'ignored' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

