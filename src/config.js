/**
 * @file config.js
 * @description Core B2B Store and Spreadsheet Synchronization Configuration.
 * Defines Google Sheets CSV endpoints for real-time inventory updates, product taxonomies,
 * local service delivery constraints, fallback contact parameters, and administrative privileges.
 * 
 * @module config
 */

export const csvUrl = process.env.GOOGLE_SHEET_PRODUCTS_URL;

export const heroCsvUrl = process.env.GOOGLE_SHEET_HERO_URL;

export const configCsvUrl = process.env.GOOGLE_SHEET_CONFIG_URL;

/**
 * Category-specific Google Sheets CSV endpoints.
 * Products from these sheets are fetched in parallel and merged into
 * the main product list. Add new entries here as you create new category tabs.
 * The key must match the Category column value expected for those products.
 */
export const categoryCsvUrls = {
  'Under 999': process.env.GOOGLE_SHEET_UNDER_999_URL,
  'Suit': process.env.GOOGLE_SHEET_SUIT_URL,
  // Add more category sheets as you create them:
  // 'Dupatta': '...',
};


export const categoryCodes = {
  1: 'Saree',
  2: 'Suit',
  3: 'Dupatta',
  4: 'Lehenga',
  5: 'Fabric',
  6: 'Under 999',
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
  'wholesale-banarasi-fabrics': 'Fabric',
  'wholesale-under-999': 'Under 999',
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
  'fabric': 'wholesale-banarasi-fabrics',
  'fabrics': 'wholesale-banarasi-fabrics',
  'under 999': 'wholesale-under-999',
  'under-999': 'wholesale-under-999',
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
  let catName = 'product';
  if (productCategory) {
    catName = productCategory.toLowerCase().trim();
  } else {
    const firstDigit = String(productId).trim().charAt(0);
    const resolvedName = categoryCodes[firstDigit];
    if (resolvedName) {
      catName = resolvedName.toLowerCase().trim();
    }
  }
  const slug = catName.replace(/\s+/g, '-');
  if (slug === 'under-999') return 'wholesale-under-999';
  return slug;
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com';


