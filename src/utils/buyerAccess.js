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
  const userType = String(profile.user_type || '').toLowerCase().trim();
  return (
    type === 'vendor' ||
    type === 'partner' ||
    type === 'supplier' ||
    userType === 'supplier' ||
    subtype.includes('vendor') ||
    subtype.includes('weaver') ||
    subtype.includes('supplier')
  );
}

export function normalizeBuyerType(value, subtype) {
  if (isVendorProfile({ buyer_type: value, buyer_subtype: subtype })) return 'vendor';
  const val = String(value || '').toLowerCase().trim();
  const sub = String(subtype || '').toLowerCase().trim();
  if (val === 'business' || val === 'reseller' || val === 'wholesale' || (sub && sub !== 'customer' && sub !== 'user')) {
    return 'business';
  }
  return 'customer';
}

export function isVaranasiPincode(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return VARANASI_PINCODE_PREFIXES.some((prefix) => digits.startsWith(prefix));
}

export function applyAutoApprovalToBuyerProfile(profile) {
  if (!profile) return profile;
  const isVendor = isVendorProfile(profile);
  const isBusiness = !isVendor && (
    profile.user_type === 'business' ||
    profile.buyer_type === 'business' ||
    profile.buyer_type === 'reseller' ||
    profile.role === 'reseller' ||
    profile.role === 'business' ||
    (profile.buyer_subtype && !['customer', 'user', ''].includes(profile.buyer_subtype.toLowerCase().trim())) ||
    Boolean(profile.business_name?.trim())
  );

  const buyerType = isVendor ? 'vendor' : (isBusiness ? 'business' : 'customer');
  const role = isVendor ? 'vendor' : (isBusiness ? (profile?.role === 'admin' ? 'admin' : 'reseller') : (profile?.role === 'admin' ? 'admin' : 'customer'));
  const userType = isVendor ? 'supplier' : (isBusiness ? 'business' : 'customer');

  return {
    ...profile,
    user_type: profile.user_type || userType,
    buyer_type: buyerType,
    role: role,
    approval_status: 'approved',
    price_group: 'approved',
  };
}

export function detectAccountCategory(user, buyerProfile) {
  const p = buyerProfile || user?.user_metadata?.buyer_profile || user?.buyer_profile || {};
  const userType = String(p.user_type || user?.user_metadata?.user_type || '').toLowerCase().trim();
  const buyerType = String(p.buyer_type || '').toLowerCase().trim();
  const buyerSubtype = String(p.buyer_subtype || '').toLowerCase().trim();
  const role = String(p.role || user?.user_metadata?.role || '').toLowerCase().trim();

  // 1. Supplier / Vendor check
  if (
    userType === 'supplier' ||
    userType === 'vendor' ||
    buyerType === 'vendor' ||
    role === 'vendor' ||
    buyerSubtype.includes('vendor') ||
    buyerSubtype.includes('supplier') ||
    buyerSubtype.includes('weaver')
  ) {
    return 'supplier';
  }

  // 2. Business / Reseller check
  if (
    userType === 'business' ||
    userType === 'reseller' ||
    buyerSubtype === 'reseller' ||
    buyerSubtype === 'wholesaler' ||
    buyerSubtype === 'boutique' ||
    buyerSubtype === 'retail store' ||
    buyerSubtype === 'retail_store' ||
    buyerSubtype === 'exporter' ||
    buyerSubtype === 'importer' ||
    buyerSubtype === 'online store' ||
    buyerSubtype === 'online_store' ||
    buyerSubtype === 'designer' ||
    Boolean(p.business_name?.trim()) ||
    Boolean(p.qualification?.business_type)
  ) {
    return 'reseller';
  }

  // 3. Customer default
  return 'customer';
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
      approvalStatus: 'approved',
      userId: null,
      userEmail: null,
      buyerName: null,
      buyerPhone: null,
      buyerPincode: null,
      blockedByVaranasiPincode: false,
      isVendor: false,
      accountCategory: 'guest',
      isCustomer: false,
    };
  }

  const profile = buyerProfile || getBuyerProfileFromUser(user) || {};
  const isVendor = profile.buyer_subtype?.toLowerCase().includes('vendor') || profile.buyer_type === 'vendor';
  const buyerType = isVendor ? 'vendor' : 'customer';
  const blockedByPincode = Boolean(isVaranasiPincode(profile.pincode));
  const category = detectAccountCategory(user, profile);
  const isAdmin = user?.role === 'admin' || user?.user_metadata?.role === 'admin' || profile?.role === 'admin';
  const isCustomer = !isVendor && !isAdmin && category === 'customer';

  return {
    isLoggedIn: true,
    canViewPrices: true,
    reason: 'approved',
    message: '',
    buyerType,
    isVendor,
    priceGroup: 'approved',
    priceLabel: 'Wholesale & Reseller',
    approvalStatus: 'approved',
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
    accountCategory: category,
    isCustomer,
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

/**
 * Checks if a user's account is locked pending required profile completion.
 * Works dynamically without requiring an 'account_locked' column in the database:
 * 1. Checks explicit lock state stored in the qualification JSONB column (or profile object).
 * 2. If user is Business/Reseller or Supplier/Vendor, they MUST have completed the respective
 *    qualification/onboarding form; otherwise, the account is locked.
 */
export function isAccountLocked(profile, user) {
  if (!profile && !user) return false;
  const p = profile || user?.user_metadata?.buyer_profile || user?.buyer_profile || {};
  const qual = (typeof p.qualification === 'object' && p.qualification) ? p.qualification : (user?.user_metadata?.qualification || {});

  // 1. Explicit lock flag in qualification JSONB or on profile object
  if (qual.account_locked === true || p.account_locked === true || p.is_locked === true) {
    return true;
  }

  // 2. Identify account role
  const userType = String(p.user_type || user?.user_metadata?.user_type || '').toLowerCase().trim();
  const role = String(p.role || user?.user_metadata?.role || '').toLowerCase().trim();
  const buyerType = String(p.buyer_type || '').toLowerCase().trim();
  const buyerSubtype = String(p.buyer_subtype || '').toLowerCase().trim();

  const isVendor = userType === 'supplier' || userType === 'vendor' || role === 'vendor' || buyerType === 'vendor' || buyerSubtype.includes('vendor') || buyerSubtype.includes('supplier');
  const isReseller = userType === 'business' || userType === 'reseller' || role === 'reseller' || buyerType === 'business' || buyerSubtype.includes('reseller');

  // 3. For Business/Reseller: account is locked unless the business account form is complete
  if (isReseller) {
    if (!isCategoryDetailsComplete(p, 'reseller')) {
      return true;
    }
  }

  // 4. For Supplier Partners: account is locked unless supplier onboarding is complete
  if (isVendor) {
    if (!isCategoryDetailsComplete(p, 'supplier')) {
      return true;
    }
  }

  // 5. If explicit unlock was set AND requirements are fulfilled
  if (qual.account_locked === false || p.account_locked === false) {
    return false;
  }

  return false;
}

/**
 * Validates if the required profile details for a given category are filled.
 * For Business / Reseller accounts, this verifies that the business account form has been completed.
 */
export function isCategoryDetailsComplete(profile, category = 'customer') {
  if (!profile) return false;
  const fullName = String(profile.full_name || profile.contact_person || '').trim();
  const rawPhone = String(profile.whatsapp_number || profile.whatsapp || profile.phone || '').replace(/\D/g, '');
  const city = String(profile.city || profile.location_city || '').trim();
  const pincode = String(profile.pincode || '').replace(/[^a-zA-Z0-9\s-]/g, '').trim();

  // Basic required contact information for all accounts
  if (!fullName || rawPhone.length < 6 || !city || pincode.length < 3) {
    return false;
  }

  const qual = (typeof profile.qualification === 'object' && profile.qualification) ? profile.qualification : {};

  // Business & Reseller specific requirements:
  // Must have completed the business account form:
  // - business name
  // - business type (from qualification)
  // - sourcing questions (monthly budget or sales channels or explicit form_completed flag)
  if (category === 'reseller' || category === 'business') {
    const businessName = String(profile.business_name || qual.business_name || '').trim();
    const businessType = String(qual.business_type || '').trim();
    const monthlyBudget = String(qual.monthly_budget || '').trim();
    const salesChannels = Array.isArray(qual.sales_channels)
      ? qual.sales_channels
      : (qual.sales_channels ? [qual.sales_channels] : []);
    const formCompleted = Boolean(qual.form_completed === true);

    if (formCompleted && businessName) {
      return true;
    }

    if (!businessName || !businessType || (!monthlyBudget && salesChannels.length === 0)) {
      return false;
    }
  }

  // Supplier Partner specific requirements:
  if (category === 'supplier' || category === 'vendor') {
    const businessName = String(profile.business_name || qual.business_name || qual.supplierBusinessName || '').trim();
    const supplierType = String(qual.business_type || qual.supplierBusinessType || '').trim();
    const formCompleted = Boolean(qual.form_completed === true);

    if (formCompleted && businessName) {
      return true;
    }

    if (!businessName || !supplierType || supplierType.toLowerCase() === 'supplier' || supplierType.toLowerCase() === 'customer') {
      return false;
    }
  }

  return true;
}

