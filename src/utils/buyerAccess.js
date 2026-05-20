/**
 * Buyer Access Utilities
 * Purpose: Implements B2B authentication & business permission rules.
 * Governs wholesale/reseller price visibility, checks against Varanasi geotargeting blocks,
 * and tracks account approval status mapping to direct SQL/Supabase profiles.
 */
export const PRICE_GROUPS = {
  wholesale: 'Wholesale Price',
  reseller: 'Reseller Price',
};

const VARANASI_PINCODE_PREFIXES = ['221'];

export function normalizeBuyerType(value) {
  return value === 'reseller' ? 'reseller' : 'wholesale';
}

export function isVaranasiPincode(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return VARANASI_PINCODE_PREFIXES.some((prefix) => digits.startsWith(prefix));
}

export function applyAutoApprovalToBuyerProfile(profile) {
  const buyerType = normalizeBuyerType(profile?.buyer_type);
  const blockedByPincode = isVaranasiPincode(profile?.pincode);

  return {
    ...profile,
    buyer_type: buyerType,
    approval_status: blockedByPincode ? 'pending' : 'approved',
    price_group: blockedByPincode ? 'pending' : buyerType,
  };
}

export function getBuyerProfileFromUser(user) {
  return user?.user_metadata?.buyer_profile || user?.buyer_profile || null;
}

export function getBuyerAccess(user, buyerProfile) {
  if (!user) {
    return {
      isLoggedIn: false,
      canViewPrices: false,
      reason: 'logged_out',
      message: 'Login to view price',
      buyerType: '',
      priceGroup: 'pending',
      priceLabel: '',
      approvalStatus: 'guest',
      userId: null,
      userEmail: null,
      buyerName: null,
      buyerPhone: null,
      buyerPincode: null,
    };
  }

  const profile = buyerProfile || getBuyerProfileFromUser(user) || {};
  const buyerType = normalizeBuyerType(profile.buyer_type);
  const approvalStatus = profile.approval_status || 'pending';
  const priceGroup = profile.price_group || (approvalStatus === 'approved' ? buyerType : 'pending');
  const canViewPrices = approvalStatus === 'approved' && Boolean(PRICE_GROUPS[priceGroup]);

  let message = 'Your account approval is pending';
  if (approvalStatus === 'rejected') message = 'Your buyer account needs review';
  if (approvalStatus === 'suspended') message = 'Price access is paused for this account';
  if (canViewPrices) message = '';

  return {
    isLoggedIn: true,
    canViewPrices,
    reason: canViewPrices ? 'approved' : approvalStatus,
    message,
    buyerType,
    priceGroup,
    priceLabel: PRICE_GROUPS[priceGroup] || 'Price Pending',
    approvalStatus,
    blockedByVaranasiPincode: isVaranasiPincode(profile.pincode),
    userId: user.id || null,
    userEmail: user.email || null,
    buyerName: profile.business_name || profile.full_name || null,
    buyerPhone: profile.whatsapp || profile.whatsapp_number || null,
    buyerPincode: profile.pincode || null,
    resellerDashboardEnabled: Boolean(profile.reseller_dashboard_enabled),
  };
}

export function priceForBuyer(prices = {}, buyerAccess) {
  if (buyerAccess && !buyerAccess.canViewPrices) return null;

  if (buyerAccess?.priceGroup === 'reseller') {
    // Reseller pricing → B2R column, fallback to B2B if B2R is missing
    return prices.b2r || prices.mrp || 0;
  }

  // Wholesale pricing → B2B column
  return prices.mrp || prices.offer || 0;
}

export function priceNoticeForAccess(buyerAccess) {
  return buyerAccess?.message || 'Login to view price';
}
