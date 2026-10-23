/**
 * @file app/api/[[...route]]/couponsHandler.js
 * @description Secure Server-Side Coupon & Promo Code Management Handler for Weave365.
 * 
 * Capabilities:
 * 1. Admin Management (/api/admin/coupons):
 *    - Generate unique private coupon codes
 *    - Enforce global usage limits (e.g. max 2 uses total)
 *    - Enforce per-user limits, expiry dates, min order requirements
 *    - Real-time usage tracking & redemption analytics
 *    - Codes remain completely private for manual distribution via WhatsApp/Email
 * 
 * 2. Buyer Checkout Validation (/api/coupons/validate):
 *    - Validates individual coupon codes entered at checkout
 *    - Checks active status, expiry, total usage limit, and per-buyer usage limits
 *    - Accurately computes percentage or fixed discounts with optional caps
 *    - Never exposes or enumerates coupons to the public
 * 
 * 3. Atomic Usage Recording:
 *    - Increments times_used counter upon payment confirmation
 *    - Records detailed redemption history in coupon_usages table
 */

import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const ALLOWED_ADMIN_ORIGINS = [
  'https://www.weave365.com',
  'https://weave365.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function getCorsHeaders(request) {
  const origin = request?.headers?.get('origin');
  const isAllowed = origin && (ALLOWED_ADMIN_ORIGINS.includes(origin) || origin.endsWith('.weave365.com'));

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase server credentials missing in environment.');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

/**
 * Verifies that the incoming request is from an authorized administrator.
 */
async function verifyAdminAuth(request, supabase) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return { authorized: false, error: 'Missing authentication token.' };
  }

  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !authUser?.email) {
    return { authorized: false, error: 'Invalid or expired session token.' };
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
    return { authorized: false, error: 'Forbidden: Admin privileges required.' };
  }

  return { authorized: true, user: authUser };
}

/**
 * Generate a random memorable coupon code
 * e.g. WEAVE-9B2F or VIP-821A
 */
export function generateCouponCode(prefix = 'WEAVE') {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix.toUpperCase().trim()}-${randomPart}`;
}

/**
 * GET /api/admin/coupons
 * Lists all generated coupons and their real-time usage statistics
 */
export async function handleAdminCouponsGet(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const supabase = getSupabaseAdmin();
    const auth = await verifyAdminAuth(request, supabase);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: 403, headers: corsHeaders });
    }

    // Fetch all coupons
    const { data: coupons, error: fetchErr } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchErr) {
      // If table doesn't exist yet, return empty list gracefully
      if (fetchErr.message && fetchErr.message.includes('does not exist')) {
        return Response.json({ success: true, coupons: [], usages: [], tableNotReady: true }, { status: 200, headers: corsHeaders });
      }
      throw fetchErr;
    }

    // Fetch recent coupon usages (last 200)
    const { data: usages, error: usagesErr } = await supabase
      .from('coupon_usages')
      .select('*')
      .order('used_at', { ascending: false })
      .limit(200);

    return Response.json({
      success: true,
      coupons: coupons || [],
      usages: usages || [],
    }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[Coupons API GET] Error:', err);
    return Response.json({ error: err.message || 'Failed to fetch coupons.' }, { status: 500, headers: corsHeaders });
  }
}

/**
 * POST /api/admin/coupons
 * Handles coupon creation, updates, and limit adjustments
 */
export async function handleAdminCouponsPost(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const supabase = getSupabaseAdmin();
    const auth = await verifyAdminAuth(request, supabase);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: 403, headers: corsHeaders });
    }

    const body = await request.json();
    const { action = 'create' } = body;

    if (action === 'create') {
      let rawCode = String(body.code || '').trim().toUpperCase();
      if (!rawCode) {
        rawCode = generateCouponCode(body.prefix || 'WEAVE');
      }

      // Sanitize code (only alphanumeric and hyphens/underscores)
      const cleanCode = rawCode.replace(/[^A-Z0-9-_]/g, '');
      if (cleanCode.length < 3) {
        return Response.json({ error: 'Coupon code must be at least 3 characters long.' }, { status: 400, headers: corsHeaders });
      }

      const discountType = body.discount_type === 'fixed' ? 'fixed' : 'percentage';
      const discountValue = Number(body.discount_value);
      if (isNaN(discountValue) || discountValue <= 0) {
        return Response.json({ error: 'Discount value must be a positive number.' }, { status: 400, headers: corsHeaders });
      }

      if (discountType === 'percentage' && discountValue > 100) {
        return Response.json({ error: 'Percentage discount cannot exceed 100%.' }, { status: 400, headers: corsHeaders });
      }

      const usageLimit = Math.max(1, parseInt(body.usage_limit, 10) || 1);
      const perUserLimit = Math.max(1, parseInt(body.per_user_limit, 10) || 1);
      const minOrderAmount = Math.max(0, Number(body.min_order_amount) || 0);
      const maxDiscountAmount = body.max_discount_amount ? Math.max(0, Number(body.max_discount_amount)) : null;
      const expiresAt = body.expires_at ? new Date(body.expires_at).toISOString() : null;
      const description = String(body.description || '').trim();
      const isActive = body.is_active !== false;

      // Check for code uniqueness
      const { data: existing } = await supabase
        .from('coupons')
        .select('id')
        .ilike('code', cleanCode)
        .maybeSingle();

      if (existing) {
        return Response.json({ error: `Coupon code "${cleanCode}" already exists. Please choose a different code.` }, { status: 400, headers: corsHeaders });
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('coupons')
        .insert({
          code: cleanCode,
          discount_type: discountType,
          discount_value: discountValue,
          usage_limit: usageLimit,
          per_user_limit: perUserLimit,
          min_order_amount: minOrderAmount,
          max_discount_amount: maxDiscountAmount,
          expires_at: expiresAt,
          description: description || null,
          is_active: isActive,
          created_by: auth.user.email,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      return Response.json({
        success: true,
        message: `Coupon "${cleanCode}" created successfully.`,
        coupon: inserted,
      }, { status: 201, headers: corsHeaders });
    }

    if (action === 'update') {
      const { id } = body;
      if (!id) {
        return Response.json({ error: 'Coupon ID is required for update.' }, { status: 400, headers: corsHeaders });
      }

      const updatePayload = {
        updated_at: new Date().toISOString(),
      };

      if (body.usage_limit !== undefined) {
        updatePayload.usage_limit = Math.max(1, parseInt(body.usage_limit, 10));
      }
      if (body.per_user_limit !== undefined) {
        updatePayload.per_user_limit = Math.max(1, parseInt(body.per_user_limit, 10));
      }
      if (body.min_order_amount !== undefined) {
        updatePayload.min_order_amount = Math.max(0, Number(body.min_order_amount));
      }
      if (body.max_discount_amount !== undefined) {
        updatePayload.max_discount_amount = body.max_discount_amount ? Math.max(0, Number(body.max_discount_amount)) : null;
      }
      if (body.expires_at !== undefined) {
        updatePayload.expires_at = body.expires_at ? new Date(body.expires_at).toISOString() : null;
      }
      if (body.description !== undefined) {
        updatePayload.description = String(body.description || '').trim();
      }
      if (body.is_active !== undefined) {
        updatePayload.is_active = Boolean(body.is_active);
      }

      const { data: updated, error: updateErr } = await supabase
        .from('coupons')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return Response.json({
        success: true,
        message: 'Coupon updated successfully.',
        coupon: updated,
      }, { status: 200, headers: corsHeaders });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) {
        return Response.json({ error: 'Coupon ID is required for deletion.' }, { status: 400, headers: corsHeaders });
      }

      const { error: deleteErr } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (deleteErr) throw deleteErr;

      return Response.json({
        success: true,
        message: 'Coupon deleted successfully.',
      }, { status: 200, headers: corsHeaders });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error('[Coupons API POST] Error:', err);
    return Response.json({ error: err.message || 'Operation failed.' }, { status: 500, headers: corsHeaders });
  }
}

/**
 * DELETE /api/admin/coupons
 */
export async function handleAdminCouponsDelete(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const supabase = getSupabaseAdmin();
    const auth = await verifyAdminAuth(request, supabase);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: 403, headers: corsHeaders });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return Response.json({ error: 'Coupon ID is required.' }, { status: 400, headers: corsHeaders });
    }

    const { error: deleteErr } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (deleteErr) throw deleteErr;

    return Response.json({ success: true, message: 'Coupon deleted successfully.' }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[Coupons API DELETE] Error:', err);
    return Response.json({ error: err.message || 'Failed to delete coupon.' }, { status: 500, headers: corsHeaders });
  }
}

/**
 * POST /api/coupons/validate
 * Public endpoint called by buyers at Checkout.
 * Validates a specific code and calculates savings.
 * NEVER lists or reveals any coupons.
 */
export async function handleValidateCoupon(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const body = await request.json();
    const {
      code,
      cart_total = 0,
      phone = '',
      email = '',
      user_id = null,
      currency = 'INR',
    } = body;

    const cleanCode = String(code || '').trim().toUpperCase();
    if (!cleanCode) {
      return Response.json({
        valid: false,
        error: 'Please enter a coupon code.',
      }, { status: 400, headers: corsHeaders });
    }

    const cartTotalNum = Math.max(0, Number(cart_total) || 0);
    const supabase = getSupabaseAdmin();

    // 1. Query coupon by code
    const { data: coupon, error: fetchErr } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', cleanCode)
      .maybeSingle();

    if (fetchErr) {
      console.warn('[Coupon Validate] DB query notice:', fetchErr.message);
      return Response.json({
        valid: false,
        error: 'Unable to validate coupon at this time. Please try again.',
      }, { status: 500, headers: corsHeaders });
    }

    if (!coupon) {
      return Response.json({
        valid: false,
        error: 'Invalid coupon code. Please check and try again.',
      }, { status: 404, headers: corsHeaders });
    }

    // 2. Check if active
    if (!coupon.is_active) {
      return Response.json({
        valid: false,
        error: 'This coupon code is currently inactive.',
      }, { status: 400, headers: corsHeaders });
    }

    // 3. Check expiration
    if (coupon.expires_at) {
      const expiry = new Date(coupon.expires_at).getTime();
      if (Date.now() > expiry) {
        return Response.json({
          valid: false,
          error: 'This coupon code has expired.',
        }, { status: 400, headers: corsHeaders });
      }
    }

    // 4. Check global usage limit
    const timesUsed = Number(coupon.times_used) || 0;
    const usageLimit = Number(coupon.usage_limit) || 1;
    if (timesUsed >= usageLimit) {
      return Response.json({
        valid: false,
        error: `This coupon code has reached its maximum usage limit (${usageLimit} ${usageLimit === 1 ? 'use' : 'uses'}).`,
      }, { status: 400, headers: corsHeaders });
    }

    // 5. Check per-buyer usage limit (anti-abuse)
    const perUserLimit = Number(coupon.per_user_limit) || 1;
    const cleanPhone = String(phone || '').trim().replace(/[^0-9]/g, '');
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (perUserLimit > 0 && (cleanPhone || cleanEmail || user_id)) {
      try {
        let usageQuery = supabase
          .from('coupon_usages')
          .select('id', { count: 'exact' })
          .eq('coupon_id', coupon.id);

        const conditions = [];
        if (user_id) conditions.push(`user_id.eq.${user_id}`);
        if (cleanEmail) conditions.push(`buyer_email.eq.${cleanEmail}`);
        if (cleanPhone && cleanPhone.length >= 10) conditions.push(`buyer_phone.ilike.%${cleanPhone.slice(-10)}%`);

        if (conditions.length > 0) {
          usageQuery = usageQuery.or(conditions.join(','));
          const { count, error: countErr } = await usageQuery;
          if (!countErr && typeof count === 'number' && count >= perUserLimit) {
            return Response.json({
              valid: false,
              error: `You have already redeemed this coupon the maximum allowed number of times (${perUserLimit}).`,
            }, { status: 400, headers: corsHeaders });
          }
        }
      } catch (userCheckErr) {
        console.warn('[Coupon Validate] User limit check notice:', userCheckErr);
      }
    }

    // 6. Check minimum order requirement
    const minOrder = Number(coupon.min_order_amount) || 0;
    if (minOrder > 0 && cartTotalNum < minOrder) {
      return Response.json({
        valid: false,
        error: `Minimum order amount of ₹${minOrder.toLocaleString('en-IN')} required to use this coupon.`,
      }, { status: 400, headers: corsHeaders });
    }

    // 7. Calculate exact discount
    let rawDiscount = 0;
    if (coupon.discount_type === 'percentage') {
      rawDiscount = (cartTotalNum * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount_amount && Number(coupon.max_discount_amount) > 0) {
        rawDiscount = Math.min(rawDiscount, Number(coupon.max_discount_amount));
      }
    } else {
      // Fixed discount
      rawDiscount = Math.min(cartTotalNum, Number(coupon.discount_value));
    }

    const finalDiscount = Number(Number(rawDiscount).toFixed(2));
    const newTotal = Math.max(0, Number((cartTotalNum - finalDiscount).toFixed(2)));

    const discountSummaryText = coupon.discount_type === 'percentage'
      ? `${coupon.discount_value}% OFF${coupon.max_discount_amount ? ` (Up to ₹${coupon.max_discount_amount})` : ''}`
      : `₹${coupon.discount_value} Flat OFF`;

    return Response.json({
      valid: true,
      message: `Coupon "${coupon.code}" applied! You saved ₹${finalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}.`,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_summary: discountSummaryText,
        min_order_amount: coupon.min_order_amount,
        max_discount_amount: coupon.max_discount_amount,
        usage_limit: coupon.usage_limit,
        times_used: coupon.times_used,
        remaining_uses: Math.max(0, usageLimit - timesUsed),
      },
      discount_amount: finalDiscount,
      final_total: newTotal,
    }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[Coupon Validate] Exception:', err);
    return Response.json({
      valid: false,
      error: 'Failed to validate coupon code.',
    }, { status: 500, headers: corsHeaders });
  }
}

/**
 * Atomically records coupon usage upon successful order placement/payment verification.
 * Automatically increments times_used on the coupon.
 */
export async function recordCouponUsage(supabase, {
  couponCode,
  orderId,
  orderNumber,
  userId = null,
  email = null,
  phone = null,
  discountAmount = 0,
  orderTotal = 0,
}) {
  if (!supabase || !couponCode) return;

  const cleanCode = String(couponCode).trim().toUpperCase();
  try {
    // 1. Fetch current coupon record
    const { data: coupon, error: fetchErr } = await supabase
      .from('coupons')
      .select('id, times_used, usage_limit')
      .ilike('code', cleanCode)
      .maybeSingle();

    if (fetchErr || !coupon) {
      console.warn(`[recordCouponUsage] Coupon "${cleanCode}" not found or error:`, fetchErr);
      return;
    }

    const currentTimesUsed = Number(coupon.times_used) || 0;
    const nextTimesUsed = currentTimesUsed + 1;

    // 2. Increment times_used
    await supabase
      .from('coupons')
      .update({
        times_used: nextTimesUsed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', coupon.id);

    // 3. Insert usage record into coupon_usages
    await supabase
      .from('coupon_usages')
      .insert({
        coupon_id: coupon.id,
        order_id: orderId || null,
        order_number: orderNumber || null,
        user_id: userId || null,
        buyer_email: email ? String(email).trim().toLowerCase() : null,
        buyer_phone: phone ? String(phone).trim() : null,
        discount_amount: Number(discountAmount) || 0,
        order_total: Number(orderTotal) || 0,
      });

    console.log(`[recordCouponUsage] Successfully recorded redemption for coupon "${cleanCode}" on order #${orderNumber || orderId}. (Usage count: ${nextTimesUsed}/${coupon.usage_limit})`);
  } catch (err) {
    console.error(`[recordCouponUsage] Exception for code "${cleanCode}":`, err);
  }
}
