/**
 * @file influencerHelpers.js
 * @description Helper functions for Weave365 B2B Influencer Program.
 * Handles influencer application submissions, referral code validation,
 * clicks/visits tracking, conversions logging, and stats retrieval from Supabase.
 * 
 * @module utils/influencerHelpers
 */

import { isSupabaseConfigured, supabase } from '../supabaseClient.js';

/**
 * Validates a referral code against the approved influencer profiles.
 * @param {string} code - The referral code to check.
 * @returns {Promise<Object|null>} Influencer profile data if valid, null otherwise.
 */
export async function validateReferralCode(code) {
  if (!code || !isSupabaseConfigured) return null;
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
  if (!isSupabaseConfigured || !userId) {
    return { data: null, error: { message: 'Supabase not configured or user not authenticated' } };
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
 * Fetches stats and referrals history for a registered influencer.
 * @param {string} userId - The influencer's user ID.
 * @returns {Promise<Object>} Object containing profile, clicks count, and referrals list.
 */
export async function fetchInfluencerStats(userId) {
  const stats = { profile: null, clicks: 0, referrals: [] };
  if (!isSupabaseConfigured || !userId) return stats;

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

      // 3. Get referrals history
      const { data: referrals, error: referralsErr } = await supabase
        .from('influencer_referrals')
        .select('*')
        .eq('influencer_id', userId)
        .eq('status', 'paid')
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
 * Records a referral commission transaction if a referral code is active in localStorage.
 * @param {Object} params
 * @param {string} [params.orderId] - Unique ID of the placed order.
 * @param {string} [params.inquiryId] - Unique ID of the inquiry.
 * @param {string} [params.buyerId] - ID of the buyer (optional).
 * @param {string} [params.buyerName] - Name of the buyer.
 * @param {Array} [params.items] - List of items.
 * @param {number} [params.saleAmount] - Total order sale amount.
 */
export async function recordReferral({ orderId, inquiryId, buyerId, buyerName, items, saleAmount }) {
  if (typeof window === 'undefined' || !isSupabaseConfigured) return;

  const refCode = getStoredReferralCode();
  if (!refCode) return;

  try {
    // 1. Fetch influencer ID and commission rate
    const influencer = await validateReferralCode(refCode);
    if (!influencer) {
      console.warn('[Referral] Active referral code is invalid or unapproved:', refCode);
      return;
    }

    // 2. Calculate commission amount
    const commissionPercent = Number(influencer.commission_percentage) || 10.0;
    const commissionAmount = (Number(saleAmount) * commissionPercent) / 100;

    // 3. Insert referral record
    const { error } = await supabase
      .from('influencer_referrals')
      .insert({
        influencer_id: influencer.id,
        order_id: orderId || null,
        inquiry_id: inquiryId || null,
        buyer_id: buyerId || null,
        buyer_name: buyerName || 'Guest Buyer',
        items: items,
        sale_amount: Number(saleAmount) || 0,
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
 * Sets the active referral code in localStorage with a 1-day expiration window.
 * @param {string} code 
 */
export function setStoredReferralCode(code) {
  if (typeof window === 'undefined' || !code) return;
  const cleanCode = code.trim().toUpperCase();

  // If the same referral code is already active and valid, keep the original expiration
  const existingCode = getStoredReferralCode();
  if (existingCode === cleanCode) {
    return;
  }

  const expirationTime = Date.now() + 1 * 24 * 60 * 60 * 1000; // 1 day in ms
  const payload = {
    code: cleanCode,
    expiresAt: expirationTime
  };
  localStorage.setItem('influencer_ref_data', JSON.stringify(payload));
  localStorage.setItem('influencer_ref', cleanCode);
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
    // Check if legacy key is present but no metadata exists
    return localStorage.getItem('influencer_ref');
  }
  
  try {
    const payload = JSON.parse(rawData);
    if (payload && payload.expiresAt) {
      if (Date.now() > payload.expiresAt) {
        // Expired! Clear both keys
        localStorage.removeItem('influencer_ref_data');
        localStorage.removeItem('influencer_ref');
        console.log('[Referral] Stored referral code has expired and was cleared.');
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
  localStorage.removeItem('influencer_ref_data');
  localStorage.removeItem('influencer_ref');
}
