/**
 * @file sellerProductOptions.js
 * @description Centralized option lists for seller product uploads in Weave365.
 * Contains all categories, colors, fabrics, works, patterns, weaves, purity, types,
 * and suit-specific fabric breakdowns.
 */

export const PRODUCT_CATEGORIES = [
  { label: 'Saree', code: '1' },
  { label: 'Suit', code: '2' },
  { label: 'Dupatta', code: '3' },
  { label: 'Lehenga', code: '4' },
];

export const COLOR_OPTIONS = [
  'As on Image',
  'Beige',
  'Black',
  'Blue',
  'Brown',
  'Copper',
  'Cream',
  'Emerald Green',
  'Firozi',
  'Gold',
  'Green',
  'Grey',
  'Lavender',
  'Lemon',
  'Luna',
  'Magenta',
  'Maroon',
  'Mauve',
  'Multi Color',
  'Mustard',
  'Navy',
  'Off White',
  'Olive',
  'Orange',
  'Peach',
  'Pink',
  'Pistachio',
  'Purple',
  'Rani',
  'Red',
  'Sage Green',
  'Silver Blue',
  'Teal',
  'Turquoise',
  'Tussar',
  'Violet',
  'White',
  'Wine',
  'Yellow',
];

export const FABRIC_OPTIONS = [
  'Art Silk',
  'Chanderi Cotton',
  'Chanderi Silk',
  'Chiffon',
  'Chiniya Silk',
  'Chniya Chiffon',
  'Cotton',
  'Cotton Silk',
  'Dupion Silk',
  'Georgette',
  'Jute',
  'Katan Silk',
  'Katan Silk Satin',
  'Khadi Chiffon',
  'Kora Muslin',
  'Kora Organza',
  'Linen',
  'Mashru Silk',
  'Mercerized Cotton',
  'Muga Silk',
  'Pure Silk',
  'Satin Silk',
  'Soft Silk',
  'Supernet',
  'Taffeta Cotton',
  'Tissue',
  'Tussar Silk',
  'Viscose',
];

export const WORK_OPTIONS = [
  'Antique Zari',
  'Digital Print',
  'Embroidery',
  'Fekua',
  'Gold Zari',
  'Hand Print',
  'Kadwa',
  'Kalamkari',
  'Lace Work',
  'Plain',
  'Rangkat',
  'Resham',
  'Resham and Zari',
  'Silver Zari',
  'Water Zari',
  'Zari',
];

export const PATTERN_OPTIONS = [
  'Alfi Buta',
  'Alfi Jaal',
  'All-over',
  'Bandhani',
  'Brocade',
  'Buta',
  'Buti',
  'Checks',
  'Circles',
  'Crushed',
  'Designer',
  'Designer Blouse',
  'Designer Border',
  'Designer Anchal',
  'Diagonal Stripe',
  'Floral',
  'Geometrical',
  'Half and Half',
  'Jaal',
  'Jamavar',
  'Jamdani',
  'Kota Checks',
  'Kota Zari',
  'Lehariya',
  'Meenakari Border',
  'Meenakari Jaal',
  'Paisley',
  'Paithani',
  'Patola',
  'Plain',
  'Polka Dot',
  'Stripe',
  'Tanchoi',
  'Tie-dye',
  'Tilfi Jaal',
];

export const WEAVE_OPTIONS = [
  'Handloom',
  'Semi-Handloom',
  'Powerloom',
  'Pick & Pick',
  'Rapier',
];

export const PURITY_OPTIONS = [
  'Faux',
  'Blend',
  'Pure',
];

export const TYPE_OPTIONS = [
  'Dyeable',
  'Weaving',
  'Brush Print',
  'Hand Print',
];

/**
 * Conditional extra fields displayed only when Category === 'Suit'
 */
export const SUIT_TOP_FABRICS = [
  'Chanderi',
  'Cotton',
  'Cotton Silk',
  'Katan Silk',
  'Kota Check',
  'Mashru Silk',
  'Mercerized Cotton',
  'Organza',
  'Tissue Silk',
];

export const SUIT_BOTTOM_FABRICS = [
  'Chenderi',
  'Cotton',
  'Cotton Silk',
  'Katan Silk',
  'Mashru Silk',
  'Mercerized Cotton',
];

export const SUIT_DUPATTA_FABRICS = [
  'Chenderi',
  'Cotton',
  'Cotton Silk',
  'Katan Silk',
  'Kinkhab',
  'Kota Check',
  'Mashru Silk',
  'Masrise Cotton',
  'Organza',
  'Tissue Silk',
];

/**
 * Helper to get the 1-digit category code from category name
 */
export function getCategoryCode(categoryName = 'Saree') {
  const match = PRODUCT_CATEGORIES.find(
    (c) => c.label.toLowerCase() === String(categoryName).toLowerCase().trim()
  );
  return match ? match.code : '1';
}

/**
 * Helper to normalize vendor code into 2 digits (e.g. V02 -> "02", 2 -> "02", V15 -> "15")
 */
export function getVendorDigits(vendorCode = '') {
  if (!vendorCode) return '00';
  const digits = String(vendorCode).replace(/\D/g, '');
  if (!digits) return '00';
  return digits.padStart(2, '0').slice(-2);
}

/**
 * Formats a 6-digit base SKU given category, vendor digits, and 3-digit design number.
 * Example: generateBaseSku('Saree', 'V02', 1) => "102001"
 */
export function generateBaseSku(categoryName, vendorCode, designIndex = 1) {
  const catCode = getCategoryCode(categoryName);
  const venCode = getVendorDigits(vendorCode);
  const designStr = String(designIndex).padStart(3, '0').slice(-3);
  return `${catCode}${venCode}${designStr}`;
}
