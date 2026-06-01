/**
 * @file profileHelpers.js
 * @description B2B user profile normalization and synchronization utilities. Translates
 * authenticated Supabase user metadata configurations into structured buyer database schemas.
 * Orchestrates backend profile synchronization, preserving administrator approvals and B2B pricing tier classifications
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
    buyer_type: buyerProfile.buyer_type || 'wholesale',
    buyer_subtype: buyerProfile.buyer_subtype || '',
    buying_behavior: buyerProfile.buying_behavior || 'instant',
    city: buyerProfile.city || '',
    pincode: buyerProfile.pincode || '',
    interested_categories: buyerProfile.interested_categories || [],
    price_group: buyerProfile.price_group || buyerProfile.buyer_type || 'pending',
    approval_status: buyerProfile.approval_status || 'pending',
    updated_at: new Date().toISOString(),
  });
}

export async function syncProfileFromUser(user) {
  if (!isSupabaseConfigured) return { error: null };

  const profileRow = profileRowFromUser(user);
  if (!profileRow) return { error: null };

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (readError) return { error: readError };

  if (!existing) {
    return supabase
      .from('profiles')
      .insert(profileRow);
  }

  // To prevent overwriting admin updates or direct database edits with stale user metadata
  // from the Supabase Auth session on every page refresh, we should not blindly overwrite
  // the profile row if it already exists.
  return { error: null };
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
