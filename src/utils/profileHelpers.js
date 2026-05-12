import { isSupabaseConfigured, supabase } from '../supabaseClient.js';

export function profileRowFromUser(user) {
  const buyerProfile = user?.user_metadata?.buyer_profile || user?.buyer_profile;
  if (!user?.id || !buyerProfile) return null;

  return {
    id: user.id,
    email: user.email || '',
    full_name: buyerProfile.full_name || '',
    whatsapp: buyerProfile.whatsapp || '',
    whatsapp_country_code: buyerProfile.whatsapp_country_code || '',
    whatsapp_number: buyerProfile.whatsapp_number || '',
    business_name: buyerProfile.business_name || '',
    buyer_type: buyerProfile.buyer_type || 'wholesale',
    buying_behavior: buyerProfile.buying_behavior || 'instant',
    pincode: buyerProfile.pincode || '',
    interested_categories: buyerProfile.interested_categories || [],
    price_group: buyerProfile.price_group || buyerProfile.buyer_type || 'pending',
    approval_status: buyerProfile.approval_status || 'pending',
    updated_at: new Date().toISOString(),
  };
}

export async function syncProfileFromUser(user) {
  if (!isSupabaseConfigured) return { error: null };

  const profileRow = profileRowFromUser(user);
  if (!profileRow) return { error: null };

  return supabase
    .from('profiles')
    .upsert(profileRow, { onConflict: 'id' });
}
