/**
 * Buyer Access Utilities
 * Purpose: Implements partner authentication & business permission rules.
 * Manages access for Customers (Hybrid Wholesale/Reseller pricing) and Artisan/Weaver Vendor Partners.
 */
export const PRICE_GROUPS = {
  vendor: 'Vendor Partner',
  customer: 'Hybrid Wholesale & Reseller',
  wholesale: 'Wholesale Price',
  reseller: 'Reseller Price',
  guest: 'Price',
};

const VARANASI_PINCODE_PREFIXES = ['221'];

export function normalizeBuyerType(value) {
  if (value === 'vendor') return 'vendor';
  return 'customer';
}

export function isVaranasiPincode(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return VARANASI_PINCODE_PREFIXES.some((prefix) => digits.startsWith(prefix));
}

export function applyAutoApprovalToBuyerProfile(profile) {
  const isVendor = profile?.buyer_subtype?.toLowerCase().includes('vendor') || profile?.buyer_type === 'vendor';
  const buyerType = isVendor ? 'vendor' : 'customer';
  const blockedByPincode = isVaranasiPincode(profile?.pincode);

  return {
    ...profile,
    buyer_type: buyerType,
    approval_status: blockedByPincode ? 'pending' : 'approved',
    price_group: blockedByPincode ? 'pending' : 'approved',
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
      buyerType: 'guest',
      priceGroup: 'guest',
      priceLabel: 'Price',
      approvalStatus: 'guest',
      userId: null,
      userEmail: null,
      buyerName: null,
      buyerPhone: null,
      buyerPincode: null,
      isVendor: false,
    };
  }

  const profile = buyerProfile || getBuyerProfileFromUser(user) || {};
  const isVendor = profile.buyer_subtype?.toLowerCase().includes('vendor') || profile.buyer_type === 'vendor';
  const buyerType = isVendor ? 'vendor' : 'customer';
  const approvalStatus = profile.approval_status || 'approved';
  
  // Geotargeting block check for Varanasi pincodes
  const blockedByPincode = isVaranasiPincode(profile.pincode);
  const isRestricted = approvalStatus === 'suspended' || approvalStatus === 'rejected' || (blockedByPincode && approvalStatus === 'pending');
  const isApproved = approvalStatus === 'approved' && !isRestricted;

  let message = '';
  if (approvalStatus === 'rejected') message = 'Your buyer account needs review. Showing prices.';
  if (approvalStatus === 'suspended') message = 'Price access is paused. Showing prices.';
  if (blockedByPincode && approvalStatus === 'pending') message = 'Your account approval is pending. Showing prices.';

  return {
    isLoggedIn: true,
    canViewPrices: true,
    reason: isRestricted ? approvalStatus : (isApproved ? 'approved' : approvalStatus),
    message,
    buyerType,
    isVendor,
    priceGroup: isApproved ? 'approved' : 'pending',
    priceLabel: 'Wholesale & Reseller',
    approvalStatus,
    blockedByVaranasiPincode: blockedByPincode,
    userId: user.id || null,
    userEmail: user.email || null,
    buyerName: profile.business_name || profile.full_name || null,
    buyerPhone: profile.whatsapp || profile.whatsapp_number || null,
    buyerPincode: profile.pincode || null,
    resellerDashboardEnabled: true,
  };
}

export function priceForBuyer(prices = {}, buyerAccess) {
  if (!buyerAccess || !buyerAccess.canViewPrices) return null;
  // Return wholesale price as standard base price; hybrid calculation computes reseller vs wholesale on quantity
  return prices.mrp || prices.offer || prices.b2r || prices.single || 0;
}

export function priceNoticeForAccess(buyerAccess) {
  return buyerAccess?.message || 'Login to view price';
}

