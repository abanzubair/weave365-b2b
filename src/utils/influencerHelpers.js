/**
 * @file influencerHelpers.js
 * @description Helper functions for Weave365 B2B Influencer & Affiliate Program.
 * Handles affiliate application submissions, incoming link detection, click tracking,
 * 30-day attribution storage, conversion logging at checkout, and stats retrieval from Supabase.
 * 
 * @module utils/influencerHelpers
 */

const REFERRAL_EXPIRY_DAYS = 30;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(val) {
  return typeof val === 'string' && UUID_REGEX.test(val.trim());
}

async function getSupabase() {
  const mod = await import('../supabaseClient.js');
  return mod.isSupabaseConfigured && mod.supabase ? mod.supabase : null;
}

/**
 * Validates a referral code against approved influencer profiles.
 * @param {string} code - The referral code to check.
 * @returns {Promise<Object|null>} Influencer profile data if valid, null otherwise.
 */
export async function validateReferralCode(code) {
  if (!code) return null;
  const supabase = await getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('influencer_profiles')
      .select('id, referral_code, commission_percentage')
      .eq('referral_code', code.trim().toUpperCase())
      .eq('is_approved', true)
      .maybeSingle();

    if (error) {
      console.error('[Influencer] Error validating referral code:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[Influencer] Failed to validate referral code:', err);
    return null;
  }
}

/**
 * Submits a new influencer application.
 * @param {string} userId - The user ID applying.
 * @param {string} referralCode - Desired referral code.
 * @param {Object} paymentDetails - Bank or UPI payment payout details.
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export async function applyAsInfluencer(userId, referralCode, paymentDetails) {
  if (!userId) {
    return { data: null, error: { message: 'User not authenticated' } };
  }
  const supabase = await getSupabase();
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  const codeClean = referralCode.trim().toUpperCase();

  try {
    // Check if the referral code is already taken
    const { data: existing, error: checkError } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('referral_code', codeClean)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      return { data: null, error: { message: `Referral code "${codeClean}" is already taken. Please choose another.` } };
    }

    const { data, error } = await supabase
      .from('influencer_profiles')
      .insert({
        id: userId,
        referral_code: codeClean,
        payment_details: paymentDetails,
        is_approved: false, // requires admin moderation
        commission_percentage: 10.0, // default rate
      })
      .select()
      .single();

    return { data, error };
  } catch (err) {
    console.error('[Influencer] Apply error:', err);
    return { data: null, error: err };
  }
}

/**
 * Records an affiliate link click in Supabase (influencer_clicks).
 * Deduplicated per browser session so refreshing pages does not inflate visit metrics.
 * @param {string} influencerId - UUID of the approved influencer.
 */
export async function recordInfluencerClick(influencerId) {
  if (typeof window === 'undefined' || !influencerId) return;

  const sessionDedupeKey = `weave_inf_click_${influencerId}`;
  try {
    if (sessionStorage.getItem(sessionDedupeKey)) {
      return; // Already counted during this active browsing session
    }
    sessionStorage.setItem(sessionDedupeKey, '1');
  } catch (e) {
    // Ignore storage quota or access errors
  }

  const supabase = await getSupabase();
  if (!supabase) return;

  try {
    const referrer = (typeof document !== 'undefined' ? document.referrer : '') || '';
    const userAgent = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';

    const { error } = await supabase
      .from('influencer_clicks')
      .insert({
        influencer_id: influencerId,
        referrer: referrer.slice(0, 1000),
        user_agent: userAgent.slice(0, 500),
      });

    if (error) {
      console.warn('[Influencer] Failed to record click log:', error.message);
    }
  } catch (err) {
    console.warn('[Influencer] Click recording exception:', err);
  }
}

/**
 * Inspects URL search params for incoming referral tags (?ref=, ?affiliate=, ?influencer=).
 * Validates against approved database profiles, logs a click, and saves to 30-day localStorage.
 * @param {string} [searchString] - Optional search query string (defaults to window.location.search).
 * @returns {Promise<Object|null>} Approved influencer profile if captured, null otherwise.
 */
export async function handleIncomingReferral(searchString) {
  if (typeof window === 'undefined') return null;

  try {
    const search = searchString !== undefined ? searchString : window.location.search;
    if (!search) return null;

    const params = new URLSearchParams(search);
    const candidateCode = params.get('ref') || params.get('affiliate') || params.get('influencer');
    if (!candidateCode) return null;

    const cleanCode = candidateCode.trim().toUpperCase();
    if (cleanCode.length < 3) return null;

    // Validate against approved database records
    const influencer = await validateReferralCode(cleanCode);
    if (!influencer) return null;

    // Store in 30-day attribution cookie
    setStoredReferralCode(influencer.referral_code);

    // Record click log
    void recordInfluencerClick(influencer.id);

    return influencer;
  } catch (err) {
    console.warn('[Influencer] Error processing incoming referral link:', err);
    return null;
  }
}

/**
 * Fetches stats and referrals history for a registered influencer.
 * Loads clicks count and ALL referrals (pending, paid, cancelled) for accurate dashboard reporting.
 * @param {string} userId - The influencer's user ID.
 * @returns {Promise<Object>} Object containing profile, clicks count, and referrals list.
 */
export async function fetchInfluencerStats(userId) {
  const stats = { profile: null, clicks: 0, referrals: [] };
  if (!userId) return stats;
  const supabase = await getSupabase();
  if (!supabase) return stats;

  try {
    // 1. Get profile
    const { data: profile, error: profileErr } = await supabase
      .from('influencer_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) throw profileErr;
    stats.profile = profile;

    if (profile) {
      // 2. Get clicks count
      const { count: clicksCount, error: clicksErr } = await supabase
        .from('influencer_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('influencer_id', userId);

      if (clicksErr) throw clicksErr;
      stats.clicks = clicksCount || 0;

      // 3. Get referrals history (include ALL statuses: pending, paid, cancelled)
      const { data: referrals, error: referralsErr } = await supabase
        .from('influencer_referrals')
        .select('*')
        .eq('influencer_id', userId)
        .order('created_at', { ascending: false });

      if (referralsErr) throw referralsErr;
      stats.referrals = referrals || [];
    }
  } catch (err) {
    console.error('[Influencer] Error fetching influencer stats:', err);
  }

  return stats;
}

/**
 * Records a referral commission transaction if an active referral code is present.
 * Prevents self-referral and validates UUID types before inserting into Supabase.
 * @param {Object} params
 * @param {string} [params.orderId] - Unique UUID of the placed order.
 * @param {string} [params.inquiryId] - Unique UUID of the inquiry.
 * @param {string} [params.buyerId] - UUID of the buyer.
 * @param {string} [params.buyerName] - Name of the buyer.
 * @param {Array} [params.items] - List of items in the order.
 * @param {number} [params.saleAmount] - Total order sale amount.
 */
export async function recordReferral({ orderId, inquiryId, buyerId, buyerName, items, saleAmount }) {
  if (typeof window === 'undefined') return;

  const refCode = getStoredReferralCode();
  if (!refCode) return;

  const supabase = await getSupabase();
  if (!supabase) return;

  try {
    // 1. Fetch influencer ID and commission rate
    const influencer = await validateReferralCode(refCode);
    if (!influencer) {
      console.warn('[Referral] Active referral code is invalid or unapproved:', refCode);
      return;
    }

    // 2. Prevent self-referrals (affiliates cannot earn commission on their own purchases)
    if (buyerId && isValidUuid(buyerId) && buyerId.toLowerCase() === influencer.id.toLowerCase()) {
      console.warn('[Referral] Self-referral ignored for influencer ID:', buyerId);
      return;
    }

    // 3. Calculate commission amount
    const parsedSaleAmount = Math.max(0, Number(saleAmount) || 0);
    const commissionPercent = Math.max(0, Math.min(100, Number(influencer.commission_percentage) || 10.0));
    const commissionAmount = Math.round(((parsedSaleAmount * commissionPercent) / 100) * 100) / 100;

    // 4. Sanitize UUID fields to prevent Postgres syntax errors
    const safeOrderId = isValidUuid(orderId) ? orderId : null;
    const safeInquiryId = isValidUuid(inquiryId) ? inquiryId : null;
    const safeBuyerId = isValidUuid(buyerId) ? buyerId : null;

    // 5. Insert referral record
    const { error } = await supabase
      .from('influencer_referrals')
      .insert({
        influencer_id: influencer.id,
        order_id: safeOrderId,
        inquiry_id: safeInquiryId,
        buyer_id: safeBuyerId,
        buyer_name: buyerName || 'Guest Buyer',
        items: Array.isArray(items) ? items : [],
        sale_amount: parsedSaleAmount,
        commission_amount: commissionAmount,
        status: 'pending',
      });

    if (error) {
      console.error('[Referral] Failed to insert referral record:', error.message);
    } else {
      console.log(`[Referral] Commission of ₹${commissionAmount} logged under code "${refCode}"`);
    }
  } catch (err) {
    console.error('[Referral] Exception while recording referral:', err);
  }
}

/**
 * Sets the active referral code in localStorage with a 30-day expiration window.
 * @param {string} code 
 */
export function setStoredReferralCode(code) {
  if (typeof window === 'undefined' || !code) return;
  const cleanCode = code.trim().toUpperCase();

  // If the exact same referral code is already active and unexpired, preserve its window
  const existingCode = getStoredReferralCode();
  if (existingCode === cleanCode) {
    return;
  }

  const expirationTime = Date.now() + REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const payload = {
    code: cleanCode,
    expiresAt: expirationTime,
  };
  try {
    localStorage.setItem('influencer_ref_data', JSON.stringify(payload));
    localStorage.setItem('influencer_ref', cleanCode);
  } catch (e) {
    console.warn('[Referral] LocalStorage write failed:', e);
  }
}

/**
 * Retrieves the active referral code if it exists and has not expired.
 * Clears it if it has expired.
 * @returns {string|null} The referral code or null.
 */
export function getStoredReferralCode() {
  if (typeof window === 'undefined') return null;

  const rawData = localStorage.getItem('influencer_ref_data');
  if (!rawData) {
    return localStorage.getItem('influencer_ref');
  }

  try {
    const payload = JSON.parse(rawData);
    if (payload && payload.expiresAt) {
      if (Date.now() > payload.expiresAt) {
        localStorage.removeItem('influencer_ref_data');
        localStorage.removeItem('influencer_ref');
        return null;
      }
      return payload.code;
    }
  } catch (e) {
    console.error('[Referral] Error parsing stored referral data:', e);
  }

  return localStorage.getItem('influencer_ref');
}

/**
 * Clears the active referral code from localStorage.
 */
export function clearStoredReferralCode() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('influencer_ref_data');
    localStorage.removeItem('influencer_ref');
  } catch (e) {}
}

/**
 * Saves the authenticated affiliate's OWN referral code into a distinct storage key.
 * This is used for generating share links without contaminating their buyer referral cookie.
 * @param {string} code 
 */
export function setOwnAffiliateCode(code) {
  if (typeof window === 'undefined') return;
  try {
    if (code) {
      localStorage.setItem('affiliate_user_code', code.trim().toUpperCase());
    } else {
      localStorage.removeItem('affiliate_user_code');
    }
  } catch (e) {}
}

/**
 * Retrieves the authenticated affiliate's OWN referral code.
 * @returns {string|null}
 */
export function getOwnAffiliateCode() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('affiliate_user_code');
  } catch (e) {
    return null;
  }
}

/**
 * Clears the authenticated affiliate's own referral code.
 */
export function clearOwnAffiliateCode() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('affiliate_user_code');
  } catch (e) {}
}
