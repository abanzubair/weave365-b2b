/**
 * @file shopifyIntegrationHandler.js
 * @description Native 1-Click Shopify Storefront Integration for Weave365.
 * Features:
 * - 1-Click OAuth handshake (no 3rd-party apps required)
 * - Strict Plan-Aware Rate Limiting & Quota Enforcement (Free, Growth, Pro)
 * - Real-time bulk inventory synchronization via Shopify GraphQL Admin API
 * - Plan-based sync cooldowns (Pro: 10s, Growth: 60s, Free: 300s)
 * - Automated stock status tracking & out-of-stock badge management
 * - Curated Catalog boundary enforcement
 * 
 * Complies with Cloudflare Pages Edge Runtime (uses crypto.subtle and fetch).
 * 
 * @module api/shopifyIntegrationHandler
 */

import { createClient } from '@supabase/supabase-js';

// Default Shopify Admin API Version
const SHOPIFY_API_VERSION = '2025-01';

// Default Scopes for wholesale reselling & inventory management
const DEFAULT_SCOPES = [
  'write_products',
  'read_products',
  'write_inventory',
  'read_inventory',
  'read_locations'
].join(',');

/**
 * Plan configuration specifications with strict rate limits and quotas
 */
export const PLAN_LIMITS = {
  pro: {
    tier: 'pro',
    name: 'Pro Scale',
    price: 499,
    rateLimitRps: 5,
    monthlyQuota: 25000,
    syncCooldownSec: 10, // 10s cooldown for high-velocity stores
    burstAllowance: 15,
  },
  growth: {
    tier: 'growth',
    name: 'Growth Partner',
    price: 299,
    rateLimitRps: 3,
    monthlyQuota: 10000,
    syncCooldownSec: 60, // 60s cooldown
    burstAllowance: 9,
  },
  free: {
    tier: 'free',
    name: 'Starter Tier',
    price: 0,
    rateLimitRps: 1,
    monthlyQuota: 1000,
    syncCooldownSec: 300, // 5 min cooldown for starter testing
    burstAllowance: 3,
  },
};

/**
 * In-memory sliding window RPS rate limiter
 */
const rpsBuckets = new Map();

export function _clearRpsBucketsForTesting() {
  rpsBuckets.clear();
}

/**
 * Check RPS limit for a given key or shop identifier
 */
export function checkRpsLimit(keyId, limitRps = 1) {
  const now = Date.now();

  // Prune expired buckets if map exceeds 200 entries to prevent memory leak on Edge
  if (rpsBuckets.size > 200) {
    for (const [k, v] of rpsBuckets.entries()) {
      if (now - v.windowStart > 5000) {
        rpsBuckets.delete(k);
      }
    }
  }

  const bucket = rpsBuckets.get(keyId);

  if (!bucket || now - bucket.windowStart >= 1000) {
    rpsBuckets.set(keyId, { windowStart: now, count: 1 });
    return { allowed: true, remaining: limitRps - 1 };
  }

  if (bucket.count < limitRps) {
    bucket.count += 1;
    return { allowed: true, remaining: limitRps - bucket.count };
  }

  const retryAfterSec = Math.max(1, Math.ceil((bucket.windowStart + 1000 - now) / 1000));
  return { allowed: false, retryAfterSec };
}

/**
 * Check sync cooldown between manual/scheduled syncs based on plan tier
 */
export function checkSyncCooldown(store, cooldownSec) {
  if (!store?.last_synced_at) return { allowed: true, remainingSec: 0 };
  const lastSyncTime = new Date(store.last_synced_at).getTime();
  if (Number.isNaN(lastSyncTime)) return { allowed: true, remainingSec: 0 };

  const elapsedSec = (Date.now() - lastSyncTime) / 1000;
  if (elapsedSec < cooldownSec) {
    return {
      allowed: false,
      remainingSec: Math.ceil(cooldownSec - elapsedSec),
    };
  }
  return { allowed: true, remainingSec: 0 };
}

let supabaseInstance = null;

export function _setSupabaseClientForTesting(client) {
  supabaseInstance = client;
}

/**
 * Lazy-init Supabase client for store credentials persistence
 */
function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Standard CORS and security headers for Shopify API responses
 */
const apiHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
};

/**
 * Clean and normalize a shop domain.
 */
export function normalizeShopDomain(shop) {
  if (!shop || typeof shop !== 'string') return null;
  let cleaned = shop.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!cleaned.includes('.')) {
    cleaned = `${cleaned}.myshopify.com`;
  }
  const shopifyRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  return shopifyRegex.test(cleaned) ? cleaned : null;
}

/**
 * Verifies Shopify OAuth HMAC signature using Web Crypto API (Edge compliant)
 */
async function verifyHmac(searchParams, secret) {
  if (!secret) return true;
  const hmac = searchParams.get('hmac');
  if (!hmac) return false;

  const entries = [];
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'hmac' && key !== 'signature') {
      entries.push(`${key}=${value}`);
    }
  }
  entries.sort();
  const message = entries.join('&');

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
    const computedHmac = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computedHmac === hmac;
  } catch (e) {
    console.error('HMAC verification error:', e);
    return false;
  }
}

/**
 * Retrieve all connected stores from Supabase sheet_data
 */
export async function getConnectedStores(supabase) {
  if (!supabase) return {};
  try {
    const { data: row } = await supabase
      .from('sheet_data')
      .select('csv_data')
      .eq('id', 'shopify_integrations')
      .maybeSingle();

    if (!row?.csv_data) return {};
    return typeof row.csv_data === 'string' ? JSON.parse(row.csv_data) : row.csv_data;
  } catch (e) {
    console.error('Failed to load shopify_integrations:', e);
    return {};
  }
}

/**
 * Persist connected store record in Supabase sheet_data
 */
export async function saveConnectedStore(supabase, shopDomain, storeData) {
  if (!supabase || !shopDomain) return false;
  try {
    const stores = await getConnectedStores(supabase);
    stores[shopDomain] = {
      ...(stores[shopDomain] || {}),
      ...storeData,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('sheet_data').upsert({
      id: 'shopify_integrations',
      csv_data: JSON.stringify(stores),
      updated_at: new Date().toISOString(),
    });

    return !error;
  } catch (e) {
    console.error('Failed to save shopify store:', e);
    return false;
  }
}

/**
 * Remove a connected store from Supabase sheet_data
 */
export async function deleteConnectedStore(supabase, shopDomain) {
  if (!supabase || !shopDomain) return false;
  try {
    const stores = await getConnectedStores(supabase);
    delete stores[shopDomain];

    const { error } = await supabase.from('sheet_data').upsert({
      id: 'shopify_integrations',
      csv_data: JSON.stringify(stores),
      updated_at: new Date().toISOString(),
    });

    return !error;
  } catch (e) {
    console.error('Failed to delete shopify store:', e);
    return false;
  }
}

/**
 * Fetch the primary inventory location ID for a Shopify store
 */
export async function getShopifyPrimaryLocation(shop, accessToken) {
  try {
    const query = `
      query {
        locations(first: 5, includeInactive: false) {
          nodes {
            id
            name
            isPrimary
            isActive
          }
        }
      }
    `;
    const res = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query }),
    });

    const json = await res.json();
    const locations = json?.data?.locations?.nodes || [];
    const primary = locations.find(l => l.isPrimary) || locations[0];
    return primary?.id || null;
  } catch (e) {
    console.warn(`Failed to fetch location for ${shop}:`, e);
    return null;
  }
}

/**
 * Resolve api_keys record for a connected store to inspect plan, tier, and quotas
 */
async function resolveKeyRecordForStore(supabase, shop, storeKeyId = null) {
  if (!supabase) return null;

  // 1. If key_id directly linked
  if (storeKeyId) {
    const { data: keyRecord } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', storeKeyId)
      .maybeSingle();
    if (keyRecord) return keyRecord;
  }

  // 2. Lookup by client_website matching shop domain
  if (shop) {
    const { data: keyByWebsite } = await supabase
      .from('api_keys')
      .select('*')
      .ilike('client_website', `%${shop}%`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (keyByWebsite) return keyByWebsite;
  }

  return null;
}

const monthUsageCache = new Map();

/**
 * Calculate month-to-date total API requests across user account (with 15s in-memory Edge cache)
 */
async function getMonthTotalUsage(supabase, keyRecord) {
  if (!supabase || !keyRecord) return 0;
  const now = Date.now();
  const cached = monthUsageCache.get(keyRecord.id);
  if (cached && now < cached.expiresAt) {
    return cached.count;
  }

  try {
    const nowDate = new Date();
    const year = nowDate.getUTCFullYear();
    const month = String(nowDate.getUTCMonth() + 1).padStart(2, '0');
    const dateStr = `${year}-${month}-01`;

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
    const total = (usageData || []).reduce((sum, r) => sum + (r.total_requests || 0), 0);

    // Prune cache if map grows large
    if (monthUsageCache.size > 200) {
      for (const [k, v] of monthUsageCache.entries()) {
        if (now > v.expiresAt) monthUsageCache.delete(k);
      }
    }
    monthUsageCache.set(keyRecord.id, { count: total, expiresAt: now + 15000 });
    return total;
  } catch (e) {
    console.warn('Failed to calculate month total usage:', e);
    return 0;
  }
}

/**
 * GET /api/shopify/auth
 * Initiates the 1-Click OAuth flow by redirecting the reseller to Shopify.
 */
export async function handleShopifyAuth(request, searchParams) {
  const rawShop = searchParams.get('shop') || searchParams.get('store');
  const apiKeyId = searchParams.get('key_id') || searchParams.get('key') || '';
  const returnTo = searchParams.get('return_to') || '/account?tab=developer';

  const shop = normalizeShopDomain(rawShop);
  if (!shop) {
    return Response.json(
      { error: 'Invalid Shopify store domain. Please provide a valid myshopify.com domain.' },
      { status: 400, headers: apiHeaders }
    );
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID || process.env.SHOPIFY_API_KEY || '3e1d62702b73c6c5278413e7b2fc7a99';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com';
  const redirectUri = `${siteUrl.replace(/\/$/, '')}/api/shopify/callback`;

  // Encode state with API key and return URL
  const statePayload = JSON.stringify({
    keyId: apiKeyId,
    returnTo,
    nonce: Math.random().toString(36).slice(2),
  });
  const state = encodeURIComponent(btoa(statePayload));

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent(DEFAULT_SCOPES)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return Response.redirect(authUrl, 302);
}

/**
 * GET /api/shopify/callback
 * Handles the OAuth return from Shopify, exchanges code for token, and redirects back.
 */
export async function handleShopifyCallback(request, searchParams) {
  const shop = normalizeShopDomain(searchParams.get('shop'));
  const code = searchParams.get('code');
  const rawState = searchParams.get('state');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com';
  let returnTo = '/account?tab=developer';
  let keyId = null;

  if (rawState) {
    try {
      const parsedState = JSON.parse(atob(decodeURIComponent(rawState)));
      if (parsedState.returnTo) returnTo = parsedState.returnTo;
      if (parsedState.keyId) keyId = parsedState.keyId;
    } catch {
      // Fallback to default
    }
  }

  if (!shop || !code) {
    const errorUrl = `${siteUrl}${returnTo}${returnTo.includes('?') ? '&' : '?'}shopify_error=missing_code_or_shop`;
    return Response.redirect(errorUrl, 302);
  }

  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET || process.env.SHOPIFY_SECRET;
  const clientId = process.env.SHOPIFY_CLIENT_ID || process.env.SHOPIFY_API_KEY || '3e1d62702b73c6c5278413e7b2fc7a99';

  // Verify HMAC signature
  if (clientSecret) {
    const isValid = await verifyHmac(searchParams, clientSecret);
    if (!isValid) {
      console.warn('Shopify callback HMAC signature verification failed for shop:', shop);
      const errorUrl = `${siteUrl}${returnTo}${returnTo.includes('?') ? '&' : '?'}shopify_error=invalid_hmac`;
      return Response.redirect(errorUrl, 302);
    }
  }

  // Exchange authorization code for permanent access token
  let accessToken = null;
  let scope = DEFAULT_SCOPES;
  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Shopify access_token exchange failed:', tokenRes.status, errText);
      const errorUrl = `${siteUrl}${returnTo}${returnTo.includes('?') ? '&' : '?'}shopify_error=token_exchange_failed`;
      return Response.redirect(errorUrl, 302);
    }

    const tokenJson = await tokenRes.json();
    accessToken = tokenJson.access_token;
    if (tokenJson.scope) scope = tokenJson.scope;
  } catch (e) {
    console.error('Network error during Shopify access token exchange:', e);
    const errorUrl = `${siteUrl}${returnTo}${returnTo.includes('?') ? '&' : '?'}shopify_error=network_error`;
    return Response.redirect(errorUrl, 302);
  }

  if (!accessToken) {
    const errorUrl = `${siteUrl}${returnTo}${returnTo.includes('?') ? '&' : '?'}shopify_error=no_token_returned`;
    return Response.redirect(errorUrl, 302);
  }

  // Fetch primary inventory location
  const locationId = await getShopifyPrimaryLocation(shop, accessToken);

  // Save integration to Supabase sheet_data
  const supabase = getSupabase();
  if (supabase) {
    await saveConnectedStore(supabase, shop, {
      shop,
      access_token: accessToken,
      scope,
      location_id: locationId,
      key_id: keyId,
      connected_at: new Date().toISOString(),
      auto_sync: true,
      last_synced_at: null,
      status: 'active',
    });

    // Also link to api_keys record if keyId provided
    if (keyId) {
      try {
        await supabase
          .from('api_keys')
          .update({
            client_website: `https://${shop}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', keyId);
      } catch (e) {
        console.warn('Failed to update api_keys client_website with shopify shop:', e);
      }
    }
  }

  const successUrl = `${siteUrl}${returnTo}${returnTo.includes('?') ? '&' : '?'}shopify_connected=true&shop=${encodeURIComponent(shop)}`;
  return Response.redirect(successUrl, 302);
}

/**
 * GET /api/shopify/status
 * Returns connection state, plan tier, rate limits, and quota metadata for a shop
 */
export async function handleShopifyStatus(request, searchParams) {
  const rawShop = searchParams.get('shop') || searchParams.get('store');
  const shop = normalizeShopDomain(rawShop);
  const keyIdParam = searchParams.get('key_id') || searchParams.get('key');
  const supabase = getSupabase();

  if (!supabase) {
    return Response.json({ connected: false, error: 'Database unavailable' }, { status: 500, headers: apiHeaders });
  }

  const stores = await getConnectedStores(supabase);

  // Match store by shop domain or keyId
  let targetStore = null;
  if (shop && stores[shop]) {
    targetStore = stores[shop];
  } else if (keyIdParam) {
    targetStore = Object.values(stores).find(s => s.key_id === keyIdParam || s.shop === shop);
  }

  if (!targetStore) {
    let plan = PLAN_LIMITS.free;
    let monthUsed = 0;
    let monthlyQuota = plan.monthlyQuota;
    let rpsLimit = plan.rateLimitRps;
    let isExpired = false;

    if (keyIdParam || shop) {
      const keyRecord = await resolveKeyRecordForStore(supabase, shop, keyIdParam);
      if (keyRecord) {
        const rawTier = (keyRecord?.tier || 'free').toLowerCase();
        plan = PLAN_LIMITS[rawTier] || PLAN_LIMITS.free;
        monthUsed = await getMonthTotalUsage(supabase, keyRecord);
        monthlyQuota = keyRecord?.monthly_quota || plan.monthlyQuota;
        rpsLimit = keyRecord?.rate_limit_rps || plan.rateLimitRps;
        isExpired = keyRecord?.subscription_status === 'expired' || (keyRecord?.subscription_expires_at && new Date(keyRecord.subscription_expires_at).getTime() < Date.now());
      }
    }

    return Response.json({
      connected: false,
      shop,
      plan: {
        tier: plan.tier,
        name: plan.name,
        rate_limit_rps: rpsLimit,
        monthly_quota: monthlyQuota,
        month_used: monthUsed,
        remaining_quota: Math.max(0, monthlyQuota - monthUsed),
        sync_cooldown_sec: plan.syncCooldownSec,
        cooldown_remaining_sec: 0,
        is_quota_exceeded: monthUsed >= monthlyQuota,
        is_subscription_active: !isExpired,
      },
    }, { status: 200, headers: apiHeaders });
  }

  // Resolve plan and rate limits for this store
  const keyRecord = await resolveKeyRecordForStore(supabase, targetStore.shop, targetStore.key_id || keyIdParam);
  const rawTier = (keyRecord?.tier || 'free').toLowerCase();
  const plan = PLAN_LIMITS[rawTier] || PLAN_LIMITS.free;

  const monthUsed = await getMonthTotalUsage(supabase, keyRecord);
  const monthlyQuota = keyRecord?.monthly_quota || plan.monthlyQuota;
  const remainingQuota = Math.max(0, monthlyQuota - monthUsed);
  const rpsLimit = keyRecord?.rate_limit_rps || plan.rateLimitRps;

  // Calculate remaining cooldown if any
  const cooldownCheck = checkSyncCooldown(targetStore, plan.syncCooldownSec);

  return Response.json({
    connected: true,
    shop: targetStore.shop,
    status: targetStore.status || 'active',
    auto_sync: Boolean(targetStore.auto_sync),
    location_id: targetStore.location_id,
    connected_at: targetStore.connected_at,
    last_synced_at: targetStore.last_synced_at,
    total_mapped_products: Object.keys(targetStore.product_mappings || {}).length,
    plan: {
      tier: plan.tier,
      name: plan.name,
      rate_limit_rps: rpsLimit,
      monthly_quota: monthlyQuota,
      month_used: monthUsed,
      remaining_quota: remainingQuota,
      sync_cooldown_sec: plan.syncCooldownSec,
      cooldown_remaining_sec: cooldownCheck.allowed ? 0 : cooldownCheck.remainingSec,
      is_quota_exceeded: monthUsed >= monthlyQuota,
      is_subscription_active: keyRecord?.subscription_status !== 'expired' && (!keyRecord?.subscription_expires_at || new Date(keyRecord.subscription_expires_at).getTime() > Date.now()),
    },
  }, { status: 200, headers: apiHeaders });
}

/**
 * POST /api/shopify/sync
 * Bulk updates inventory quantities directly in the merchant's Shopify store
 * Enforces:
 * 1. Subscription active status
 * 2. Monthly quota limits
 * 3. Sliding-window RPS limits
 * 4. Plan-based sync cooldowns (Pro: 10s, Growth: 60s, Free: 300s)
 * 5. Curated Catalog access boundaries
 */
let cachedStockMap = { data: null, expiresAt: 0 };

/**
 * Helper to fetch live stock map from sheet_data or fallback (with 30s Edge cache)
 */
async function getLiveStockMap(supabase) {
  const now = Date.now();
  if (cachedStockMap.data && now < cachedStockMap.expiresAt) {
    return cachedStockMap.data;
  }

  let stockMap = {};
  try {
    const { data: stockRow } = await supabase
      .from('sheet_data')
      .select('csv_data')
      .eq('id', 'stock_map')
      .maybeSingle();

    if (stockRow?.csv_data) {
      stockMap = typeof stockRow.csv_data === 'string' ? JSON.parse(stockRow.csv_data) : stockRow.csv_data;
    }
  } catch (e) {
    console.warn('Failed to load live stock_map:', e);
  }

  if (Object.keys(stockMap).length === 0) {
    try {
      const { data: vendorStocks } = await supabase.from('vendor_product_stock').select('sku, stock_status, quantity');
      if (Array.isArray(vendorStocks)) {
        for (const vs of vendorStocks) {
          if (vs.sku) stockMap[vs.sku.trim()] = vs.quantity ?? (vs.stock_status === 'in_stock' ? 10 : 0);
        }
      }
    } catch (e) {
      console.warn('Failed to load vendor_product_stock:', e);
    }
  }

  if (Object.keys(stockMap).length > 0) {
    cachedStockMap = { data: stockMap, expiresAt: now + 30000 };
  }
  return stockMap;
}

/**
 * Core inventory synchronization logic for a single store
 * Shared by manual trigger (/api/shopify/sync) and automated cron (/api/shopify/cron-sync)
 */
export async function executeStockSyncForStore({
  supabase,
  shop,
  store,
  keyRecord,
  stockMap = null,
  isCron = false,
}) {
  const rawTier = (keyRecord?.tier || 'free').toLowerCase();
  const plan = PLAN_LIMITS[rawTier] || PLAN_LIMITS.free;
  const rateLimitRps = keyRecord?.rate_limit_rps || plan.rateLimitRps;
  const monthlyQuota = keyRecord?.monthly_quota || plan.monthlyQuota;
  const now = Date.now();

  // 1. Enforce Subscription Expiry
  if (keyRecord) {
    if (keyRecord.subscription_expires_at) {
      const expiresAt = new Date(keyRecord.subscription_expires_at).getTime();
      if (!Number.isNaN(expiresAt) && expiresAt < now) {
        return {
          success: false,
          status: 403,
          code: 'SUBSCRIPTION_EXPIRED',
          error: `Your API subscription (${plan.name}) has expired. Please renew your plan in the developer dashboard to restore inventory sync.`,
          plan: plan.name,
        };
      }
    }

    if (keyRecord.subscription_status === 'expired') {
      return {
        success: false,
        status: 403,
        code: 'SUBSCRIPTION_EXPIRED',
        error: `Your API subscription (${plan.name}) is expired. Please renew your plan in the developer dashboard to restore inventory sync.`,
        plan: plan.name,
      };
    }

    if (!keyRecord.is_active) {
      return {
        success: false,
        status: 403,
        code: 'KEY_DEACTIVATED',
        error: 'Your API key is currently deactivated. Please contact Weave365 admin.',
      };
    }
  }

  // 2. Enforce Monthly Quota
  const monthTotal = await getMonthTotalUsage(supabase, keyRecord);
  if (monthTotal >= monthlyQuota) {
    if (keyRecord?.id) {
      void supabase.rpc('record_api_request', {
        p_key_id: keyRecord.id,
        p_is_success: false,
        p_is_rate_limited: true,
      }).catch(() => {});
    }

    return {
      success: false,
      status: 429,
      code: 'QUOTA_EXCEEDED',
      error: `Monthly request quota reached (${monthlyQuota.toLocaleString()} requests on ${plan.name}). Upgrade your plan to increase limits.`,
      monthly_quota: monthlyQuota,
      month_total: monthTotal,
      plan: plan.name,
    };
  }

  // 3. Enforce Sliding-Window RPS & Cooldown
  if (!isCron) {
    const rpsKey = keyRecord?.id || shop;
    const rpsCheck = checkRpsLimit(rpsKey, rateLimitRps);
    if (!rpsCheck.allowed) {
      return {
        success: false,
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSec: rpsCheck.retryAfterSec,
        error: `Rate limit exceeded (${rateLimitRps} RPS on ${plan.name}). Please retry in ${rpsCheck.retryAfterSec}s.`,
        plan: plan.name,
        rate_limit_rps: rateLimitRps,
      };
    }

    const cooldownCheck = checkSyncCooldown(store, plan.syncCooldownSec);
    if (!cooldownCheck.allowed) {
      return {
        success: false,
        status: 429,
        code: 'SYNC_COOLDOWN_ACTIVE',
        remainingSec: cooldownCheck.remainingSec,
        error: `Sync cooldown active for ${plan.name}. Please wait ${cooldownCheck.remainingSec}s before triggering another stock sync.`,
        plan: plan.name,
        sync_cooldown_sec: plan.syncCooldownSec,
      };
    }
  } else {
    // In automated cron: Respect plan sync cadence
    const minCronIntervalSec = rawTier === 'pro' ? 3600 : (rawTier === 'growth' ? 14400 : 86400);
    const cooldownCheck = checkSyncCooldown(store, minCronIntervalSec);
    if (!cooldownCheck.allowed) {
      return {
        success: false,
        skipped: true,
        reason: `Sync cadence for ${plan.name} not elapsed yet (next eligible in ${cooldownCheck.remainingSec}s)`,
      };
    }
  }

  // 4. Fetch live stock map if not passed
  if (!stockMap || Object.keys(stockMap).length === 0) {
    stockMap = await getLiveStockMap(supabase);
  }

  // 5. Enforce Curated Catalog boundary
  const isCurated = keyRecord?.catalog_mode === 'curated' && Array.isArray(keyRecord?.selected_skus) && keyRecord.selected_skus.length > 0;
  const authorizedSkuSet = isCurated ? new Set(keyRecord.selected_skus.map(s => String(s).trim().toLowerCase())) : null;

  // 6. Primary location
  let locationId = store.location_id;
  if (!locationId) {
    locationId = await getShopifyPrimaryLocation(shop, store.access_token);
    if (locationId) {
      store.location_id = locationId;
      await saveConnectedStore(supabase, shop, store);
    }
  }

  if (!locationId) {
    return {
      success: false,
      status: 400,
      error: `No active location found in Shopify store ${shop}. Please configure a location in Shopify Settings.`,
    };
  }

  // 7. Query variants from Shopify Admin GraphQL API
  let variants = [];
  try {
    const variantsQuery = `
      query getVariants($cursor: String) {
        productVariants(first: 250, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            sku
            barcode
            inventoryItem {
              id
            }
          }
        }
      }
    `;

    let cursor = null;
    let hasNext = true;
    while (hasNext && variants.length < 1000) {
      const gqlRes = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': store.access_token,
        },
        body: JSON.stringify({ query: variantsQuery, variables: { cursor } }),
      });

      const gqlJson = await gqlRes.json();
      const nodes = gqlJson?.data?.productVariants?.nodes || [];
      variants = variants.concat(nodes);

      const pageInfo = gqlJson?.data?.productVariants?.pageInfo;
      hasNext = Boolean(pageInfo?.hasNextPage);
      cursor = pageInfo?.endCursor;
      if (!cursor) break;
    }
  } catch (e) {
    console.error(`Failed to query variants from ${shop}:`, e);
    return {
      success: false,
      status: 502,
      error: 'Failed to query existing product variants from Shopify store',
    };
  }

  // 8. Build inventory quantities update payload
  const quantitiesToSet = [];
  let updatedCount = 0;

  for (const v of variants) {
    const rawSku = (v.sku || v.barcode || '').trim();
    if (!rawSku || !v.inventoryItem?.id) continue;

    if (authorizedSkuSet) {
      const lowerSku = rawSku.toLowerCase();
      const lowerBase = lowerSku.replace(/-[0-9]+$/, '');
      if (!authorizedSkuSet.has(lowerSku) && !authorizedSkuSet.has(lowerBase)) {
        continue;
      }
    }

    let liveQty = stockMap[rawSku];
    if (liveQty === undefined) {
      const baseSku = rawSku.replace(/-[0-9]+$/, '');
      if (stockMap[baseSku] !== undefined) liveQty = stockMap[baseSku];
    }

    if (liveQty !== undefined) {
      const qtyNumber = Math.max(0, parseInt(liveQty, 10) || 0);
      quantitiesToSet.push({
        inventoryItemId: v.inventoryItem.id,
        locationId: locationId,
        quantity: qtyNumber,
      });
      updatedCount++;
    }
  }

  // 9. Execute bulk inventorySetQuantities mutation in chunks of 100
  const CHUNK_SIZE = 100;
  let successCount = 0;
  const userErrors = [];

  for (let i = 0; i < quantitiesToSet.length; i += CHUNK_SIZE) {
    const chunk = quantitiesToSet.slice(i, i + CHUNK_SIZE);
    const mutation = `
      mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
        inventorySetQuantities(input: $input) {
          inventoryAdjustmentGroup {
            reason
            changes {
              name
              delta
              quantityAfterChange
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    try {
      const mutRes = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': store.access_token,
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              reason: 'correction',
              name: 'available',
              ignoreCompareQuantity: true,
              quantities: chunk,
            },
          },
        }),
      });

      const mutJson = await mutRes.json();
      const topLevelErrors = mutJson?.errors || [];
      const userErrorsList = mutJson?.data?.inventorySetQuantities?.userErrors || [];
      if (topLevelErrors.length > 0) {
        userErrors.push(...topLevelErrors);
      } else if (userErrorsList.length > 0) {
        userErrors.push(...userErrorsList);
      } else if (mutJson?.data?.inventorySetQuantities) {
        successCount += chunk.length;
      }
    } catch (e) {
      console.error(`Chunk inventory set error for ${shop}:`, e);
    }
  }

  // 10. Record successful API request in Supabase usage aggregation
  if (keyRecord?.id) {
    void supabase.rpc('record_api_request', {
      p_key_id: keyRecord.id,
      p_is_success: true,
      p_is_rate_limited: false,
    }).catch(() => {});
  }

  // 11. Update store metadata in Supabase
  store.last_synced_at = new Date().toISOString();
  await saveConnectedStore(supabase, shop, store);

  return {
    success: true,
    shop,
    plan: {
      name: plan.name,
      tier: plan.tier,
      rate_limit_rps: rateLimitRps,
      monthly_quota: monthlyQuota,
      month_used: monthTotal + 1,
      remaining_quota: Math.max(0, monthlyQuota - (monthTotal + 1)),
      sync_cooldown_sec: plan.syncCooldownSec,
    },
    matched_variants: updatedCount,
    quantities_updated: successCount,
    errors: userErrors,
    timestamp: store.last_synced_at,
  };
}

/**
 * POST /api/shopify/sync
 * Bulk updates inventory quantities directly in the merchant's Shopify store
 */
export async function handleShopifySync(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {}

  const url = new URL(request.url);
  const rawShop = body.shop || url.searchParams.get('shop');
  const shop = normalizeShopDomain(rawShop);
  const explicitKeyId = body.key_id || url.searchParams.get('key_id') || url.searchParams.get('key');
  const supabase = getSupabase();

  if (!supabase || !shop) {
    return Response.json(
      { error: 'Valid shop domain and database connection required' },
      { status: 400, headers: apiHeaders }
    );
  }

  const stores = await getConnectedStores(supabase);
  const store = stores[shop];

  if (!store || !store.access_token) {
    return Response.json(
      { error: `Store ${shop} is not connected or missing access token. Please connect via OAuth first.` },
      { status: 404, headers: apiHeaders }
    );
  }

  const keyRecord = await resolveKeyRecordForStore(supabase, shop, store.key_id || explicitKeyId);
  const result = await executeStockSyncForStore({
    supabase,
    shop,
    store,
    keyRecord,
    isCron: false,
  });

  if (!result.success) {
    const headers = { ...apiHeaders };
    if (result.retryAfterSec) headers['Retry-After'] = String(result.retryAfterSec);
    if (result.remainingSec) headers['Retry-After'] = String(result.remainingSec);
    return Response.json(result, { status: result.status || 400, headers });
  }

  return Response.json(result, { status: 200, headers: apiHeaders });
}

/**
 * GET/POST /api/shopify/cron-sync
 * Scheduled background inventory synchronization across all connected stores
 */
export async function handleShopifyCronSync(request) {
  const supabase = getSupabase();
  if (!supabase) {
    return Response.json({ error: 'Database unavailable' }, { status: 500, headers: apiHeaders });
  }

  const url = new URL(request.url);
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = url.searchParams.get('secret') || request.headers.get('x-cron-secret') || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');

  if (cronSecret && providedSecret !== cronSecret) {
    return Response.json({ error: 'Unauthorized cron request' }, { status: 401, headers: apiHeaders });
  }

  const stores = await getConnectedStores(supabase);
  const storeEntries = Object.entries(stores);

  if (storeEntries.length === 0) {
    return Response.json({ message: 'No connected stores configured for sync', processed: 0 }, { status: 200, headers: apiHeaders });
  }

  const stockMap = await getLiveStockMap(supabase);
  const results = {
    total_stores: storeEntries.length,
    synced: [],
    skipped: [],
    failed: [],
    timestamp: new Date().toISOString(),
  };

  for (const [shop, store] of storeEntries) {
    if (store.auto_sync === false || !store.access_token) {
      results.skipped.push({ shop, reason: 'auto_sync disabled or missing token' });
      continue;
    }

    const keyRecord = await resolveKeyRecordForStore(supabase, shop, store.key_id);
    const syncRes = await executeStockSyncForStore({
      supabase,
      shop,
      store,
      keyRecord,
      stockMap,
      isCron: true,
    });

    if (syncRes.success) {
      results.synced.push({
        shop,
        plan: syncRes.plan?.name,
        matched_variants: syncRes.matched_variants,
        quantities_updated: syncRes.quantities_updated,
      });
    } else if (syncRes.skipped) {
      results.skipped.push({ shop, reason: syncRes.reason });
    } else {
      results.failed.push({ shop, error: syncRes.error, code: syncRes.code });
    }
  }

  return Response.json(results, { status: 200, headers: apiHeaders });
}

let cachedProductsJson = { data: null, expiresAt: 0 };

async function getCachedProductsJson(supabase) {
  const now = Date.now();
  if (cachedProductsJson.data && now < cachedProductsJson.expiresAt) {
    return cachedProductsJson.data;
  }
  let allProducts = [];
  try {
    const { data: prodRow } = await supabase.from('sheet_data').select('csv_data').eq('id', 'products_json').maybeSingle();
    if (prodRow?.csv_data) {
      allProducts = typeof prodRow.csv_data === 'string' ? JSON.parse(prodRow.csv_data) : prodRow.csv_data;
    }
  } catch (e) {
    console.error('Failed to load products_json:', e);
  }
  if (Array.isArray(allProducts) && allProducts.length > 0) {
    cachedProductsJson = { data: allProducts, expiresAt: now + 60000 };
  }
  return allProducts;
}

/**
 * POST /api/shopify/push-catalog
 * 1-Click product publishing directly into reseller's Shopify storefront
 */
export async function handleShopifyPushCatalog(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {}

  const url = new URL(request.url);
  const rawShop = body.shop || url.searchParams.get('shop');
  const shop = normalizeShopDomain(rawShop);
  const explicitKeyId = body.key_id || url.searchParams.get('key_id') || url.searchParams.get('key');
  const limit = Math.min(Math.max(1, parseInt(body.limit || url.searchParams.get('limit') || '20', 10)), 101);
  const supabase = getSupabase();

  if (!supabase || !shop) {
    return Response.json({ error: 'Valid shop domain and database connection required' }, { status: 400, headers: apiHeaders });
  }

  const stores = await getConnectedStores(supabase);
  const store = stores[shop];
  if (!store || !store.access_token) {
    return Response.json({ error: `Store ${shop} is not connected. Please connect via OAuth first.` }, { status: 404, headers: apiHeaders });
  }

  const keyRecord = await resolveKeyRecordForStore(supabase, shop, store.key_id || explicitKeyId);
  const rawTier = (keyRecord?.tier || 'free').toLowerCase();
  const plan = PLAN_LIMITS[rawTier] || PLAN_LIMITS.free;

  // Subscription expiry & quota checks
  if (keyRecord) {
    if (keyRecord.subscription_expires_at && new Date(keyRecord.subscription_expires_at).getTime() < Date.now()) {
      return Response.json({ error: 'Subscription expired', code: 'SUBSCRIPTION_EXPIRED' }, { status: 403, headers: apiHeaders });
    }
    if (keyRecord.subscription_status === 'expired') {
      return Response.json({ error: 'Subscription expired', code: 'SUBSCRIPTION_EXPIRED' }, { status: 403, headers: apiHeaders });
    }
    if (!keyRecord.is_active) {
      return Response.json({ error: 'API key deactivated', code: 'KEY_DEACTIVATED' }, { status: 403, headers: apiHeaders });
    }
  }

  const monthTotal = await getMonthTotalUsage(supabase, keyRecord);
  if (monthTotal >= (keyRecord?.monthly_quota || plan.monthlyQuota)) {
    return Response.json({ error: 'Monthly quota exceeded', code: 'QUOTA_EXCEEDED' }, { status: 429, headers: apiHeaders });
  }

  // Load products from sheet_data (with 60s cache)
  const allProducts = await getCachedProductsJson(supabase);

  if (!Array.isArray(allProducts) || allProducts.length === 0) {
    return Response.json({ error: 'Catalog products currently unavailable' }, { status: 500, headers: apiHeaders });
  }

  // Filter curated
  const isCurated = keyRecord?.catalog_mode === 'curated' && Array.isArray(keyRecord?.selected_skus) && keyRecord.selected_skus.length > 0;
  const authorizedSkuSet = isCurated ? new Set(keyRecord.selected_skus.map(s => String(s).trim().toLowerCase())) : null;

  let filteredProducts = allProducts;
  if (authorizedSkuSet) {
    filteredProducts = allProducts.filter(p => {
      const matchGroup = authorizedSkuSet.has(String(p.id || p.designCode || '').toLowerCase());
      const matchVariant = (p.variants || []).some(v => authorizedSkuSet.has(String(v.code || '').toLowerCase()));
      return matchGroup || matchVariant;
    });
  }

  // Slice by requested limit
  const targetProducts = filteredProducts.slice(0, limit);
  const createdProducts = [];
  const errors = [];

  for (const prod of targetProducts) {
    try {
      const media = (prod.images || []).slice(0, 6).map(imgUrl => ({
        mediaContentType: 'IMAGE',
        originalSource: imgUrl,
      }));

      const descHtml = `
        <p><strong>Fabric:</strong> ${prod.fabric || 'Pure Banarasi Silk'}</p>
        <p><strong>Work / Weave:</strong> ${prod.work || prod.weave || 'Zari Woven'}</p>
        <p><strong>Occasion:</strong> ${prod.occasion || 'Bridal, Festive, Party'}</p>
        <p><strong>Length:</strong> ${prod.length || '6.3 Meters with Blouse Piece'}</p>
        <p>${prod.description || prod.subtitle || ''}</p>
        <p><em>Authentic Handloom Banarasi directly sourced from Varanasi weavers by Weave365.</em></p>
      `.trim();

      const productInput = {
        title: prod.title || 'Authentic Banarasi Silk Saree',
        descriptionHtml: descHtml,
        vendor: 'Weave365',
        productType: 'Banarasi Saree',
        tags: ['Banarasi Saree', 'Weave365', prod.fabric, prod.occasion].filter(Boolean),
        status: 'ACTIVE',
      };

      const prodCreateMutation = `
        mutation productCreate($input: ProductInput!, $media: [CreateMediaInput!]) {
          productCreate(input: $input, media: $media) {
            product {
              id
              title
              handle
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const pRes = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': store.access_token,
        },
        body: JSON.stringify({
          query: prodCreateMutation,
          variables: { input: productInput, media: media.length > 0 ? media : undefined },
        }),
      });

      const pJson = await pRes.json();
      const pData = pJson?.data?.productCreate;
      if (pData?.userErrors?.length > 0) {
        errors.push({ title: prod.title, userErrors: pData.userErrors });
        continue;
      }

      const createdProduct = pData?.product;
      if (createdProduct?.id) {
        createdProducts.push({
          id: createdProduct.id,
          title: createdProduct.title,
          handle: createdProduct.handle,
        });

        store.product_mappings = store.product_mappings || {};
        store.product_mappings[prod.id || prod.designCode] = {
          shopify_product_id: createdProduct.id,
          pushed_at: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.error(`Error creating product ${prod.title} in ${shop}:`, err);
      errors.push({ title: prod.title, error: err.message });
    }
  }

  await saveConnectedStore(supabase, shop, store);

  if (keyRecord?.id) {
    void supabase.rpc('record_api_request', {
      p_key_id: keyRecord.id,
      p_is_success: true,
      p_is_rate_limited: false,
    }).catch(() => {});
  }

  return Response.json({
    success: true,
    shop,
    products_created: createdProducts.length,
    products: createdProducts,
    errors,
  }, { status: 200, headers: apiHeaders });
}

/**
 * POST /api/shopify/disconnect
 * Disconnects a Shopify store cleanly from Weave365
 */
export async function handleShopifyDisconnect(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {}

  const url = new URL(request.url);
  const rawShop = body.shop || url.searchParams.get('shop');
  const shop = normalizeShopDomain(rawShop);
  const supabase = getSupabase();

  if (!supabase || !shop) {
    return Response.json({ error: 'Valid shop domain required' }, { status: 400, headers: apiHeaders });
  }

  await deleteConnectedStore(supabase, shop);

  return Response.json({
    success: true,
    disconnected_shop: shop,
    message: `Store ${shop} disconnected successfully`,
  }, { status: 200, headers: apiHeaders });
}

/**
 * Universal dispatcher for /api/shopify/* routes
 */
export async function handleShopifyRoute(request, routeArray) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: apiHeaders });
  }

  const action = routeArray[1] || 'status';
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  switch (action) {
    case 'auth':
    case 'authorize':
    case 'connect':
      return handleShopifyAuth(request, searchParams);

    case 'callback':
      return handleShopifyCallback(request, searchParams);

    case 'status':
      return handleShopifyStatus(request, searchParams);

    case 'sync':
      return handleShopifySync(request);

    case 'cron-sync':
    case 'cron':
    case 'sync-all':
      return handleShopifyCronSync(request);

    case 'push-catalog':
    case 'publish':
      return handleShopifyPushCatalog(request);

    case 'disconnect':
      return handleShopifyDisconnect(request);

    default:
      return Response.json(
        { error: `Unknown shopify route: /api/shopify/${action}` },
        { status: 404, headers: apiHeaders }
      );
  }
}
