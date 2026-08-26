/**
 * @file developerApiHandler.js
 * @description Cloudflare Edge-optimized B2B Developer API handler for Weave365.
 * Provides high-speed, cached endpoints for external reseller websites (Shopify, WooCommerce, PrestaShop)
 * while strictly protecting Supabase Free Tier quotas with zero DB bloat.
 */

export const runtime = 'edge';

let supabaseInstance = null;
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
};

const edgeCacheHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=180, s-maxage=600, stale-while-revalidate=86400',
  'CDN-Cache-Control': 'max-age=600',
  'Cloudflare-CDN-Cache-Control': 'max-age=600',
  ...corsHeaders,
};

const stockCacheHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300',
  'CDN-Cache-Control': 'max-age=60',
  'Cloudflare-CDN-Cache-Control': 'max-age=60',
  ...corsHeaders,
};

// Edge In-Memory Cache for API Keys (TTL: 60 seconds) to prevent repeated DB hits
const keyMemoryCache = new Map();
const KEY_CACHE_TTL_MS = 60 * 1000;

/**
 * Compute SHA-256 hash using native Web Crypto API (Edge-safe)
 */
async function hashApiKey(rawKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Authenticate API Key and check monthly quota
 */
async function authenticateApiKey(request, supabase) {
  const rawKey = request.headers.get('x-api-key') || 
    (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const apiKeyIdHeader = request.headers.get('x-api-key-id');

  if (!rawKey && !apiKeyIdHeader) {
    return {
      authenticated: false,
      status: 401,
      error: 'Missing API Key. Pass your key in the "X-API-Key" or "Authorization: Bearer <key>" header.',
    };
  }

  const now = Date.now();
  let keyRecord = null;

  // Try authenticating with full raw secret key first
  if (rawKey && !rawKey.includes('...') && rawKey !== 'w365_demo_test') {
    const keyHash = await hashApiKey(rawKey);
    const cached = keyMemoryCache.get(keyHash);
    if (cached && (now - cached.timestamp < KEY_CACHE_TTL_MS)) {
      keyRecord = cached.data;
    } else {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .single();

      if (!error && data) {
        keyRecord = data;
        keyMemoryCache.set(keyHash, { data: keyRecord, timestamp: now });
      }
    }
  }

  // Fallback to dashboard test console header (allows testing directly from user's authenticated portal)
  if (!keyRecord && apiKeyIdHeader) {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', apiKeyIdHeader)
      .single();

    if (!error && data) {
      keyRecord = data;
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

    return {
      id: p.id || p.groupKey,
      title: p.title || p.name,
      handle: handle,
      body_html: `<p>${p.description || p.fullDescription || p.title}</p><p><strong>Fabric:</strong> ${p.fabric || 'Pure Silk'}<br><strong>Weave:</strong> ${p.weave || 'Handloom'}<br><strong>Authenticity:</strong> 100% Certified Weave365 Authentic</p>`,
      vendor: 'Weave365 Wholesale',
      product_type: p.category || 'Sarees',
      tags: [p.fabric, p.weave, p.category, p.stockStatusLabel || 'Ready Stock'].filter(Boolean).join(', '),
      published: !p.isOutOfStock && !p.isArchived,
      variants: (p.colors || ['Default']).map((color, idx) => ({
        id: `${p.id || p.groupKey}-${idx}`,
        title: color,
        sku: `${p.id || p.groupKey}-${color.toUpperCase().slice(0, 3)}`,
        price: resellerPrice,
        compare_at_price: suggestedMrp,
        inventory_management: 'shopify',
        inventory_policy: 'deny',
        inventory_quantity: p.isOutOfStock ? 0 : 5,
        option1: color,
      })),
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
    return Response.json({ error: 'Database unconfigured' }, { status: 500, headers: corsHeaders });
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
    return Response.json(errorBody, { status: auth.status, headers: corsHeaders });
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

    // Optional Category Filtering
    const category = searchParams.get('category');
    if (category) {
      products = products.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
    }

    // Mandatory Curated Product Selection Filter:
    // API users only receive the products they have selected in their dashboard (or passed via ?skus=)
    const skusParam = searchParams.get('skus') || searchParams.get('ids');
    if (skusParam) {
      const selectedSkus = new Set(skusParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
      products = products.filter(p => selectedSkus.has((p.id || p.groupKey || '').toLowerCase()));
    } else {
      // Strictly filter to the merchant's dashboard-selected SKUs
      const curatedSkus = Array.isArray(auth.keyRecord?.selected_skus) ? auth.keyRecord.selected_skus : [];
      const curatedSet = new Set(curatedSkus.map(s => String(s).trim().toLowerCase()).filter(Boolean));
      products = products.filter(p => curatedSet.has((p.id || p.groupKey || '').toLowerCase()));
    }

    // Format for Shopify if requested
    const format = searchParams.get('format');
    if (format === 'shopify' || format === 'matrixify') {
      const shopifyFeed = formatForShopify(products);
      return Response.json({ status: 'success', total_products: shopifyFeed.length, products: shopifyFeed }, {
        status: 200,
        headers: edgeCacheHeaders,
      });
    }

    // Standard B2B Reseller Catalog Feed (Strictly Reseller Price Only)
    return Response.json({
      status: 'success',
      tier: auth.keyRecord.tier,
      client_name: auth.keyRecord.client_name,
      total_products: products.length,
      last_synced_at: new Date().toISOString(),
      products: products.map((p) => {
        const firstPrices = p.variants?.[0]?.prices || {};
        const resellerPrice = Number(firstPrices.b2r || firstPrices.single || p.resellerPrice || p.price || 0);

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
          colors: p.colors || [],
          images: p.images || [],
          description: p.description || '',
        };
      }),
    }, {
      status: 200,
      headers: edgeCacheHeaders,
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

    // Mandatory Curated Stock Filter: Only return stock for selected products (or ?skus=)
    const stockSkusParam = searchParams.get('skus') || searchParams.get('ids') || searchParams.get('sku');
    if (stockSkusParam) {
      const selectedSkus = new Set(stockSkusParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
      products = products.filter(p => selectedSkus.has((p.id || p.groupKey || '').toLowerCase()));
    } else {
      const curatedSkus = Array.isArray(auth.keyRecord?.selected_skus) ? auth.keyRecord.selected_skus : [];
      const curatedSet = new Set(curatedSkus.map(s => String(s).trim().toLowerCase()).filter(Boolean));
      products = products.filter(p => curatedSet.has((p.id || p.groupKey || '').toLowerCase()));
    }

    const stockMap = {};
    products.forEach((p) => {
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
      headers: stockCacheHeaders,
    });
  }

  // 4. Route: /api/v1/products (Single or Batch product query - Reseller Price Only)
  if (endpoint === 'products' || endpoint === 'product') {
    const skuParam = searchParams.get('sku') || searchParams.get('id') || searchParams.get('skus') || searchParams.get('ids') || pathSegments[2];
    if (!skuParam) {
      return Response.json({ error: 'Please provide product SKU(s) via ?sku=..., ?skus=SKU1,SKU2 or path /api/v1/products/:sku' }, { status: 400, headers: corsHeaders });
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

    const skuList = skuParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

    // If multiple SKUs requested (Batch Mode)
    if (skuList.length > 1) {
      const skuSet = new Set(skuList);
      const matchedList = products.filter(p => skuSet.has((p.id || p.groupKey || '').toLowerCase()));
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
        headers: edgeCacheHeaders,
      });
    }

    // Single SKU Mode
    const singleSku = skuList[0];
    const matched = products.find(p => (p.id || p.groupKey || '').toLowerCase() === singleSku);
    if (!matched) {
      return Response.json({ error: `Product with SKU '${singleSku}' not found.` }, { status: 404, headers: corsHeaders });
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
      headers: edgeCacheHeaders,
    });
  }

  // 5. Route: /api/v1/me (Developer metrics & credentials)
  if (endpoint === 'me') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: usageHistory } = await supabase
      .from('api_usage_daily')
      .select('*')
      .eq('api_key_id', auth.keyRecord.id)
      .gte('usage_date', dateStr)
      .order('usage_date', { ascending: true });

    return Response.json({
      status: 'success',
      client_name: auth.keyRecord.client_name,
      client_website: auth.keyRecord.client_website,
      tier: auth.keyRecord.tier,
      monthly_quota: auth.keyRecord.monthly_quota,
      month_total_used: auth.monthTotal,
      remaining_quota: Math.max(0, auth.keyRecord.monthly_quota - auth.monthTotal),
      rate_limit_rps: auth.keyRecord.rate_limit_rps,
      is_active: auth.keyRecord.is_active,
      key_prefix: auth.keyRecord.key_prefix,
      usage_history: usageHistory || [],
    }, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // 6. Route: /api/v1/orders (Fetch Reseller Orders & Live Fulfillment/Tracking Status)
  if (endpoint === 'orders' || endpoint === 'order') {
    const singleOrderId = searchParams.get('id') || searchParams.get('order_id') || pathSegments[2];
    const resellerOrderId = searchParams.get('reseller_order_id');
    const statusFilter = searchParams.get('status');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    // Query both orders table and legacy inquiries table
    let ordersQuery = supabase
      .from('orders')
      .select('*');

    let inquiriesQuery = supabase
      .from('inquiries')
      .select('*')
      .eq('inquiry_type', 'reseller_api_order');

    if (auth.keyRecord.user_id) {
      ordersQuery = ordersQuery.eq('user_id', auth.keyRecord.user_id);
      inquiriesQuery = inquiriesQuery.eq('user_id', auth.keyRecord.user_id);
    } else if (auth.keyRecord.client_name) {
      ordersQuery = ordersQuery.eq('business_name', auth.keyRecord.client_name);
      inquiriesQuery = inquiriesQuery.eq('business_name', auth.keyRecord.client_name);
    }

    if (singleOrderId) {
      ordersQuery = ordersQuery.eq('id', singleOrderId);
      inquiriesQuery = inquiriesQuery.eq('id', singleOrderId);
    }

    if (statusFilter && statusFilter !== 'all') {
      ordersQuery = ordersQuery.eq('status', statusFilter.toLowerCase());
      inquiriesQuery = inquiriesQuery.eq('status', statusFilter.toLowerCase());
    }

    const [{ data: ordersData }, { data: inqData }] = await Promise.all([
      ordersQuery.order('created_at', { ascending: false }).limit(limit),
      inquiriesQuery.order('created_at', { ascending: false }).limit(limit),
    ]);

    const combinedRaw = [...(ordersData || []), ...(inqData || [])];
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
      let extractedResellerOrderId = null;
      if (o.message) {
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
        is_dropship: Boolean(o.is_dropship),
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
        notes: o.message || '',
      };
    });

    if (resellerOrderId) {
      list = list.filter(o => o.reseller_order_id === resellerOrderId);
    }

    if (singleOrderId) {
      if (list.length === 0) {
        return Response.json({ status: 'error', error: `Order with ID '${singleOrderId}' not found.` }, { status: 404, headers: corsHeaders });
      }
      return Response.json({
        status: 'success',
        order: list[0],
      }, { status: 200, headers: corsHeaders });
    }

    return Response.json({
      status: 'success',
      total_orders: list.length,
      orders: list,
    }, { status: 200, headers: corsHeaders });
  }

  return Response.json({
    status: 'error',
    message: `Endpoint /api/v1/${endpoint} not found. Available endpoints: /api/v1/catalog, /api/v1/stock-status, /api/v1/products, /api/v1/orders, /api/v1/me`,
  }, { status: 404, headers: corsHeaders });
}

/**
 * Main POST router for /api/v1/* (e.g. /api/v1/orders)
 */
export async function handleDeveloperApiPost(request, pathSegments) {
  const supabase = await getSupabase();
  if (!supabase) {
    return Response.json({ error: 'Database unconfigured' }, { status: 500, headers: corsHeaders });
  }

  const endpoint = pathSegments[1] || '';

  // 1. Authenticate Request
  const auth = await authenticateApiKey(request, supabase);
  if (!auth.authenticated) {
    return Response.json({ status: 'error', code: auth.code || 'UNAUTHORIZED', message: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  // 2. Route: POST /api/v1/orders (Automated Reseller Order Placement)
  if (endpoint === 'orders') {
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
      } = body || {};

      // Support either 'customer' or 'shipping_address' key
      const cust = customer || shipping_address || {};

      if (!cust?.name || !cust?.phone || !cust?.pincode) {
        return Response.json({
          status: 'error',
          error: 'Missing customer details. Name, phone number, and pincode are required for delivery.',
        }, { status: 400, headers: corsHeaders });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return Response.json({
          status: 'error',
          error: 'Items array cannot be empty. Please specify at least one product SKU and quantity.',
        }, { status: 400, headers: corsHeaders });
      }

      // Normalize items array so variant_code, sku, color and quantity are always set
      const normalizedItems = items.map((item) => {
        const sku = String(item.sku || item.variant_code || item.id || '').trim();
        return {
          sku: sku,
          variant_code: sku,
          color: item.color || item.title || 'Standard',
          quantity: Math.max(1, parseInt(item.quantity || 1, 10)),
          price: item.price ? Number(item.price) : undefined,
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
          error: 'One or more items in your order are currently out of stock.',
          unavailable_items: outOfStockItems,
        }, { status: 409, headers: corsHeaders });
      }

      const recipientAddress = cust.address_line1 || cust.address || '';
      const recipientCity = cust.city || '';
      const recipientState = cust.state || '';
      const recipientPincode = cust.pincode || '';
      const fullAddressStr = `${recipientAddress}${recipientCity ? `, ${recipientCity}` : ''}${recipientState ? `, ${recipientState}` : ''} - PIN: ${recipientPincode}`;

      const senderName = sender?.name || auth.keyRecord.client_name || 'B2B Partner Store';
      const senderPhone = sender?.phone || '';

      // Create Order Entry in Supabase Orders Table (with fallback to Inquiries)
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

      let insertedOrder = null;
      let insertError = null;

      // Try inserting into orders table first
      const ordersRes = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (!ordersRes.error && ordersRes.data) {
        insertedOrder = ordersRes.data;
      } else {
        // Fallback to inquiries table
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

      if (insertError) {
        throw new Error(insertError.message);
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
      }, { status: 201, headers: corsHeaders });

    } catch (err) {
      return Response.json({ status: 'error', error: err.message || 'Failed to process order' }, { status: 500, headers: corsHeaders });
    }
  }

  return Response.json({ status: 'error', message: `POST /api/v1/${endpoint} not supported.` }, { status: 404, headers: corsHeaders });
}
