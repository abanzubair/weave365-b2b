/**
 * @file profileHelpers.js
 * @description User profile normalization and synchronization utilities. Translates
 * authenticated Supabase user metadata configurations into structured buyer database schemas.
 * Orchestrates backend profile synchronization, preserving administrator approvals and wholesale pricing tier classifications
 * while updating retail contact parameters and wholesale buyer interests.
 * 
 * @module utils/profileHelpers
 */

import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { applyAutoApprovalToBuyerProfile } from './buyerAccess.js';

export function profileRowFromUser(user) {
  const buyerProfile = user?.user_metadata?.buyer_profile || user?.buyer_profile;
  if (!user?.id || !buyerProfile) return null;

  return applyAutoApprovalToBuyerProfile({
    id: user.id,
    email: user.email || '',
    full_name: buyerProfile.full_name || '',
    whatsapp: buyerProfile.whatsapp || '',
    whatsapp_country_code: buyerProfile.whatsapp_country_code || '',
    whatsapp_number: buyerProfile.whatsapp_number || '',
    business_name: buyerProfile.business_name || '',
    buyer_type: buyerProfile.buyer_type === 'vendor' ? 'vendor' : 'customer',
    buyer_subtype: buyerProfile.buyer_subtype || '',
    vendor_code: buyerProfile.vendor_code || '',
    partner_name: buyerProfile.partner_name || '',
    buying_behavior: buyerProfile.buying_behavior || 'instant',
    city: buyerProfile.city || '',
    pincode: buyerProfile.pincode || '',
    interested_categories: buyerProfile.interested_categories || [],
    price_group: buyerProfile.price_group || 'approved',
    approval_status: buyerProfile.approval_status || 'approved',
    updated_at: new Date().toISOString(),
  });
}

export async function syncProfileFromUser(user) {
  if (!isSupabaseConfigured) return { error: null };

  const profileRow = profileRowFromUser(user);
  if (!profileRow) return { error: null };

  // Use atomic upsert with ignoreDuplicates: true so concurrent sign-in / registration
  // events do not trigger unique constraint race conditions (SQL state 23505).
  const { error } = await supabase
    .from('profiles')
    .upsert(profileRow, { onConflict: 'id', ignoreDuplicates: true });

  return { error: error || null };
}

export async function loadProfileForUser(user) {
  if (!user) return { profile: null, error: null };

  const fallbackProfile = user.user_metadata?.buyer_profile || user.buyer_profile || null;
  if (!isSupabaseConfigured) {
    return { profile: fallbackProfile, error: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return { profile: data || fallbackProfile, error };
}
