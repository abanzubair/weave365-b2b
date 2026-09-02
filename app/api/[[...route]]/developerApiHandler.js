/**
 * @file developerApiHandler.js
 * @description Cloudflare Edge-optimized B2B Developer API handler for Weave365.
 * Provides high-speed, cached endpoints for external reseller websites (Shopify, WooCommerce, PrestaShop)
 * while strictly protecting Supabase Free Tier quotas with zero DB bloat.
 */

export const runtime = 'edge';

let supabaseInstance = null;
export function _setSupabaseClientForTesting(client) {
  supabaseInstance = client;
}

async function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const { createClient } = await import('@supabase/supabase-js');
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

const defaultCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Vary': 'Origin, X-API-Key, Authorization',
};

function getCorsHeaders(request, clientWebsite = null) {
  const origin = request?.headers?.get('origin');
  if (!origin) return defaultCorsHeaders;

  const allowedOrigins = [
    'https://www.weave365.com',
    'https://weave365.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
  if (clientWebsite) {
    try {
      allowedOrigins.push(new URL(clientWebsite).origin);
    } catch {}
  }

  const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.weave365.com');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Vary': 'Origin, X-API-Key, Authorization',
  };
}

// Authenticated responses are account-specific and MUST NOT be cached by public/shared CDN caches
const securePrivateHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Vary': 'X-API-Key, Authorization, Origin',
  ...defaultCorsHeaders,
};

// Edge In-Memory Cache for API Keys (TTL: 60 seconds) to prevent repeated DB hits
const keyMemoryCache = new Map();
const KEY_CACHE_TTL_MS = 60 * 1000;

export function _clearKeyMemoryCacheForTesting() {
  keyMemoryCache.clear();
}

/**
 * Compute SHA-256 hash using native Web Crypto API (Edge-safe)
 */
export async function hashApiKey(rawKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Authenticate API Key and check monthly quota.
 * Strictly requires full unmasked API secret via X-API-Key or Authorization: Bearer header.
 */
async function authenticateApiKey(request, supabase) {
  const rawKey = (
    request.headers.get('x-api-key') ||
    (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  ).trim();

  if (!rawKey) {
    return {
      authenticated: false,
      status: 401,
      error: 'Missing API Key. Pass your key in the "X-API-Key" or "Authorization: Bearer <key>" header.',
    };
  }

  // Reject masked placeholder strings (e.g. w365_live_... or bullet points)
  if (rawKey.includes('...') || rawKey.includes('••••')) {
    return {
      authenticated: false,
      status: 401,
      error: 'Invalid API Key. Masked key prefixes cannot be used for authentication. Pass the full unmasked secret.',
    };
  }

  const now = Date.now();
  let keyRecord = null;

  const keyHash = await hashApiKey(rawKey);
  const cached = keyMemoryCache.get(keyHash);
  if (cached && (now - cached.timestamp < KEY_CACHE_TTL_MS)) {
    keyRecord = cached.data;
  } else {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .maybeSingle();

    if (!error && data) {
      keyRecord = data;
      keyMemoryCache.set(keyHash, { data: keyRecord, timestamp: now });
    }
  }

  if (!keyRecord) {
    return {
      authenticated: false,
      status: 401,
      error: 'Invalid or revoked API Key. Please check your developer dashboard or contact support.',
    };
  }

  if (!keyRecord.is_active) {
    return {
      authenticated: false,
      status: 403,
      error: 'This API Key is currently deactivated. Please contact Weave365 admin.',
    };
  }

  // Calculate current month usage across user account (from 1st of current month)
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  const dateStr = currentMonthStart.toISOString().split('T')[0];

  let usageQuery = supabase
    .from('api_usage_daily')
    .select('total_requests')
    .gte('usage_date', dateStr);

  if (keyRecord.user_id) {
    usageQuery = usageQuery.or(`api_key_id.eq.${keyRecord.id},user_id.eq.${keyRecord.user_id}`);
  } else {
    usageQuery = usageQuery.eq('api_key_id', keyRecord.id);
  }

  const { data: usageData } = await usageQuery;
  const monthTotal = (usageData || []).reduce((sum, r) => sum + (r.total_requests || 0), 0);

  if (monthTotal >= keyRecord.monthly_quota) {
    // Record rate limited request asynchronously
    void (async () => {
      try {
        await supabase.rpc('record_api_request', {
          p_key_id: keyRecord.id,
          p_is_success: false,
          p_is_rate_limited: true,
        });
      } catch (e) {
        console.warn('[developerApi] record_api_request error:', e);
      }
    })();

    return {
      authenticated: false,
      status: 429,
      error: `Monthly API request quota reached (${keyRecord.monthly_quota} requests). Upgrade to the Growth Partner Tier (₹699/mo) or contact support on WhatsApp to increase your limit.`,
      code: 'QUOTA_EXCEEDED',
      isQuotaExceeded: true,
      keyRecord,
    };
  }

  // Record successful request asynchronously
  void (async () => {
    try {
      await supabase.rpc('record_api_request', {
        p_key_id: keyRecord.id,
        p_is_success: true,
        p_is_rate_limited: false,
      });
    } catch (e) {
      console.warn('[developerApi] record_api_request error:', e);
    }
  })();

  return {
    authenticated: true,
    keyRecord,
    monthTotal,
  };
}

/**
 * Establish authorization boundary for products.
 * The client can NEVER access products outside its authorized catalog.
 */
export function getAuthorizedProducts(products, keyRecord) {
  if (!Array.isArray(products)) return [];
  const isCurated = keyRecord?.catalog_mode === 'curated' || (Array.isArray(keyRecord?.selected_skus) && keyRecord.selected_skus.length > 0);
  if (!isCurated) {
    return products;
  }

  const authorizedSet = new Set((keyRecord?.selected_skus || []).map(s => String(s).trim().toLowerCase()).filter(Boolean));
  return products.filter((p) => {
    const pId = String(p.id || '').trim().toLowerCase();
    const pGroup = String(p.groupKey || '').trim().toLowerCase();
    if (authorizedSet.has(pId) || authorizedSet.has(pGroup)) return true;
    if (Array.isArray(p.variants) && p.variants.some(v => authorizedSet.has(String(v.code || '').trim().toLowerCase()))) {
      return true;
    }
    return false;
  });
}

/**
 * Apply live stock status overrides to product list
 */
function applyStockOverrides(products, stockRows) {
  if (!Array.isArray(products) || !Array.isArray(stockRows) || !stockRows.length) return products;
  const map = new Map();
  for (const row of stockRows) {
    if (row.product_id) map.set(row.product_id, row);
  }
  return products.map((product) => {
    const key = product.id || product.groupKey;
    const override = map.get(key);
    if (!override) return product;
    const stockKey = override.stock_status;
    const stockLabel = override.stock_status_label;
    const nonStockTags = (product.statusTags || []).filter(
      (tag) => !['ready-stock', 'pre-order', 'out-of-stock', 'back-soon', 'archived'].includes(tag.key)
    );
    const updatedTags = [{ key: stockKey, label: stockLabel }, ...nonStockTags];
    return {
      ...product,
      stockStatusOverride: stockKey,
      stockStatusLabel: stockLabel,
      stockLastUpdatedIST: override.updated_at_ist,
      statusTags: updatedTags,
      isOutOfStock: stockKey === 'out-of-stock',
      isReadyStock: stockKey === 'ready-stock',
      isPreOrder: stockKey === 'pre-order',
      isBackSoon: stockKey === 'back-soon',
      isArchived: stockKey === 'archived',
    };
  });
}

/**
 * Transform standard products into Shopify-ready feed format (Reseller Price Only)
 */
function formatForShopify(products) {
  return products.map((p) => {
    const handle = (p.title || p.name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const firstPrices = p.variants?.[0]?.prices || {};
    const resellerPrice = Number(firstPrices.b2r || firstPrices.single || p.resellerPrice || p.price || 0);
    const suggestedMrp = Number(firstPrices.single || p.mrp || p.suggestedMrp || Math.round(resellerPrice * 1.5));

    const hasExplicitVariants = Array.isArray(p.variants) && p.variants.length > 0;
    const shopifyVariants = hasExplicitVariants
      ? p.variants.map((v, idx) => {
          const vPrices = v.prices || {};
          const vPrice = Number(vPrices.b2r || vPrices.single || resellerPrice);
          return {
            id: `${p.id || p.groupKey}-${idx}`,
            title: v.color || `Option ${idx + 1}`,
            sku: v.code || `${p.id || p.groupKey}-${(v.color || 'VAR').toUpperCase().slice(0, 3)}`,
            price: vPrice,
            compare_at_price: suggestedMrp,
            inventory_management: 'shopify',
            inventory_policy: 'deny',
            inventory_quantity: p.isOutOfStock ? 0 : 5,
            option1: v.color || 'Default',
            image: v.image || p.images?.[0] || '',
          };
        })
      : (p.colors || ['Default']).map((color, idx) => ({
          id: `${p.id || p.groupKey}-${idx}`,
          title: color,
          sku: `${p.id || p.groupKey}-${color.toUpperCase().slice(0, 3)}`,
          price: resellerPrice,
          compare_at_price: suggestedMrp,
          inventory_management: 'shopify',
          inventory_policy: 'deny',
          inventory_quantity: p.isOutOfStock ? 0 : 5,
          option1: color,
        }));

    return {
      id: p.id || p.groupKey,
      title: p.title || p.name,
      handle: handle,
      body_html: `<p>${p.description || p.fullDescription || p.title}</p><p><strong>Fabric:</strong> ${p.fabric || 'Pure Silk'}<br><strong>Weave:</strong> ${p.weave || 'Handloom'}<br><strong>Authenticity:</strong> 100% Certified Weave365 Authentic</p>`,
      vendor: 'Weave365 Wholesale',
      product_type: p.category || 'Sarees',
      tags: [p.fabric, p.weave, p.category, p.stockStatusLabel || 'Ready Stock'].filter(Boolean).join(', '),
      published: !p.isOutOfStock && !p.isArchived,
      variants: shopifyVariants,
      images: (p.images || []).map((src, pos) => ({
        src,
        position: pos + 1,
        alt: `${p.title} - View ${pos + 1}`,
      })),
    };
  });
}

/**
 * Main GET router for /api/v1/*
 */
export async function handleDeveloperApiGet(request, pathSegments) {
  const supabase = await getSupabase();
  if (!supabase) {
    return Response.json({ status: 'error', code: 'DATABASE_ERROR', message: 'Database unconfigured' }, { status: 500, headers: defaultCorsHeaders });
  }

  const endpoint = pathSegments[1] || ''; // e.g. 'catalog', 'stock-status', 'products', 'me'
  const { searchParams } = new URL(request.url);

  // 1. Authenticate Request
  const auth = await authenticateApiKey(request, supabase);
  if (!auth.authenticated) {
    const errorBody = {
      status: 'error',
      code: auth.code || 'UNAUTHORIZED',
      message: auth.error,
      upgrade_info: auth.isQuotaExceeded ? {
        current_tier: auth.keyRecord?.tier,
        monthly_quota: auth.keyRecord?.monthly_quota,
        growth_tier_price: '₹699/month (20,000 requests)',
        whatsapp_support: '+91 9919101369',
      } : undefined,
    };
    return Response.json(errorBody, { status: auth.status, headers: defaultCorsHeaders });
  }

  // 2. Route: /api/v1/catalog
  if (endpoint === 'catalog') {
    const [{ data: sheetRow }, { data: stockData }] = await Promise.all([
      supabase.from('sheet_data').select('csv_data').eq('id', 'products_json').single(),
      supabase.from('vendor_product_stock').select('*'),
    ]);

    let products = [];
    try {
      products = JSON.parse(sheetRow?.csv_data || '[]');
    } catch {
      products = [];
    }

    if (Array.isArray(stockData) && stockData.length > 0) {
      products = applyStockOverrides(products, stockData);
    }

    const cors = getCorsHeaders(request, auth.keyRecord?.client_website);

    // Mandatory Curated Product Selection Filter:
    // Restrict products to the authenticated account's authorized catalog first
    const authorizedProducts = getAuthorizedProducts(products, auth.keyRecord);

    let resultProducts = authorizedProducts;

    // Optional Category Filtering (within authorized catalog)
    const category = searchParams.get('category');
    if (category) {
      resultProducts = resultProducts.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
    }

    // Optional SKU filtering: ?skus= can only narrow authorized products, never expand access
    const skusParam = searchParams.get('skus') || searchParams.get('ids');
    if (skusParam) {
      const requestedSkus = new Set(skusParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
      resultProducts = resultProducts.filter((p) => {
        const pId = String(p.id || '').trim().toLowerCase();
        const pGroup = String(p.groupKey || '').trim().toLowerCase();
        if (requestedSkus.has(pId) || requestedSkus.has(pGroup)) return true;
        if (Array.isArray(p.variants) && p.variants.some(v => requestedSkus.has(String(v.code || '').trim().toLowerCase()))) return true;
        return false;
      });
    }

    // Format for Shopify if requested
    const format = searchParams.get('format');
    if (format === 'shopify' || format === 'matrixify') {
      const shopifyFeed = formatForShopify(resultProducts);
      return Response.json({ status: 'success', total_products: shopifyFeed.length, products: shopifyFeed }, {
        status: 200,
        headers: { ...securePrivateHeaders, ...cors },
      });
    }

    // Standard B2B Reseller Catalog Feed (Strictly Reseller Price Only)
    return Response.json({
      status: 'success',
      tier: auth.keyRecord.tier,
      client_name: auth.keyRecord.client_name,
      total_products: resultProducts.length,
      last_synced_at: new Date().toISOString(),
      products: resultProducts.map((p) => {
        const firstPrices = p.variants?.[0]?.prices || {};
        const resellerPrice = Number(firstPrices.b2r || firstPrices.single || p.resellerPrice || p.price || 0);

        const extractedColors = Array.isArray(p.colorOptions) && p.colorOptions.length > 0
          ? p.colorOptions.map(c => c.name).filter(Boolean)
          : (Array.isArray(p.colors) && p.colors.length > 0
            ? p.colors
            : (Array.isArray(p.variants)
              ? Array.from(new Set(p.variants.map(v => v.color).filter(Boolean)))
              : []));

        const structuredVariants = (p.variants || []).map(v => {
          const vPrices = v.prices || {};
          const vPrice = Number(vPrices.b2r || vPrices.single || resellerPrice);
          return {
            code: v.code,
            sku: v.code,
            color: v.color || '',
            image: v.image || '',
            price: vPrice,
          };
        });

        return {
          id: p.id || p.groupKey,
          sku: p.id || p.groupKey,
          title: p.title || p.name,
          category: p.category || 'Sarees',
          fabric: p.fabric || 'Pure Silk',
          weave: p.weave || 'Handloom',
          price: resellerPrice,
          currency: 'INR',
          stock_status: p.stockStatusOverride || (p.isOutOfStock ? 'out-of-stock' : 'ready-stock'),
          stock_status_label: p.stockStatusLabel || (p.isOutOfStock ? 'Out of Stock' : 'Ready Stock'),
          is_available: !p.isOutOfStock && !p.isArchived,
          colors: extractedColors,
          color_options: p.colorOptions || [],
          variants: structuredVariants,
          images: p.images || [],
          description: p.description || '',
        };
      }),
    }, {
      status: 200,
      headers: { ...securePrivateHeaders, ...cors },
    });
  }

  // 3. Route: /api/v1/stock-status
  if (endpoint === 'stock-status') {
    const [{ data: sheetRow }, { data: stockData }] = await Promise.all([
      supabase.from('sheet_data').select('csv_data').eq('id', 'products_json').single(),
      supabase.from('vendor_product_stock').select('*'),
    ]);

    let products = [];
    try {
      products = JSON.parse(sheetRow?.csv_data || '[]');
    } catch {
      products = [];
    }

    if (Array.isArray(stockData) && stockData.length > 0) {
      products = applyStockOverrides(products, stockData);
    }

    const cors = getCorsHeaders(request, auth.keyRecord?.client_website);

    // Mandatory Curated Stock Filter: Restrict to authorized catalog FIRST
    const authorizedProducts = getAuthorizedProducts(products, auth.keyRecord);
    let resultProducts = authorizedProducts;

    const stockSkusParam = searchParams.get('skus') || searchParams.get('ids') || searchParams.get('sku');
    if (stockSkusParam) {
      const requestedSkus = new Set(stockSkusParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
      resultProducts = resultProducts.filter((p) => {
        const pId = String(p.id || '').trim().toLowerCase();
        const pGroup = String(p.groupKey || '').trim().toLowerCase();
        if (requestedSkus.has(pId) || requestedSkus.has(pGroup)) return true;
        if (Array.isArray(p.variants) && p.variants.some(v => requestedSkus.has(String(v.code || '').trim().toLowerCase()))) return true;
        return false;
      });
    }

    const stockMap = {};
    resultProducts.forEach((p) => {
      const key = p.id || p.groupKey;
      stockMap[key] = {
        title: p.title || p.name,
        status: p.stockStatusOverride || (p.isOutOfStock ? 'out-of-stock' : 'ready-stock'),
        is_available: !p.isOutOfStock && !p.isArchived,
        stock_label: p.stockStatusLabel || (p.isOutOfStock ? 'Out of Stock' : 'Ready Stock'),
        updated_at: p.stockLastUpdatedIST || new Date().toISOString(),
      };
    });

    return Response.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      total_items: Object.keys(stockMap).length,
      stock_map: stockMap,
    }, {
      status: 200,
      headers: { ...securePrivateHeaders, ...cors },
    });
  }

  // 4. Route: /api/v1/products (Single or Batch product query - Reseller Price Only)
  if (endpoint === 'products' || endpoint === 'product') {
    const cors = getCorsHeaders(request, auth.keyRecord?.client_website);
    const skuParam = searchParams.get('sku') || searchParams.get('id') || searchParams.get('skus') || searchParams.get('ids') || pathSegments[2];
    if (!skuParam) {
      return Response.json({
        status: 'error',
        code: 'MISSING_SKU',
        message: 'Please provide product SKU(s) via /api/v1/products/:sku or ?sku=..., ?skus=SKU1,SKU2',
      }, { status: 400, headers: cors });
    }

    const [{ data: sheetRow }, { data: stockData }] = await Promise.all([
      supabase.from('sheet_data').select('csv_data').eq('id', 'products_json').single(),
      supabase.from('vendor_product_stock').select('*'),
    ]);

    let products = [];
    try {
      products = JSON.parse(sheetRow?.csv_data || '[]');
    } catch {
      products = [];
    }

    if (Array.isArray(stockData) && stockData.length > 0) {
      products = applyStockOverrides(products, stockData);
    }

    // Restrict product search to authorized catalog FIRST
    const authorizedProducts = getAuthorizedProducts(products, auth.keyRecord);
    const skuList = skuParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

    // If multiple SKUs requested (Batch Mode)
    if (skuList.length > 1) {
      const skuSet = new Set(skuList);
      const matchedList = authorizedProducts.filter((p) => {
        const pId = String(p.id || '').trim().toLowerCase();
        const pGroup = String(p.groupKey || '').trim().toLowerCase();
        if (skuSet.has(pId) || skuSet.has(pGroup)) return true;
        if (Array.isArray(p.variants) && p.variants.some(v => skuSet.has(String(v.code || '').trim().toLowerCase()))) return true;
        return false;
      });

      return Response.json({
        status: 'success',
        total_products: matchedList.length,
        products: matchedList.map((matched) => {
          const firstPrices = matched.variants?.[0]?.prices || {};
          const resellerPrice = Number(firstPrices.b2r || firstPrices.single || matched.resellerPrice || matched.price || 0);
          return {
            id: matched.id || matched.groupKey,
            sku: matched.id || matched.groupKey,
            title: matched.title || matched.name,
            category: matched.category || 'Sarees',
            fabric: matched.fabric || 'Pure Silk',
            weave: matched.weave || 'Handloom',
            price: resellerPrice,
            currency: 'INR',
            stock_status: matched.stockStatusOverride || (matched.isOutOfStock ? 'out-of-stock' : 'ready-stock'),
            stock_status_label: matched.stockStatusLabel || (matched.isOutOfStock ? 'Out of Stock' : 'Ready Stock'),
            is_available: !matched.isOutOfStock && !matched.isArchived,
            colors: matched.colors || [],
            images: matched.images || [],
            description: matched.description || '',
          };
        }),
      }, {
        status: 200,
        headers: { ...securePrivateHeaders, ...cors },
      });
    }

    // Single SKU Mode: strictly check inside authorizedProducts
    const singleSku = skuList[0];
    const matched = authorizedProducts.find((p) => {
      const pId = String(p.id || '').trim().toLowerCase();
      const pGroup = String(p.groupKey || '').trim().toLowerCase();
      if (pId === singleSku || pGroup === singleSku) return true;
      if (Array.isArray(p.variants) && p.variants.some(v => String(v.code || '').trim().toLowerCase() === singleSku)) return true;
      return false;
    });

    if (!matched) {
      return Response.json({
        status: 'error',
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found.',
      }, { status: 404, headers: cors });
    }

    const firstPrices = matched.variants?.[0]?.prices || {};
    const resellerPrice = Number(firstPrices.b2r || firstPrices.single || matched.resellerPrice || matched.price || 0);

    return Response.json({
      status: 'success',
      product: {
        id: matched.id || matched.groupKey,
        sku: matched.id || matched.groupKey,
        title: matched.title || matched.name,
        category: matched.category || 'Sarees',
        fabric: matched.fabric || 'Pure Silk',
        weave: matched.weave || 'Handloom',
        price: resellerPrice,
        currency: 'INR',
        stock_status: matched.stockStatusOverride || (matched.isOutOfStock ? 'out-of-stock' : 'ready-stock'),
        stock_status_label: matched.stockStatusLabel || (matched.isOutOfStock ? 'Out of Stock' : 'Ready Stock'),
        is_available: !matched.isOutOfStock && !matched.isArchived,
        colors: matched.colors || [],
        images: matched.images || [],
        description: matched.description || '',
      },
    }, {
      status: 200,
      headers: { ...securePrivateHeaders, ...cors },
    });
  }

  // 5. Route: /api/v1/me (Developer metrics & credentials - strictly sanitized, no secrets/internal IDs)
  if (endpoint === 'me') {
    const cors = getCorsHeaders(request, auth.keyRecord?.client_website);

    // Sanitize client_website: if it contains localhost, resolve base via configured siteUrl
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com';
    let clientWebsite = auth.keyRecord.client_website || '';
    if (clientWebsite.includes('localhost') || clientWebsite.includes('127.0.0.1')) {
      try {
        const parsed = new URL(clientWebsite);
        const baseParsed = new URL(configuredSiteUrl);
        clientWebsite = `${baseParsed.origin}${parsed.pathname}${parsed.search}`;
      } catch {
        clientWebsite = configuredSiteUrl;
      }
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Expose only non-sensitive aggregation fields (no internal api_key_id or user_id)
    const { data: usageHistory } = await supabase
      .from('api_usage_daily')
      .select('usage_date, total_requests, successful_requests, rate_limited_requests')
      .eq('api_key_id', auth.keyRecord.id)
      .gte('usage_date', dateStr)
      .order('usage_date', { ascending: true });

    return Response.json({
      status: 'success',
      client_name: auth.keyRecord.client_name,
      client_website: clientWebsite,
      tier: auth.keyRecord.tier,
      monthly_quota: auth.keyRecord.monthly_quota,
      month_total_used: auth.monthTotal,
      remaining_quota: Math.max(0, auth.keyRecord.monthly_quota - auth.monthTotal),
      rate_limit_rps: auth.keyRecord.rate_limit_rps,
      is_active: auth.keyRecord.is_active,
      orders_enabled: Boolean(auth.keyRecord.orders_enabled),
      usage_history: usageHistory || [],
    }, {
      status: 200,
      headers: { ...securePrivateHeaders, ...cors },
    });
  }

  // 6. Route: /api/v1/orders (Fetch Reseller Orders & Live Fulfillment/Tracking Status)
  if (endpoint === 'orders' || endpoint === 'order') {
    const cors = getCorsHeaders(request, auth.keyRecord?.client_website);

    // Backend enforcement of Admin-Controlled Order API Access Toggle
    if (!auth.keyRecord.orders_enabled) {
      return Response.json({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'Order API access is not enabled for this API key.',
      }, { status: 403, headers: cors });
    }

    const singleOrderId = searchParams.get('id') || searchParams.get('order_id') || pathSegments[2];
    const resellerOrderId = searchParams.get('reseller_order_id');
    const statusFilter = searchParams.get('status');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    // STRICT ACCOUNT ISOLATION: Scoped strictly to authenticated api_key_id or user_id
    let apiOrdersQuery = supabase
      .from('api_orders')
      .select('*');

    let ordersQuery = supabase
      .from('orders')
      .select('*');

    let inquiriesQuery = supabase
      .from('inquiries')
      .select('*')
      .eq('inquiry_type', 'reseller_api_order');

    if (auth.keyRecord.user_id) {
      apiOrdersQuery = apiOrdersQuery.or(`api_key_id.eq.${auth.keyRecord.id},user_id.eq.${auth.keyRecord.user_id}`);
      ordersQuery = ordersQuery.eq('user_id', auth.keyRecord.user_id);
      inquiriesQuery = inquiriesQuery.eq('user_id', auth.keyRecord.user_id);
    } else {
      apiOrdersQuery = apiOrdersQuery.eq('api_key_id', auth.keyRecord.id);
      ordersQuery = ordersQuery.eq('business_name', auth.keyRecord.client_name || '__unmatched__');
      inquiriesQuery = inquiriesQuery.eq('business_name', auth.keyRecord.client_name || '__unmatched__');
    }

    if (singleOrderId) {
      apiOrdersQuery = apiOrdersQuery.eq('id', singleOrderId);
      ordersQuery = ordersQuery.eq('id', singleOrderId);
      inquiriesQuery = inquiriesQuery.eq('id', singleOrderId);
    }

    if (statusFilter && statusFilter !== 'all') {
      apiOrdersQuery = apiOrdersQuery.eq('status', statusFilter.toLowerCase());
      ordersQuery = ordersQuery.eq('status', statusFilter.toLowerCase());
      inquiriesQuery = inquiriesQuery.eq('status', statusFilter.toLowerCase());
    }

    const [{ data: apiOrdersData }, { data: ordersData }, { data: inqData }] = await Promise.all([
      apiOrdersQuery.order('created_at', { ascending: false }).limit(limit),
      ordersQuery.order('created_at', { ascending: false }).limit(limit),
      inquiriesQuery.order('created_at', { ascending: false }).limit(limit),
    ]);

    // Normalize api_orders fields to match unified order representation
    const normalizedApiOrders = (apiOrdersData || []).map(a => ({
      ...a,
      _sourceTable: 'api_orders',
      buyer_name: a.recipient_name,
      phone: a.recipient_phone,
      email: a.recipient_email,
      pincode: a.recipient_pincode,
      is_dropship: true,
      dropship_sender_name: a.sender_name,
      dropship_sender_phone: a.sender_phone,
      dropship_recipient_name: a.recipient_name,
      dropship_recipient_phone: a.recipient_phone,
      dropship_recipient_address: a.recipient_address,
      dropship_recipient_city: a.recipient_city,
      dropship_recipient_state: a.recipient_state,
      dropship_recipient_pincode: a.recipient_pincode,
      dropship_packing_preference: a.packing_preference,
      message: a.shipping_notes || a.message,
    }));

    const combinedRaw = [...normalizedApiOrders, ...(ordersData || []), ...(inqData || [])];
    // Deduplicate by ID
    const seen = new Set();
    const rawOrders = [];
    for (const item of combinedRaw) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        rawOrders.push(item);
      }
    }
    rawOrders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const formatStatusLabel = (status) => {
      switch ((status || '').toLowerCase()) {
        case 'new': return 'New / Under Review';
        case 'verified': return 'Payment & Stock Verified';
        case 'processing': return 'Packaging & Quality Check';
        case 'dispatched': return 'Dispatched / In Transit';
        case 'delivered': return 'Delivered';
        case 'cancelled': return 'Cancelled';
        default: return status || 'New';
      }
    };

    let list = rawOrders.slice(offset, offset + limit).map((o) => {
      let extractedResellerOrderId = o.reseller_order_id || null;
      if (!extractedResellerOrderId && o.message) {
        const match = o.message.match(/\[API Dropship Order #([^\]]+)\]/);
        if (match && match[1] !== 'N/A') extractedResellerOrderId = match[1];
      }

      return {
        id: o.id,
        reseller_order_id: extractedResellerOrderId,
        created_at: o.created_at,
        updated_at: o.updated_at,
        status: o.status || 'new',
        status_label: formatStatusLabel(o.status),
        is_dropship: Boolean(o.is_dropship || o._sourceTable === 'api_orders'),
        tracking: {
          carrier: o.tracking_carrier || null,
          tracking_number: o.tracking_number || null,
          tracking_message: o.tracking_message || null,
          tracking_url: `https://www.weave365.com/order-tracking/${o.id}`,
          is_dispatched: ['dispatched', 'delivered'].includes((o.status || '').toLowerCase()),
        },
        customer: {
          name: o.dropship_recipient_name || o.buyer_name,
          phone: o.dropship_recipient_phone || o.phone,
          email: o.email || null,
          address: o.dropship_recipient_address || null,
          city: o.dropship_recipient_city || null,
          state: o.dropship_recipient_state || null,
          pincode: o.dropship_recipient_pincode || o.pincode,
        },
        sender: {
          name: o.dropship_sender_name || o.business_name || 'B2B Partner Store',
          phone: o.dropship_sender_phone || null,
        },
        items: o.items || [],
        notes: o.shipping_notes || o.message || '',
      };
    });

    if (resellerOrderId) {
      list = list.filter(o => o.reseller_order_id === resellerOrderId);
    }

    if (singleOrderId) {
      if (list.length === 0) {
        return Response.json({ status: 'error', error: `Order with ID '${singleOrderId}' not found.` }, { status: 404, headers: cors });
      }
      return Response.json({
        status: 'success',
        order: list[0],
      }, { status: 200, headers: { ...securePrivateHeaders, ...cors } });
    }

    return Response.json({
      status: 'success',
      total_orders: list.length,
      orders: list,
    }, { status: 200, headers: { ...securePrivateHeaders, ...cors } });
  }

  return Response.json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Endpoint /api/v1/${endpoint} not found. Available endpoints: /api/v1/catalog, /api/v1/stock-status, /api/v1/products, /api/v1/orders, /api/v1/me`,
  }, { status: 404, headers: defaultCorsHeaders });
}

/**
 * Main POST router for /api/v1/* (e.g. /api/v1/orders)
 */
export async function handleDeveloperApiPost(request, pathSegments) {
  const supabase = await getSupabase();
  if (!supabase) {
    return Response.json({ status: 'error', code: 'DATABASE_ERROR', message: 'Database unconfigured' }, { status: 500, headers: defaultCorsHeaders });
  }

  const endpoint = pathSegments[1] || '';

  // 1. Authenticate Request
  const auth = await authenticateApiKey(request, supabase);
  if (!auth.authenticated) {
    return Response.json({ status: 'error', code: auth.code || 'UNAUTHORIZED', message: auth.error }, { status: auth.status, headers: defaultCorsHeaders });
  }

  const cors = getCorsHeaders(request, auth.keyRecord?.client_website);

  // 2. Route: POST /api/v1/orders (Automated Reseller Order Placement)
  if (endpoint === 'orders' || endpoint === 'order') {
    // Backend enforcement of Admin-Controlled Order API Access Toggle
    if (!auth.keyRecord.orders_enabled) {
      return Response.json({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'Order API access is not enabled for this API key.',
      }, { status: 403, headers: cors });
    }

    try {
      const body = await request.json();
      const {
        reseller_order_id,
        customer,
        shipping_address,
        sender,
        items,
        shipping_notes,
        packing_preference,
        platform,
      } = body || {};

      // Support either 'customer' or 'shipping_address' key
      const cust = customer || shipping_address || {};

      if (!cust?.name || !cust?.phone || !cust?.pincode) {
        return Response.json({
          status: 'error',
          code: 'INVALID_CUSTOMER_DETAILS',
          message: 'Missing customer details. Name, phone number, and pincode are required for delivery.',
        }, { status: 400, headers: cors });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return Response.json({
          status: 'error',
          code: 'EMPTY_ITEMS',
          message: 'Items array cannot be empty. Please specify at least one product SKU and quantity.',
        }, { status: 400, headers: cors });
      }

      // Fetch catalog for SKU validation and item metadata enrichment (title, images, price)
      let catalogList = [];
      try {
        const { data: sheetRow } = await supabase.from('sheet_data').select('csv_data').eq('id', 'products_json').single();
        if (sheetRow?.csv_data) {
          catalogList = typeof sheetRow.csv_data === 'string' ? JSON.parse(sheetRow.csv_data) : sheetRow.csv_data;
        }
      } catch (e) {
        console.warn('Failed to load products_json for order enrichment:', e);
      }

      // Enforce product authorization boundary: ensure all requested SKUs are authorized for this API key
      const isCurated = auth.keyRecord?.catalog_mode === 'curated' || (Array.isArray(auth.keyRecord?.selected_skus) && auth.keyRecord.selected_skus.length > 0);
      if (isCurated) {
        const authorizedProducts = getAuthorizedProducts(catalogList, auth.keyRecord);
        const authorizedSkuSet = new Set(authorizedProducts.map(p => String(p.id || p.groupKey || '').trim().toLowerCase()));
        authorizedProducts.forEach((p) => {
          if (Array.isArray(p.variants)) {
            p.variants.forEach((v) => {
              if (v.code) authorizedSkuSet.add(String(v.code).trim().toLowerCase());
            });
          }
        });

        for (const item of items) {
          const itemSku = String(item.sku || item.variant_code || item.id || '').trim().toLowerCase();
          const baseSku = itemSku.includes('-') ? itemSku.split('-')[0].trim() : itemSku;
          if (!authorizedSkuSet.has(itemSku) && !authorizedSkuSet.has(baseSku)) {
            return Response.json({
              status: 'error',
              code: 'UNAUTHORIZED_PRODUCT',
              message: `Product SKU '${item.sku || item.id}' is not authorized for this account.`,
            }, { status: 403, headers: cors });
          }
        }
      }

      // Normalize items array with full catalog metadata
      const normalizedItems = items.map((item) => {
        const sku = String(item.sku || item.variant_code || item.id || '').trim();
        const skuLower = sku.toLowerCase();
        const baseSku = skuLower.includes('-') ? skuLower.split('-')[0].trim() : skuLower;
        const itemColor = String(item.color || item.title || '').trim();
        const itemColorLower = itemColor.toLowerCase();

        // 1. Match in catalog (exact match first, then base SKU fallback)
        let matchedProduct = (catalogList || []).find(p => {
          const pId = String(p.id || '').toLowerCase();
          const pGroup = String(p.groupKey || '').toLowerCase();
          if (pId === skuLower || pGroup === skuLower) return true;
          if (p.variants && p.variants.some(v => String(v.code || '').toLowerCase() === skuLower)) return true;
          return false;
        });

        if (!matchedProduct && baseSku) {
          matchedProduct = (catalogList || []).find(p => {
            const pId = String(p.id || '').toLowerCase();
            const pGroup = String(p.groupKey || '').toLowerCase();
            return pId === baseSku || pGroup === baseSku;
          });
        }

        // 2. Resolve matched variant / color
        let matchedVariant = null;
        if (matchedProduct?.variants && matchedProduct.variants.length > 0) {
          matchedVariant = matchedProduct.variants.find(v => String(v.code || '').toLowerCase() === skuLower);
          
          if (!matchedVariant && itemColorLower) {
            matchedVariant = matchedProduct.variants.find(v => 
              String(v.color || v.colorName || '').toLowerCase() === itemColorLower
            );
          }

          if (!matchedVariant && itemColorLower && Array.isArray(matchedProduct.colorOptions)) {
            const colorOption = matchedProduct.colorOptions.find(c => 
              String(c.name || '').toLowerCase() === itemColorLower
            );
            if (colorOption) {
              matchedVariant = {
                color: colorOption.name,
                image: colorOption.image,
              };
            }
          }

          if (!matchedVariant) {
            matchedVariant = matchedProduct.variants[0];
          }
        }

        const colorName = itemColor || matchedVariant?.color || matchedVariant?.colorName || matchedProduct?.colorOptions?.[0]?.name || 'Standard';
        
        let imageSrc = item.image || item.image_url || '';
        if (!imageSrc && matchedProduct) {
          if (colorName && matchedProduct.colorOptions) {
            const matchedColorOpt = matchedProduct.colorOptions.find(c => String(c.name || '').toLowerCase() === colorName.toLowerCase());
            if (matchedColorOpt?.image) imageSrc = matchedColorOpt.image;
          }
          if (!imageSrc && matchedProduct.colorImages && matchedProduct.colorImages[colorName]) {
            imageSrc = matchedProduct.colorImages[colorName];
          }
          if (!imageSrc) {
            imageSrc = matchedVariant?.image || matchedVariant?.images?.[0] || matchedProduct.images?.[0] || '';
          }
        }

        let itemPrice = item.price ? Number(item.price) : undefined;
        if (!itemPrice && (matchedVariant || matchedProduct)) {
          const prices = matchedVariant?.prices || matchedProduct?.variants?.[0]?.prices || {};
          itemPrice = Number(prices.b2r || prices.single || matchedProduct?.resellerPrice || matchedProduct?.price || 0);
        }

        const productTitle = item.product_title || matchedProduct?.title || matchedProduct?.name || 'Handloom Banarasi Saree';

        return {
          sku: sku,
          variant_code: matchedVariant?.code || sku,
          product_id: matchedProduct?.id || baseSku || sku,
          product_title: productTitle,
          color: colorName,
          quantity: Math.max(1, parseInt(item.quantity || 1, 10)),
          price: itemPrice > 0 ? itemPrice : undefined,
          image: imageSrc || undefined,
        };
      });

      // Check Real-Time Stock Availability for all items before placing
      const { data: stockData } = await supabase.from('vendor_product_stock').select('*');
      const outOfStockItems = [];

      for (const item of normalizedItems) {
        const override = (stockData || []).find(s => (s.product_id || '').toLowerCase() === item.sku.toLowerCase());
        if (override && override.stock_status === 'out-of-stock') {
          outOfStockItems.push({ sku: item.sku, reason: 'Out of stock in warehouse' });
        }
      }

      if (outOfStockItems.length > 0) {
        return Response.json({
          status: 'error',
          code: 'STOCK_UNAVAILABLE',
          message: 'One or more items in your order are currently out of stock.',
          unavailable_items: outOfStockItems,
        }, { status: 409, headers: cors });
      }

      const recipientAddress = cust.address_line1 || cust.address || '';
      const recipientCity = cust.city || '';
      const recipientState = cust.state || '';
      const recipientPincode = cust.pincode || '';
      const fullAddressStr = `${recipientAddress}${recipientCity ? `, ${recipientCity}` : ''}${recipientState ? `, ${recipientState}` : ''} - PIN: ${recipientPincode}`;

      const senderName = sender?.name || auth.keyRecord.client_name || 'B2B Partner Store';
      const senderPhone = sender?.phone || '';

      // 1. Primary: Insert into dedicated api_orders table (strictly bound to authenticated key)
      const apiOrderPayload = {
        api_key_id: auth.keyRecord?.id || null,
        user_id: auth.keyRecord?.user_id || null,
        reseller_order_id: reseller_order_id || null,
        platform: platform || 'api',
        recipient_name: cust.name,
        recipient_phone: cust.phone,
        recipient_email: cust.email || '',
        recipient_address: recipientAddress,
        recipient_city: recipientCity,
        recipient_state: recipientState,
        recipient_pincode: recipientPincode,
        sender_name: senderName,
        sender_phone: senderPhone,
        packing_preference: packing_preference || 'Blind Packaging (Zero Supplier Branding / No Prices)',
        items: normalizedItems,
        status: 'new',
        shipping_notes: shipping_notes || '',
      };

      let insertedOrder = null;
      let insertError = null;

      const apiRes = await supabase
        .from('api_orders')
        .insert([apiOrderPayload])
        .select()
        .single();

      if (!apiRes.error && apiRes.data) {
        insertedOrder = apiRes.data;
      } else {
        // 2. Fallback: orders table
        const orderPayload = {
          user_id: auth.keyRecord.user_id,
          buyer_name: cust.name,
          business_name: senderName,
          phone: cust.phone,
          email: cust.email || '',
          pincode: recipientPincode,
          message: `[API Dropship Order #${reseller_order_id || 'N/A'}] Delivery Address: ${fullAddressStr}. Notes: ${shipping_notes || 'Blind packaging'}`,
          items: normalizedItems,
          status: 'new',
          is_dropship: true,
          dropship_sender_name: senderName,
          dropship_sender_phone: senderPhone,
          dropship_recipient_name: cust.name,
          dropship_recipient_phone: cust.phone,
          dropship_recipient_address: recipientAddress,
          dropship_recipient_city: recipientCity,
          dropship_recipient_state: recipientState,
          dropship_recipient_pincode: recipientPincode,
          dropship_packing_preference: packing_preference || 'Blind Packaging (Zero Supplier Branding / No Prices)',
        };

        const ordersRes = await supabase
          .from('orders')
          .insert([orderPayload])
          .select()
          .single();

        if (!ordersRes.error && ordersRes.data) {
          insertedOrder = ordersRes.data;
        } else {
          // 3. Fallback: inquiries table
          const fallbackPayload = {
            ...orderPayload,
            inquiry_type: 'reseller_api_order',
          };
          const inqRes = await supabase
            .from('inquiries')
            .insert([fallbackPayload])
            .select()
            .single();

          insertedOrder = inqRes.data;
          insertError = inqRes.error;
        }
      }

      if (insertError) {
        throw new Error('Database insert failed');
      }

      return Response.json({
        status: 'success',
        order_id: insertedOrder.id,
        reseller_order_id: reseller_order_id || null,
        message: 'Order received successfully and queued for wholesale fulfillment.',
        tracking_url: `https://www.weave365.com/order-tracking/${insertedOrder.id}`,
        estimated_dispatch: '24-48 Business Hours',
        order: {
          id: insertedOrder.id,
          status: 'new',
          status_label: 'New / Under Review',
          is_dropship: true,
          items: normalizedItems,
          customer: {
            name: cust.name,
            phone: cust.phone,
            address: fullAddressStr,
          },
        },
      }, { status: 201, headers: cors });

    } catch (err) {
      console.error('[developerApi POST /orders] Error:', err);
      return Response.json({
        status: 'error',
        code: 'ORDER_PROCESSING_FAILED',
        message: 'Failed to process order. Please verify your request data format.',
      }, { status: 500, headers: cors });
    }
  }

  return Response.json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `POST /api/v1/${endpoint} not supported.`,
  }, { status: 404, headers: defaultCorsHeaders });
}
