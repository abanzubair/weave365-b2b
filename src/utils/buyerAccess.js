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

export function isVendorProfile(profile) {
  if (!profile) return false;
  const type = String(profile.buyer_type || '').toLowerCase().trim();
  const subtype = String(profile.buyer_subtype || '').toLowerCase().trim();
  return type === 'vendor' || type === 'partner' || subtype.includes('vendor') || subtype.includes('weaver');
}

export function normalizeBuyerType(value, subtype) {
  if (isVendorProfile({ buyer_type: value, buyer_subtype: subtype })) return 'vendor';
  return 'customer';
}

export function isVaranasiPincode(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return VARANASI_PINCODE_PREFIXES.some((prefix) => digits.startsWith(prefix));
}

export function isProfileComplete(user, buyerProfile) {
  if (!user) return false;
  const profile = buyerProfile || user.user_metadata?.buyer_profile || user.buyer_profile;
  if (!profile) return false;

  const fullName = String(
    profile.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    ''
  ).trim();
  const whatsapp = String(profile.whatsapp_number || profile.whatsapp || '').replace(/\D/g, '').slice(-10);
  const city = String(profile.city || '').trim();
  const pincode = String(profile.pincode || '').replace(/\D/g, '').slice(0, 6);

  if (!fullName || whatsapp.length !== 10 || !city || pincode.length !== 6) {
    return false;
  }

  return true;
}

export function applyAutoApprovalToBuyerProfile(profile) {
  const isVendor = isVendorProfile(profile);
  const buyerType = isVendor ? 'vendor' : 'customer';
  const role = isVendor ? 'vendor' : (profile?.role || 'customer');
  const blockedByPincode = isVaranasiPincode(profile?.pincode);
  const cleanPhone = String(profile?.whatsapp_number || profile?.whatsapp || '').replace(/\D/g, '').slice(-10);
  const cleanPincode = String(profile?.pincode || '').replace(/\D/g, '').slice(0, 6);
  const isComplete = Boolean(cleanPhone.length === 10 && cleanPincode.length === 6 && (profile?.city || '').trim());

  const status = !isComplete ? 'incomplete' : (blockedByPincode ? 'pending' : 'approved');

  return {
    ...profile,
    buyer_type: buyerType,
    role: role,
    approval_status: status,
    price_group: status === 'approved' ? 'approved' : 'pending',
  };
}

export function getBuyerProfileFromUser(user) {
  return user?.user_metadata?.buyer_profile || user?.buyer_profile || null;
}

export function getBuyerAccess(user, buyerProfile) {
  if (!user) {
    return {
      isLoggedIn: false,
      isProfileComplete: false,
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
  const isComplete = isProfileComplete(user, profile);

  if (!isComplete) {
    return {
      isLoggedIn: false,
      isProfileComplete: false,
      canViewPrices: false,
      reason: 'incomplete_profile',
      message: 'Please complete your registration form to activate wholesale pricing.',
      buyerType: 'guest',
      priceGroup: 'guest',
      priceLabel: 'Price',
      approvalStatus: 'incomplete',
      userId: user.id || null,
      userEmail: user.email || null,
      buyerName: null,
      buyerPhone: null,
      buyerPincode: null,
      isVendor: false,
      resellerDashboardEnabled: false,
    };
  }

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
    isProfileComplete: true,
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
    resellerDashboardEnabled: Boolean(
      profile.reseller_dashboard_enabled === true ||
      user?.user_metadata?.reseller_dashboard_enabled === true ||
      user?.user_metadata?.buyer_profile?.reseller_dashboard_enabled === true
    ),
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

