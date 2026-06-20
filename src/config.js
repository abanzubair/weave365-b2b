/**
 * @file config.js
 * @description Core B2B Store and Spreadsheet Synchronization Configuration.
 * Defines Google Sheets CSV endpoints for real-time inventory updates, product taxonomies,
 * local service delivery constraints, fallback contact parameters, and administrative privileges.
 * 
 * @module config
 */

export const csvUrl =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRX1gaMx_CdSX-ozTHYarKfGNtsAsBTsvqvLoexBjR5FxEYiWVY3JlZKK6AD4g-KigjwOLOk5JvXDQ-/pub?gid=0&single=true&output=csv';

export const heroCsvUrl =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0sRjHxpdyuxJ6KsXmnEKnakC8ryFTDSSZozFRhfXPfI82PYYQqDlk2fNPBMptKit3hVXEAdxeagLq/pub?gid=0&single=true&output=csv';

export const configCsvUrl =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRX1gaMx_CdSX-ozTHYarKfGNtsAsBTsvqvLoexBjR5FxEYiWVY3JlZKK6AD4g-KigjwOLOk5JvXDQ-/pub?gid=2140935109&single=true&output=csv';


export const categoryCodes = {
  1: 'Saree',
  2: 'Suit',
  3: 'Dupatta',
  4: 'Lehenga',
  5: 'Fabric',
  6: 'Accessories',
};

export const serviceablePincodes = [
  '221001',
  '302001',
  '400001',
  '500001',
  '560001',
  '700001',
];

export const storeConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || 'Weave 365',
  subtitle: process.env.NEXT_PUBLIC_STORE_SUBTITLE || 'WHOLESALE',
  email: process.env.NEXT_PUBLIC_STORE_EMAIL || 'weave365@gmail.com',
  phone: process.env.NEXT_PUBLIC_STORE_PHONE || '9919101369',
  whatsapp: process.env.NEXT_PUBLIC_STORE_WHATSAPP || '9919101369',
  minimumOrderValue: Number(process.env.NEXT_PUBLIC_MIN_ORDER_VALUE || 10000),
  upiId: process.env.NEXT_PUBLIC_STORE_UPI || '9919101369@kotak',
};

export const adminEmails = String(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

/**
 * Maps SEO-friendly URL slugs → category names.
 * Used to resolve routes like /wholesale-banarasi-sarees into category filters.
 */
export const seoCategoryRoutes = {
  'wholesale-banarasi-sarees': 'Saree',
  'wholesale-banarasi-suits': 'Suit',
  'wholesale-banarasi-lehengas': 'Lehenga',
  'wholesale-banarasi-dupattas': 'Dupatta',
};

/**
 * Maps category names → SEO-friendly URL slugs.
 * Inverse of seoCategoryRoutes, used to build clean URLs during navigation.
 */
export const seoCategoryMap = {
  'saree': 'wholesale-banarasi-sarees',
  'sarees': 'wholesale-banarasi-sarees',
  'suit': 'wholesale-banarasi-suits',
  'suits': 'wholesale-banarasi-suits',
  'lehenga': 'wholesale-banarasi-lehengas',
  'lehengas': 'wholesale-banarasi-lehengas',
  'dupatta': 'wholesale-banarasi-dupattas',
  'dupattas': 'wholesale-banarasi-dupattas',
};

export const NON_PRODUCT_ROUTES = new Set([
  'home',
  'product',
  's',
  'partner',
  'blog',
  'order-tracking',
  'wholesale-catalogue',
  'catalogue',
  'contact',
  'about',
  'reviews',
  'early-access',
  'disclaimer',
  'shipping-delivery',
  'returns-cancellation',
  'privacy-security',
  'terms-conditions',
  'wholesale-partner-program',
  'bulk-inquiry',
  'new-arrivals',
  'sourcing-partners',
  'white-label-brands',
  'weaver-registration',
  'weaver-onboarding',
  'our-offerings',
  'admin',
  'reseller-dashboard'
]);

export function getProductCategorySlug(productId, productCategory = null) {
  if (!productId) return 'product';
  if (productCategory) {
    return productCategory.toLowerCase().trim();
  }
  const firstDigit = String(productId).trim().charAt(0);
  const catName = categoryCodes[firstDigit];
  return catName ? catName.toLowerCase().trim() : 'product';
}

