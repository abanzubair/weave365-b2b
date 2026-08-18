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
 * Used to resolve routes like /sarees into category filters.
 */
export const seoCategoryRoutes = {
  'sarees': 'Saree',
  'suits': 'Suit',
  'dupattas': 'Dupatta',
  'lehengas': 'Lehenga',
  'fabrics': 'Fabric',
  'under-999': 'Under 999',
  // Backward compatibility / legacy aliases:
  'saree': 'Saree',
  'suit': 'Suit',
  'dupatta': 'Dupatta',
  'lehenga': 'Lehenga',
  'fabric': 'Fabric',
  'banarasi-sarees': 'Saree',
  'banarasi-suits': 'Suit',
  'banarasi-lehengas': 'Lehenga',
  'banarasi-dupattas': 'Dupatta',
  'banarasi-fabrics': 'Fabric',
};

/**
 * Maps category names → SEO-friendly URL slugs.
 * Inverse of seoCategoryRoutes, used to build clean URLs during navigation.
 */
export const seoCategoryMap = {
  'saree': 'sarees',
  'sarees': 'sarees',
  'suit': 'suits',
  'suits': 'suits',
  'lehenga': 'lehengas',
  'lehengas': 'lehengas',
  'dupatta': 'dupattas',
  'dupattas': 'dupattas',
  'fabric': 'fabrics',
  'fabrics': 'fabrics',
  'under 999': 'under-999',
  'under-999': 'under-999',
};

/**
 * Resolves a category name to its canonical URL slug (e.g. 'Saree' -> 'sarees', 'Under 999' -> 'under-999').
 */
export function getCategorySlug(categoryName) {
  if (!categoryName) return '';
  const clean = String(categoryName).trim().toLowerCase();
  if (seoCategoryMap[clean]) {
    return seoCategoryMap[clean];
  }
  if (clean === 'all') return 'catalogue';
  if (clean.endsWith('s')) {
    return clean.replace(/\s+/g, '-');
  }
  return `${clean}s`.replace(/\s+/g, '-');
}

/**
 * Resolves a URL slug to its canonical category name (e.g. 'sarees' -> 'Saree', 'under-999' -> 'Under 999').
 */
export function getCategoryFromSlug(slug) {
  if (!slug) return null;
  const clean = String(slug).trim().toLowerCase();
  if (seoCategoryRoutes[clean]) {
    return seoCategoryRoutes[clean];
  }
  return null;
}

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
  'bulk-inquiry',
  'new-arrivals',
  'sourcing-partners',
  'white-label',
  'weaver-registration',
  'weaver-onboarding',
  'collaboration',
  'admin',
  'reseller-dashboard',
  'affiliate-program',
  'dropshipping',
  'resell-sarees-online',
  'handloom-vs-powerloom-guide',
  'custom-woven',
  'checkout',
  'sarees',
  'suits',
  'dupattas',
  'lehengas',
  'fabrics',
  'under-999',
  'banarasi-sarees',
  'banarasi-suits',
  'banarasi-dupattas',
  'banarasi-lehengas',
  'banarasi-fabrics',
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
  return slug;
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com';


