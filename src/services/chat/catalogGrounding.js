/**
 * @file catalogGrounding.js
 * @description Live catalog grounding for text and visual search in the Weave 365 AI Concierge.
 * Edge-safe (no Node-only fs/Buffer dependencies).
 */

import { getProductCategorySlug } from '../../config.js';
import { DEFAULT_BASELINE_RATES } from '../../constants/currencyRates.js';
import { getOptimizedImageUrl, getOriginalImageUrl } from '../../utils/imageOptimizer.js';
import {
  generateChatReply as defaultGenerateChatReply,
  embedMultimodalContent as defaultEmbedMultimodalContent,
} from './geminiClient.js';
import { buildWhatsAppHandoffUrl } from '../../data/chatbotKnowledgeBase.js';

export const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const IMAGE_FETCH_TIMEOUT_MS = 4500;
export const MAX_CANDIDATE_IMAGE_BYTES = 1024 * 1024; // 1MB per candidate reference image

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

let catalogCache = null;

export function _clearCatalogGroundingCacheForTesting() {
  catalogCache = null;
}

export function _setCatalogGroundingProductsForTesting(products) {
  catalogCache = Array.isArray(products)
    ? { products, timestamp: Date.now() }
    : null;
}

/**
 * Derives verified fabricLabel strictly from product.purity / product.fabric / product.type.
 * Never guesses "Pure" when the underlying fields don't explicitly confirm it.
 * @param {Object} product
 * @returns {'Pure'|'Blend'|'Faux'|null}
 */
export function deriveFabricLabel(product) {
  if (!product || typeof product !== 'object') return null;

  const purity = String(product.purity || '').trim();
  const fabric = String(product.fabric || '').trim();
  const type = String(product.type || '').trim();

  // 1. Authoritative purity column takes priority
  if (purity) {
    if (/\bpure\b/i.test(purity)) return 'Pure';
    if (/\bblend\b|\bsemi\b|\bmix\b/i.test(purity)) return 'Blend';
    if (/\bfaux\b|\bart\b|\bsynthetic\b/i.test(purity)) return 'Faux';
  }

  // 2. Explicit fabric/type classification when purity is absent
  const combined = `${fabric} ${type}`.trim();
  if (!combined) return null;

  if (/\bfaux\b|\bart[\s-]*silk\b|\bsynthetic\b|\bpolyester\b/i.test(combined)) {
    return 'Faux';
  }
  if (/\bblend\b|\bsemi[\s-]*silk\b|\bcotton[\s-]*silk\b|\bsilk[\s-]*linen\b|\bmashru\b|\bchanderi\s+silk\b/i.test(combined)) {
    return 'Blend';
  }
  if (/\bpure\b/i.test(combined)) {
    return 'Pure';
  }

  return null;
}

function applyStockOverrides(products, stockRows) {
  if (!Array.isArray(products) || !Array.isArray(stockRows) || stockRows.length === 0) {
    return products;
  }
  const map = new Map();
  for (const row of stockRows) {
    if (row?.product_id) {
      map.set(String(row.product_id).trim(), row);
    }
  }
  return products.map((product) => {
    const key = String(product.id || product.groupKey || '').trim();
    const override = map.get(key);

    const updatedVariants = Array.isArray(product.variants)
      ? product.variants.map((v) => {
          const vCode = String(v?.code || v?.sku || '').trim();
          const vOverride = vCode ? map.get(vCode) : null;
          if (!vOverride) return v;
          const vStatus = vOverride.stock_status;
          return {
            ...v,
            stockStatus: vStatus,
            isOutOfStock: vStatus === 'out-of-stock',
            isArchived: vStatus === 'archived' || Boolean(v?.isArchived),
          };
        })
      : product.variants;

    if (!override) {
      return updatedVariants !== product.variants ? { ...product, variants: updatedVariants } : product;
    }

    const stockKey = override.stock_status;
    const stockLabel = override.stock_status_label;
    const isArchived = stockKey === 'archived' || Boolean(product.isArchived);
    return {
      ...product,
      variants: updatedVariants,
      stockStatusOverride: stockKey,
      stockStatusLabel: stockLabel,
      isOutOfStock: stockKey === 'out-of-stock',
      isReadyStock: stockKey === 'ready-stock',
      isPreOrder: stockKey === 'pre-order',
      isBackSoon: stockKey === 'back-soon',
      isArchived,
    };
  });
}

function transformSellerProduct(sp) {
  if (!sp || !sp.sku) return null;
  const baseSku = String(sp.sku);
  const colors = Array.isArray(sp.colors) ? sp.colors : [];
  const images = Array.isArray(sp.images) ? sp.images : [];
  const coverImage = sp.cover_image || images[0] || '';
  const variants = colors.map((c, idx) => ({
    code: c.sku || `${baseSku}-${idx + 1}`,
    color: c.color || '',
    image: c.image_url || coverImage,
    prices: {
      mrp: sp.wholesale_price || null,
      b2r: null,
      single: null,
    },
  }));

  return {
    id: baseSku,
    groupKey: baseSku,
    category: sp.category || 'Saree',
    fabric: sp.fabric || '',
    work: sp.work || '',
    pattern: sp.pattern || '',
    weave: sp.weave || '',
    purity: sp.purity || '',
    type: sp.type || '',
    title: sp.title || `${sp.fabric || ''} ${sp.work || ''} ${sp.category || 'Saree'}`.replace(/\s+/g, ' ').trim(),
    images: images.length ? images : (coverImage ? [coverImage] : []),
    cover: coverImage,
    variants,
    colors: colors.map((c) => c.color).filter(Boolean),
    price: Number(sp.wholesale_price || 0) || null,
    mrp: Number(sp.wholesale_price || 0) || null,
    isReadyStock: true,
    isOutOfStock: false,
    isArchived: false,
  };
}

/**
 * Normalizes any raw catalog product into the grounded API response card shape.
 * @param {Object} product
 */
export function normalizeCatalogProduct(product) {
  if (!product || typeof product !== 'object') return null;
  const id = String(product.id || product.groupKey || '').trim();
  if (!id) return null;

  const firstPrices = product.variants?.[0]?.prices || {};
  const wholesaleRaw = Number(firstPrices.mrp || product.mrp || product.price || product.base_price || 0);
  const resellerRaw = Number(firstPrices.b2r || product.reseller_price || wholesaleRaw || 0);
  const priceInr = wholesaleRaw > 0 ? wholesaleRaw : (resellerRaw > 0 ? resellerRaw : null);

  const primaryImage =
    product.cover ||
    (Array.isArray(product.images) && product.images[0]) ||
    product.variants?.[0]?.image ||
    product.colorOptions?.[0]?.image ||
    '';

  const isArchived = Boolean(product.isArchived || product.stockStatusOverride === 'archived');
  const isOutOfStock = Boolean(
    isArchived ||
    product.isOutOfStock ||
    product.stockStatusOverride === 'out-of-stock' ||
    (typeof product.quantity === 'number' && product.quantity <= 0)
  );

  const category = String(product.category || 'Saree').trim();
  const slug = getProductCategorySlug(id, category);

  const normalizedVariants = Array.isArray(product.variants)
    ? product.variants.map((v) => {
        const vStatus = String(v?.stockStatus || '').trim();
        const vOutOfStock = Boolean(
          v?.isOutOfStock ||
          v?.isArchived ||
          vStatus === 'out-of-stock' ||
          vStatus === 'archived' ||
          (typeof v?.quantity === 'number' && v.quantity <= 0)
        );
        const vPrices = v?.prices || {};
        const vWholesale = Number(vPrices.mrp || v?.mrp || v?.price || 0);
        const vReseller = Number(vPrices.b2r || v?.reseller_price || vWholesale || 0);
        const vPriceInr = vWholesale > 0 ? vWholesale : (vReseller > 0 ? vReseller : priceInr);
        return {
          code: String(v?.code || v?.sku || '').trim(),
          color: String(v?.color || '').trim(),
          image: String(v?.image || '').trim(),
          prices: vPrices,
          priceInr: vPriceInr,
          stockStatus: vStatus || (vOutOfStock ? 'out-of-stock' : 'ready-stock'),
          isOutOfStock: vOutOfStock,
          isArchived: Boolean(v?.isArchived || vStatus === 'archived'),
          quantity: typeof v?.quantity === 'number' ? v.quantity : null,
        };
      })
    : [];

  return {
    id,
    title: String(product.title || product.name || id).trim(),
    url: `/${slug}/${encodeURIComponent(id)}`,
    image: String(primaryImage || '').trim(),
    price: priceInr,
    priceInr,
    wholesalePriceInr: wholesaleRaw > 0 ? wholesaleRaw : priceInr,
    resellerPriceInr: resellerRaw > 0 ? resellerRaw : priceInr,
    fabricLabel: deriveFabricLabel(product),
    fabric: String(product.fabric || '').trim(),
    weave: String(product.weave || '').trim(),
    work: String(product.work || '').trim(),
    pattern: String(product.pattern || '').trim(),
    category,
    colors: Array.isArray(product.colors)
      ? product.colors.filter(Boolean)
      : (Array.isArray(product.colorOptions) ? product.colorOptions.map((c) => c.name).filter(Boolean) : []),
    variants: normalizedVariants,
    inStock: !isOutOfStock,
    stockStatus: product.stockStatusOverride || (isOutOfStock ? 'out-of-stock' : 'ready-stock'),
    isArchived,
  };
}

/**
 * Formats a normalized product into a compact card suitable for chat JSON output.
 */
export function toChatProductCard(normalizedProduct) {
  if (!normalizedProduct) return null;
  return {
    id: normalizedProduct.id,
    title: normalizedProduct.title,
    url: normalizedProduct.url,
    image: normalizedProduct.image,
    price: normalizedProduct.price,
    priceInr: normalizedProduct.priceInr,
    fabricLabel: normalizedProduct.fabricLabel,
    colorName: normalizedProduct.colorName || null,
    inStock: Boolean(normalizedProduct.inStock),
  };
}

async function getDefaultSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key);
}

/**
 * Loads and caches the live Weave 365 product catalog from Supabase for 5 minutes.
 * Matches catalogHandler.js (sheet_data products_json + vendor_product_stock + approved seller_products).
 */
export async function loadLiveCatalog({ supabase, forceRefresh = false, catalogOverride = null } = {}) {
  if (Array.isArray(catalogOverride)) {
    return catalogOverride.map(normalizeCatalogProduct).filter(Boolean);
  }

  const now = Date.now();
  if (!forceRefresh && catalogCache && now - catalogCache.timestamp < CATALOG_CACHE_TTL_MS) {
    return catalogCache.products;
  }

  const client = supabase || (await getDefaultSupabaseClient());
  if (!client) {
    return catalogCache?.products || [];
  }

  try {
    const [sheetRes, stockRes, sellerRes] = await Promise.all([
      client.from('sheet_data').select('csv_data').eq('id', 'products_json').single(),
      client.from('vendor_product_stock').select('*'),
      client.from('seller_products').select('*').eq('status', 'approved'),
    ]);

    let products = [];
    try {
      const raw = sheetRes?.data?.csv_data;
      products = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []);
    } catch {
      products = [];
    }

    if (Array.isArray(stockRes?.data) && stockRes.data.length > 0) {
      products = applyStockOverrides(products, stockRes.data);
    }

    if (Array.isArray(sellerRes?.data) && sellerRes.data.length > 0) {
      const mappedSeller = sellerRes.data.map(transformSellerProduct).filter(Boolean);
      products = [...mappedSeller, ...products];
    }

    const normalized = products.map(normalizeCatalogProduct).filter(Boolean);
    catalogCache = {
      products: normalized,
      timestamp: now,
    };
    return normalized;
  } catch (err) {
    console.warn('[catalogGrounding] Failed to load live catalog:', err?.message || err);
    return catalogCache?.products || [];
  }
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'for', 'and', 'or', 'of', 'in', 'to', 'with', 'show', 'me',
  'find', 'looking', 'want', 'need', 'do', 'you', 'have', 'any', 'price', 'rate',
  'rates', 'cost', 'how', 'much', 'what', 'is', 'are', 'can', 'i', 'buy', 'please',
  'under', 'below', 'above', 'over', 'less', 'more', 'than', 'between', 'from',
  'within', 'max', 'min', 'minimum', 'maximum', 'least', 'starting', 'upto',
  'best', 'good', 'available', 'stock', 'pieces', 'pcs', 'piece', 'anything',
  'something', 'everything', 'nothing', 'else', 'other', 'another', 'options',
  'option', 'items', 'item', 'products', 'product', 'collections', 'collection',
  'ones', 'one', 'which', 'tell', 'about', 'around', 'near', 'roughly', 'approx',
  'approximately', 'range', 'budget', 'expensive', 'cheapest', 'lowest', 'highest',
  'costliest', 'luxury', 'premium', 'affordable', 'friendly', 'inr', 'usd', 'gbp',
  'eur', 'aed', 'qar', 'cad', 'aud', 'sgd', 'sar', 'rs',
]);

const CURRENCY_TOKEN_PATTERNS = [
  { code: 'CAD', regex: /\bCAD\b|CA\$|C\$/i },
  { code: 'AUD', regex: /\bAUD\b|A\$/i },
  { code: 'SGD', regex: /\bSGD\b|S\$/i },
  { code: 'USD', regex: /\bUSD\b|US\$|\$/i },
  { code: 'INR', regex: /₹|\bINR\b|\bRs\.?(?=\s*\d|\b)/i },
  { code: 'GBP', regex: /£|\bGBP\b/i },
  { code: 'EUR', regex: /€|\bEUR\b/i },
  { code: 'AED', regex: /\bAED\b/i },
  { code: 'QAR', regex: /\bQAR\b/i },
  { code: 'SAR', regex: /\bSAR\b/i },
];

const CATEGORY_SYNONYMS = [
  { category: 'Saree', regex: /\bsarees?\b/i, keyword: 'saree' },
  { category: 'Suit', regex: /\bsuits?\b|\bsalwar\b|\bun[\s-]*stitched\b/i, keyword: 'suit' },
  { category: 'Dupatta', regex: /\bdupattas?\b|\bodhani\b/i, keyword: 'dupatta' },
  { category: 'Lehenga', regex: /\blehengas?\b/i, keyword: 'lehenga' },
];

const FABRIC_PURITY_SYNONYMS = [
  { label: 'Pure', regex: /\bpure\b/i, keyword: 'pure' },
  { label: 'Blend', regex: /\bblend\b|\bsemi[\s-]*silk\b/i, keyword: 'blend' },
  { label: 'Faux', regex: /\bfaux\b|\bart[\s-]*silk\b/i, keyword: 'faux' },
];

const COLOR_KEYWORDS = [
  'red', 'maroon', 'crimson', 'pink', 'rani', 'magenta', 'blue', 'navy',
  'firozi', 'turquoise', 'teal', 'green', 'emerald', 'sage', 'olive',
  'yellow', 'mustard', 'lemon', 'gold', 'golden', 'silver', 'copper',
  'white', 'ivory', 'cream', 'beige', 'off-white', 'black', 'purple',
  'lavender', 'mauve', 'violet', 'wine', 'peach', 'orange', 'brown',
  'grey', 'gray', 'pastel', 'multicolor', 'multi',
];

const DESCRIPTIVE_STYLE_TOKENS = new Set([
  ...COLOR_KEYWORDS,
  'bridal', 'wedding', 'heavy', 'festive', 'party', 'reception', 'occasion',
  'zari', 'jaal', 'jangla', 'buti', 'buta', 'floral', 'paisley', 'meenakari',
  'kadhwa', 'kadwa', 'tanchoi', 'brocade', 'cutwork', 'bandhani', 'jamdani',
  'paithani', 'patola', 'lehariya', 'stripes', 'checks', 'border', 'pallu',
  'katan', 'organza', 'kora', 'georgette', 'khaddi', 'tissue', 'chiffon',
  'chanderi', 'cotton', 'linen', 'mashru', 'tussar', 'muga', 'dupion',
  'satin', 'viscose', 'handloom', 'powerloom', 'semi-handloom', 'silk',
  'embroidery', 'embroidered', 'woven', 'weave', 'motif', 'motifs', 'design',
  'pattern', 'drape', 'shine', 'sheer', 'rich', 'intricate', 'lightweight',
]);

function normalizePriceNumberStrings(text) {
  let out = String(text || '');
  // Strip commas inside numbers: 10,000 -> 10000
  out = out.replace(/(\d),(?=\d{3}\b)/g, '$1');
  // Expand k shorthand attached to numbers: 10k -> 10000, 2.5k -> 2500
  out = out.replace(/(\d+(?:\.\d+)?)\s*k\b/gi, (_, num) => {
    const val = Number(num) * 1000;
    return Number.isFinite(val) ? String(Math.round(val * 100) / 100) : num;
  });
  return out;
}

function buildCurrencyConversionForCode(currencyCode, currencyContext) {
  const ctxCurr = String(currencyContext?.currency || 'INR').trim().toUpperCase() || 'INR';
  const target = String(currencyCode || ctxCurr).trim().toUpperCase() || 'INR';

  if (target === 'INR') {
    return { currency: 'INR', exchangeRate: 1, markupPercent: 0 };
  }
  if (target === ctxCurr) {
    const r = Number(currencyContext?.exchangeRate);
    const m = Number(currencyContext?.markupPercent);
    return {
      currency: target,
      exchangeRate: Number.isFinite(r) && r > 0 ? r : Number(DEFAULT_BASELINE_RATES[target] || 1),
      markupPercent: Number.isFinite(m) && m >= 0 ? m : 0,
    };
  }
  const baseline = Number(DEFAULT_BASELINE_RATES[target] || 0);
  return {
    currency: baseline > 0 ? target : 'INR',
    exchangeRate: baseline > 0 ? baseline : 1,
    markupPercent: 0,
  };
}

function resolveCurrencyConversion(normalizedText, currencyContext) {
  let explicitCurrency = null;
  for (const entry of CURRENCY_TOKEN_PATTERNS) {
    if (entry.regex.test(normalizedText)) {
      explicitCurrency = entry.code;
      break;
    }
  }
  return buildCurrencyConversionForCode(explicitCurrency, currencyContext);
}

function convertDisplayPriceToBaseInr(amount, { currency, exchangeRate, markupPercent }) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return null;
  if (currency === 'INR' || !exchangeRate || exchangeRate <= 0) {
    return Math.round(num * 100) / 100;
  }
  const divisor = exchangeRate * (1 + (markupPercent || 0) / 100);
  if (divisor <= 0) return null;
  return Math.round((num / divisor) * 100) / 100;
}

function convertBaseInrToDisplayPrice(baseInr, { currency, exchangeRate, markupPercent }) {
  const num = Number(baseInr);
  if (!Number.isFinite(num) || num <= 0) return null;
  if (currency === 'INR' || !exchangeRate || exchangeRate <= 0) {
    return Math.round(num);
  }
  const converted = num * (1 + (markupPercent || 0) / 100) * exchangeRate;
  return Math.round(converted * 100) / 100;
}

const PRICE_TOKEN_PATTERN = '(?:₹|US\\$|CA\\$|A\\$|S\\$|C\\$|Rs\\.?|INR|USD|GBP|EUR|AED|QAR|CAD|AUD|SGD|SAR|£|€|\\$)?\\s*(\\d+(?:\\.\\d+)?)';

/**
 * Parses currency-aware price bounds, sort intent, category, fabric purity, and descriptive tokens from a query.
 * @param {string} query
 * @param {{ currencyContext?: { currency?: string, exchangeRate?: number, markupPercent?: number } }} [options]
 */
export function parseCatalogQueryFilters(query, { currencyContext } = {}) {
  const normalized = normalizePriceNumberStrings(query);
  const lower = normalized.toLowerCase();
  const conversion = resolveCurrencyConversion(normalized, currencyContext);

  let minPriceLocal = null;
  let maxPriceLocal = null;

  // 1. Range patterns: "between X and Y", "from X to Y", or "X to Y" / "X - Y"
  const betweenRe = new RegExp(`(?:between|from)\\s*${PRICE_TOKEN_PATTERN}\\s*(?:and|to|-|–)\\s*${PRICE_TOKEN_PATTERN}`, 'i');
  const betweenMatch = normalized.match(betweenRe);
  if (betweenMatch) {
    const v1 = Number(betweenMatch[1]);
    const v2 = Number(betweenMatch[2]);
    if (Number.isFinite(v1) && Number.isFinite(v2)) {
      minPriceLocal = Math.min(v1, v2);
      maxPriceLocal = Math.max(v1, v2);
    }
  } else {
    const dashRangeRe = new RegExp(`${PRICE_TOKEN_PATTERN}\\s*(?:to|–|-)\\s*${PRICE_TOKEN_PATTERN}`, 'i');
    const dashMatch = normalized.match(dashRangeRe);
    if (dashMatch) {
      const v1 = Number(dashMatch[1]);
      const v2 = Number(dashMatch[2]);
      const hasCurrency = /[$₹£€]|USD|INR|Rs|GBP|EUR|AED|QAR|CAD|AUD|SGD|SAR/i.test(dashMatch[0]);
      // Guard against SKU patterns like "101001-1"
      const looksLikeSku = !hasCurrency && v1 >= 1000 && v2 < 50;
      if (!looksLikeSku && Number.isFinite(v1) && Number.isFinite(v2) && v1 < v2) {
        minPriceLocal = v1;
        maxPriceLocal = v2;
      }
    }
  }

  // 2. Minimum price patterns: "above 10000", "over $100", "10000+"
  if (minPriceLocal === null) {
    const minRe = new RegExp(`(?:above|over|more\\s+than|greater\\s+than|min(?:imum)?|at\\s+least|starting\\s+(?:at|from)|>=?)\\s*${PRICE_TOKEN_PATTERN}`, 'i');
    const minMatch = normalized.match(minRe);
    if (minMatch) {
      const v = Number(minMatch[1]);
      if (Number.isFinite(v) && v > 0) minPriceLocal = v;
    } else {
      const plusRe = new RegExp(`${PRICE_TOKEN_PATTERN}\\s*\\+`, 'i');
      const plusMatch = normalized.match(plusRe);
      if (plusMatch) {
        const v = Number(plusMatch[1]);
        if (Number.isFinite(v) && v > 0) minPriceLocal = v;
      }
    }
  }

  // 3. Maximum price patterns: "under 2000", "below $30", "within 5000"
  if (maxPriceLocal === null) {
    const maxRe = new RegExp(`(?:under|below|less\\s+than|within|max(?:imum)?|up\\s+to|upto|<=?)\\s*${PRICE_TOKEN_PATTERN}`, 'i');
    const maxMatch = normalized.match(maxRe);
    if (maxMatch) {
      const v = Number(maxMatch[1]);
      if (Number.isFinite(v) && v > 0) maxPriceLocal = v;
    }
  }

  const minPriceInr = minPriceLocal !== null ? convertDisplayPriceToBaseInr(minPriceLocal, conversion) : null;
  const maxPriceInr = maxPriceLocal !== null ? convertDisplayPriceToBaseInr(maxPriceLocal, conversion) : null;

  // 4. Sort intent
  let sort = null;
  if (/(?:cheapest|lowest(?:\s+price)?|most\s+affordable|budget(?:\s+friendly)?|low\s+to\s+high|cheaper)/i.test(lower)) {
    sort = 'price_asc';
  } else if (/(?:most\s+expensive|expensive|costliest|highest(?:\s+price)?|luxury|premium|high\s+to\s+low|pricier)/i.test(lower)) {
    sort = 'price_desc';
  }

  // 5. Category & fabric purity synonyms
  let category = null;
  for (const cat of CATEGORY_SYNONYMS) {
    if (cat.regex.test(lower)) {
      category = cat.category;
      break;
    }
  }

  let fabricLabel = null;
  for (const fab of FABRIC_PURITY_SYNONYMS) {
    if (fab.regex.test(lower)) {
      fabricLabel = fab.label;
      break;
    }
  }

  const hasStructuredFilters = Boolean(
    minPriceInr !== null || maxPriceInr !== null || sort || category
  );

  return {
    normalizedQuery: normalized,
    currency: conversion.currency,
    exchangeRate: conversion.exchangeRate,
    markupPercent: conversion.markupPercent,
    minPriceLocal,
    maxPriceLocal,
    minPriceInr,
    maxPriceInr,
    sort,
    category,
    fabricLabel,
    hasStructuredFilters,
  };
}

function extractSearchTokens(query) {
  return String(query || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !/^\d+$/.test(t) && !STOP_WORDS.has(t));
}

function matchesProductFilters(p, filters) {
  if (!p || p.isArchived || !p.inStock) return false;
  if (filters.minPriceInr !== null) {
    if (p.priceInr === null || p.priceInr < filters.minPriceInr) return false;
  }
  if (filters.maxPriceInr !== null) {
    if (p.priceInr === null || p.priceInr > filters.maxPriceInr) return false;
  }
  if (filters.category) {
    if (String(p.category || '').toLowerCase() !== filters.category.toLowerCase()) return false;
  }
  return true;
}

/**
 * Returns true ONLY when the query has visual/style/motif/color/weave/occasion/fabric descriptors,
 * and false for pure price/sort queries or general policy/reseller/shipping questions.
 */
export function isDescriptiveStyleQuery(query, parsedFilters = null) {
  const filters = parsedFilters || parseCatalogQueryFilters(query);
  const tokens = extractSearchTokens(filters.normalizedQuery || query);
  const categoryWords = new Set(['saree', 'sarees', 'suit', 'suits', 'dupatta', 'dupattas', 'lehenga', 'lehengas']);
  for (const tok of tokens) {
    if (categoryWords.has(tok)) continue;
    if (DESCRIPTIVE_STYLE_TOKENS.has(tok)) {
      return true;
    }
  }
  return false;
}

/**
 * Resolves short multi-turn follow-up queries (e.g. "anything cheaper?", "in red?", "what about suits?")
 * by merging missing category/fabric/color cues from the last 1-2 user turns without carrying over old price bounds.
 */
export function resolveEffectiveSearchQuery(message, history = [], parsedCurrentFilters = null) {
  const current = String(message || '').trim();
  if (!current || !Array.isArray(history) || history.length === 0) {
    return current;
  }

  const filters = parsedCurrentFilters || parseCatalogQueryFilters(current);
  const currentLower = current.toLowerCase();
  const currentTokens = extractSearchTokens(filters.normalizedQuery || current);
  const isShortFollowUp =
    currentTokens.length <= 4 ||
    /^(?:anything|something|what\s+about|how\s+about|show\s+more|any\s+other|more|cheaper|in\s+[a-z]+)/i.test(currentLower);

  if (!isShortFollowUp) {
    return current;
  }

  const recentUserTurns = history
    .filter((h) => h && h.role === 'user' && typeof h.text === 'string' && h.text.trim())
    .slice(-2)
    .reverse();

  if (recentUserTurns.length === 0) {
    return current;
  }

  const hasCurrentColor = currentTokens.some((t) => COLOR_KEYWORDS.includes(t));
  const hasCurrentFabric = currentTokens.some((t) =>
    ['pure', 'blend', 'faux', 'katan', 'organza', 'georgette', 'tissue', 'chiffon', 'chanderi', 'cotton', 'linen', 'mashru', 'tussar', 'muga', 'silk', 'handloom', 'powerloom'].includes(t)
  );

  const inheritedCues = [];
  let resolvedCategory = filters.category;
  let resolvedColor = hasCurrentColor ? '__set__' : null;
  let resolvedFabric = hasCurrentFabric ? '__set__' : null;

  for (const turn of recentUserTurns) {
    const prevParsed = parseCatalogQueryFilters(turn.text);
    const prevTokens = extractSearchTokens(prevParsed.normalizedQuery || turn.text);

    if (!resolvedCategory && prevParsed.category) {
      resolvedCategory = prevParsed.category;
      const catEntry = CATEGORY_SYNONYMS.find((c) => c.category === prevParsed.category);
      if (catEntry) inheritedCues.push(catEntry.keyword);
    }
    if (!resolvedColor) {
      const colorTok = prevTokens.find((t) => COLOR_KEYWORDS.includes(t));
      if (colorTok) {
        resolvedColor = colorTok;
        inheritedCues.push(colorTok);
      }
    }
    if (!resolvedFabric) {
      const fabToks = prevTokens.filter((t) =>
        ['pure', 'blend', 'faux', 'katan', 'organza', 'georgette', 'tissue', 'chiffon', 'chanderi', 'cotton', 'linen', 'mashru', 'tussar', 'muga', 'silk', 'handloom', 'powerloom'].includes(t)
      );
      if (fabToks.length > 0) {
        resolvedFabric = fabToks.join(' ');
        inheritedCues.push(...fabToks);
      }
    }
  }

  if (inheritedCues.length === 0) {
    return current;
  }

  return `${Array.from(new Set(inheritedCues)).join(' ')} ${current}`.trim();
}

/**
 * Builds an authoritative live in-stock catalog summary for the current turn.
 * Strictly excludes archived and out-of-stock SKUs.
 */
export function buildInStockCatalogSummary(catalog = [], currencyContext = null) {
  const inStock = (Array.isArray(catalog) ? catalog : []).filter((p) => p && !p.isArchived && p.inStock);
  if (inStock.length === 0) {
    return 'LIVE IN-STOCK CATALOG SUMMARY (authoritative for this turn only): 0 in-stock SKUs currently available.';
  }

  const prices = inStock.map((p) => p.priceInr).filter((v) => typeof v === 'number' && v > 0);
  const minInr = prices.length ? Math.min(...prices) : null;
  const maxInr = prices.length ? Math.max(...prices) : null;

  const categories = Array.from(new Set(inStock.map((p) => p.category).filter(Boolean))).sort();
  const fabricLabels = Array.from(new Set(inStock.map((p) => p.fabricLabel).filter(Boolean))).sort();

  const ctxCurr = String(currencyContext?.currency || 'INR').trim().toUpperCase() || 'INR';
  let priceRangeText = minInr !== null && maxInr !== null ? `₹${minInr} – ₹${maxInr}` : 'Price on request';

  if (ctxCurr !== 'INR' && minInr !== null && maxInr !== null) {
    const conversion = resolveCurrencyConversion('', currencyContext);
    const minLocal = convertBaseInrToDisplayPrice(minInr, conversion);
    const maxLocal = convertBaseInrToDisplayPrice(maxInr, conversion);
    if (minLocal !== null && maxLocal !== null) {
      priceRangeText += ` (${conversion.currency} ${minLocal} – ${maxLocal})`;
    }
  }

  return [
    'LIVE IN-STOCK CATALOG SUMMARY (authoritative for this turn only; never carry forward older turns):',
    `- In-stock SKUs: ${inStock.length}`,
    `- In-stock price range: ${priceRangeText}`,
    `- Available categories: ${categories.length ? categories.join(', ') : 'N/A'}`,
    `- Verified fabric tags in stock: ${fabricLabels.length ? fabricLabels.join(', ') : 'None verified'}`,
  ].join('\n');
}

/**
 * Searches the live catalog for text-grounded product matches with currency-aware price filtering & sorting.
 * @param {string} query
 * @param {{ limit?: number, includeOutOfStock?: boolean, supabase?: any, catalogOverride?: Array, currencyContext?: Object }} [options]
 */
export async function searchCatalogProducts(query, options = {}) {
  const { limit = 4, includeOutOfStock = false, supabase, catalogOverride, currencyContext } = options;
  const catalog = await loadLiveCatalog({ supabase, catalogOverride });
  const active = catalog.filter((p) => !p.isArchived && (includeOutOfStock || p.inStock));

  const trimmed = String(query || '').trim();
  if (!trimmed || active.length === 0) return [];

  const filters = parseCatalogQueryFilters(trimmed, { currencyContext });
  const lower = filters.normalizedQuery.toLowerCase();

  // Direct SKU/ID match first (real SKUs contain digits, e.g. 111001 or 101001-1)
  const skuTokens = (lower.match(/\b[a-z0-9]{4,12}(?:-[a-z0-9]+)?\b/gi) || []).filter((t) => /\d/.test(t));
  const categoryWords = new Set(['saree', 'sarees', 'suit', 'suits', 'dupatta', 'dupattas', 'lehenga', 'lehengas']);
  const tokens = extractSearchTokens(lower).filter((t) => !categoryWords.has(t));

  if (tokens.length === 0 && skuTokens.length === 0 && !filters.hasStructuredFilters) {
    return [];
  }

  // Apply structured price & category filters strictly
  const filteredPool = active.filter((p) => {
    if (filters.minPriceInr !== null && (p.priceInr === null || p.priceInr < filters.minPriceInr)) {
      return false;
    }
    if (filters.maxPriceInr !== null && (p.priceInr === null || p.priceInr > filters.maxPriceInr)) {
      return false;
    }
    if (filters.category && String(p.category || '').toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }
    return true;
  });

  if (filteredPool.length === 0) return [];

  const scored = [];
  for (const p of filteredPool) {
    let score = 0;
    const idLower = p.id.toLowerCase();
    const titleLower = p.title.toLowerCase();
    const fabricLower = `${p.fabric} ${p.fabricLabel || ''}`.toLowerCase();
    const metaLower = `${p.category} ${p.weave} ${p.work} ${p.pattern} ${p.colors.join(' ')}`.toLowerCase();

    for (const s of skuTokens) {
      if (idLower === s.toLowerCase()) score += 100;
      else if (idLower.includes(s.toLowerCase())) score += 40;
    }

    for (const tok of tokens) {
      if (idLower === tok) score += 80;
      if (titleLower.includes(tok)) score += 12;
      if (fabricLower.includes(tok)) score += 10;
      if (metaLower.includes(tok)) score += 6;
    }

    if (filters.fabricLabel && p.fabricLabel === filters.fabricLabel) {
      score += 10;
    }

    if (filters.hasStructuredFilters) {
      // If user also gave non-category descriptive tokens (e.g. "maroon floral"), require at least some keyword match unless there are no descriptive tokens
      if (tokens.length > 0 && score === 0) {
        continue;
      }
      if (p.inStock) score += 3;
      scored.push({ product: p, score });
    } else if (score > 0) {
      if (p.inStock) score += 3;
      scored.push({ product: p, score });
    }
  }

  if (filters.sort === 'price_asc') {
    scored.sort((a, b) => (a.product.priceInr ?? Infinity) - (b.product.priceInr ?? Infinity) || b.score - a.score);
  } else if (filters.sort === 'price_desc') {
    scored.sort((a, b) => (b.product.priceInr ?? -Infinity) - (a.product.priceInr ?? -Infinity) || b.score - a.score);
  } else if (filters.minPriceInr !== null && tokens.length === 0) {
    // For "anything above 10k?", show highest/closest matching items clearly
    scored.sort((a, b) => (b.product.priceInr ?? 0) - (a.product.priceInr ?? 0));
  } else {
    scored.sort((a, b) => b.score - a.score);
  }

  return scored.slice(0, limit).map((s) => s.product);
}

function isVariantInStock(variant) {
  if (!variant || typeof variant !== 'object') return true;
  const status = String(variant.stockStatus || '').trim().toLowerCase();
  if (variant.isArchived || variant.isOutOfStock) return false;
  if (status === 'out-of-stock' || status === 'archived') return false;
  if (typeof variant.quantity === 'number' && variant.quantity <= 0) return false;
  return true;
}

/**
 * Hydrates a match_product_images RPC row against the live catalog with variant-level stock,
 * variant image precedence (row.image_url || liveProduct.image), and colorName.
 * Returns null if parent or matched variant is out-of-stock or archived.
 */
export function hydrateMatchedVariantCandidate(row, liveProduct) {
  if (!row || !liveProduct || liveProduct.isArchived || !liveProduct.inStock) {
    return null;
  }

  const variants = Array.isArray(liveProduct.variants) ? liveProduct.variants : [];
  const rowVariantCode = String(row.variant_code || '').trim();
  const rowColorName = String(row.color_name || '').trim();

  let matchedVariant = null;
  if (rowVariantCode && variants.length > 0) {
    matchedVariant =
      variants.find((v) => String(v?.code || '').trim().toLowerCase() === rowVariantCode.toLowerCase()) || null;
  }
  if (!matchedVariant && rowColorName && variants.length > 0) {
    matchedVariant =
      variants.find((v) => String(v?.color || '').trim().toLowerCase() === rowColorName.toLowerCase()) || null;
  }

  if (matchedVariant && !isVariantInStock(matchedVariant)) {
    return null;
  }

  const colorName = String(rowColorName || matchedVariant?.color || '').trim() || null;
  const priceInr = matchedVariant?.priceInr || liveProduct.priceInr || null;
  const image = String(row.image_url || liveProduct.image || '').trim();

  return {
    ...liveProduct,
    price: priceInr,
    priceInr,
    image,
    colorName,
    variantCode: rowVariantCode || matchedVariant?.code || null,
    similarity: Number(row.similarity || 0),
  };
}

/**
 * Semantic text-to-image fallback via gemini-embedding-2 + match_product_images RPC.
 * Strictly enforces in-stock (parent + variant), non-archived, and any parsed price/category filters on every match.
 */
export async function semanticTextFallbackSearch({
  query,
  filters = null,
  supabase,
  apiKey,
  fetchImpl,
  geminiClient,
  catalogOverride = null,
  matchThreshold = 0.45,
  matchCount = 12,
  limit = 3,
} = {}) {
  const activeFilters = filters || parseCatalogQueryFilters(query);
  if (!isDescriptiveStyleQuery(query, activeFilters)) {
    return [];
  }

  const client = supabase || (await getDefaultSupabaseClient());
  if (!client || typeof client.rpc !== 'function') {
    return [];
  }

  const embedFn = geminiClient?.embedMultimodalContent || defaultEmbedMultimodalContent;
  const { embedding } = await embedFn({
    text: String(query || '').trim(),
    outputDimensionality: 768,
    apiKey,
    fetchImpl,
  });

  const { data, error } = await client.rpc('match_product_images', {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });
  if (error || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  const liveCatalog = await loadLiveCatalog({ supabase: client, catalogOverride });
  const catalogById = new Map(liveCatalog.map((p) => [p.id, p]));

  const seenIds = new Set();
  const results = [];
  for (const row of data) {
    const pid = String(row.product_id || row.id || '').trim();
    if (!pid || seenIds.has(pid)) continue;

    const liveProduct = catalogById.get(pid);
    const hydrated = hydrateMatchedVariantCandidate(row, liveProduct);
    if (!hydrated || !matchesProductFilters(hydrated, activeFilters)) {
      continue;
    }

    seenIds.add(pid);
    results.push(hydrated);
  }

  if (activeFilters.sort === 'price_asc') {
    results.sort((a, b) => (a.priceInr ?? Infinity) - (b.priceInr ?? Infinity));
  } else if (activeFilters.sort === 'price_desc') {
    results.sort((a, b) => (b.priceInr ?? -Infinity) - (a.priceInr ?? -Infinity));
  }

  return results.slice(0, limit);
}

const NON_PRODUCT_PAGE_PREFIXES = new Set([
  'blog',
  'order-tracking',
  'partner',
  's',
  'store',
  'admin',
  'account',
  'api',
  'reseller-dashboard',
]);

/**
 * Extracts the active product SKU from a product route path (e.g. "/saree/121008" or "/banarasi-sarees/101001").
 * Returns null for non-product multi-segment routes such as "/blog/...", "/order-tracking/...", or "/partner/...".
 */
export function extractActiveProductSku(pagePath = '') {
  if (typeof pagePath !== 'string') return null;
  const trimmed = pagePath.trim();
  if (!trimmed) return null;

  let pathname = trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      pathname = new URL(trimmed).pathname || '/';
    } catch {
      return null;
    }
  }

  pathname = pathname.split('?')[0].split('#')[0];
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length !== 2) return null;

  const firstSeg = segments[0].toLowerCase();
  if (NON_PRODUCT_PAGE_PREFIXES.has(firstSeg)) return null;

  try {
    const decoded = decodeURIComponent(segments[1]).trim();
    return decoded || null;
  } catch {
    return segments[1].trim() || null;
  }
}

export const CHAT_TOOL_DECLARATIONS = [
  {
    name: 'queryCatalog',
    description:
      'Filter, count, and list live Weave 365 catalog products by category, verified fabric purity label, fabric, weave, color, price bounds, keywords, stock status, and sort order. Returns exact totalMatched count plus up to limit (max 6) verified SKUs.',
    parameters: {
      type: 'OBJECT',
      properties: {
        category: {
          type: 'STRING',
          description: 'Optional category: "Saree", "Suit", "Dupatta", "Lehenga", or "Under 999".',
        },
        fabricLabel: {
          type: 'STRING',
          description: 'Optional verified fabric purity tag: "Pure", "Blend", or "Faux".',
        },
        fabric: {
          type: 'STRING',
          description: 'Optional fabric keyword, e.g. "Katan Silk", "Organza", "Georgette", "Cotton Silk", "Tissue", "Satin Silk".',
        },
        weave: {
          type: 'STRING',
          description: 'Optional weave or loom keyword, e.g. "Handloom", "Powerloom", "Kadwa", "Jaal", "Meenakari".',
        },
        color: {
          type: 'STRING',
          description: 'Optional color keyword, e.g. "Red", "Maroon", "Gold", "Orange", "Pink", "Green", "Blue".',
        },
        searchText: {
          type: 'STRING',
          description: 'Optional search terms for title, motifs, work, occasion, or SKU.',
        },
        minPrice: {
          type: 'NUMBER',
          description: 'Optional minimum price filter (in currency specified by currency arg).',
        },
        maxPrice: {
          type: 'NUMBER',
          description: 'Optional maximum price filter (in currency specified by currency arg).',
        },
        currency: {
          type: 'STRING',
          description: 'Currency code for minPrice/maxPrice (e.g. "INR", "USD"). Always pass "INR" for rupee/₹/k amounts.',
        },
        sortBy: {
          type: 'STRING',
          enum: ['relevance', 'price_asc', 'price_desc'],
          description: 'Sort order for returned items ("price_asc" for cheapest, "price_desc" for highest/luxury).',
        },
        inStockOnly: {
          type: 'BOOLEAN',
          description: 'Whether to include only currently in-stock SKUs (defaults to true).',
        },
        limit: {
          type: 'INTEGER',
          description: 'Number of matching products to return (1 to 6, defaults to 4).',
        },
      },
    },
  },
  {
    name: 'getProductDetails',
    description:
      'Look up complete verified specifications, price, verified fabric purity tag, weave, colors, and variant-level stock availability for a specific product SKU (or the active product page SKU).',
    parameters: {
      type: 'OBJECT',
      properties: {
        sku: {
          type: 'STRING',
          description: 'Product SKU ID or variant code (e.g. "121008" or "121008-1").',
        },
      },
      required: ['sku'],
    },
  },
  {
    name: 'semanticStyleSearch',
    description:
      'Search the catalog semantically via Banarasi visual/style embeddings (good for subjective occasion, motif, drape, aesthetic, or descriptive visual requests when structured filters alone are too narrow). Strictly enforces in-stock status and any price/category/fabric filters.',
    parameters: {
      type: 'OBJECT',
      properties: {
        styleQuery: {
          type: 'STRING',
          description: 'Natural-language description of the saree/suit style, motif, color mood, or occasion.',
        },
        category: {
          type: 'STRING',
          description: 'Optional category filter: "Saree", "Suit", "Dupatta", "Lehenga", or "Under 999".',
        },
        fabricLabel: {
          type: 'STRING',
          description: 'Optional verified fabric purity tag filter: "Pure", "Blend", or "Faux".',
        },
        minPrice: {
          type: 'NUMBER',
          description: 'Optional minimum price filter (in currency specified by currency arg).',
        },
        maxPrice: {
          type: 'NUMBER',
          description: 'Optional maximum price filter (in currency specified by currency arg).',
        },
        currency: {
          type: 'STRING',
          description: 'Currency code for minPrice/maxPrice (e.g. "INR", "USD").',
        },
        limit: {
          type: 'INTEGER',
          description: 'Max items to return (1 to 6, defaults to 3).',
        },
      },
      required: ['styleQuery'],
    },
  },
];

function clampToolLimit(rawLimit, defaultLimit = 4, maxLimit = 6) {
  const num = Number(rawLimit);
  if (!Number.isFinite(num) || num <= 0) return defaultLimit;
  return Math.min(Math.max(1, Math.floor(num)), maxLimit);
}

function normalizeCurrencyCodeForTool(rawCurrency, currencyContext) {
  const ctxCurr = String(currencyContext?.currency || 'INR').trim().toUpperCase() || 'INR';
  if (!rawCurrency || typeof rawCurrency !== 'string') return ctxCurr;
  const trimmed = rawCurrency.trim();
  if (!trimmed) return ctxCurr;

  const upper = trimmed.toUpperCase();
  if (upper === '$' || upper === 'US$' || upper === 'DOLLAR' || upper === 'DOLLARS') return 'USD';
  if (upper === '₹' || upper === 'RS' || upper === 'RS.' || upper === 'RUPEE' || upper === 'RUPEES') return 'INR';
  if (upper === '£' || upper === 'POUND' || upper === 'POUNDS') return 'GBP';
  if (upper === '€' || upper === 'EURO' || upper === 'EUROS') return 'EUR';

  for (const entry of CURRENCY_TOKEN_PATTERNS) {
    if (entry.regex.test(trimmed)) return entry.code;
  }
  return upper;
}

function resolveToolPriceBounds(rawArgs = {}, currencyContext = null) {
  const currency = normalizeCurrencyCodeForTool(rawArgs?.currency, currencyContext);
  const conversion = buildCurrencyConversionForCode(currency, currencyContext);

  const rawMin = rawArgs?.minPrice;
  const rawMax = rawArgs?.maxPrice;
  const minVal = rawMin !== null && rawMin !== undefined && rawMin !== '' ? Number(rawMin) : NaN;
  const maxVal = rawMax !== null && rawMax !== undefined && rawMax !== '' ? Number(rawMax) : NaN;

  let minPriceInr = Number.isFinite(minVal) && minVal > 0
    ? convertDisplayPriceToBaseInr(minVal, conversion)
    : null;
  let maxPriceInr = Number.isFinite(maxVal) && maxVal > 0
    ? convertDisplayPriceToBaseInr(maxVal, conversion)
    : null;

  if (minPriceInr !== null && maxPriceInr !== null && minPriceInr > maxPriceInr) {
    [minPriceInr, maxPriceInr] = [maxPriceInr, minPriceInr];
  }

  return {
    currency: conversion.currency,
    minPriceInr,
    maxPriceInr,
  };
}

function normalizeCategoryToolArg(rawCategory) {
  if (!rawCategory || typeof rawCategory !== 'string') return null;
  const trimmed = rawCategory.trim();
  if (!trimmed || /^(all|any)$/i.test(trimmed)) return null;
  const lower = trimmed.toLowerCase();
  if (/under[\s_-]*999/.test(lower)) return 'Under 999';
  for (const cat of CATEGORY_SYNONYMS) {
    if (cat.regex.test(lower)) return cat.category;
  }
  return trimmed;
}

function normalizeFabricLabelToolArg(rawLabel) {
  if (!rawLabel || typeof rawLabel !== 'string') return null;
  const trimmed = rawLabel.trim();
  if (!trimmed || /^(all|any)$/i.test(trimmed)) return null;
  for (const fab of FABRIC_PURITY_SYNONYMS) {
    if (fab.regex.test(trimmed)) return fab.label;
  }
  return null;
}

function cleanOptionalToolText(val) {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed || /^(all|any|none|n\/a)$/i.test(trimmed)) return '';
  return trimmed;
}

function serializeProductForTool(p) {
  return {
    id: p.id,
    title: p.title,
    url: p.url,
    category: p.category,
    priceInr: p.priceInr,
    fabricLabel: p.fabricLabel || 'Unverified',
    fabric: p.fabric || '',
    weave: p.weave || '',
    work: p.work || '',
    pattern: p.pattern || '',
    colors: Array.isArray(p.colors) ? p.colors : [],
    matchedColor: p.colorName || null,
    inStock: Boolean(p.inStock),
    stockStatus: p.stockStatus || (p.inStock ? 'ready-stock' : 'out-of-stock'),
  };
}

/**
 * Executes `queryCatalog` tool deterministically with case-insensitive normalization,
 * clamped limit <= 6, currency-aware price conversion, and default inStockOnly: true.
 */
export async function executeQueryCatalog(rawArgs = {}, options = {}) {
  const args = rawArgs && typeof rawArgs === 'object' && !Array.isArray(rawArgs) ? rawArgs : {};
  const { catalog: catalogArg, supabase, catalogOverride, currencyContext } = options;

  const catalog = Array.isArray(catalogArg)
    ? catalogArg
    : await loadLiveCatalog({ supabase, catalogOverride });

  const limit = clampToolLimit(args.limit, 4, 6);
  const inStockOnly = args.inStockOnly === false ? false : true;
  const category = normalizeCategoryToolArg(args.category);
  const fabricLabel = normalizeFabricLabelToolArg(args.fabricLabel);
  const fabricFilter = cleanOptionalToolText(args.fabric);
  const weaveFilter = cleanOptionalToolText(args.weave);
  const colorFilter = cleanOptionalToolText(args.color);
  const searchText = cleanOptionalToolText(args.searchText);
  const sortRaw = String(args.sortBy || 'relevance').trim().toLowerCase();
  const sortBy = sortRaw === 'price_asc' || sortRaw === 'price_desc' ? sortRaw : 'relevance';
  const { currency, minPriceInr, maxPriceInr } = resolveToolPriceBounds(args, currencyContext);

  const fabricTokens = fabricFilter ? fabricFilter.toLowerCase().split(/\s+/).filter((t) => t.length >= 2) : [];
  const weaveTokens = weaveFilter ? weaveFilter.toLowerCase().split(/\s+/).filter((t) => t.length >= 2) : [];
  const colorLower = colorFilter.toLowerCase();
  const searchTokens = searchText ? extractSearchTokens(searchText) : [];
  const searchSkuTokens = searchText
    ? (searchText.toLowerCase().match(/\b[a-z0-9]{4,12}(?:-[a-z0-9]+)?\b/gi) || []).filter((t) => /\d/.test(t))
    : [];

  const matched = [];
  for (const p of catalog) {
    if (!p || p.isArchived) continue;
    if (inStockOnly && !p.inStock) continue;

    if (category && String(p.category || '').trim().toLowerCase() !== category.toLowerCase()) {
      continue;
    }
    if (fabricLabel && String(p.fabricLabel || '').trim().toLowerCase() !== fabricLabel.toLowerCase()) {
      continue;
    }

    let candidateProduct = p;

    // Color & variant-level matching
    if (colorLower) {
      const variants = Array.isArray(p.variants) ? p.variants : [];
      const colorVariants = variants.filter((v) =>
        String(v?.color || '').toLowerCase().includes(colorLower)
      );
      if (colorVariants.length > 0) {
        const usableVariants = inStockOnly ? colorVariants.filter(isVariantInStock) : colorVariants;
        if (usableVariants.length === 0) continue;
        const chosen = usableVariants[0];
        candidateProduct = {
          ...p,
          colorName: String(chosen.color || '').trim() || colorFilter,
          image: String(chosen.image || p.image || '').trim(),
          price: chosen.priceInr || p.price,
          priceInr: chosen.priceInr || p.priceInr,
        };
      } else {
        const colorPool = `${(p.colors || []).join(' ')} ${p.title || ''}`.toLowerCase();
        if (!colorPool.includes(colorLower)) continue;
      }
    }

    if (minPriceInr !== null && (candidateProduct.priceInr === null || candidateProduct.priceInr < minPriceInr)) {
      continue;
    }
    if (maxPriceInr !== null && (candidateProduct.priceInr === null || candidateProduct.priceInr > maxPriceInr)) {
      continue;
    }

    const fullText = `${candidateProduct.id} ${candidateProduct.title} ${candidateProduct.category} ${candidateProduct.fabric} ${candidateProduct.fabricLabel || ''} ${candidateProduct.weave} ${candidateProduct.work} ${candidateProduct.pattern} ${(candidateProduct.colors || []).join(' ')}`.toLowerCase();
    const fabricPool = `${candidateProduct.fabric} ${candidateProduct.fabricLabel || ''} ${candidateProduct.title}`.toLowerCase();
    const weavePool = `${candidateProduct.weave} ${candidateProduct.work} ${candidateProduct.pattern} ${candidateProduct.title}`.toLowerCase();

    if (fabricTokens.length > 0 && !fabricTokens.every((tok) => fabricPool.includes(tok) || fullText.includes(tok))) {
      continue;
    }
    if (weaveTokens.length > 0 && !weaveTokens.every((tok) => weavePool.includes(tok) || fullText.includes(tok))) {
      continue;
    }

    let score = candidateProduct.inStock ? 3 : 0;
    if (searchSkuTokens.length > 0 || searchTokens.length > 0) {
      let queryScore = 0;
      const idLower = candidateProduct.id.toLowerCase();
      const titleLower = candidateProduct.title.toLowerCase();
      for (const s of searchSkuTokens) {
        if (idLower === s) queryScore += 100;
        else if (idLower.includes(s)) queryScore += 40;
      }
      for (const tok of searchTokens) {
        if (idLower === tok) queryScore += 80;
        if (titleLower.includes(tok)) queryScore += 12;
        if (fabricPool.includes(tok)) queryScore += 10;
        if (fullText.includes(tok)) queryScore += 6;
      }
      if (queryScore === 0) continue;
      score += queryScore;
    }

    matched.push({ product: candidateProduct, score });
  }

  if (sortBy === 'price_asc') {
    matched.sort((a, b) => (a.product.priceInr ?? Infinity) - (b.product.priceInr ?? Infinity) || b.score - a.score);
  } else if (sortBy === 'price_desc') {
    matched.sort((a, b) => (b.product.priceInr ?? -Infinity) - (a.product.priceInr ?? -Infinity) || b.score - a.score);
  } else if (minPriceInr !== null && !searchText && !fabricFilter && !weaveFilter) {
    matched.sort((a, b) => (b.product.priceInr ?? 0) - (a.product.priceInr ?? 0));
  } else {
    matched.sort((a, b) => b.score - a.score || (a.product.priceInr ?? Infinity) - (b.product.priceInr ?? Infinity));
  }

  const allMatchedProducts = matched.map((m) => m.product);
  const slicedProducts = allMatchedProducts.slice(0, limit);
  const prices = allMatchedProducts.map((p) => p.priceInr).filter((v) => typeof v === 'number' && v > 0);

  return {
    response: {
      totalMatched: allMatchedProducts.length,
      returnedCount: slicedProducts.length,
      inStockOnly,
      appliedCurrency: currency,
      minPriceInr,
      maxPriceInr,
      minMatchedPriceInr: prices.length ? Math.min(...prices) : null,
      maxMatchedPriceInr: prices.length ? Math.max(...prices) : null,
      products: slicedProducts.map(serializeProductForTool),
    },
    matchedProducts: slicedProducts,
  };
}

/**
 * Executes `getProductDetails` tool to fetch exact verified details & variant stock for a SKU.
 */
export async function executeGetProductDetails(rawArgs = {}, options = {}) {
  const args = rawArgs && typeof rawArgs === 'object' && !Array.isArray(rawArgs) ? rawArgs : {};
  const { catalog: catalogArg, supabase, catalogOverride, activeProductSku } = options;

  const rawSku = String(args.sku || activeProductSku || '')
    .trim()
    .replace(/^(?:sku\s*[:#-]?\s*|#)/i, '')
    .trim();

  if (!rawSku) {
    return {
      response: { found: false, sku: '', message: 'No SKU provided.' },
      matchedProducts: [],
    };
  }

  const catalog = Array.isArray(catalogArg)
    ? catalogArg
    : await loadLiveCatalog({ supabase, catalogOverride });

  const skuLower = rawSku.toLowerCase();
  const baseFromVariant = skuLower.includes('-') ? skuLower.replace(/-[^-]+$/, '') : skuLower;

  let matchedProduct = null;
  let matchedVariant = null;

  for (const p of catalog) {
    if (!p) continue;
    if (String(p.id || '').trim().toLowerCase() === skuLower) {
      matchedProduct = p;
      break;
    }
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const foundVar = variants.find((v) => String(v?.code || '').trim().toLowerCase() === skuLower);
    if (foundVar) {
      matchedProduct = p;
      matchedVariant = foundVar;
      break;
    }
  }

  if (!matchedProduct && baseFromVariant !== skuLower) {
    matchedProduct =
      catalog.find((p) => p && String(p.id || '').trim().toLowerCase() === baseFromVariant) || null;
  }

  if (!matchedProduct) {
    return {
      response: {
        found: false,
        sku: rawSku,
        message: 'No product found matching that SKU in the current catalog.',
      },
      matchedProducts: [],
    };
  }

  const variants = Array.isArray(matchedProduct.variants) ? matchedProduct.variants : [];
  const inStockColors = [];
  const outOfStockColors = [];
  for (const v of variants) {
    const label = String(v?.color || v?.code || '').trim();
    if (!label) continue;
    if (matchedProduct.inStock && isVariantInStock(v)) {
      inStockColors.push(label);
    } else {
      outOfStockColors.push(label);
    }
  }

  const effectiveInStock = matchedVariant
    ? Boolean(!matchedProduct.isArchived && matchedProduct.inStock && isVariantInStock(matchedVariant))
    : Boolean(!matchedProduct.isArchived && matchedProduct.inStock);

  const hydratedProduct = matchedVariant
    ? {
        ...matchedProduct,
        colorName: String(matchedVariant.color || '').trim() || null,
        image: String(matchedVariant.image || matchedProduct.image || '').trim(),
        price: matchedVariant.priceInr || matchedProduct.price,
        priceInr: matchedVariant.priceInr || matchedProduct.priceInr,
        inStock: effectiveInStock,
      }
    : matchedProduct;

  return {
    response: {
      found: true,
      isArchived: Boolean(matchedProduct.isArchived),
      product: {
        ...serializeProductForTool(hydratedProduct),
        inStock: effectiveInStock,
        matchedVariantCode: matchedVariant?.code || null,
        inStockColors: Array.from(new Set(inStockColors)),
        outOfStockColors: Array.from(new Set(outOfStockColors)),
      },
    },
    matchedProducts: matchedProduct.isArchived ? [] : [hydratedProduct],
  };
}

/**
 * Executes `semanticStyleSearch` tool via gemini-embedding-2 + match_product_images RPC,
 * strictly enforcing in-stock (parent + variant), non-archived, and price/category/fabric filters.
 */
export async function executeSemanticStyleSearch(rawArgs = {}, options = {}) {
  const args = rawArgs && typeof rawArgs === 'object' && !Array.isArray(rawArgs) ? rawArgs : {};
  const {
    catalog: catalogArg,
    supabase,
    catalogOverride,
    apiKey,
    fetchImpl,
    geminiClient,
    currencyContext,
  } = options;

  const styleQuery = String(args.styleQuery || '').trim();
  if (!styleQuery) {
    return {
      response: { totalMatched: 0, products: [], error: 'styleQuery is required.' },
      matchedProducts: [],
    };
  }

  const limit = clampToolLimit(args.limit, 3, 6);
  const category = normalizeCategoryToolArg(args.category);
  const fabricLabel = normalizeFabricLabelToolArg(args.fabricLabel);
  const { currency, minPriceInr, maxPriceInr } = resolveToolPriceBounds(args, currencyContext);

  const client = supabase || (await getDefaultSupabaseClient());
  if (!client || typeof client.rpc !== 'function') {
    return {
      response: {
        totalMatched: 0,
        products: [],
        note: 'Semantic style index is unavailable right now.',
      },
      matchedProducts: [],
    };
  }

  try {
    const embedFn = geminiClient?.embedMultimodalContent || defaultEmbedMultimodalContent;
    const { embedding } = await embedFn({
      text: styleQuery,
      outputDimensionality: 768,
      apiKey,
      fetchImpl,
    });

    const { data, error } = await client.rpc('match_product_images', {
      query_embedding: embedding,
      match_threshold: 0.42,
      match_count: 16,
    });

    if (error || !Array.isArray(data) || data.length === 0) {
      return {
        response: { totalMatched: 0, products: [] },
        matchedProducts: [],
      };
    }

    const liveCatalog = Array.isArray(catalogArg)
      ? catalogArg
      : await loadLiveCatalog({ supabase: client, catalogOverride });
    const catalogById = new Map(liveCatalog.map((p) => [p.id, p]));

    const seenIds = new Set();
    const results = [];
    for (const row of data) {
      const pid = String(row.product_id || row.id || '').trim();
      if (!pid || seenIds.has(pid)) continue;

      const liveProduct = catalogById.get(pid);
      const hydrated = hydrateMatchedVariantCandidate(row, liveProduct);
      if (!hydrated) continue;
      if (minPriceInr !== null && (hydrated.priceInr === null || hydrated.priceInr < minPriceInr)) continue;
      if (maxPriceInr !== null && (hydrated.priceInr === null || hydrated.priceInr > maxPriceInr)) continue;
      if (category && String(hydrated.category || '').trim().toLowerCase() !== category.toLowerCase()) continue;
      if (fabricLabel && String(hydrated.fabricLabel || '').trim().toLowerCase() !== fabricLabel.toLowerCase()) {
        continue;
      }

      seenIds.add(pid);
      results.push(hydrated);
    }

    const sliced = results.slice(0, limit);
    return {
      response: {
        totalMatched: results.length,
        returnedCount: sliced.length,
        appliedCurrency: currency,
        minPriceInr,
        maxPriceInr,
        products: sliced.map(serializeProductForTool),
      },
      matchedProducts: sliced,
    };
  } catch (err) {
    console.warn('[catalogGrounding] semanticStyleSearch failed:', err?.message || err);
    return {
      response: {
        totalMatched: 0,
        products: [],
        error: 'Semantic style lookup failed cleanly; fallback to WhatsApp if exact visual sourcing is needed.',
      },
      matchedProducts: [],
    };
  }
}

/**
 * Unified safe dispatcher for Gemini catalog tool calls.
 */
export async function executeCatalogToolCall(toolName, rawArgs = {}, options = {}) {
  const normalizedName = String(toolName || '').trim();
  try {
    if (normalizedName === 'queryCatalog') {
      return await executeQueryCatalog(rawArgs, options);
    }
    if (normalizedName === 'getProductDetails') {
      return await executeGetProductDetails(rawArgs, options);
    }
    if (normalizedName === 'semanticStyleSearch') {
      return await executeSemanticStyleSearch(rawArgs, options);
    }
    return {
      response: { error: `Unknown tool: ${normalizedName}` },
      matchedProducts: [],
    };
  } catch (err) {
    console.warn('[catalogGrounding] executeCatalogToolCall error:', normalizedName, err?.message || err);
    return {
      response: { error: 'Catalog tool lookup failed cleanly.' },
      matchedProducts: [],
    };
  }
}

/**
 * Formats matched live products into grounded context text for Gemini.
 */
export function buildCatalogContextPrompt(products = []) {
  if (!Array.isArray(products) || products.length === 0) {
    return '';
  }
  const lines = products.map((p, idx) => {
    const priceStr = p.priceInr ? `₹${p.priceInr}` : 'Price on request';
    const fabricTag = p.fabricLabel ? `fabricLabel=${p.fabricLabel}` : 'fabricLabel=Unverified (do not claim Pure)';
    const stockStr = p.inStock ? 'In Stock' : 'Out of Stock';
    return `${idx + 1}. SKU=${p.id} | Title="${p.title}" | URL=${p.url} | Price=${priceStr} | ${fabricTag} | Fabric="${p.fabric || 'N/A'}" | Weave="${p.weave || 'N/A'}" | Status=${stockStr}`;
  });
  return `GROUNDED LIVE CATALOG CONTEXT (cite ONLY these verified SKUs, prices, URLs, and fabricLabel values):\n${lines.join('\n')}`;
}

function uint8ArrayToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

/**
 * Safely fetches a remote product image with timeout and size limits for Edge runtime.
 * Returns { mimeType, base64 } or null if unavailable.
 */
export async function fetchImageAsBase64(imageUrl, { fetchImpl, timeoutMs = IMAGE_FETCH_TIMEOUT_MS } = {}) {
  if (!imageUrl || typeof imageUrl !== 'string' || !/^https?:\/\//i.test(imageUrl)) {
    return null;
  }
  const fn = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!fn) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fn(imageUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const rawMime = String(res.headers?.get?.('content-type') || 'image/jpeg')
      .split(';')[0]
      .trim()
      .toLowerCase();
    const mimeType = ALLOWED_IMAGE_MIMES.has(rawMime) ? rawMime : 'image/jpeg';

    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength === 0 || buf.byteLength > MAX_CANDIDATE_IMAGE_BYTES) {
      return null;
    }

    return {
      mimeType,
      base64: uint8ArrayToBase64(new Uint8Array(buf)),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const CANDIDATE_VISION_IMAGE_PRESET = {
  width: 560,
  quality: 72,
  format: 'jpeg',
  fit: 'scale-down',
};

/**
 * Fetches a candidate product image using the requested preset (default 'listing' ~700px;
 * visual search verification uses ~560px), falling back cleanly to the raw URL on failure.
 */
export async function fetchCandidateImageWithFallback(
  rawUrl,
  { fetchImpl, preset = 'listing', timeoutMs = IMAGE_FETCH_TIMEOUT_MS } = {}
) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const optimizedUrl = getOptimizedImageUrl(trimmed, preset);
  const rawFallbackUrl = /^https?:\/\//i.test(trimmed) ? trimmed : getOriginalImageUrl(trimmed);

  if (optimizedUrl && /^https?:\/\//i.test(optimizedUrl)) {
    const optResult = await fetchImageAsBase64(optimizedUrl, { fetchImpl, timeoutMs });
    if (optResult) return optResult;
  }

  if (rawFallbackUrl && rawFallbackUrl !== optimizedUrl && /^https?:\/\//i.test(rawFallbackUrl)) {
    return fetchImageAsBase64(rawFallbackUrl, { fetchImpl, timeoutMs });
  }

  return null;
}

/**
 * Sanitizes visual match summaries so internal labels ("Candidate 1", "ID:", "SKU:", or raw numeric SKU codes)
 * never leak into customer-facing text.
 */
export function sanitizeVisualSummary(summary, candidates = []) {
  if (!summary || typeof summary !== 'string') return '';
  let text = summary.trim();

  // Strip parenthetical internal refs like "(Candidate 1)", "(ID: 121008)", "(SKU 121008)"
  text = text.replace(/\(\s*(?:candidate\s*#?\d+|(?:id|sku|ref)\s*[:#-]?\s*[a-z0-9-]+)\s*\)/gi, '');
  // Strip labeled prefixes like "Candidate 1:", "ID: 121008", "SKU 121008"
  text = text.replace(/\b(?:candidate\s*#?\d+\s*[:\-–—]|(?:id|sku|ref)\s*[:#]\s*[a-z0-9-]+(?:\s*[:\-–—])?)/gi, '');
  // Replace remaining standalone "Candidate N" with natural phrasing
  text = text.replace(/\bcandidate\s*#?\d+\b/gi, (match, offset) => (offset === 0 ? 'This matching piece' : 'this matching piece'));

  // Strip bare numeric SKU tokens matching any candidate ID
  for (const cand of Array.isArray(candidates) ? candidates : []) {
    const id = String(cand?.id || '').trim();
    if (id && /^\d{4,12}(?:-[a-z0-9]+)?$/i.test(id)) {
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
    }
  }

  return text
    .replace(/\s+([.,;!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,;:\s\-–—]+/, '')
    .trim();
}

/**
 * Sanitizes model replies to enforce the Hard Rule:
 * never claim or verify whether a customer-uploaded photo itself is "pure silk", "handloom", "katan", or "real zari".
 */
export function enforceUploadedPhotoPurityGuard(text) {
  if (!text || typeof text !== 'string') return '';

  const disclaimerContext =
    /(?:cannot|can't|unable\s+to|do\s+not|don't|never)\s+(?:verify|confirm|claim|tell|guarantee)\s+(?:whether|if|that)\s+$/i;
  const unsafeClaimPattern =
    /(?:your|the|this|customer(?:'s)?)\s+(?:uploaded\s+|customer\s+)?(?:photo|image|picture|saree|piece)\s+(?:is|looks\s+like|appears\s+to\s+be|shows|depicts|features)(?:\s+(?:made\s+of|woven\s+in|crafted\s+from))?\s+(?:(?:authentic|original|certified|100%)\s+)*(?:pure\s+(?:handloom\s+)?silk|pure\s+handloom|100%\s+silk|handloom|katan(?:\s+silk)?|real\s+zari)(?:\s+(?:handloom|silk|katan|real\s+zari|saree|piece))*/gi;

  let replaced = false;
  const sanitized = text.replace(unsafeClaimPattern, (match, offset, fullStr) => {
    const prefix = fullStr.slice(Math.max(0, offset - 80), offset);
    if (disclaimerContext.test(prefix)) {
      return match;
    }
    replaced = true;
    return 'This piece';
  });

  if (!replaced) {
    return text.trim();
  }

  return `${sanitized.replace(/\s+\./g, '.').trim()} (Note: we cannot verify fabric purity or loom type from an uploaded photo alone — only the verified catalog tag on matching Weave 365 SKUs is reported.)`;
}

function parseVerificationJson(rawText) {
  const cleaned = String(rawText || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

const COLOR_FAMILY_SYNONYMS = {
  blue: ['navy', 'firozi', 'turquoise', 'teal', 'cobalt', 'royal', 'sky', 'indigo'],
  navy: ['blue', 'cobalt', 'indigo'],
  red: ['maroon', 'crimson', 'wine', 'cherry', 'rust', 'scarlet'],
  maroon: ['red', 'wine', 'crimson', 'burgundy'],
  pink: ['rani', 'magenta', 'rose', 'peach', 'mauve', 'fuchsia'],
  magenta: ['pink', 'rani', 'fuchsia', 'wine'],
  green: ['olive', 'emerald', 'sage', 'mint', 'mehndi', 'bottle', 'teal'],
  yellow: ['mustard', 'lemon', 'gold', 'golden', 'haldi'],
  gold: ['golden', 'yellow', 'beige', 'copper'],
  purple: ['violet', 'lavender', 'mauve', 'wine', 'magenta'],
  violet: ['purple', 'lavender', 'mauve'],
  orange: ['rust', 'peach', 'coral', 'terracotta'],
  white: ['ivory', 'cream', 'off-white', 'beige'],
};

const TAG_EXTRACTION_SYSTEM_INSTRUCTION =
  'You extract concise, neutral visual search attributes from product screenshots and photos. Return valid JSON only. Never guess or verify fabric purity ("pure silk") or loom type from an image.';

function normalizeOptionalTagText(val) {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed || /^(none|null|n\/a|unknown)$/i.test(trimmed)) return null;
  return trimmed;
}

/**
 * Computes color affinity bonus between a variant/product color and extracted image color tags.
 * Handles multi-word descriptions like "royal blue" or "deep maroon".
 */
export function scoreColorAffinity(candidateColor, targetPrimaryColor, secondaryColors = []) {
  const candLower = String(candidateColor || '').trim().toLowerCase();
  const primaryLower = String(targetPrimaryColor || '').trim().toLowerCase();
  if (!candLower || !primaryLower) return 0;

  if (candLower === primaryLower) {
    return 0.16;
  }

  const candTokens = candLower.split(/[\s/-]+/).filter(Boolean);
  const primaryTokens = primaryLower.split(/[\s/-]+/).filter(Boolean);

  if (candTokens.some((t) => primaryTokens.includes(t))) {
    return 0.14;
  }

  for (const pt of primaryTokens) {
    const family = COLOR_FAMILY_SYNONYMS[pt] || [];
    if (candTokens.some((t) => family.includes(t))) {
      return 0.04;
    }
  }

  for (const sec of Array.isArray(secondaryColors) ? secondaryColors : []) {
    const secTokens = String(sec || '').trim().toLowerCase().split(/[\s/-]+/).filter(Boolean);
    if (secTokens.some((st) => candTokens.includes(st))) {
      return 0.02;
    }
  }

  return 0;
}

/**
 * Extracts structured visual attributes and optional visible SKU (OCR) via gemini-3.5-flash-lite.
 * Non-fatal: returns null cleanly on network errors or unit-test mocks returning verification JSON.
 */
export async function extractVisualSearchTags({
  image,
  message = '',
  chatFn = defaultGenerateChatReply,
  apiKey,
  fetchImpl,
} = {}) {
  if (!image || !image.base64) return null;

  const promptText = [
    'Analyze this customer-uploaded textile screenshot or photo for catalog matching.',
    'Inspect corners, margins, and image edges carefully for any visible Weave 365 SKU or variant code (often numeric like "102006-4", "102006", "121008", sometimes vertical/faint in the bottom-right margin). Only report detectedSku if characters/digits are genuinely legible; otherwise null.',
    'Ignore UI overlays like "<", ">", or "4/12" carousel badges when describing pattern and primaryColor.',
    'Return STRICT JSON only with keys:',
    '{"detectedSku":string|null,"category":"Saree"|"Suit"|"Dupatta"|"Lehenga"|null,"primaryColor":string|null,"secondaryColors":string[],"pattern":string|null,"borderStyle":string|null,"zariTone":string|null,"searchKeywords":string[]}',
    message ? `Customer note: ${message}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const res = await chatFn({
      systemInstruction: TAG_EXTRACTION_SYSTEM_INSTRUCTION,
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: image.mimeType || 'image/jpeg',
                data: image.base64,
              },
            },
          ],
        },
      ],
      thinkingLevel: 'minimal',
      temperature: 0.1,
      maxOutputTokens: 220,
      responseMimeType: 'application/json',
      apiKey,
      fetchImpl,
    });

    const parsed = parseVerificationJson(res?.text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    // Do not misinterpret mocked side-by-side verification JSON as visual tags
    if ('outcome' in parsed || 'matchedIds' in parsed) return null;

    const detectedSku = normalizeOptionalTagText(parsed.detectedSku);
    const category = normalizeCategoryToolArg(parsed.category);
    const primaryColor = normalizeOptionalTagText(parsed.primaryColor);
    const secondaryColors = Array.isArray(parsed.secondaryColors)
      ? parsed.secondaryColors.map(normalizeOptionalTagText).filter(Boolean).slice(0, 4)
      : [];
    const pattern = normalizeOptionalTagText(parsed.pattern);
    const borderStyle = normalizeOptionalTagText(parsed.borderStyle);
    const zariTone = normalizeOptionalTagText(parsed.zariTone);
    const searchKeywords = Array.isArray(parsed.searchKeywords)
      ? parsed.searchKeywords.map(normalizeOptionalTagText).filter(Boolean).slice(0, 8)
      : [];

    if (!detectedSku && !category && !primaryColor && !pattern && searchKeywords.length === 0) {
      return null;
    }

    return {
      detectedSku,
      category,
      primaryColor,
      secondaryColors,
      pattern,
      borderStyle,
      zariTone,
      searchKeywords,
    };
  } catch {
    return null;
  }
}

function selectBestVariantForProduct(liveProduct, visualTags) {
  const variants = Array.isArray(liveProduct?.variants) ? liveProduct.variants : [];
  const inStockVariants = variants.filter(isVariantInStock);
  if (inStockVariants.length === 0) {
    return {
      ...liveProduct,
      colorName: liveProduct.colors?.[0] || null,
    };
  }

  let bestVariant = inStockVariants[0];
  let bestScore = -1;
  for (const v of inStockVariants) {
    const score = scoreColorAffinity(
      v?.color,
      visualTags?.primaryColor,
      visualTags?.secondaryColors
    );
    if (score > bestScore) {
      bestScore = score;
      bestVariant = v;
    }
  }

  return {
    ...liveProduct,
    price: bestVariant?.priceInr || liveProduct.price,
    priceInr: bestVariant?.priceInr || liveProduct.priceInr,
    image: String(bestVariant?.image || liveProduct.image || '').trim(),
    colorName: String(bestVariant?.color || '').trim() || liveProduct.colors?.[0] || null,
    variantCode: String(bestVariant?.code || '').trim() || null,
  };
}

/**
 * Resolves a detected OCR SKU/variant code directly against the live in-stock catalog.
 */
export function resolveOcrSkuCandidate(detectedSku, visualTags, liveCatalog = []) {
  const rawClean = String(detectedSku || '')
    .trim()
    .replace(/^(?:sku\s*[:#-]?\s*|#)/i, '')
    .trim();
  if (!rawClean || !Array.isArray(liveCatalog) || liveCatalog.length === 0) return null;

  const skuLower = rawClean.toLowerCase();
  const baseFromVariant = skuLower.includes('-') ? skuLower.replace(/-[^-]+$/, '') : skuLower;

  let matchedProduct = null;
  let matchedVariant = null;

  for (const p of liveCatalog) {
    if (!p || p.isArchived || !p.inStock) continue;
    const pidLower = String(p.id || '').trim().toLowerCase();
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const exactVar = variants.find((v) => String(v?.code || '').trim().toLowerCase() === skuLower);
    if (exactVar) {
      if (!isVariantInStock(exactVar)) return null;
      matchedProduct = p;
      matchedVariant = exactVar;
      break;
    }
    if (pidLower === skuLower || (baseFromVariant !== skuLower && pidLower === baseFromVariant)) {
      matchedProduct = p;
      break;
    }
  }

  if (!matchedProduct) return null;

  if (matchedVariant) {
    return {
      ...matchedProduct,
      price: matchedVariant.priceInr || matchedProduct.price,
      priceInr: matchedVariant.priceInr || matchedProduct.priceInr,
      image: String(matchedVariant.image || matchedProduct.image || '').trim(),
      colorName: String(matchedVariant.color || '').trim() || null,
      variantCode: String(matchedVariant.code || '').trim() || null,
      similarity: 1.0,
      matchSource: 'ocr_sku',
    };
  }

  const colorPicked = selectBestVariantForProduct(matchedProduct, visualTags);
  return {
    ...colorPicked,
    similarity: 0.99,
    matchSource: 'ocr_sku',
  };
}

function collectPatternTokens(visualTags) {
  const rawParts = [
    visualTags?.pattern,
    visualTags?.borderStyle,
    visualTags?.zariTone,
    ...(Array.isArray(visualTags?.searchKeywords) ? visualTags.searchKeywords : []),
  ]
    .filter(Boolean)
    .join(' ');
  const colorSet = new Set(
    [
      visualTags?.primaryColor,
      ...(Array.isArray(visualTags?.secondaryColors) ? visualTags.secondaryColors : []),
    ]
      .filter(Boolean)
      .map((c) => c.toLowerCase())
  );

  return extractSearchTokens(rawParts).filter(
    (t) =>
      !colorSet.has(t) &&
      !['saree', 'sarees', 'suit', 'suits', 'dupatta', 'lehenga', 'banarasi', 'silk'].includes(t)
  );
}

function tokenMatchesField(tok, field) {
  if (!tok || !field) return false;
  if (field.includes(tok)) return true;
  if (tok.length >= 5) {
    const stem = tok
      .replace(/ies$/i, 'y')
      .replace(/(?:es|ed|ing|s)$/i, '');
    if (stem.length >= 4 && field.includes(stem)) {
      return true;
    }
  }
  return false;
}

function scoreProductVisualAttributes(product, visualTags, patternTokens) {
  if (!visualTags) return { boost: 0, patternHits: 0, colorAffinity: 0 };

  let boost = 0;
  if (
    visualTags.category &&
    String(product.category || '').trim().toLowerCase() === visualTags.category.toLowerCase()
  ) {
    boost += 0.03;
  }

  const colorAffinity = scoreColorAffinity(
    product.colorName || (product.colors || []).join(' '),
    visualTags.primaryColor,
    visualTags.secondaryColors
  );
  boost += colorAffinity;

  const patternField = `${product.pattern || ''} ${product.work || ''} ${product.title || ''}`.toLowerCase();
  const fullField = `${patternField} ${product.fabric || ''} ${product.weave || ''}`.toLowerCase();

  let patternHits = 0;
  for (const tok of patternTokens) {
    if (tokenMatchesField(tok, patternField)) {
      patternHits += 1;
      boost += 0.045;
    } else if (tokenMatchesField(tok, fullField)) {
      patternHits += 1;
      boost += 0.025;
    }
  }

  return {
    boost: Math.min(0.32, boost),
    patternHits,
    colorAffinity,
  };
}

/**
 * Builds a hybrid, color-aware top-N candidate pool combining:
 * 1) OCR-detected SKU (highest priority if present & in stock)
 * 2) Color-aware variant deduplication across match_product_images (match_count = 20)
 * 3) Live catalog attribute/pattern fusion for cropped/occluded images
 */
export function buildHybridVisualCandidates({
  rpcMatches = [],
  liveCatalog = [],
  visualTags = null,
  maxCandidates = 6,
} = {}) {
  const limit = Math.max(1, Math.min(Number(maxCandidates) || 6, 8));
  const catalogById = new Map(liveCatalog.map((p) => [p.id, p]));
  const patternTokens = collectPatternTokens(visualTags);

  // 1. Direct OCR SKU match takes priority #1
  const ocrCandidate = resolveOcrSkuCandidate(visualTags?.detectedSku, visualTags, liveCatalog);

  // 2. Group RPC matches by product_id and select the best color-aligned in-stock variant per product
  const rpcByProduct = new Map();
  for (const row of Array.isArray(rpcMatches) ? rpcMatches : []) {
    const pid = String(row?.product_id || row?.id || '').trim();
    if (!pid) continue;

    const liveProduct = catalogById.get(pid);
    const hydrated = hydrateMatchedVariantCandidate(row, liveProduct);
    if (!hydrated) continue;

    const colorAffinity = scoreColorAffinity(
      hydrated.colorName,
      visualTags?.primaryColor,
      visualTags?.secondaryColors
    );
    const variantRank = Number(hydrated.similarity || 0) + colorAffinity;

    const existing = rpcByProduct.get(pid);
    if (!existing || variantRank > existing.variantRank) {
      rpcByProduct.set(pid, {
        candidate: { ...hydrated, matchSource: 'pgvector' },
        variantRank,
      });
    }
  }

  // Score RPC candidates with pattern/attribute alignment
  const pooledById = new Map();
  for (const [pid, entry] of rpcByProduct.entries()) {
    const attr = scoreProductVisualAttributes(entry.candidate, visualTags, patternTokens);
    const hybridScore = Number(entry.candidate.similarity || 0) + attr.boost;
    pooledById.set(pid, {
      candidate: entry.candidate,
      hybridScore,
    });
  }

  // 3. Attribute/Pattern fusion from live in-stock catalog (rescues tightly cropped items falling past top 20)
  if (visualTags && (patternTokens.length > 0 || visualTags.primaryColor)) {
    for (const p of liveCatalog) {
      if (!p || p.isArchived || !p.inStock) continue;
      if (
        visualTags.category &&
        String(p.category || '').trim().toLowerCase() !== visualTags.category.toLowerCase()
      ) {
        continue;
      }

      const colorVariant = selectBestVariantForProduct(p, visualTags);
      const attr = scoreProductVisualAttributes(colorVariant, visualTags, patternTokens);

      // Require strong pattern overlap (or explicit pattern + exact color) before injecting a non-RPC item
      const hasStrongAttributeMatch =
        attr.patternHits >= 2 ||
        (attr.patternHits >= 1 && (!visualTags.primaryColor || attr.colorAffinity >= 0.04));

      if (!hasStrongAttributeMatch) continue;

      const existing = pooledById.get(p.id);
      if (!existing) {
        const syntheticScore = 0.52 + attr.boost;
        pooledById.set(p.id, {
          candidate: {
            ...colorVariant,
            similarity: Number((0.52 + Math.min(0.25, attr.boost * 0.7)).toFixed(4)),
            matchSource: 'attribute_fusion',
          },
          hybridScore: syntheticScore,
        });
      }
    }
  }

  const results = [];
  const addedIds = new Set();
  if (ocrCandidate && !addedIds.has(ocrCandidate.id)) {
    results.push(ocrCandidate);
    addedIds.add(ocrCandidate.id);
  }

  const ranked = Array.from(pooledById.values()).sort((a, b) => b.hybridScore - a.hybridScore);
  for (const item of ranked) {
    if (results.length >= limit) break;
    if (addedIds.has(item.candidate.id)) continue;
    addedIds.add(item.candidate.id);
    results.push(item.candidate);
  }

  return results;
}

/**
 * End-to-end hybrid visual search:
 * 1. Runs gemini-embedding-2 (768 dims) & gemini-3.5-flash-lite visual-tag/OCR extraction in parallel.
 * 2. Queries Supabase RPC public.match_product_images with match_count = 20.
 * 3. Fuses OCR SKU match, color-aware pgvector variants, and live attribute matches (capped at 6).
 * 4. Fetches up to 6 resized candidate images (~560px, with raw fallback) and verifies side-by-side via gemini-3.5-flash-lite.
 * 5. Enforces strict 3-outcome visual match classification.
 */
export async function visualSearchCatalog({
  image,
  message = '',
  pagePath = '/',
  supabase,
  fetchImpl,
  apiKey,
  geminiClient,
  catalogOverride = null,
  matchThreshold = 0.48,
  matchCount = 20,
  maxCandidates = 6,
} = {}) {
  const client = supabase || (await getDefaultSupabaseClient());
  const embedFn = geminiClient?.embedMultimodalContent || defaultEmbedMultimodalContent;
  const chatFn = geminiClient?.generateChatReply || defaultGenerateChatReply;

  // Step 1: Parallel embedding (gemini-embedding-2) + lightweight OCR & visual-tag extraction (gemini-3.5-flash-lite)
  const [embedResult, visualTags] = await Promise.all([
    embedFn({
      image: { mimeType: image.mimeType, base64: image.base64 },
      outputDimensionality: 768,
      apiKey,
      fetchImpl,
    }),
    extractVisualSearchTags({
      image,
      message,
      chatFn,
      apiKey,
      fetchImpl,
    }),
  ]);
  const embedding = embedResult?.embedding;

  // Step 2: Query Supabase RPC public.match_product_images (up to 20 rows)
  let rpcMatches = [];
  if (client && typeof client.rpc === 'function') {
    const { data, error } = await client.rpc('match_product_images', {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });
    if (error) {
      throw new Error(`Visual match RPC failed: ${error.message || 'Unknown error'}`);
    }
    rpcMatches = Array.isArray(data) ? data : [];
  }

  // Step 3: Hydrate & fuse OCR + color-aware pgvector + live catalog attribute candidates (max 6)
  const liveCatalog = await loadLiveCatalog({ supabase: client, catalogOverride });
  const candidates = buildHybridVisualCandidates({
    rpcMatches,
    liveCatalog,
    visualTags,
    maxCandidates: Math.min(Number(maxCandidates) || 6, 6),
  });

  // No in-stock candidates -> strict no_match outcome
  if (candidates.length === 0) {
    return {
      outcome: 'no_match',
      reply:
        "We don't have this exact piece in our ready catalogue right now. Share this design with our Varanasi team on WhatsApp — we can check upcoming loom batches or develop it via custom weaving (from 4 pcs for Handloom or 50 pcs for Powerloom).",
      products: [],
      handoff: {
        show: true,
        reason: 'no_visual_match',
        whatsappUrl: buildWhatsAppHandoffUrl(
          message || 'Looking for a matching Banarasi piece from my uploaded photo.',
          pagePath,
          'no_visual_match'
        ),
      },
    };
  }

  // Step 4: Safely fetch up to 6 resized (~560px) candidate images (with raw fallback) and verify side-by-side
  const candidateImages = await Promise.all(
    candidates.map((c) =>
      fetchCandidateImageWithFallback(c.image, {
        fetchImpl,
        preset: CANDIDATE_VISION_IMAGE_PRESET,
      })
    )
  );

  const verificationParts = [
    {
      text: [
        'Compare the CUSTOMER UPLOADED IMAGE against the WEAVE 365 CATALOG ITEMS below.',
        'Classify strictly into one outcome:',
        '- "exact_or_close": One or more items are the exact design or an unmistakably close match in motif/pattern geometry (e.g. diagonal stripes vs buti vs jaal), border weave, and colour — even if the customer upload is tightly cropped or shows UI overlays like "<", ">", or "4/12".',
        '- "similar_only": None is the exact design, but items are genuinely similar Banarasi pieces in style/colour/weave.',
        '- "no_match": Items are visually unrelated or not a meaningful match.',
        'HARD RULES:',
        '- NEVER claim or verify whether the uploaded customer photo is "pure silk" or "handloom".',
        '- Ignore UI icons, carousel arrows, page counters ("4/12"), and tighter crops when judging exact design match.',
        '- Carefully inspect EVERY candidate ITEM individually before deciding — an exact match may be later in the list.',
        '- Only return ref codes from the provided list in "matchedIds".',
        '- In "summary", speak naturally to the customer using the product title and color (e.g., "Katan Silk Zari Work Diagonal Stripe Banarasi Saree in Blue") and verified fabricTag if applicable. NEVER write "Candidate", "Candidate 1", "ID:", "SKU:", or numeric SKU codes in "summary".',
        '- Return STRICT JSON only: {"outcome":"exact_or_close"|"similar_only"|"no_match","matchedIds":["..."],"summary":"short 1-2 sentence customer-facing explanation"}',
        message ? `Customer note: ${message}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    },
    { text: 'CUSTOMER UPLOADED IMAGE:' },
    {
      inlineData: {
        mimeType: image.mimeType,
        data: image.base64,
      },
    },
  ];

  candidates.forEach((cand, idx) => {
    const fabricDesc = cand.fabricLabel ? `Verified Fabric Tag: ${cand.fabricLabel}` : 'Verified Fabric Tag: Unspecified';
    const displayTitle = cand.colorName ? `${cand.title} in ${cand.colorName}` : cand.title;
    const ocrNote = cand.matchSource === 'ocr_sku' ? ' | MatchSignal: ExactCodeDetected' : '';
    verificationParts.push({
      text: `ITEM ${idx + 1} | Ref: ${cand.id} | Product: ${displayTitle} | Price: ₹${cand.priceInr || 'On request'} | ${fabricDesc} | Similarity: ${cand.similarity.toFixed(3)}${ocrNote}`,
    });
    if (candidateImages[idx]) {
      verificationParts.push({
        inlineData: {
          mimeType: candidateImages[idx].mimeType,
          data: candidateImages[idx].base64,
        },
      });
    }
  });

  const verificationRes = await chatFn({
    contents: [{ role: 'user', parts: verificationParts }],
    thinkingLevel: 'low',
    temperature: 0.1,
    maxOutputTokens: 512,
    responseMimeType: 'application/json',
    apiKey,
    fetchImpl,
  });

  const parsed = parseVerificationJson(verificationRes.text);
  const rawOutcome = parsed?.outcome;
  const validCandidateMap = new Map(candidates.map((c) => [c.id, c]));
  const selectedProducts = Array.isArray(parsed?.matchedIds)
    ? parsed.matchedIds.map((id) => validCandidateMap.get(String(id))).filter(Boolean)
    : [];

  const outcome =
    rawOutcome === 'exact_or_close' || rawOutcome === 'similar_only' || rawOutcome === 'no_match'
      ? rawOutcome
      : 'similar_only';

  const safeSummary = enforceUploadedPhotoPurityGuard(
    sanitizeVisualSummary(parsed?.summary || '', candidates)
  );

  if (outcome === 'exact_or_close' && selectedProducts.length > 0) {
    const cards = selectedProducts.slice(0, 3).map(toChatProductCard);
    return {
      outcome: 'exact_or_close',
      reply:
        safeSummary ||
        `Here ${cards.length === 1 ? 'is the matching piece' : 'are the matching pieces'} currently in stock from our ready catalogue:`,
      products: cards,
      handoff: {
        show: false,
        reason: null,
        whatsappUrl: buildWhatsAppHandoffUrl(message, pagePath, ''),
      },
    };
  }

  if (outcome === 'similar_only' || (outcome === 'exact_or_close' && selectedProducts.length === 0)) {
    const fallbackCards = (selectedProducts.length > 0 ? selectedProducts : candidates)
      .slice(0, 3)
      .map(toChatProductCard);

    return {
      outcome: 'similar_only',
      reply:
        `We don't have this exact design in stock, but here are similar Banarasi pieces available now${safeSummary ? ` — ${safeSummary}` : '.'}`,
      products: fallbackCards,
      handoff: {
        show: false,
        reason: null,
        whatsappUrl: buildWhatsAppHandoffUrl(message, pagePath, ''),
      },
    };
  }

  // Strict Outcome 3: no_match
  return {
    outcome: 'no_match',
    reply:
      "We don't have this exact piece in our ready catalogue. Please connect with us on WhatsApp for direct Varanasi loom sourcing or custom weaving (MOQ from 4 pcs for Handloom or 50 pcs for Powerloom).",
    products: [],
    handoff: {
      show: true,
      reason: 'no_visual_match',
      whatsappUrl: buildWhatsAppHandoffUrl(
        message || 'Looking for this Banarasi design via loom sourcing / custom weaving.',
        pagePath,
        'no_visual_match'
      ),
    },
  };
}
