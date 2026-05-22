/**
 * Buyer Access Utilities
 * Purpose: Implements B2B authentication & business permission rules.
 * Governs wholesale/reseller price visibility, checks against Varanasi geotargeting blocks,
 * and tracks account approval status mapping to direct SQL/Supabase profiles.
 */
export const PRICE_GROUPS = {
  wholesale: 'Wholesale Price',
  reseller: 'Reseller Price',
  guest: 'Price',
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
      canViewPrices: true,
      reason: 'logged_out',
      message: '',
      buyerType: '',
      priceGroup: 'guest',
      priceLabel: 'Price',
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
  
  // Geotargeting block check for Varanasi pincodes
  const blockedByPincode = isVaranasiPincode(profile.pincode);
  
  // If explicitly suspended, rejected, or a pending Varanasi competitor
  const isRestricted = approvalStatus === 'suspended' || approvalStatus === 'rejected' || (blockedByPincode && approvalStatus === 'pending');
  
  // To view wholesale or reseller prices, the buyer's account must be fully approved by the admin and not restricted.
  // Otherwise, they default to guest (D2C) pricing.
  const isApproved = approvalStatus === 'approved';
  
  let priceGroup = 'guest';
  if (isApproved && !isRestricted) {
    const profilePriceGroup = profile.price_group || profile.buyer_type;
    if (profilePriceGroup === 'reseller') {
      priceGroup = 'reseller';
    } else if (profilePriceGroup === 'wholesale') {
      priceGroup = 'wholesale';
    } else {
      priceGroup = buyerType;
    }
  }
  
  const canViewPrices = true;

  let message = '';
  if (approvalStatus === 'rejected') message = 'Your buyer account needs review. Showing prices.';
  if (approvalStatus === 'suspended') message = 'Price access is paused. Showing prices.';
  if (blockedByPincode && approvalStatus === 'pending') message = 'Your B2B account approval is pending. Showing prices.';

  return {
    isLoggedIn: true,
    canViewPrices,
    reason: isRestricted ? approvalStatus : (isApproved ? 'approved' : approvalStatus),
    message,
    buyerType,
    priceGroup,
    priceLabel: PRICE_GROUPS[priceGroup] || 'Price',
    approvalStatus,
    blockedByVaranasiPincode: blockedByPincode,
    userId: user.id || null,
    userEmail: user.email || null,
    buyerName: profile.business_name || profile.full_name || null,
    buyerPhone: profile.whatsapp || profile.whatsapp_number || null,
    buyerPincode: profile.pincode || null,
    resellerDashboardEnabled: Boolean(profile.reseller_dashboard_enabled),
  };
}

export function priceForBuyer(prices = {}, buyerAccess) {
  if (!buyerAccess || !buyerAccess.canViewPrices) return null;

  if (buyerAccess.priceGroup === 'guest') {
    return prices.single || 0;
  }

  if (buyerAccess.priceGroup === 'reseller') {
    // Reseller pricing → B2R column, fallback to B2B if B2R is missing
    return prices.b2r || prices.mrp || 0;
  }

  // Wholesale pricing → B2B column
  return prices.mrp || prices.offer || 0;
}

export function priceNoticeForAccess(buyerAccess) {
  return buyerAccess?.message || 'Login to view price';
}
