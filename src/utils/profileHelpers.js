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
import { applyAutoApprovalToBuyerProfile, isVendorProfile, isProfileComplete } from './buyerAccess.js';

export { isProfileComplete };

export function profileRowFromUser(user) {
  if (!user?.id) return null;
  const buyerProfile = user?.user_metadata?.buyer_profile || user?.buyer_profile || {};

  const isVendor = isVendorProfile(buyerProfile) || user?.user_metadata?.role === 'vendor';

  return applyAutoApprovalToBuyerProfile({
    id: user.id,
    email: user.email || user.user_metadata?.email || '',
    full_name: buyerProfile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
    whatsapp: buyerProfile.whatsapp || '',
    whatsapp_country_code: buyerProfile.whatsapp_country_code || '',
    whatsapp_number: buyerProfile.whatsapp_number || '',
    business_name: buyerProfile.business_name || '',
    buyer_type: isVendor ? 'vendor' : (buyerProfile.buyer_type || 'customer'),
    buyer_subtype: buyerProfile.buyer_subtype || (isVendor ? 'Vendor' : 'Customer'),
    role: isVendor ? 'vendor' : (buyerProfile.role || user.user_metadata?.role || 'customer'),
    vendor_code: buyerProfile.vendor_code || '',
    partner_name: buyerProfile.partner_name || '',
    buying_behavior: buyerProfile.buying_behavior || 'instant',
    city: buyerProfile.city ? (buyerProfile.city.includes(',') ? buyerProfile.city.split(',')[0].trim() : buyerProfile.city) : '',
    state: buyerProfile.state || (buyerProfile.city && buyerProfile.city.includes(',') ? buyerProfile.city.split(',').slice(1).join(',').trim() : ''),
    pincode: buyerProfile.pincode || '',
    interested_categories: buyerProfile.interested_categories || [],
    price_group: buyerProfile.price_group || 'pending',
    approval_status: buyerProfile.approval_status || 'incomplete',
    updated_at: new Date().toISOString(),
  });
}

export async function syncProfileFromUser(user) {
  if (!isSupabaseConfigured) return { error: null };

  const profileRow = profileRowFromUser(user);
  if (!profileRow) return { error: null };

  // If the profile is incomplete, check if a complete profile is already saved in Supabase
  if (profileRow.approval_status === 'incomplete') {
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id, whatsapp_number, pincode, approval_status')
        .eq('id', user.id)
        .maybeSingle();

      // If an existing profile is already complete or approved in DB, do not overwrite it with incomplete Google metadata
      if (
        existing &&
        existing.whatsapp_number &&
        existing.pincode &&
        existing.approval_status !== 'incomplete'
      ) {
        return { error: null };
      }
    } catch (e) {
      console.warn('[profileHelpers] Error checking existing profile:', e);
    }
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(profileRow, { onConflict: 'id' });

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
