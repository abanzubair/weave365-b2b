/**
 * @file shopify-integration.test.js
 * @description Automated verification test suite for Weave365 Native Shopify Integration:
 * - Domain normalization (normalizeShopDomain)
 * - /api/shopify/status (connected, disconnected, plan limits, cooldown remaining)
 * - /api/shopify/auth (domain validation, OAuth URL redirection, state nonce)
 * - /api/shopify/callback (missing parameters, HMAC verification, token exchange, error redirects)
 * - /api/shopify/sync:
 *     * Tier rate limits: Pro (5 RPS), Growth (3 RPS), Free (1 RPS)
 *     * Plan cooldowns: Pro (10s), Growth (60s), Free (300s)
 *     * Monthly quota enforcement (429 QUOTA_EXCEEDED)
 *     * Curated catalog boundary enforcement (only authorized SKUs synced)
 *     * Subscription expiry & key deactivation (403)
 *     * Unconnected store (404)
 * - /api/shopify/cron-sync (cron secret validation, plan cadences: 1h/4h/24h, skip/sync)
 * - /api/shopify/push-catalog (curated filtering, 1-click publishing)
 * - /api/shopify/disconnect (clean removal from Supabase sheet_data)
 */

import test, { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  handleShopifyRoute,
  normalizeShopDomain,
  checkRpsLimit,
  checkSyncCooldown,
  PLAN_LIMITS,
  _setSupabaseClientForTesting,
  _clearRpsBucketsForTesting,
} from '../app/api/[[...route]]/shopifyIntegrationHandler.js';

function generateShopifyHmac(searchParams, secret) {
  const entries = [];
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'hmac' && key !== 'signature') {
      entries.push(`${key}=${value}`);
    }
  }
  entries.sort();
  const message = entries.join('&');
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

describe('Weave365 Shopify Integration Verification', () => {
  let originalFetch;
  let mockStores;
  let mockKeys;
  let usageTotals;
  let capturedMutations;

  beforeEach(() => {
    _clearRpsBucketsForTesting();
    capturedMutations = [];

    mockStores = {
      'pro-boutique.myshopify.com': {
        shop: 'pro-boutique.myshopify.com',
        access_token: 'shpat_pro_token_111',
        location_id: 'gid://shopify/Location/1001',
        key_id: 'key-pro-1',
        status: 'active',
        auto_sync: true,
        last_synced_at: null,
        product_mappings: { '102001': 'gid://shopify/Product/1' },
      },
      'growth-boutique.myshopify.com': {
        shop: 'growth-boutique.myshopify.com',
        access_token: 'shpat_growth_token_222',
        location_id: 'gid://shopify/Location/1002',
        key_id: 'key-growth-1',
        status: 'active',
        auto_sync: true,
        last_synced_at: null,
        product_mappings: { '102001': 'gid://shopify/Product/2' },
      },
      'free-store.myshopify.com': {
        shop: 'free-store.myshopify.com',
        access_token: 'shpat_free_token_333',
        location_id: 'gid://shopify/Location/1003',
        key_id: 'key-free-1',
        status: 'active',
        auto_sync: true,
        last_synced_at: null,
        product_mappings: {},
      },
      'curated-store.myshopify.com': {
        shop: 'curated-store.myshopify.com',
        access_token: 'shpat_curated_token_444',
        location_id: 'gid://shopify/Location/1004',
        key_id: 'key-curated-1',
        status: 'active',
        auto_sync: true,
        last_synced_at: null,
        product_mappings: {},
      },
    };

    mockKeys = {
      'key-pro-1': {
        id: 'key-pro-1',
        client_name: 'Pro Boutique Reseller',
        client_website: 'https://pro-boutique.myshopify.com',
        tier: 'pro',
        monthly_quota: 25000,
        rate_limit_rps: 5,
        is_active: true,
        catalog_mode: 'all',
        selected_skus: [],
        subscription_status: 'active',
      },
      'key-growth-1': {
        id: 'key-growth-1',
        client_name: 'Growth Boutique Reseller',
        client_website: 'https://growth-boutique.myshopify.com',
        tier: 'growth',
        monthly_quota: 10000,
        rate_limit_rps: 3,
        is_active: true,
        catalog_mode: 'all',
        selected_skus: [],
        subscription_status: 'active',
      },
      'key-free-1': {
        id: 'key-free-1',
        client_name: 'Free Trial Store',
        client_website: 'https://free-store.myshopify.com',
        tier: 'free',
        monthly_quota: 1000,
        rate_limit_rps: 1,
        is_active: true,
        catalog_mode: 'all',
        selected_skus: [],
        subscription_status: 'active',
      },
      'key-curated-1': {
        id: 'key-curated-1',
        client_name: 'Curated Silk Boutique',
        client_website: 'https://curated-store.myshopify.com',
        tier: 'pro',
        monthly_quota: 25000,
        rate_limit_rps: 5,
        is_active: true,
        catalog_mode: 'curated',
        selected_skus: ['102001', '102001-1'],
        subscription_status: 'active',
      },
    };

    usageTotals = {
      'key-pro-1': 100,
      'key-growth-1': 200,
      'key-free-1': 50,
      'key-curated-1': 50,
    };

    const mockSupabase = {
      from: (table) => {
        if (table === 'sheet_data') {
          return {
            select: () => ({
              eq: (col, val) => ({
                maybeSingle: async () => {
                  if (val === 'shopify_integrations') {
                    return { data: { csv_data: JSON.stringify(mockStores) }, error: null };
                  }
                  if (val === 'stock_map') {
                    return {
                      data: {
                        csv_data: JSON.stringify({
                          '102001': 20,
                          '102001-1': 15,
                          '999999': 5,
                          '999999-1': 2,
                        }),
                      },
                      error: null,
                    };
                  }
                  if (val === 'products_json') {
                    return {
                      data: {
                        csv_data: JSON.stringify([
                          {
                            id: '102001',
                            designCode: '102001',
                            title: 'Authentic Banarasi Silk Saree',
                            fabric: 'Pure Silk',
                            variants: [{ code: '102001-1', color: 'Red' }],
                          },
                          {
                            id: '999999',
                            designCode: '999999',
                            title: 'Unauthorized Saree',
                            fabric: 'Georgette',
                            variants: [{ code: '999999-1', color: 'Gold' }],
                          },
                        ]),
                      },
                      error: null,
                    };
                  }
                  return { data: null, error: null };
                },
              }),
            }),
            upsert: async (row) => {
              if (row.id === 'shopify_integrations' && row.csv_data) {
                mockStores = typeof row.csv_data === 'string' ? JSON.parse(row.csv_data) : row.csv_data;
              }
              return { error: null };
            },
          };
        }
        if (table === 'api_keys') {
          const createKeyQuery = () => {
            let matchedKey = null;
            const query = {
              eq: (col, val) => {
                matchedKey = mockKeys[val] || null;
                return query;
              },
              or: (filterStr) => {
                for (const key of Object.values(mockKeys)) {
                  if (filterStr.includes(key.id) || (key.client_website && filterStr.includes(key.client_website))) {
                    matchedKey = key;
                    break;
                  }
                }
                return query;
              },
              ilike: (col, pattern) => {
                const search = pattern.replace(/%/g, '').toLowerCase();
                for (const key of Object.values(mockKeys)) {
                  if (key.client_website && key.client_website.toLowerCase().includes(search)) {
                    matchedKey = key;
                    break;
                  }
                }
                return query;
              },
              order: () => query,
              limit: () => query,
              maybeSingle: async () => ({ data: matchedKey, error: null }),
            };
            return query;
          };

          return {
            select: () => createKeyQuery(),
            update: (updates) => ({
              eq: async (col, val) => {
                if (mockKeys[val]) Object.assign(mockKeys[val], updates);
                return { error: null };
              },
            }),
          };
        }
        if (table === 'api_usage_daily') {
          return {
            select: () => ({
              gte: () => ({
                or: async () => ({ data: [{ total_requests: 10 }], error: null }),
                eq: (col, keyId) => ({
                  data: [{ total_requests: usageTotals[keyId] || 0 }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'vendor_product_stock') {
          return {
            select: async () => ({ data: [], error: null }),
          };
        }
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
          }),
        };
      },
      rpc: async () => ({ data: null, error: null }),
    };

    _setSupabaseClientForTesting(mockSupabase);

    // Mock global fetch for Shopify Admin API
    originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options = {}) => {
      const urlStr = String(url);

      if (urlStr.includes('myshopify.com')) {
        // 1. Locations endpoint
        if (urlStr.includes('locations.json')) {
          return new Response(
            JSON.stringify({
              locations: [
                { id: 1001, name: 'Primary Warehouse', active: true },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // 2. OAuth token exchange
        if (urlStr.includes('oauth/access_token')) {
          const body = JSON.parse(options.body || '{}');
          if (body.code === 'invalid_code') {
            return new Response('Invalid authorization code', { status: 400 });
          }
          return new Response(
            JSON.stringify({
              access_token: 'shpat_new_exchanged_token',
              scope: 'write_products,read_products,write_inventory,read_inventory,read_locations',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // 3. GraphQL Admin API
        if (urlStr.includes('graphql.json')) {
          const body = JSON.parse(options.body || '{}');
          const query = body.query || '';

          if (query.includes('getVariants')) {
            return new Response(
              JSON.stringify({
                data: {
                  productVariants: {
                    pageInfo: { hasNextPage: false, endCursor: null },
                    nodes: [
                      {
                        id: 'gid://shopify/ProductVariant/101',
                        sku: '102001-1',
                        barcode: '102001-1',
                        inventoryItem: { id: 'gid://shopify/InventoryItem/501' },
                      },
                      {
                        id: 'gid://shopify/ProductVariant/102',
                        sku: '999999-1',
                        barcode: '999999-1',
                        inventoryItem: { id: 'gid://shopify/InventoryItem/502' },
                      },
                    ],
                  },
                },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (query.includes('inventorySetQuantities')) {
            capturedMutations.push(body.variables?.input);
            return new Response(
              JSON.stringify({
                data: {
                  inventorySetQuantities: {
                    inventoryAdjustmentGroup: {
                      reason: 'correction',
                      changes: (body.variables?.input?.quantities || []).map(q => ({
                        name: 'available',
                        delta: q.quantity,
                        quantityAfterChange: q.quantity,
                      })),
                    },
                    userErrors: [],
                  },
                },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (query.includes('productCreate')) {
            return new Response(
              JSON.stringify({
                data: {
                  productCreate: {
                    product: { id: 'gid://shopify/Product/9999', title: 'Pushed Saree' },
                    userErrors: [],
                  },
                },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      }

      return originalFetch(url, options);
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('1. Domain Normalization (normalizeShopDomain)', () => {
    it('normalizes bare store prefix to myshopify.com', () => {
      assert.equal(normalizeShopDomain('my-saree-store'), 'my-saree-store.myshopify.com');
    });

    it('strips https:// protocol and trailing paths', () => {
      assert.equal(normalizeShopDomain('https://royal-banarasi.myshopify.com/admin/'), 'royal-banarasi.myshopify.com');
    });

    it('converts uppercase to lowercase', () => {
      assert.equal(normalizeShopDomain('WEAVE-STORE.MYSHOPIFY.COM'), 'weave-store.myshopify.com');
    });

    it('rejects invalid domains, spaces, and non-shopify hosts', () => {
      assert.equal(normalizeShopDomain(''), null);
      assert.equal(normalizeShopDomain(null), null);
      assert.equal(normalizeShopDomain('invalid store with spaces'), null);
      assert.equal(normalizeShopDomain('https://custom-domain.com'), null);
      assert.equal(normalizeShopDomain('http://attacker.com/fake.myshopify.com'), null);
    });
  });

  describe('2. GET /api/shopify/status', () => {
    it('returns connected: false with plan defaults for an unconfigured store', async () => {
      const req = new Request('https://www.weave365.com/api/shopify/status?shop=unconnected.myshopify.com');
      const res = await handleShopifyRoute(req, ['shopify', 'status']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.connected, false);
      assert.equal(json.shop, 'unconnected.myshopify.com');
      assert.equal(json.plan.tier, 'free');
      assert.equal(json.plan.rate_limit_rps, 1);
      assert.equal(json.plan.monthly_quota, 1000);
      assert.equal(json.plan.sync_cooldown_sec, 300);
    });

    it('returns connected: true with Pro tier plan limits and active status', async () => {
      const req = new Request('https://www.weave365.com/api/shopify/status?shop=pro-boutique.myshopify.com');
      const res = await handleShopifyRoute(req, ['shopify', 'status']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.connected, true);
      assert.equal(json.status, 'active');
      assert.equal(json.auto_sync, true);
      assert.equal(json.plan.tier, 'pro');
      assert.equal(json.plan.rate_limit_rps, 5);
      assert.equal(json.plan.monthly_quota, 25000);
      assert.equal(json.plan.month_used, 100);
      assert.equal(json.plan.remaining_quota, 24900);
      assert.equal(json.plan.sync_cooldown_sec, 10);
      assert.equal(json.plan.cooldown_remaining_sec, 0);
      assert.equal(json.plan.is_subscription_active, true);
    });

    it('returns remaining cooldown when store synced recently', async () => {
      // Set last_synced_at to 4 seconds ago (Pro cooldown is 10s -> ~6s remaining)
      mockStores['pro-boutique.myshopify.com'].last_synced_at = new Date(Date.now() - 4000).toISOString();

      const req = new Request('https://www.weave365.com/api/shopify/status?shop=pro-boutique.myshopify.com');
      const res = await handleShopifyRoute(req, ['shopify', 'status']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.ok(json.plan.cooldown_remaining_sec >= 5 && json.plan.cooldown_remaining_sec <= 7);
    });
  });

  describe('3. GET /api/shopify/auth', () => {
    it('returns 400 when invalid or missing shop parameter', async () => {
      const req = new Request('https://www.weave365.com/api/shopify/auth?shop=invalid_domain');
      const res = await handleShopifyRoute(req, ['shopify', 'auth']);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.error, /Invalid Shopify store domain/i);
    });

    it('returns 302 redirecting to Shopify OAuth authorize URL with state and scopes', async () => {
      const req = new Request('https://www.weave365.com/api/shopify/auth?shop=pro-boutique.myshopify.com&key_id=key-pro-1');
      const res = await handleShopifyRoute(req, ['shopify', 'auth']);
      assert.equal(res.status, 302);

      const location = res.headers.get('location');
      assert.ok(location);
      const authUrl = new URL(location);
      assert.equal(authUrl.host, 'pro-boutique.myshopify.com');
      assert.equal(authUrl.pathname, '/admin/oauth/authorize');
      const expectedClientId = process.env.SHOPIFY_CLIENT_ID || '3c6c76997388a070f8ae474f0e9046e9';
      assert.equal(authUrl.searchParams.get('client_id'), expectedClientId);
      assert.match(authUrl.searchParams.get('scope'), /write_products/);
      assert.match(authUrl.searchParams.get('scope'), /write_inventory/);
      assert.match(authUrl.searchParams.get('scope'), /read_locations/);
      assert.match(authUrl.searchParams.get('redirect_uri'), /\/api\/shopify\/callback/);

      // Verify decoded state contains keyId (supports URL-safe base64)
      const stateParam = authUrl.searchParams.get('state');
      assert.ok(stateParam);
      let stateB64 = decodeURIComponent(stateParam).replace(/-/g, '+').replace(/_/g, '/');
      while (stateB64.length % 4) stateB64 += '=';
      const stateObj = JSON.parse(atob(stateB64));
      assert.equal(stateObj.keyId, 'key-pro-1');
      assert.ok(stateObj.nonce);
    });
  });

  describe('4. GET /api/shopify/callback', () => {
    it('redirects with shopify_error=missing_code_or_shop when code is missing', async () => {
      const req = new Request('https://www.weave365.com/api/shopify/callback?shop=pro-boutique.myshopify.com');
      const res = await handleShopifyRoute(req, ['shopify', 'callback']);
      assert.equal(res.status, 302);
      const location = res.headers.get('location');
      assert.match(location, /shopify_error=missing_code_or_shop/);
    });

    it('redirects with shopify_error=missing_code_or_shop when shop is missing', async () => {
      const req = new Request('https://www.weave365.com/api/shopify/callback?code=mock_code_123');
      const res = await handleShopifyRoute(req, ['shopify', 'callback']);
      assert.equal(res.status, 302);
      const location = res.headers.get('location');
      assert.match(location, /shopify_error=missing_code_or_shop/);
    });

    it('redirects with shopify_error=invalid_hmac when HMAC signature is invalid', async () => {
      const req = new Request('https://www.weave365.com/api/shopify/callback?shop=pro-boutique.myshopify.com&code=valid_code&hmac=badhmac123');
      const res = await handleShopifyRoute(req, ['shopify', 'callback']);
      assert.equal(res.status, 302);
      const location = res.headers.get('location');
      assert.match(location, /shopify_error=invalid_hmac/);
    });

    it('redirects with shopify_error=token_exchange_failed on invalid authorization code with valid HMAC', async () => {
      const secret = process.env.SHOPIFY_CLIENT_SECRET;
      const url = new URL('https://www.weave365.com/api/shopify/callback?shop=pro-boutique.myshopify.com&code=invalid_code');
      const hmac = generateShopifyHmac(url.searchParams, secret);
      url.searchParams.set('hmac', hmac);

      const req = new Request(url.toString());
      const res = await handleShopifyRoute(req, ['shopify', 'callback']);
      assert.equal(res.status, 302);
      const location = res.headers.get('location');
      assert.match(location, /shopify_error=token_exchange_failed/);
    });

    it('exchanges valid code for access token and redirects with shopify_connected=true', async () => {
      const secret = process.env.SHOPIFY_CLIENT_SECRET;
      const statePayload = btoa(JSON.stringify({ keyId: 'key-pro-1', returnTo: '/account?tab=developer' }));
      const url = new URL(`https://www.weave365.com/api/shopify/callback?shop=pro-boutique.myshopify.com&code=valid_test_code&state=${encodeURIComponent(statePayload)}`);
      const hmac = generateShopifyHmac(url.searchParams, secret);
      url.searchParams.set('hmac', hmac);

      const req = new Request(url.toString());
      const res = await handleShopifyRoute(req, ['shopify', 'callback']);
      assert.equal(res.status, 302);
      const location = res.headers.get('location');
      assert.match(location, /shopify_connected=true/);
      assert.match(location, /shop=pro-boutique\.myshopify\.com/);

      // Verify stored access token was updated
      assert.equal(mockStores['pro-boutique.myshopify.com'].access_token, 'shpat_new_exchanged_token');
    });

    it('verifies HMAC correctly over raw query string containing URL-encoded characters (%3D%3D)', async () => {
      const secret = process.env.SHOPIFY_CLIENT_SECRET;
      // Raw string with URL-encoded characters that Shopify signs in production
      const rawQs = 'code=valid_test_code&host=YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvc2hvcDE&shop=pro-boutique.myshopify.com&state=eyJrZXlJZCI6InBybyJ9%3D%3D&timestamp=1337178173';
      const hmac = crypto.createHmac('sha256', secret).update(rawQs).digest('hex');
      const fullUrl = `https://www.weave365.com/api/shopify/callback?${rawQs}&hmac=${hmac}`;

      const req = new Request(fullUrl);
      const res = await handleShopifyRoute(req, ['shopify', 'callback']);
      assert.equal(res.status, 302);
      const location = res.headers.get('location');
      assert.match(location, /shopify_connected=true/);
    });
  });

  describe('5. Plan Rate Limits (Sliding Window RPS)', () => {
    it('Pro Tier (5 RPS): allows 5 requests in 1 second, rejects 6th (429 RATE_LIMIT_EXCEEDED)', async () => {
      const keyId = 'pro-test-key';
      _clearRpsBucketsForTesting();

      for (let i = 1; i <= 5; i++) {
        const check = checkRpsLimit(keyId, PLAN_LIMITS.pro.rateLimitRps);
        assert.equal(check.allowed, true, `Request ${i} should be allowed on Pro tier`);
        assert.equal(check.remaining, 5 - i);
      }

      // 6th request within the same 1s window must be rejected
      const sixth = checkRpsLimit(keyId, PLAN_LIMITS.pro.rateLimitRps);
      assert.equal(sixth.allowed, false, '6th request must exceed 5 RPS rate limit');
      assert.equal(sixth.retryAfterSec, 1);
    });

    it('Growth Tier (3 RPS): allows 3 requests in 1 second, rejects 4th (429)', async () => {
      const keyId = 'growth-test-key';
      _clearRpsBucketsForTesting();

      for (let i = 1; i <= 3; i++) {
        const check = checkRpsLimit(keyId, PLAN_LIMITS.growth.rateLimitRps);
        assert.equal(check.allowed, true, `Request ${i} should be allowed on Growth tier`);
      }

      const fourth = checkRpsLimit(keyId, PLAN_LIMITS.growth.rateLimitRps);
      assert.equal(fourth.allowed, false, '4th request must exceed 3 RPS limit');
      assert.equal(fourth.retryAfterSec, 1);
    });

    it('Free Tier (1 RPS): allows 1 request in 1 second, rejects 2nd (429)', async () => {
      const keyId = 'free-test-key';
      _clearRpsBucketsForTesting();

      const first = checkRpsLimit(keyId, PLAN_LIMITS.free.rateLimitRps);
      assert.equal(first.allowed, true, '1st request should be allowed on Free tier');

      const second = checkRpsLimit(keyId, PLAN_LIMITS.free.rateLimitRps);
      assert.equal(second.allowed, false, '2nd request in same second must be rejected');
      assert.equal(second.retryAfterSec, 1);
    });
  });

  describe('6. Plan Sync Cooldown Enforcement', () => {
    it('Pro Tier: enforces 10s cooldown between syncs', () => {
      // 4 seconds elapsed on Pro (cooldown 10s) -> rejected with 6s remaining
      const storeRecent = { last_synced_at: new Date(Date.now() - 4000).toISOString() };
      const checkBlocked = checkSyncCooldown(storeRecent, PLAN_LIMITS.pro.syncCooldownSec);
      assert.equal(checkBlocked.allowed, false);
      assert.equal(checkBlocked.remainingSec, 6);

      // 12 seconds elapsed on Pro -> allowed
      const storeElapsed = { last_synced_at: new Date(Date.now() - 12000).toISOString() };
      const checkAllowed = checkSyncCooldown(storeElapsed, PLAN_LIMITS.pro.syncCooldownSec);
      assert.equal(checkAllowed.allowed, true);
      assert.equal(checkAllowed.remainingSec, 0);
    });

    it('Growth Tier: enforces 60s cooldown between syncs', () => {
      // 25s elapsed on Growth (cooldown 60s) -> rejected with 35s remaining
      const storeRecent = { last_synced_at: new Date(Date.now() - 25000).toISOString() };
      const checkBlocked = checkSyncCooldown(storeRecent, PLAN_LIMITS.growth.syncCooldownSec);
      assert.equal(checkBlocked.allowed, false);
      assert.equal(checkBlocked.remainingSec, 35);

      // 65s elapsed on Growth -> allowed
      const storeElapsed = { last_synced_at: new Date(Date.now() - 65000).toISOString() };
      const checkAllowed = checkSyncCooldown(storeElapsed, PLAN_LIMITS.growth.syncCooldownSec);
      assert.equal(checkAllowed.allowed, true);
    });

    it('Free Tier: enforces 300s (5 min) cooldown between syncs', () => {
      // 120s elapsed on Free (cooldown 300s) -> rejected with 180s remaining
      const storeRecent = { last_synced_at: new Date(Date.now() - 120000).toISOString() };
      const checkBlocked = checkSyncCooldown(storeRecent, PLAN_LIMITS.free.syncCooldownSec);
      assert.equal(checkBlocked.allowed, false);
      assert.equal(checkBlocked.remainingSec, 180);

      // 310s elapsed on Free -> allowed
      const storeElapsed = { last_synced_at: new Date(Date.now() - 310000).toISOString() };
      const checkAllowed = checkSyncCooldown(storeElapsed, PLAN_LIMITS.free.syncCooldownSec);
      assert.equal(checkAllowed.allowed, true);
    });

    it('allows sync immediately if store has never synced (last_synced_at: null)', () => {
      const storeNew = { last_synced_at: null };
      const check = checkSyncCooldown(storeNew, PLAN_LIMITS.pro.syncCooldownSec);
      assert.equal(check.allowed, true);
      assert.equal(check.remainingSec, 0);
    });
  });

  describe('7. POST /api/shopify/sync Endpoint Behavior', () => {
    it('returns 404 when syncing an unconnected store', async () => {
      const req = new Request('https://www.weave365.com/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: 'unknown-reseller.myshopify.com' }),
      });
      const res = await handleShopifyRoute(req, ['shopify', 'sync']);
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.match(json.error, /not connected/i);
    });

    it('returns 403 SUBSCRIPTION_EXPIRED when linked API key subscription is expired', async () => {
      mockKeys['key-pro-1'].subscription_status = 'expired';
      const req = new Request('https://www.weave365.com/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: 'pro-boutique.myshopify.com' }),
      });
      const res = await handleShopifyRoute(req, ['shopify', 'sync']);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.code, 'SUBSCRIPTION_EXPIRED');
    });

    it('returns 403 KEY_DEACTIVATED when linked API key is deactivated', async () => {
      mockKeys['key-pro-1'].is_active = false;
      const req = new Request('https://www.weave365.com/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: 'pro-boutique.myshopify.com' }),
      });
      const res = await handleShopifyRoute(req, ['shopify', 'sync']);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.code, 'KEY_DEACTIVATED');
    });

    it('returns 429 QUOTA_EXCEEDED when monthly quota is exhausted', async () => {
      usageTotals['key-free-1'] = 1000;
      const req = new Request('https://www.weave365.com/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: 'free-store.myshopify.com' }),
      });
      const res = await handleShopifyRoute(req, ['shopify', 'sync']);
      assert.equal(res.status, 429);
      const json = await res.json();
      assert.equal(json.code, 'QUOTA_EXCEEDED');
      assert.match(json.error, /Monthly request quota reached/i);
    });

    it('executes successful bulk inventory sync via GraphQL mutation', async () => {
      const req = new Request('https://www.weave365.com/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: 'pro-boutique.myshopify.com' }),
      });
      const res = await handleShopifyRoute(req, ['shopify', 'sync']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.shop, 'pro-boutique.myshopify.com');
      assert.equal(json.quantities_updated, 2);
      assert.ok(json.timestamp);

      // Verify GraphQL mutation payload was sent to Shopify
      assert.equal(capturedMutations.length, 1);
      const mutationInput = capturedMutations[0];
      assert.equal(mutationInput.name, 'available');
      assert.equal(mutationInput.quantities.length, 2);
      assert.equal(mutationInput.quantities[0].quantity, 15); // '102001-1' live qty
      assert.equal(mutationInput.quantities[1].quantity, 2);  // '999999-1' live qty
    });

    it('returns 429 SYNC_COOLDOWN_ACTIVE on immediate second sync attempt', async () => {
      // First sync succeeds
      const req1 = new Request('https://www.weave365.com/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: 'pro-boutique.myshopify.com' }),
      });
      const res1 = await handleShopifyRoute(req1, ['shopify', 'sync']);
      assert.equal(res1.status, 200);

      // Clear RPS bucket to isolate cooldown check
      _clearRpsBucketsForTesting();

      // Immediate second sync must be blocked by cooldown (Pro: 10s cooldown)
      const req2 = new Request('https://www.weave365.com/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: 'pro-boutique.myshopify.com' }),
      });
      const res2 = await handleShopifyRoute(req2, ['shopify', 'sync']);
      assert.equal(res2.status, 429);
      assert.ok(res2.headers.get('retry-after'));
      const json2 = await res2.json();
      assert.equal(json2.code, 'SYNC_COOLDOWN_ACTIVE');
      assert.ok(json2.remainingSec > 0 && json2.remainingSec <= 10);
    });
  });

  describe('8. Curated Catalog Boundary Enforcement in Shopify Sync', () => {
    it('restricts sync mutations strictly to authorized SKUs (omits unauthorized 999999)', async () => {
      capturedMutations = [];
      const req = new Request('https://www.weave365.com/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: 'curated-store.myshopify.com' }),
      });
      const res = await handleShopifyRoute(req, ['shopify', 'sync']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.quantities_updated, 1, 'Only authorized 102001-1 should be updated');

      assert.equal(capturedMutations.length, 1);
      const mutationInput = capturedMutations[0];
      assert.equal(mutationInput.quantities.length, 1);
      assert.equal(mutationInput.quantities[0].inventoryItemId, 'gid://shopify/InventoryItem/501');
      assert.equal(mutationInput.quantities[0].quantity, 15);

      // Verify unauthorized 999999-1 was NEVER included in the mutation
      const hasUnauthorized = mutationInput.quantities.some(q => q.inventoryItemId === 'gid://shopify/InventoryItem/502');
      assert.equal(hasUnauthorized, false, 'Unauthorized SKU 999999-1 must NOT be synced for curated store');
    });
  });

  describe('9. GET/POST /api/shopify/cron-sync', () => {
    it('rejects unauthorized cron request when CRON_SECRET is configured', async () => {
      process.env.CRON_SECRET = 'test_cron_secret_777';
      const req = new Request('https://www.weave365.com/api/shopify/cron-sync');
      const res = await handleShopifyRoute(req, ['shopify', 'cron-sync']);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.match(json.error, /Unauthorized cron request/i);
    });

    it('processes eligible stores and respects plan cadences (Pro 1h, Growth 4h, Free 24h)', async () => {
      process.env.CRON_SECRET = 'test_cron_secret_777';

      // Set pro store as having synced 2 hours ago (> 1 hour cadence -> ELIGIBLE)
      mockStores['pro-boutique.myshopify.com'].last_synced_at = new Date(Date.now() - 2 * 3600 * 1000).toISOString();

      // Set growth store as having synced 1 hour ago (< 4 hour cadence -> SKIPPED)
      mockStores['growth-boutique.myshopify.com'].last_synced_at = new Date(Date.now() - 1 * 3600 * 1000).toISOString();

      const req = new Request('https://www.weave365.com/api/shopify/cron-sync?secret=test_cron_secret_777');
      const res = await handleShopifyRoute(req, ['shopify', 'cron-sync']);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.ok(json.synced.some(s => s.shop === 'pro-boutique.myshopify.com'), 'Pro store should be synced');
      assert.ok(json.skipped.some(s => s.shop === 'growth-boutique.myshopify.com'), 'Growth store should be skipped due to cadence');

      delete process.env.CRON_SECRET;
    });
  });

  describe('10. POST /api/shopify/push-catalog', () => {
    it('returns 404 when pushing to an unconnected store', async () => {
      const req = new Request('https://www.weave365.com/api/shopify/push-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: 'unconnected.myshopify.com' }),
      });
      const res = await handleShopifyRoute(req, ['shopify', 'push-catalog']);
      assert.equal(res.status, 404);
    });

    it('enforces curated catalog boundary during 1-click catalog push', async () => {
      const req = new Request('https://www.weave365.com/api/shopify/push-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: 'curated-store.myshopify.com', limit: 10 }),
      });
      const res = await handleShopifyRoute(req, ['shopify', 'push-catalog']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      // Only 1 product in products_json (102001) matched curated selected_skus ['102001', '102001-1']
      assert.equal(json.products_created, 1);
      assert.equal(json.products[0].id, 'gid://shopify/Product/9999');
      assert.ok(mockStores['curated-store.myshopify.com'].product_mappings['102001']);
    });
  });

  describe('11. POST /api/shopify/disconnect', () => {
    it('returns 400 when shop is missing or invalid', async () => {
      const req = new Request('https://www.weave365.com/api/shopify/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: '' }),
      });
      const res = await handleShopifyRoute(req, ['shopify', 'disconnect']);
      assert.equal(res.status, 400);
    });

    it('cleanly disconnects store from Supabase sheet_data', async () => {
      assert.ok(mockStores['pro-boutique.myshopify.com']);

      const req = new Request('https://www.weave365.com/api/shopify/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: 'pro-boutique.myshopify.com' }),
      });
      const res = await handleShopifyRoute(req, ['shopify', 'disconnect']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.disconnected_shop, 'pro-boutique.myshopify.com');

      // Verify store was removed from mockStores
      assert.equal(mockStores['pro-boutique.myshopify.com'], undefined);

      // Verify subsequent status check returns connected: false
      const statusReq = new Request('https://www.weave365.com/api/shopify/status?shop=pro-boutique.myshopify.com');
      const statusRes = await handleShopifyRoute(statusReq, ['shopify', 'status']);
      const statusJson = await statusRes.json();
      assert.equal(statusJson.connected, false);
    });
  });
});
