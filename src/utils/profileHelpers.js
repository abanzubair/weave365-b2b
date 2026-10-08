/**
 * @file profileHelpers.js
 * @description User profile normalization and synchronization utilities. Translates
 * authenticated Supabase user metadata configurations into structured buyer database schemas.
 * Orchestrates backend profile synchronization, preserving administrator approvals and wholesale pricing tier classifications
 * while updating retail contact parameters and wholesale buyer interests.
 * 
 * @module utils/profileHelpers
 */

async function getSupabase() {
  const mod = await import('../supabaseClient.js');
  return mod.isSupabaseConfigured && mod.supabase ? mod.supabase : null;
}
import { applyAutoApprovalToBuyerProfile, isVendorProfile } from './buyerAccess.js';
import { getStoredAttribution } from './trafficTracker.js';

export function profileRowFromUser(user) {
  if (!user?.id) return null;
  const buyerProfile = user?.user_metadata?.buyer_profile || user?.buyer_profile || {};

  const isVendor = isVendorProfile(buyerProfile) || user?.user_metadata?.role === 'vendor';
  const isBusiness = !isVendor && (
    buyerProfile.user_type === 'business' ||
    user?.user_metadata?.user_type === 'business' ||
    buyerProfile.buyer_type === 'business' ||
    buyerProfile.buyer_type === 'reseller' ||
    buyerProfile.role === 'reseller' ||
    buyerProfile.role === 'business' ||
    (buyerProfile.buyer_subtype && !['customer', 'user', ''].includes(buyerProfile.buyer_subtype.toLowerCase().trim())) ||
    Boolean(buyerProfile.business_name?.trim())
  );

  const storedAttr = getStoredAttribution();
  const acquisition = buyerProfile.acquisition || user?.user_metadata?.acquisition || storedAttr || null;

  const userType = isVendor ? 'supplier' : (isBusiness ? 'business' : 'customer');
  const buyerType = isVendor ? 'vendor' : (isBusiness ? 'business' : 'customer');
  const role = isVendor ? 'vendor' : (isBusiness ? (buyerProfile.role === 'admin' ? 'admin' : (buyerProfile.role || 'reseller')) : (buyerProfile.role === 'admin' ? 'admin' : 'customer'));
  const buyerSubtype = buyerProfile.buyer_subtype || (isVendor ? 'Vendor' : (isBusiness ? 'Reseller' : 'Customer'));

  return applyAutoApprovalToBuyerProfile({
    id: user.id,
    email: user.email || user.user_metadata?.email || '',
    full_name: buyerProfile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
    whatsapp: buyerProfile.whatsapp || '',
    whatsapp_country_code: buyerProfile.whatsapp_country_code || '',
    whatsapp_number: buyerProfile.whatsapp_number || '',
    business_name: buyerProfile.business_name || '',
    website: buyerProfile.website || '',
    social_handle: buyerProfile.social_handle || buyerProfile.socialHandle || '',
    user_type: userType,
    qualification: buyerProfile.qualification || user?.user_metadata?.qualification || null,
    buyer_type: buyerType,
    buyer_subtype: buyerSubtype,
    role: role,
    vendor_code: buyerProfile.vendor_code || '',
    partner_name: buyerProfile.partner_name || '',
    buying_behavior: buyerProfile.buying_behavior || 'instant',
    city: buyerProfile.city ? (buyerProfile.city.includes(',') ? buyerProfile.city.split(',')[0].trim() : buyerProfile.city) : '',
    state: buyerProfile.state || (buyerProfile.city && buyerProfile.city.includes(',') ? buyerProfile.city.split(',').slice(1).join(',').trim() : ''),
    pincode: buyerProfile.pincode || '',
    country: buyerProfile.country || 'India',
    interested_categories: buyerProfile.interested_categories || [],
    price_group: buyerProfile.price_group || 'approved',
    approval_status: buyerProfile.approval_status || 'approved',
    updated_at: new Date().toISOString(),
  });
}

export async function syncProfileFromUser(user) {
  const supabase = await getSupabase();
  if (!supabase) return { error: null };

  const profileRow = profileRowFromUser(user);
  if (!profileRow) return { error: null };

  // Store first-touch attribution into Supabase user_metadata if available
  const storedAttr = getStoredAttribution();
  if (storedAttr && !user.user_metadata?.acquisition) {
    try {
      void supabase.auth.updateUser({
        data: {
          acquisition: storedAttr,
          buyer_profile: {
            ...(user.user_metadata?.buyer_profile || {}),
            acquisition: storedAttr,
          }
        }
      }).catch(() => {});
    } catch {}
  }

  let { data: existingProfile } = await supabase
    .from('profiles')
    .select('user_type, role, buyer_type, buyer_subtype, qualification, approval_status, price_group, vendor_code, partner_name')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile) {
    // Preserve administrative role promotions if present in DB
    if (existingProfile.role && existingProfile.role !== 'customer') {
      profileRow.role = existingProfile.role;
    }
    if (existingProfile.user_type && profileRow.user_type === 'customer' && existingProfile.user_type !== 'customer') {
      profileRow.user_type = existingProfile.user_type;
    }
    if (existingProfile.buyer_type && profileRow.buyer_type === 'customer' && existingProfile.buyer_type !== 'customer') {
      profileRow.buyer_type = existingProfile.buyer_type;
    }
    if (existingProfile.buyer_subtype && (!profileRow.buyer_subtype || profileRow.buyer_subtype === 'Customer')) {
      profileRow.buyer_subtype = existingProfile.buyer_subtype;
    }
    if (existingProfile.vendor_code) profileRow.vendor_code = existingProfile.vendor_code;
    if (existingProfile.partner_name) profileRow.partner_name = existingProfile.partner_name;
    if (existingProfile.price_group) profileRow.price_group = existingProfile.price_group;
    if (existingProfile.approval_status) profileRow.approval_status = existingProfile.approval_status;

    // Merge qualification: combine existing DB fields with incoming qualification without wiping questionnaire data
    const existingQual = (typeof existingProfile.qualification === 'object' && existingProfile.qualification) ? existingProfile.qualification : {};
    const incomingQual = (typeof profileRow.qualification === 'object' && profileRow.qualification) ? profileRow.qualification : {};
    profileRow.qualification = {
      ...existingQual,
      ...incomingQual,
    };
  }

  let { error } = await supabase
    .from('profiles')
    .upsert(profileRow, { onConflict: 'id' });

  // If a column doesn't exist yet on public.profiles (e.g. pending DB migration),
  // retry without ONLY the specific failing column(s), NEVER stripping qualification or core user profile data.
  if (error && (
    error.message?.includes('acquisition') ||
    error.message?.includes('website') ||
    error.message?.includes('social_handle') ||
    error.message?.includes('country') ||
    error.message?.includes('column') ||
    error.message?.includes('schema cache') ||
    error.code === 'PGRST204'
  )) {
    const fallbackRow = { ...profileRow };
    const optionalColumns = ['acquisition', 'website', 'social_handle', 'country'];
    let modified = false;

    for (const col of optionalColumns) {
      if (error.message?.includes(col)) {
        delete fallbackRow[col];
        modified = true;
      }
    }

    // Safety fallback: if error did not mention a specific column, remove acquisition if present
    if (!modified && 'acquisition' in fallbackRow) {
      delete fallbackRow.acquisition;
      modified = true;
    }

    if (modified) {
      const retryResult = await supabase
        .from('profiles')
        .upsert(fallbackRow, { onConflict: 'id' });
      error = retryResult.error;
    }
  }

  return { error: error || null };
}

export async function loadProfileForUser(user) {
  if (!user) return { profile: null, error: null };

  const fallbackProfile = user.user_metadata?.buyer_profile || user.buyer_profile || null;
  const supabase = await getSupabase();
  if (!supabase) {
    return { profile: fallbackProfile, error: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return { profile: data || fallbackProfile, error };
}

export function isProfileComplete(user, buyerProfile) {
  if (!user) return false;
  const profile = buyerProfile || user.user_metadata?.buyer_profile || user.buyer_profile;
  if (!profile) return false;

  const fullName = String(profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '').trim();
  const whatsapp = String(profile.whatsapp_number || profile.whatsapp || '').replace(/\D/g, '').slice(0, 15);
  const city = String(profile.city || '').trim();
  const pincode = String(profile.pincode || '').replace(/[^a-zA-Z0-9\s-]/g, '').trim().slice(0, 12);

  if (!fullName || whatsapp.length < 6 || whatsapp.length > 15 || !city || pincode.length < 3) {
    return false;
  }

  return true;
}
