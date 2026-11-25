/**
 * @file developer-api.test.js
 * @description Automated verification test suite for Weave365 B2B Developer API endpoints:
 * - Authentication (headers, bearer, query, smart fallback, expired, pending payment, deactivated)
 * - /api/v1/catalog.json (reseller pricing, pagination, caching, headers)
 * - /api/v1/stock.json (real-time stock map)
 * - /api/v1/product.json (single product, batch query, missing sku, 404)
 * - /api/v1/reseller-pricing.json (reseller pricing verification)
 * - /api/v1/catalog-feed.csv (RFC-4180 Shopify CSV export)
 * - format=syncx (flat JSON variant rows for Stock Sync / SyncX)
 * - Tier Monthly Quotas (Free: 1000, Growth: 10000, Pro: 25000)
 * - Curated Catalog Boundaries (catalog filtering, stock isolation, product lookup boundary)
 */

import test, { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import Papa from 'papaparse';
import {
  handleDeveloperApiGet,
  handleDeveloperApiPost,
  _setSupabaseClientForTesting,
  _setCatalogProductsForTesting,
  _setStockMapForTesting,
  _clearCatalogDataCacheForTesting,
  _clearKeyMemoryCacheForTesting,
  _clearStockMapCacheForTesting,
  _clearSyncFeedCacheForTesting,
  hashApiKey,
  getAuthorizedProducts,
  applyResellerMarkup,
  formatForWooCommerceCsv,
} from '../app/api/[[...route]]/developerApiHandler.js';
import {
  generateStockMap,
  buildGlobalStockMap,
  buildStockMap,
  updateStockMapWriteThrough,
} from '../src/utils/stockMapService.js';

describe('Weave365 B2B Developer API Verification', () => {
  const TEST_KEY_PRO = 'w365_live_pro_key_1111222233334444';
  const TEST_KEY_GROWTH = 'w365_live_growth_key_5555666677778888';
  const TEST_KEY_FREE = 'w365_live_free_key_9999000011112222';
  const TEST_KEY_CURATED = 'w365_live_curated_key_3333444455556666';

  let hashPro;
  let hashGrowth;
  let hashFree;
  let hashCurated;

  const mockCatalog = [
    {
      id: '102001',
      title: 'Pure Katan Silk Banarasi Saree',
      price: 5200,
      category: 'Saree',
      fabric: 'Pure Katan Silk',
      weave: 'Kadhwa',
      isArchived: false,
      images: ['https://assets.weave365.com/saree1.jpg'],
      variants: [
        { code: '102001-1', color: 'Royal Red', price: 5200, quantity: 15 },
        { code: '102001-2', color: 'Emerald Green', price: 5200, quantity: 10 },
      ],
    },
    {
      id: '102002',
      title: 'Georgette Banarasi Floral Saree',
      price: 4300,
      category: 'Saree',
      fabric: 'Georgette',
      weave: 'Handloom',
      isArchived: false,
      images: ['https://assets.weave365.com/saree2.jpg'],
      variants: [
        { code: '102002-1', color: 'Midnight Blue', price: 4300, quantity: 8 },
      ],
    },
    {
      id: '999999',
      title: 'Ultra Exclusive Heritage Saree',
      price: 25000,
      category: 'Bridal',
      fabric: 'Pure Muga Silk',
      weave: 'Real Zari Handloom',
      isArchived: false,
      images: ['https://assets.weave365.com/exclusive.jpg'],
      variants: [
        { code: '999999-1', color: 'Gold Zari', price: 25000, quantity: 2 },
      ],
    },
  ];

  const mockStockMap = {
    '102001': 25,
    '102001-1': 15,
    '102001-2': 10,
    '102002': 8,
    '102002-1': 8,
    '999999': 2,
    '999999-1': 2,
  };

  let mockKeys;
  let usageTotals;
  let sheetStockMapData;
  let insertedApiOrders;

  beforeEach(async () => {
    _clearCatalogDataCacheForTesting();
    _clearKeyMemoryCacheForTesting();
    _clearStockMapCacheForTesting();
    _clearSyncFeedCacheForTesting();

    sheetStockMapData = JSON.stringify(mockStockMap);
    insertedApiOrders = [];
    _setCatalogProductsForTesting(mockCatalog);
    _setStockMapForTesting(mockStockMap);

    hashPro = await hashApiKey(TEST_KEY_PRO);
    hashGrowth = await hashApiKey(TEST_KEY_GROWTH);
    hashFree = await hashApiKey(TEST_KEY_FREE);
    hashCurated = await hashApiKey(TEST_KEY_CURATED);

    mockKeys = {
      [hashPro]: {
        id: 'key-pro-1',
        key_hash: hashPro,
        tier: 'pro',
        client_name: 'Pro Boutique Reseller',
        client_website: 'https://pro-boutique.myshopify.com',
        monthly_quota: 25000,
        rate_limit_rps: 5,
        is_active: true,
        catalog_mode: 'all',
        selected_skus: [],
        subscription_status: 'active',
      },
      [hashGrowth]: {
        id: 'key-growth-1',
        key_hash: hashGrowth,
        tier: 'growth',
        client_name: 'Growth Reseller',
        client_website: 'https://growth-store.com',
        monthly_quota: 10000,
        rate_limit_rps: 3,
        is_active: true,
        catalog_mode: 'all',
        selected_skus: [],
        subscription_status: 'active',
      },
      [hashFree]: {
        id: 'key-free-1',
        key_hash: hashFree,
        tier: 'free',
        client_name: 'Free Trial Reseller',
        client_website: 'https://free-trial.com',
        monthly_quota: 1000,
        rate_limit_rps: 1,
        is_active: true,
        catalog_mode: 'all',
        selected_skus: [],
        subscription_status: 'active',
      },
      [hashCurated]: {
        id: 'key-curated-1',
        key_hash: hashCurated,
        tier: 'pro',
        client_name: 'Curated Boutique',
        client_website: 'https://curated-silk.com',
        monthly_quota: 25000,
        rate_limit_rps: 5,
        is_active: true,
        catalog_mode: 'curated',
        selected_skus: ['102001', '102002'],
        subscription_status: 'active',
      },
    };

    usageTotals = {
      'key-pro-1': 150,
      'key-growth-1': 200,
      'key-free-1': 50,
      'key-curated-1': 100,
    };

    const mockSupabase = {
      from: (table) => {
        if (table === 'api_keys') {
          return {
            select: () => ({
              eq: (col, val) => ({
                maybeSingle: async () => ({
                  data: mockKeys[val] || null,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'api_usage_daily') {
          const makeUsageResult = () => ({
            or: async () => ({ data: [{ total_requests: 10 }], error: null }),
            eq: (col, keyId) => ({
              data: [{ total_requests: usageTotals[keyId] || 0 }],
              error: null,
            }),
          });
          return {
            select: () => ({
              gte: () => ({
                ...makeUsageResult(),
                order: () => makeUsageResult(),
              }),
            }),
          };
        }
        if (table === 'sheet_data') {
          return {
            select: () => ({
              eq: (col, id) => ({
                maybeSingle: async () => {
                  if (id === 'stock_map') return { data: sheetStockMapData ? { csv_data: sheetStockMapData } : null, error: null };
                  if (id === 'products_json') return { data: { csv_data: JSON.stringify(mockCatalog) }, error: null };
                  return { data: null, error: null };
                },
              }),
            }),
          };
        }
        if (table === 'vendor_product_stock') {
          return {
            select: async () => ({ data: [], error: null }),
          };
        }
        if (table === 'api_orders') {
          return {
            select: () => {
              const filters = {};
              const query = {
                in: (col, vals) => {
                  filters.in = { col, vals };
                  return query;
                },
                eq: (col, val) => {
                  filters[col] = val;
                  return query;
                },
                maybeSingle: async () => {
                  const match = insertedApiOrders.find((row) => {
                    if (filters.in && !filters.in.vals.includes(row[filters.in.col])) return false;
                    if (filters.api_key_id && row.api_key_id !== filters.api_key_id) return false;
                    if (filters.user_id && row.user_id !== filters.user_id) return false;
                    return true;
                  }) || null;
                  return { data: match, error: null };
                },
              };
              return query;
            },
            insert: (rows) => ({
              select: () => ({
                single: async () => {
                  const created = {
                    id: `api-order-${insertedApiOrders.length + 1}`,
                    order_number: null,
                    created_at: new Date().toISOString(),
                    ...rows[0],
                  };
                  insertedApiOrders.push(created);
                  return { data: created, error: null };
                },
              }),
            }),
            update: () => ({
              eq: async () => ({ data: null, error: null }),
            }),
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
  });

  describe('1. Authentication Verification', () => {
    it('rejects request with missing API key (401 UNAUTHORIZED)', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog.json');
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, 'UNAUTHORIZED');
      assert.match(json.message, /Missing API Key/i);
    });

    it('rejects request with invalid API key (401 UNAUTHORIZED)', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': 'w365_live_non_existent_key_999999' },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.match(json.message, /Invalid or revoked API Key/i);
    });

    it('rejects masked placeholder keys like w365_live_... (401)', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': 'w365_live_abcdef123456...' },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.match(json.message, /Masked key prefixes cannot be used/i);
    });

    it('rejects deactivated API key (403 FORBIDDEN)', async () => {
      mockKeys[hashPro].is_active = false;
      const req = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.message, /deactivated/i);
    });

    it('rejects expired subscription (403 SUBSCRIPTION_EXPIRED)', async () => {
      mockKeys[hashPro].subscription_status = 'expired';
      const req = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.code, 'SUBSCRIPTION_EXPIRED');
    });

    it('rejects subscription pending payment (403 SUBSCRIPTION_PENDING_PAYMENT)', async () => {
      mockKeys[hashPro].subscription_status = 'pending_payment';
      const req = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.code, 'SUBSCRIPTION_PENDING_PAYMENT');
    });

    it('authenticates via X-API-Key header', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.status, 'success');
      assert.equal(json.tier, 'pro');
    });

    it('authenticates via Authorization: Bearer header', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { authorization: `Bearer ${TEST_KEY_PRO}` },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.status, 'success');
    });

    it('authenticates via ?api_key query parameter', async () => {
      const req = new Request(`https://www.weave365.com/api/v1/catalog.json?api_key=${TEST_KEY_PRO}`);
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 200);
    });

    it('authenticates via ?key query parameter', async () => {
      const req = new Request(`https://www.weave365.com/api/v1/catalog.json?key=${TEST_KEY_PRO}`);
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 200);
    });

    it('authenticates via smart fallback query parameter ?w365_live_...', async () => {
      const req = new Request(`https://www.weave365.com/api/v1/catalog.json?${TEST_KEY_PRO}`);
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 200);
    });
  });

  describe('2. Endpoint: /api/v1/catalog.json', () => {
    it('returns 200 with standard catalog, pagination, and reseller prices', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
      assert.match(res.headers.get('content-disposition') || '', /inline; filename="catalog\.json"/);

      const json = await res.json();
      assert.equal(json.status, 'success');
      assert.equal(json.total_products, 3);
      assert.equal(json.products.length, 3);

      const prod = json.products[0];
      assert.equal(prod.id, '102001');
      assert.equal(prod.sku, '102001');
      assert.equal(prod.title, 'Pure Katan Silk Banarasi Saree');
      assert.equal(prod.price, 5200);
      // Raw supplier cost must NEVER be leaked
      assert.equal(prod.cost, undefined);
      assert.equal(prod.supplier_price, undefined);
    });
  });

  describe('3. Endpoint: /api/v1/stock.json', () => {
    it('returns 200 with live stock status map', async () => {
      const req = new Request('https://www.weave365.com/api/v1/stock.json', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'stock.json']);
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type') || '', /application\/json/);

      const json = await res.json();
      assert.equal(json.status, 'success');
      assert.ok(json.timestamp);
      assert.equal(json.total_items, Object.keys(mockStockMap).length);
      assert.equal(json.stock_map['102001'], 25);
      assert.equal(json.stock_map['102001-1'], 15);
    });

    it('filters stock map by SKU query (?skus=102001,102002)', async () => {
      const req = new Request('https://www.weave365.com/api/v1/stock.json?skus=102001,102002', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'stock.json']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.stock_map['102001'], 25);
      assert.equal(json.stock_map['102002'], 8);
      assert.equal(json.stock_map['999999'], undefined);
    });

    it('filters stock map by individual variant SKU query (?skus=102001-1)', async () => {
      const req = new Request('https://www.weave365.com/api/v1/stock.json?skus=102001-1', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'stock.json']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.stock_map['102001-1'], 15);
      assert.equal(json.stock_map['102001'], undefined);
      assert.equal(json.stock_map['102002'], undefined);
    });

    it('fallback path: resolves parent and variant SKUs when stock_map cache is missing', async () => {
      _clearStockMapCacheForTesting();
      sheetStockMapData = null;

      const req = new Request('https://www.weave365.com/api/v1/stock.json', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'stock.json']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.status, 'success');

      // Parent SKU resolution
      assert.ok(json.stock_map['102001'], 'Parent SKU 102001 must exist');
      assert.equal(json.stock_map['102001'].quantity, 25);
      assert.equal(json.stock_map['102001'].in_stock, true);

      // Variant SKU resolution (code and index)
      assert.ok(json.stock_map['102001-1'], 'Variant SKU 102001-1 must exist');
      assert.equal(json.stock_map['102001-1'].quantity, 15);
      assert.equal(json.stock_map['102001-1'].in_stock, true);

      assert.ok(json.stock_map['102001-2'], 'Variant SKU 102001-2 must exist');
      assert.equal(json.stock_map['102001-2'].quantity, 10);
      assert.equal(json.stock_map['102001-2'].in_stock, true);

      // Matrixify formatted variant SKU
      assert.ok(json.stock_map['102001-ROYALRED-1'], 'Matrixify variant SKU 102001-ROYALRED-1 must exist');
      assert.equal(json.stock_map['102001-ROYALRED-1'].quantity, 15);
    });

    it('fallback path: filters by specific variant SKU (?skus=102001-2)', async () => {
      _clearStockMapCacheForTesting();
      sheetStockMapData = null;

      const req = new Request('https://www.weave365.com/api/v1/stock.json?skus=102001-2', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'stock.json']);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.ok(json.stock_map['102001-2'], 'Target variant SKU 102001-2 must exist');
      assert.equal(json.stock_map['102001-2'].quantity, 10);
      assert.equal(json.stock_map['102001-1'], undefined, 'Other variant SKU must not be included');
      assert.equal(json.stock_map['102001'], undefined, 'Parent SKU must not be included when only variant was queried');
    });
  });

  describe('4. Endpoint: /api/v1/product.json', () => {
    it('returns single product query by SKU (?sku=102001)', async () => {
      const req = new Request('https://www.weave365.com/api/v1/product.json?sku=102001', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'product.json']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.status, 'success');
      assert.equal(json.product.id, '102001');
      assert.equal(json.product.price, 5200);
      assert.equal(json.product.fabric, 'Pure Katan Silk');
    });

    it('returns batch products query by SKUs (?skus=102001,102002)', async () => {
      const req = new Request('https://www.weave365.com/api/v1/product.json?skus=102001,102002', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'product.json']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.status, 'success');
      assert.equal(json.total_products, 2);
      assert.equal(json.products.length, 2);
    });

    it('returns 400 MISSING_SKU when no SKU param provided', async () => {
      const req = new Request('https://www.weave365.com/api/v1/product.json', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'product.json']);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.code, 'MISSING_SKU');
    });

    it('returns 404 PRODUCT_NOT_FOUND when SKU does not exist', async () => {
      const req = new Request('https://www.weave365.com/api/v1/product.json?sku=nonexistent999', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'product.json']);
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.code, 'PRODUCT_NOT_FOUND');
    });
  });

  describe('5. Endpoint: /api/v1/reseller-pricing.json', () => {
    it('returns 200 with catalog reseller pricing', async () => {
      const req = new Request('https://www.weave365.com/api/v1/reseller-pricing.json', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'reseller-pricing.json']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.status, 'success');
      assert.equal(json.products[0].price, 5200);
    });
  });

  describe('6. Endpoint: /api/v1/catalog-feed.csv', () => {
    it('returns 200 with RFC-4180 Shopify/Matrixify CSV format', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog-feed.csv', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog-feed.csv']);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/csv; charset=utf-8');
      assert.match(res.headers.get('content-disposition') || '', /attachment; filename="weave365-catalog\.csv"/);

      const csv = await res.text();
      const lines = csv.trim().split('\n');
      assert.ok(lines.length >= 2, 'CSV must have header and rows');

      const header = lines[0];
      assert.match(header, /Handle/);
      assert.match(header, /Title/);
      assert.match(header, /Body \(HTML\)/);
      assert.match(header, /Vendor/);
      assert.match(header, /Option1 Name/);
      assert.match(header, /Option1 Value/);
      assert.match(header, /Variant SKU/);
      assert.match(header, /Variant Price/);
      assert.match(header, /Variant Inventory Qty/);

      // Verify row data includes our products
      assert.match(csv, /102001-1/);
      assert.match(csv, /Pure Katan Silk Banarasi Saree/);
      assert.match(csv, /Royal Red/);
    });
  });

  describe('7. Feed format: format=syncx', () => {
    it('returns flat JSON array of variant rows with image aliases for Stock Sync auto-mapping', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog.json?format=syncx', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 200);
      const rows = await res.json();
      assert.ok(Array.isArray(rows), 'format=syncx should return flat array by default');

      const row = rows[0];
      assert.ok(row.id);
      assert.ok(row.product_id);
      assert.ok(row.handle);
      assert.ok(row.title);
      assert.ok(row.sku);
      assert.equal(typeof row.price, 'number');
      assert.equal(typeof row.stock, 'number');
      assert.ok(row.stock_status);
      assert.ok(row.variant_image_url || row.variant_image_src || row.image_url);
    });

    it('returns enveloped response when &envelope=true is requested', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog.json?format=syncx&envelope=true', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.status, 'success');
      assert.ok(json.pagination);
      assert.ok(Array.isArray(json.products));
      assert.equal(json.total_items, json.products.length);
    });
  });

  describe('8. Tier Rate Limits & Monthly Quotas', () => {
    it('Free Tier: allows requests when below 1000 monthly quota', async () => {
      usageTotals['key-free-1'] = 999;
      const req = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': TEST_KEY_FREE },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 200);
    });

    it('Free Tier: rejects requests when 1000 monthly quota is reached (429 QUOTA_EXCEEDED)', async () => {
      usageTotals['key-free-1'] = 1000;
      const req = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': TEST_KEY_FREE },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 429);
      const json = await res.json();
      assert.equal(json.code, 'QUOTA_EXCEEDED');
      assert.ok(json.upgrade_info);
      assert.equal(json.upgrade_info.current_tier, 'free');
    });

    it('Growth Tier: allows requests up to 10000 monthly quota, blocks at 10000', async () => {
      usageTotals['key-growth-1'] = 9999;
      const req1 = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': TEST_KEY_GROWTH },
      });
      const res1 = await handleDeveloperApiGet(req1, ['v1', 'catalog.json']);
      assert.equal(res1.status, 200);

      _clearKeyMemoryCacheForTesting();
      usageTotals['key-growth-1'] = 10000;
      const req2 = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': TEST_KEY_GROWTH },
      });
      const res2 = await handleDeveloperApiGet(req2, ['v1', 'catalog.json']);
      assert.equal(res2.status, 429);
      const json = await res2.json();
      assert.equal(json.code, 'QUOTA_EXCEEDED');
    });

    it('Pro Tier: allows requests up to 25000 monthly quota, blocks at 25000', async () => {
      usageTotals['key-pro-1'] = 24999;
      const req1 = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res1 = await handleDeveloperApiGet(req1, ['v1', 'catalog.json']);
      assert.equal(res1.status, 200);

      _clearKeyMemoryCacheForTesting();
      usageTotals['key-pro-1'] = 25000;
      const req2 = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res2 = await handleDeveloperApiGet(req2, ['v1', 'catalog.json']);
      assert.equal(res2.status, 429);
      const json = await res2.json();
      assert.equal(json.code, 'QUOTA_EXCEEDED');
    });
  });

  describe('9. Curated Catalog Boundaries', () => {
    it('restricts catalog feed to selected_skus only (102001, 102002), omitting unauthorized 999999', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog.json', {
        headers: { 'x-api-key': TEST_KEY_CURATED },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.json']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.total_products, 2);
      const ids = json.products.map(p => p.id);
      assert.deepEqual(ids.sort(), ['102001', '102002']);
      assert.equal(ids.includes('999999'), false, 'Unauthorized SKU 999999 must not appear in curated feed');
    });

    it('returns 404 PRODUCT_NOT_FOUND when curated key requests unauthorized SKU directly', async () => {
      const req = new Request('https://www.weave365.com/api/v1/product.json?sku=999999', {
        headers: { 'x-api-key': TEST_KEY_CURATED },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'product.json']);
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.code, 'PRODUCT_NOT_FOUND');
    });

    it('restricts stock.json to only authorized curated SKUs', async () => {
      const req = new Request('https://www.weave365.com/api/v1/stock.json', {
        headers: { 'x-api-key': TEST_KEY_CURATED },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'stock.json']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.ok(json.stock_map['102001'] !== undefined);
      assert.ok(json.stock_map['102002'] !== undefined);
      assert.equal(json.stock_map['999999'], undefined, 'Unauthorized SKU 999999 must not appear in stock map');
    });

    it('restricts catalog-feed.csv to only authorized curated SKUs', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog-feed.csv', {
        headers: { 'x-api-key': TEST_KEY_CURATED },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog-feed.csv']);
      assert.equal(res.status, 200);
      const csv = await res.text();
      assert.match(csv, /102001/);
      assert.match(csv, /102002/);
      assert.doesNotMatch(csv, /999999/);
    });
  });

  describe('10. Stock Map Service (Parent vs. Variant SKUs)', () => {
    it('generateStockMap / buildGlobalStockMap / buildStockMap creates keys for parent and all variant SKUs', () => {
      const stockMap = buildGlobalStockMap(mockCatalog);

      // Parent checks
      assert.ok(stockMap['102001']);
      assert.equal(stockMap['102001'].quantity, 25);
      assert.equal(stockMap['102001'].in_stock, true);
      assert.equal(stockMap['102001'].stock_status, 'ready-stock');

      // Variant checks (code and index)
      assert.ok(stockMap['102001-1']);
      assert.equal(stockMap['102001-1'].quantity, 15);
      assert.equal(stockMap['102001-1'].in_stock, true);
      assert.equal(stockMap['102001-1'].stock_status, 'ready-stock');

      assert.ok(stockMap['102001-2']);
      assert.equal(stockMap['102001-2'].quantity, 10);
      assert.equal(stockMap['102001-2'].in_stock, true);

      // Matrixify formatted SKU
      assert.ok(stockMap['102001-ROYALRED-1']);
      assert.equal(stockMap['102001-ROYALRED-1'].quantity, 15);

      assert.ok(stockMap['102001-EMERALDGREEN-2']);
      assert.equal(stockMap['102001-EMERALDGREEN-2'].quantity, 10);

      // Product 2
      assert.ok(stockMap['102002']);
      assert.equal(stockMap['102002'].quantity, 8);
      assert.ok(stockMap['102002-1']);
      assert.equal(stockMap['102002-1'].quantity, 8);

      // Verify buildStockMap alias behaves identically
      const aliasMap = buildStockMap(mockCatalog);
      assert.deepEqual(Object.keys(stockMap).sort(), Object.keys(aliasMap).sort());
      for (const k of Object.keys(stockMap)) {
        assert.equal(stockMap[k].quantity, aliasMap[k].quantity);
        assert.equal(stockMap[k].in_stock, aliasMap[k].in_stock);
        assert.equal(stockMap[k].status, aliasMap[k].status);
      }
    });

    it('accurately reflects zero quantity and out-of-stock for individual variants', () => {
      const catalogWithOosVariant = [
        {
          id: '103001',
          title: 'Organza Floral Saree',
          quantity: 10,
          isArchived: false,
          variants: [
            { code: '103001-1', color: 'Pastel Pink', quantity: 10 },
            { code: '103001-2', color: 'Mint Green', quantity: 0 },
            { code: '103001-3', color: 'Lavender', isOutOfStock: true, quantity: 5 },
          ],
        },
      ];

      const stockMap = generateStockMap(catalogWithOosVariant);

      // In-stock variant
      assert.equal(stockMap['103001-1'].in_stock, true);
      assert.equal(stockMap['103001-1'].quantity, 10);
      assert.equal(stockMap['103001-1'].stock_status, 'ready-stock');

      // Quantity 0 variant
      assert.equal(stockMap['103001-2'].in_stock, false);
      assert.equal(stockMap['103001-2'].quantity, 0);
      assert.equal(stockMap['103001-2'].stock_status, 'out-of-stock');
      assert.equal(stockMap['103001-2'].stock_label, 'Out of Stock');

      // Explicit isOutOfStock variant
      assert.equal(stockMap['103001-3'].in_stock, false);
      assert.equal(stockMap['103001-3'].quantity, 0);
      assert.equal(stockMap['103001-3'].stock_status, 'out-of-stock');
    });

    it('cascades parent out-of-stock or archived status to all child variants', () => {
      const catalogWithOosParent = [
        {
          id: '104001',
          title: 'Chanderi Saree',
          isOutOfStock: true,
          variants: [
            { code: '104001-1', color: 'Yellow', quantity: 10 },
          ],
        },
      ];

      const stockMap = generateStockMap(catalogWithOosParent);

      assert.equal(stockMap['104001'].in_stock, false);
      assert.equal(stockMap['104001'].quantity, 0);

      assert.equal(stockMap['104001-1'].in_stock, false);
      assert.equal(stockMap['104001-1'].quantity, 0);
      assert.equal(stockMap['104001-1'].stock_status, 'out-of-stock');
    });

    it('respects vendor stock overrides for specific variant SKUs', () => {
      const overrides = [
        {
          product_id: '102001-1',
          stock_status: 'out-of-stock',
          stock_status_label: 'Temporarily Unavailable',
        },
      ];

      const stockMap = generateStockMap(mockCatalog, overrides);

      // Parent remains ready-stock
      assert.equal(stockMap['102001'].in_stock, true);

      // Overridden variant becomes out of stock
      assert.equal(stockMap['102001-1'].in_stock, false);
      assert.equal(stockMap['102001-1'].quantity, 0);
      assert.equal(stockMap['102001-1'].stock_status, 'out-of-stock');
      assert.equal(stockMap['102001-1'].stock_label, 'Temporarily Unavailable');

      // Non-overridden variant remains ready-stock
      assert.equal(stockMap['102001-2'].in_stock, true);
      assert.equal(stockMap['102001-2'].quantity, 10);
      assert.equal(stockMap['102001-2'].stock_status, 'ready-stock');
    });

    it('generates variant keys from colors array when explicit variants are absent', () => {
      const catalogColorsOnly = [
        {
          id: '105001',
          title: 'Tussar Silk Saree',
          quantity: 12,
          colors: ['Beige', 'Maroon'],
        },
      ];

      const stockMap = generateStockMap(catalogColorsOnly);

      assert.ok(stockMap['105001']);
      assert.ok(stockMap['105001-1']);
      assert.ok(stockMap['105001-2']);
      assert.ok(stockMap['105001-BEIGE-1']);
      assert.ok(stockMap['105001-MAROON-2']);
      assert.equal(stockMap['105001-1'].quantity, 12);
      assert.equal(stockMap['105001-1'].in_stock, true);
    });

    it('updateStockMapWriteThrough: cascades restock (!isOutOfStock) back to all variant keys with positive quantity and available status', async () => {
      let storedStockMap = {
        '102001': {
          in_stock: true,
          quantity: 25,
          stock_status: 'ready-stock',
          status: 'ready-stock',
          is_available: true,
          stock_label: 'Ready Stock',
        },
        '102001-1': {
          in_stock: true,
          quantity: 15,
          stock_status: 'ready-stock',
          status: 'ready-stock',
          is_available: true,
          stock_label: 'Ready Stock',
        },
        '102001-2': {
          in_stock: true,
          quantity: 10,
          stock_status: 'ready-stock',
          status: 'ready-stock',
          is_available: true,
          stock_label: 'Ready Stock',
        },
        '102001-ROYALRED-1': {
          in_stock: true,
          quantity: 15,
          stock_status: 'ready-stock',
          status: 'ready-stock',
          is_available: true,
          stock_label: 'Ready Stock',
        },
      };

      const mockDb = {
        from: (table) => {
          assert.equal(table, 'sheet_data');
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { csv_data: JSON.stringify(storedStockMap) },
                  error: null,
                }),
              }),
            }),
            upsert: async (payload) => {
              storedStockMap = JSON.parse(payload.csv_data);
              return { error: null };
            },
          };
        },
      };

      // 1. Parent is marked out-of-stock
      const oosOk = await updateStockMapWriteThrough(mockDb, {
        productId: '102001',
        stockStatus: 'out-of-stock',
        stockStatusLabel: 'Out of Stock',
      });
      assert.equal(oosOk, true);

      // Verify parent and all variant keys cascaded to out-of-stock
      assert.equal(storedStockMap['102001'].in_stock, false);
      assert.equal(storedStockMap['102001'].quantity, 0);
      assert.equal(storedStockMap['102001-1'].in_stock, false);
      assert.equal(storedStockMap['102001-1'].quantity, 0);
      assert.equal(storedStockMap['102001-1'].is_available, false);
      assert.equal(storedStockMap['102001-2'].in_stock, false);
      assert.equal(storedStockMap['102001-2'].quantity, 0);
      assert.equal(storedStockMap['102001-2'].is_available, false);
      assert.equal(storedStockMap['102001-ROYALRED-1'].in_stock, false);
      assert.equal(storedStockMap['102001-ROYALRED-1'].quantity, 0);

      // 2. Parent is restocked back to ready-stock
      const restockOk = await updateStockMapWriteThrough(mockDb, {
        productId: '102001',
        stockStatus: 'ready-stock',
        stockStatusLabel: 'Ready Stock',
      });
      assert.equal(restockOk, true);

      // Verify parent is restored
      assert.equal(storedStockMap['102001'].in_stock, true);
      assert.equal(storedStockMap['102001'].is_available, true);
      assert.equal(storedStockMap['102001'].stock_status, 'ready-stock');
      assert.equal(storedStockMap['102001'].status, 'ready-stock');
      assert.equal(storedStockMap['102001'].stock_label, 'Ready Stock');
      assert.ok(storedStockMap['102001'].quantity > 0);

      // Verify ALL child variant keys cascaded back to available with positive quantity
      const expectedVariantKeys = ['102001-1', '102001-2', '102001-ROYALRED-1'];
      for (const vKey of expectedVariantKeys) {
        assert.equal(storedStockMap[vKey].in_stock, true, `${vKey} must be in_stock: true`);
        assert.equal(storedStockMap[vKey].is_available, true, `${vKey} must be is_available: true`);
        assert.equal(storedStockMap[vKey].stock_status, 'ready-stock', `${vKey} status must be ready-stock`);
        assert.equal(storedStockMap[vKey].status, 'ready-stock');
        assert.equal(storedStockMap[vKey].stock_label, 'Ready Stock');
        assert.ok(storedStockMap[vKey].quantity > 0, `${vKey} must have positive quantity`);
      }
    });

    it('updateStockMapWriteThrough: preserves existing positive quantity when variant already has v.quantity > 0', async () => {
      let storedStockMap = {
        '102001': {
          in_stock: false,
          quantity: 0,
          stock_status: 'out-of-stock',
          is_available: false,
        },
        '102001-1': {
          in_stock: false,
          quantity: 12, // Variant had remaining quantity tracked
          stock_status: 'out-of-stock',
          is_available: false,
        },
      };

      const mockDb = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { csv_data: JSON.stringify(storedStockMap) },
                error: null,
              }),
            }),
          }),
          upsert: async (payload) => {
            storedStockMap = JSON.parse(payload.csv_data);
            return { error: null };
          },
        }),
      };

      const ok = await updateStockMapWriteThrough(mockDb, {
        productId: '102001',
        stockStatus: 'ready-stock',
      });
      assert.equal(ok, true);
      assert.equal(storedStockMap['102001-1'].in_stock, true);
      assert.equal(storedStockMap['102001-1'].is_available, true);
      assert.equal(storedStockMap['102001-1'].quantity, 12, 'Must preserve existing positive variant quantity');
    });

    it('updateStockMapWriteThrough: cascades pre-order and back-soon restocks to variants', async () => {
      let storedStockMap = {
        '102001': {
          in_stock: false,
          quantity: 0,
          stock_status: 'out-of-stock',
          is_available: false,
        },
        '102001-1': {
          in_stock: false,
          quantity: 0,
          stock_status: 'out-of-stock',
          is_available: false,
        },
      };

      const mockDb = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { csv_data: JSON.stringify(storedStockMap) },
                error: null,
              }),
            }),
          }),
          upsert: async (payload) => {
            storedStockMap = JSON.parse(payload.csv_data);
            return { error: null };
          },
        }),
      };

      const ok = await updateStockMapWriteThrough(mockDb, {
        productId: '102001',
        stockStatus: 'pre-order',
      });
      assert.equal(ok, true);
      assert.equal(storedStockMap['102001-1'].in_stock, true);
      assert.equal(storedStockMap['102001-1'].is_available, true);
      assert.equal(storedStockMap['102001-1'].stock_status, 'pre-order');
      assert.equal(storedStockMap['102001-1'].status, 'pre-order');
      assert.equal(storedStockMap['102001-1'].stock_label, 'Pre-Order');
      assert.ok(storedStockMap['102001-1'].quantity > 0);
    });
  });

  describe('11. Endpoints: GET /api/v1/me & POST /api/v1/orders (WooCommerce & Storefront Integration)', () => {
    let originalResendApiKey;

    beforeEach(() => {
      originalResendApiKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;
    });

    afterEach(() => {
      if (originalResendApiKey === undefined) {
        delete process.env.RESEND_API_KEY;
      } else {
        process.env.RESEND_API_KEY = originalResendApiKey;
      }
    });

    it('GET /api/v1/me returns orders_enabled capability flag accurately', async () => {
      mockKeys[hashPro].orders_enabled = false;
      const reqDisabled = new Request('https://www.weave365.com/api/v1/me', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const resDisabled = await handleDeveloperApiGet(reqDisabled, ['v1', 'me']);
      assert.equal(resDisabled.status, 200);
      const jsonDisabled = await resDisabled.json();
      assert.equal(jsonDisabled.status, 'success');
      assert.equal(jsonDisabled.orders_enabled, false);

      _clearKeyMemoryCacheForTesting();
      mockKeys[hashPro].orders_enabled = true;
      const reqEnabled = new Request('https://www.weave365.com/api/v1/me', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const resEnabled = await handleDeveloperApiGet(reqEnabled, ['v1', 'me']);
      assert.equal(resEnabled.status, 200);
      const jsonEnabled = await resEnabled.json();
      assert.equal(jsonEnabled.status, 'success');
      assert.equal(jsonEnabled.orders_enabled, true);
    });

    it('POST /api/v1/orders with platform=woocommerce and orders_enabled=false returns 403 FORBIDDEN', async () => {
      mockKeys[hashPro].orders_enabled = false;
      const req = new Request('https://www.weave365.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': TEST_KEY_PRO,
        },
        body: JSON.stringify({
          platform: 'woocommerce',
          reseller_order_id: 'WC-1001',
          shipping_address: {
            name: 'Ananya Sharma',
            phone: '9876543210',
            postcode: '560001',
            address_line1: '42 MG Road',
            city: 'Bengaluru',
            state: 'KA',
          },
          items: [
            { sku: '102001-1', quantity: 1, selling_price: 7500 },
          ],
        }),
      });

      const res = await handleDeveloperApiPost(req, ['v1', 'orders']);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.status, 'error');
      assert.equal(json.code, 'FORBIDDEN');
      assert.equal(insertedApiOrders.length, 0);
    });

    it('POST /api/v1/orders with platform=woocommerce and mixed cart filters non-Weave365 items, computes Weave365 totals only, and adds WooCommerce Multi-Vendor note', async () => {
      mockKeys[hashPro].orders_enabled = true;
      const req = new Request('https://www.weave365.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': TEST_KEY_PRO,
        },
        body: JSON.stringify({
          platform: 'woocommerce',
          reseller_order_id: 'WC-1042',
          customer: {
            name: 'Ananya Sharma',
            phone: '9876543210',
            email: 'ananya@example.com',
          },
          shipping_address: {
            name: 'Ananya Sharma',
            phone: '9876543210',
            postcode: '560001',
            address_line1: '42 MG Road',
            city: 'Bengaluru',
            state: 'KA',
          },
          sender: {
            name: 'Silk Heritage Store',
            phone: '9988776655',
          },
          shipping_notes: 'Call before delivery',
          customer_price: 20000,
          items: [
            {
              sku: '102001-1',
              quantity: 2,
              product_title: 'Pure Katan Silk Banarasi Saree',
              color: 'Royal Red',
              selling_price: 7500,
            },
            {
              sku: 'NON-WEAVE-999',
              quantity: 1,
              product_title: 'Third-Party Cotton Kurta',
              selling_price: 5000,
            },
          ],
        }),
      });

      const res = await handleDeveloperApiPost(req, ['v1', 'orders']);
      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.status, 'success');
      assert.equal(json.reseller_order_id, 'WC-1042');
      assert.deepEqual(json.items_filtered, {
        total_order_items: 2,
        weave365_items_processed: 1,
      });

      assert.equal(json.order.items.length, 1);
      assert.equal(json.order.items[0].sku, '102001-1');
      assert.equal(json.order.items[0].quantity, 2);

      // Totals must reflect Weave 365 items only (2 * 5200 wholesale, 2 * 7500 retail)
      assert.equal(json.pricing.wholesale_amount, 10400);
      assert.equal(json.pricing.customer_billed_price, 15000);
      assert.equal(json.pricing.reseller_margin, 4600);
      assert.equal(json.courier_slip.parcel_declared_value, 15000);

      assert.equal(insertedApiOrders.length, 1);
      assert.equal(insertedApiOrders[0].platform, 'woocommerce');
      assert.equal(insertedApiOrders[0].items.length, 1);
      assert.match(
        insertedApiOrders[0].shipping_notes,
        /\[WooCommerce Multi-Vendor: 1 of 2 items fulfilled by Weave 365\]/
      );
      assert.match(insertedApiOrders[0].shipping_notes, /Call before delivery/);
    });

    it('POST /api/v1/orders with platform=woocommerce and zero Weave365 items returns 200 ignored NO_WEAVE365_ITEMS', async () => {
      mockKeys[hashPro].orders_enabled = true;
      const req = new Request('https://www.weave365.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': TEST_KEY_PRO,
        },
        body: JSON.stringify({
          platform: 'woocommerce',
          reseller_order_id: 'WC-1043',
          shipping_address: {
            name: 'Priya Verma',
            phone: '9123456780',
            postcode: '110001',
            address_line1: '15 Connaught Place',
            city: 'New Delhi',
            state: 'DL',
          },
          items: [
            { sku: 'NON-WEAVE-100', quantity: 1, selling_price: 1999 },
            { sku: 'NON-WEAVE-200', quantity: 2, selling_price: 1200 },
          ],
        }),
      });

      const res = await handleDeveloperApiPost(req, ['v1', 'orders']);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.status, 'ignored');
      assert.equal(json.code, 'NO_WEAVE365_ITEMS');
      assert.equal(json.reseller_order_id, 'WC-1043');
      assert.equal(insertedApiOrders.length, 0);
    });

    it('POST /api/v1/orders with platform=woocommerce on curated key filters unauthorized SKUs in mixed carts and ignores all-unauthorized carts', async () => {
      mockKeys[hashCurated].orders_enabled = true;

      // Mixed cart: 1 authorized SKU (102001-1) + 1 unauthorized SKU (999999-1)
      const mixedReq = new Request('https://www.weave365.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': TEST_KEY_CURATED,
        },
        body: JSON.stringify({
          platform: 'woocommerce',
          reseller_order_id: 'WC-CUR-1',
          shipping_address: {
            name: 'Meera Iyer',
            phone: '9876501234',
            postcode: '600001',
            address_line1: '8 Mount Road',
            city: 'Chennai',
            state: 'TN',
          },
          items: [
            { sku: '102001-1', quantity: 1, selling_price: 6800 },
            { sku: '999999-1', quantity: 1, selling_price: 30000 },
          ],
        }),
      });

      const mixedRes = await handleDeveloperApiPost(mixedReq, ['v1', 'orders']);
      assert.equal(mixedRes.status, 201);
      const mixedJson = await mixedRes.json();
      assert.equal(mixedJson.order.items.length, 1);
      assert.equal(mixedJson.order.items[0].sku, '102001-1');
      assert.equal(mixedJson.pricing.wholesale_amount, 5200);
      assert.equal(mixedJson.pricing.customer_billed_price, 6800);
      assert.match(
        insertedApiOrders[0].shipping_notes,
        /\[WooCommerce Multi-Vendor: 1 of 2 items fulfilled by Weave 365\]/
      );

      // All-unauthorized cart on WooCommerce curated key returns 200 ignored
      const unauthReq = new Request('https://www.weave365.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': TEST_KEY_CURATED,
        },
        body: JSON.stringify({
          platform: 'woocommerce',
          reseller_order_id: 'WC-CUR-2',
          shipping_address: {
            name: 'Meera Iyer',
            phone: '9876501234',
            postcode: '600001',
          },
          items: [
            { sku: '999999-1', quantity: 1, selling_price: 30000 },
          ],
        }),
      });

      const unauthRes = await handleDeveloperApiPost(unauthReq, ['v1', 'orders']);
      assert.equal(unauthRes.status, 200);
      const unauthJson = await unauthRes.json();
      assert.equal(unauthJson.status, 'ignored');
      assert.equal(unauthJson.code, 'NO_WEAVE365_ITEMS');
    });

    it('POST /api/v1/orders keeps Shopify Multi-Vendor label and direct-API strict rejection intact', async () => {
      mockKeys[hashPro].orders_enabled = true;

      // Shopify mixed cart preserves [Shopify Multi-Vendor: ...]
      const shopifyReq = new Request('https://www.weave365.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': TEST_KEY_PRO,
        },
        body: JSON.stringify({
          platform: 'shopify',
          reseller_order_id: 'SH-5001',
          shipping_address: {
            name: 'Riya Patel',
            phone: '9898989898',
            zip: '380001',
            address1: '10 CG Road',
            city: 'Ahmedabad',
            province: 'GJ',
          },
          line_items: [
            { sku: '102001-1', quantity: 1, price: 7000 },
            { sku: 'OTHER-SHOP-SKU', quantity: 1, price: 2500 },
          ],
        }),
      });

      const shopifyRes = await handleDeveloperApiPost(shopifyReq, ['v1', 'orders']);
      assert.equal(shopifyRes.status, 201);
      assert.equal(insertedApiOrders.length, 1);
      assert.equal(insertedApiOrders[0].platform, 'shopify');
      assert.match(
        insertedApiOrders[0].shipping_notes,
        /\[Shopify Multi-Vendor: 1 of 2 items fulfilled by Weave 365\]/
      );

      // Direct API call with unknown SKU alongside valid one still returns 400 INVALID_PRODUCT_SKU
      const directReq = new Request('https://www.weave365.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': TEST_KEY_PRO,
        },
        body: JSON.stringify({
          platform: 'api',
          reseller_order_id: 'API-9001',
          shipping_address: {
            name: 'Riya Patel',
            phone: '9898989898',
            pincode: '380001',
          },
          items: [
            { sku: '102001-1', quantity: 1, selling_price: 7000 },
            { sku: 'UNKNOWN-SKU', quantity: 1, selling_price: 2500 },
          ],
        }),
      });

      const directRes = await handleDeveloperApiPost(directReq, ['v1', 'orders']);
      assert.equal(directRes.status, 400);
      const directJson = await directRes.json();
      assert.equal(directJson.code, 'INVALID_PRODUCT_SKU');
    });

    it('POST /api/v1/orders with platform=woocommerce deduplicates retries and scopes COD amount on mixed carts to Weave365 items', async () => {
      mockKeys[hashPro].orders_enabled = true;
      const payload = {
        platform: 'woocommerce',
        reseller_order_id: 'WC-COD-77',
        payment_type: 'cod',
        gateway: 'cod',
        cod_amount: 12000,
        shipping_address: {
          name: 'Kavita Nair',
          phone: '9845012345',
          postcode: '682001',
          address_line1: '19 Marine Drive',
          city: 'Kochi',
          state: 'KL',
        },
        items: [
          { sku: '102002-1', quantity: 1, selling_price: 6200 },
          { sku: 'OTHER-VENDOR-88', quantity: 1, selling_price: 5800 },
        ],
      };

      const firstRes = await handleDeveloperApiPost(
        new Request('https://www.weave365.com/api/v1/orders', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': TEST_KEY_PRO },
          body: JSON.stringify(payload),
        }),
        ['v1', 'orders']
      );
      assert.equal(firstRes.status, 201);
      const firstJson = await firstRes.json();
      assert.equal(firstJson.pricing.payment_mode, 'COD');
      assert.equal(firstJson.pricing.wholesale_amount, 4300);
      assert.equal(firstJson.pricing.customer_billed_price, 6200);
      assert.equal(firstJson.pricing.cod_amount_to_collect, 6200);
      assert.equal(firstJson.courier_slip.cod_amount_to_collect, 6200);
      assert.equal(insertedApiOrders.length, 1);

      // Retry with same reseller_order_id must deduplicate safely
      const retryRes = await handleDeveloperApiPost(
        new Request('https://www.weave365.com/api/v1/orders', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': TEST_KEY_PRO },
          body: JSON.stringify(payload),
        }),
        ['v1', 'orders']
      );
      assert.equal(retryRes.status, 200);
      const retryJson = await retryRes.json();
      assert.equal(retryJson.is_duplicate, true);
      assert.equal(retryJson.order_id, firstJson.order_id);
      assert.equal(insertedApiOrders.length, 1);
    });
  });

  describe('12. Endpoint: WooCommerce Product CSV Export & Self-Serve Markup', () => {
    const EXPECTED_WOO_HEADERS = [
      'Type',
      'SKU',
      'Name',
      'Published',
      'Is featured?',
      'Visibility in catalog',
      'Short description',
      'Description',
      'In stock?',
      'Stock',
      'Backorders allowed?',
      'Weight (kg)',
      'Regular price',
      'Sale price',
      'Categories',
      'Tags',
      'Images',
      'Parent',
      'Attribute 1 name',
      'Attribute 1 value(s)',
      'Attribute 1 visible',
      'Attribute 1 global',
    ];

    async function readWooCsvResponse(res) {
      const buf = Buffer.from(await res.arrayBuffer());
      const hasUtf8Bom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
      const rawWithBom = new TextDecoder('utf-8', { ignoreBOM: true }).decode(buf);
      const textWithoutBom = rawWithBom.startsWith('\uFEFF') ? rawWithBom.slice(1) : rawWithBom;
      const parsed = Papa.parse(textWithoutBom, { header: true, skipEmptyLines: true });
      return { buf, hasUtf8Bom, rawWithBom, textWithoutBom, parsed };
    }

    it('applyResellerMarkup handles bounds, invalid prices, rounding modes, and never returns below B2R base', () => {
      // Invalid / non-positive base prices
      assert.equal(applyResellerMarkup(NaN, 30, 100, '10'), 0);
      assert.equal(applyResellerMarkup(null, 30, 100, '99'), 0);
      assert.equal(applyResellerMarkup(0, 30, 500, '99'), 0);
      assert.equal(applyResellerMarkup(-250, 30, 0, '50'), 0);

      // Clamping pct (0..500), flat (0..100000), invalid round_to fallback
      assert.equal(applyResellerMarkup(1000, -25, -50, 'invalid'), 1000);
      assert.equal(applyResellerMarkup(1000, 999, 0, 'none'), 6000); // 1000 * (1 + 500/100)
      assert.equal(applyResellerMarkup(1000, 0, 999999, 'none'), 101000);

      // Percentage + rounding modes
      assert.equal(applyResellerMarkup(5200, 30, 0, '10'), 6760);
      assert.equal(applyResellerMarkup(4300, 15, 0, '50'), 4950); // 4945 -> 4950
      assert.equal(applyResellerMarkup(5200, 15, 0, '50'), 6000); // 5980 -> 6000
      assert.equal(applyResellerMarkup(4300, 0, 1000, '99'), 5399); // 5300 -> 5399
      assert.equal(applyResellerMarkup(5200, 15.37, 0, '99'), 6099); // 5999.24 > 5999 -> bumps to 6099

      // Floating-point exactness
      assert.equal(applyResellerMarkup(100, 14, 0, 'none'), 114);
      assert.equal(applyResellerMarkup(100, 99, 0, '99'), 199);

      // Never rounds down below B2R base price
      assert.equal(applyResellerMarkup(5203, 0, 0, '10'), 5210);
      assert.equal(applyResellerMarkup(5210, 0, 0, '50'), 5250);
    });

    it('GET /api/v1/catalog.csv?format=woocommerce&markup_pct=30&round_to=10 returns UTF-8 BOM, headers, 22 columns, simple vs variable+variation rows, and marked-up prices', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog.csv?format=woocommerce&markup_pct=30&round_to=10', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog.csv']);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/csv; charset=utf-8');
      assert.equal(res.headers.get('content-disposition'), 'attachment; filename="weave365-woocommerce-catalog.csv"');

      const { hasUtf8Bom, rawWithBom, parsed } = await readWooCsvResponse(res);
      assert.equal(hasUtf8Bom, true, 'HTTP response must begin with UTF-8 BOM bytes 0xEF 0xBB 0xBF');
      assert.equal(rawWithBom.startsWith('\uFEFF'), true);
      assert.deepEqual(parsed.errors, []);
      assert.deepEqual(parsed.meta.fields, EXPECTED_WOO_HEADERS);
      assert.equal(parsed.meta.fields.length, 22);

      const rows = parsed.data;
      // 102001 (1 variable + 2 variations) + 102002 (1 simple) + 999999 (1 simple) = 5 rows
      assert.equal(rows.length, 5);

      const parent102001 = rows.find((r) => r.Type === 'variable' && r.SKU === '102001');
      assert.ok(parent102001);
      assert.equal(parent102001.Name, 'Pure Katan Silk Banarasi Saree');
      assert.equal(parent102001.Published, '1');
      assert.equal(parent102001['Is featured?'], '0');
      assert.equal(parent102001['Visibility in catalog'], 'visible');
      assert.equal(parent102001['In stock?'], '1');
      assert.equal(parent102001.Stock, '');
      assert.equal(parent102001['Backorders allowed?'], '0');
      assert.equal(parent102001['Weight (kg)'], '0.9');
      assert.equal(parent102001['Regular price'], '');
      assert.equal(parent102001['Sale price'], '');
      assert.equal(parent102001.Categories, 'Saree');
      assert.equal(parent102001.Parent, '');
      assert.equal(parent102001['Attribute 1 name'], 'Color');
      assert.equal(parent102001['Attribute 1 value(s)'], 'Royal Red, Emerald Green');
      assert.equal(parent102001['Attribute 1 visible'], '1');
      assert.equal(parent102001['Attribute 1 global'], '0');
      assert.match(parent102001.Description, /100% Banarasi/);
      assert.doesNotMatch(parent102001.Description, /Weave365/i);

      const childRed = rows.find((r) => r.Type === 'variation' && r.SKU === '102001-1');
      assert.ok(childRed);
      assert.equal(childRed.Name, 'Pure Katan Silk Banarasi Saree - Royal Red');
      assert.equal(childRed.Parent, '102001');
      assert.equal(childRed['In stock?'], '1');
      assert.equal(childRed.Stock, '15');
      assert.equal(childRed['Regular price'], '6760'); // 5200 * 1.30 = 6760
      assert.equal(childRed['Short description'], '');
      assert.equal(childRed.Description, '');
      assert.equal(childRed.Categories, '');
      assert.equal(childRed.Tags, '');
      assert.equal(childRed['Attribute 1 name'], 'Color');
      assert.equal(childRed['Attribute 1 value(s)'], 'Royal Red');
      assert.equal(childRed['Attribute 1 visible'], '');
      assert.equal(childRed['Attribute 1 global'], '0');

      const childGreen = rows.find((r) => r.Type === 'variation' && r.SKU === '102001-2');
      assert.ok(childGreen);
      assert.equal(childGreen.Parent, '102001');
      assert.equal(childGreen.Stock, '10');
      assert.equal(childGreen['Regular price'], '6760');
      assert.equal(childGreen['Attribute 1 value(s)'], 'Emerald Green');

      // Single-variant product 102002 -> simple product using parent SKU
      const simple102002 = rows.find((r) => r.Type === 'simple' && r.SKU === '102002');
      assert.ok(simple102002);
      assert.equal(simple102002.Name, 'Georgette Banarasi Floral Saree');
      assert.equal(simple102002.Parent, '');
      assert.equal(simple102002['In stock?'], '1');
      assert.equal(simple102002.Stock, '8');
      assert.equal(simple102002['Regular price'], '5590'); // 4300 * 1.30 = 5590
      assert.equal(simple102002['Attribute 1 name'], '');
      assert.equal(simple102002['Attribute 1 value(s)'], '');
      assert.equal(simple102002['Attribute 1 visible'], '');
      assert.equal(simple102002['Attribute 1 global'], '');
      assert.equal(rows.some((r) => r.SKU === '102002-1'), false, 'Single-variant simple product should use parent SKU');

      // Exclusive 999999 -> simple product: 25000 * 1.30 = 32500
      const simple999999 = rows.find((r) => r.Type === 'simple' && r.SKU === '999999');
      assert.ok(simple999999);
      assert.equal(simple999999['Regular price'], '32500');
    });

    it('supports format=woo, /api/v1/catalog, /api/v1/catalog-feed.csv, markup_flat, round_to=99, round_to=50, and leaves Matrixify unchanged', async () => {
      // 1. /api/v1/catalog?format=woo&markup_flat=500&round_to=99
      const wooAliasReq = new Request('https://www.weave365.com/api/v1/catalog?format=woo&markup_flat=500&round_to=99', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const wooAliasRes = await handleDeveloperApiGet(wooAliasReq, ['v1', 'catalog']);
      assert.equal(wooAliasRes.status, 200);
      assert.equal(wooAliasRes.headers.get('content-disposition'), 'attachment; filename="weave365-woocommerce-catalog.csv"');
      const { hasUtf8Bom, parsed: wooParsed } = await readWooCsvResponse(wooAliasRes);
      assert.equal(hasUtf8Bom, true);
      assert.equal(wooParsed.data.find((r) => r.SKU === '102001-1')['Regular price'], '5799'); // 5200 + 500 -> 5799
      assert.equal(wooParsed.data.find((r) => r.SKU === '102002')['Regular price'], '4899'); // 4300 + 500 -> 4899

      // 2. /api/v1/catalog-feed.csv?format=woocommerce&markup_pct=15&round_to=50
      const feedWooReq = new Request('https://www.weave365.com/api/v1/catalog-feed.csv?format=woocommerce&markup_pct=15&round_to=50', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const feedWooRes = await handleDeveloperApiGet(feedWooReq, ['v1', 'catalog-feed.csv']);
      assert.equal(feedWooRes.status, 200);
      assert.equal(feedWooRes.headers.get('content-disposition'), 'attachment; filename="weave365-woocommerce-catalog.csv"');
      const { parsed: feedWooParsed } = await readWooCsvResponse(feedWooRes);
      assert.equal(feedWooParsed.data.find((r) => r.SKU === '102001-1')['Regular price'], '6000'); // 5200*1.15=5980 -> 6000
      assert.equal(feedWooParsed.data.find((r) => r.SKU === '102002')['Regular price'], '4950'); // 4300*1.15=4945 -> 4950

      // 3. Matrixify/Shopify CSV default on /api/v1/catalog-feed.csv remains unchanged
      const matrixifyReq = new Request('https://www.weave365.com/api/v1/catalog-feed.csv', {
        headers: { 'x-api-key': TEST_KEY_PRO },
      });
      const matrixifyRes = await handleDeveloperApiGet(matrixifyReq, ['v1', 'catalog-feed.csv']);
      assert.equal(matrixifyRes.status, 200);
      assert.equal(matrixifyRes.headers.get('content-disposition'), 'attachment; filename="weave365-catalog.csv"');
      const matrixifyBuf = Buffer.from(await matrixifyRes.arrayBuffer());
      assert.equal(matrixifyBuf[0] === 0xef && matrixifyBuf[1] === 0xbb && matrixifyBuf[2] === 0xbf, false);
      const matrixifyText = matrixifyBuf.toString('utf-8');
      assert.match(matrixifyText.split('\n')[0], /^Handle,Title,Body \(HTML\)/);
    });

    it('isolates syncFeedResponseCache and syncFeedCache across different markup params and auth scopes', async () => {
      // Request 1: default (no markup)
      const res0 = await handleDeveloperApiGet(
        new Request('https://www.weave365.com/api/v1/catalog.csv?format=woocommerce', {
          headers: { 'x-api-key': TEST_KEY_PRO },
        }),
        ['v1', 'catalog.csv']
      );
      const { parsed: p0 } = await readWooCsvResponse(res0);
      assert.equal(p0.data.find((r) => r.SKU === '102002')['Regular price'], '4300');

      // Request 2 (without clearing caches!): markup_pct=30&round_to=10
      const res30 = await handleDeveloperApiGet(
        new Request('https://www.weave365.com/api/v1/catalog.csv?format=woocommerce&markup_pct=30&round_to=10', {
          headers: { 'x-api-key': TEST_KEY_PRO },
        }),
        ['v1', 'catalog.csv']
      );
      const { parsed: p30 } = await readWooCsvResponse(res30);
      assert.equal(p30.data.find((r) => r.SKU === '102002')['Regular price'], '5590');

      // Request 3 (without clearing caches!): markup_flat=250&round_to=99
      const resFlat = await handleDeveloperApiGet(
        new Request('https://www.weave365.com/api/v1/catalog.csv?format=woocommerce&markup_flat=250&round_to=99', {
          headers: { 'x-api-key': TEST_KEY_PRO },
        }),
        ['v1', 'catalog.csv']
      );
      const { parsed: pFlat } = await readWooCsvResponse(resFlat);
      assert.equal(pFlat.data.find((r) => r.SKU === '102002')['Regular price'], '4599');

      // Request 4 (cache hit on Request 2!): must still preserve headers & exact prices
      const res30Hit = await handleDeveloperApiGet(
        new Request('https://www.weave365.com/api/v1/catalog.csv?format=woocommerce&markup_pct=30&round_to=10', {
          headers: { 'x-api-key': TEST_KEY_PRO },
        }),
        ['v1', 'catalog.csv']
      );
      assert.equal(res30Hit.headers.get('content-disposition'), 'attachment; filename="weave365-woocommerce-catalog.csv"');
      const { parsed: p30Hit } = await readWooCsvResponse(res30Hit);
      assert.equal(p30Hit.data.find((r) => r.SKU === '102002')['Regular price'], '5590');

      // Request 5 (curated key with same params): must NOT receive Pro cached 999999
      const resCurated = await handleDeveloperApiGet(
        new Request('https://www.weave365.com/api/v1/catalog.csv?format=woocommerce&markup_pct=30&round_to=10', {
          headers: { 'x-api-key': TEST_KEY_CURATED },
        }),
        ['v1', 'catalog.csv']
      );
      const { parsed: pCurated } = await readWooCsvResponse(resCurated);
      assert.equal(pCurated.data.some((r) => r.SKU === '999999'), false);
      assert.equal(pCurated.data.some((r) => r.SKU === '102001'), true);
      assert.equal(pCurated.data.some((r) => r.SKU === '102002'), true);
    });

    it('enforces curated SKU isolation, archived exclusion, zero B2B price leakage, variant dedup _index SKUs matching stock_map, HTTPS image filtering, and variant stock checks', async () => {
      const richCatalog = [
        {
          id: '201001',
          title: 'Rich Kadhwa Saree',
          summary: 'Handwoven Kadhwa silk saree.',
          category: 'Sarees',
          subCategory: 'Katan Silk',
          b2bPrice: 1800,
          wholesaleBulkPrice: 1700,
          costPrice: 1500,
          isArchived: false,
          images: [
            'https://assets.weave365.com/main.jpg',
            'http://insecure.example.com/skip.jpg',
            '/relative/skip.jpg',
            'data:image/png;base64,AAA',
          ],
          variants: [
            {
              color: 'Crimson',
              image: 'https://assets.weave365.com/crimson-1.jpg',
              quantity: 6,
              prices: { b2r: 4000, b2b: 1800, bulk: 1700, cost: 1500, mrp: 1900, single: 6200 },
            },
            {
              color: 'crimson', // Duplicate color -> collects image into parent gallery; next variant keeps _index=2!
              image: 'https://assets.weave365.com/crimson-extra.jpg',
              quantity: 4,
              prices: { b2r: 4000 },
            },
            {
              color: 'Emerald',
              image: 'https://assets.weave365.com/emerald.jpg',
              isOutOfStock: true,
              quantity: 9,
              prices: { b2r: 4200, b2b: 1850, mrp: 1950, single: 6500 },
            },
            {
              color: 'Ivory',
              image: 'https://assets.weave365.com/ivory.jpg',
              stockStatusOverride: 'archived',
              quantity: 3,
              prices: { b2r: 4100 },
            },
          ],
        },
        {
          id: '201002',
          title: 'Archived Hidden Saree',
          isArchived: true,
          variants: [{ code: '201002-1', color: 'Black', quantity: 5, prices: { b2r: 3000 } }],
        },
        {
          id: '201003',
          title: 'Single Out Of Stock Variant Saree',
          category: 'Sarees',
          images: ['https://assets.weave365.com/201003.jpg'],
          variants: [
            { code: '201003-1', color: 'Maroon', stockStatusOverride: 'out-of-stock', quantity: 4, prices: { b2r: 3500 } },
          ],
        },
        {
          id: '201004',
          title: 'Colors Only Tussar Saree',
          category: 'Sarees',
          price: 3200,
          quantity: 9,
          images: ['https://assets.weave365.com/201004.jpg'],
          colors: ['Beige', 'Maroon'],
        },
        {
          id: '999888',
          title: 'Unauthorized Luxury Saree',
          isArchived: false,
          images: ['https://assets.weave365.com/unauth.jpg'],
          variants: [{ code: '999888-1', color: 'Gold', quantity: 2, prices: { b2r: 18000 } }],
        },
      ];

      _setCatalogProductsForTesting(richCatalog);
      const stockMap = generateStockMap(richCatalog);

      // Pro request
      const proRes = await handleDeveloperApiGet(
        new Request('https://www.weave365.com/api/v1/catalog.csv?format=woocommerce&markup_pct=25&round_to=10', {
          headers: { 'x-api-key': TEST_KEY_PRO },
        }),
        ['v1', 'catalog.csv']
      );
      assert.equal(proRes.status, 200);
      const { textWithoutBom, parsed } = await readWooCsvResponse(proRes);
      const rows = parsed.data;

      // Archived product 201002 must be excluded
      assert.equal(rows.some((r) => r.SKU === '201002' || r.Parent === '201002'), false);

      // No B2B/bulk/cost values leaked anywhere in CSV body
      for (const forbiddenVal of ['1800', '1700', '1500', '1900', '1850', '1950']) {
        assert.equal(textWithoutBom.includes(forbiddenVal), false, `B2B/cost value ${forbiddenVal} must never leak`);
      }

      // Variable parent 201001 checks
      const parent = rows.find((r) => r.Type === 'variable' && r.SKU === '201001');
      assert.ok(parent);
      assert.equal(parent.Categories, 'Sarees > Katan Silk');
      assert.equal(parent['Short description'], 'Handwoven Kadhwa silk saree.');
      assert.equal(parent['In stock?'], '1');
      assert.equal(parent['Attribute 1 value(s)'], 'Crimson, Emerald, Ivory');
      // Only valid https:// images included, primary/unique variant images first, duplicate variant image collected
      assert.equal(
        parent.Images,
        'https://assets.weave365.com/main.jpg, https://assets.weave365.com/crimson-1.jpg, https://assets.weave365.com/emerald.jpg, https://assets.weave365.com/ivory.jpg, https://assets.weave365.com/crimson-extra.jpg'
      );

      // Fallback variant SKUs must match stockMap keys (preserving _index across dedup!)
      const vCrimson = rows.find((r) => r.Type === 'variation' && r['Attribute 1 value(s)'] === 'Crimson');
      const vEmerald = rows.find((r) => r.Type === 'variation' && r['Attribute 1 value(s)'] === 'Emerald');
      const vIvory = rows.find((r) => r.Type === 'variation' && r['Attribute 1 value(s)'] === 'Ivory');
      assert.ok(vCrimson && vEmerald && vIvory);
      assert.equal(vCrimson.SKU, '201001-CRIMSON-1');
      assert.equal(vEmerald.SKU, '201001-EMERALD-3', 'Must preserve _index=2 (+1 => 3) after skipping duplicate Crimson at index 1');
      assert.equal(vIvory.SKU, '201001-IVORY-4', 'Must preserve _index=3 (+1 => 4)');
      assert.ok(stockMap[vCrimson.SKU], `Stock map must contain ${vCrimson.SKU}`);
      assert.ok(stockMap[vEmerald.SKU], `Stock map must contain ${vEmerald.SKU}`);
      assert.ok(stockMap[vIvory.SKU], `Stock map must contain ${vIvory.SKU}`);

      // Prices marked up >= B2R base (4000*1.25=5000, 4200*1.25=5250, 4100*1.25=5125->5130)
      assert.equal(vCrimson['Regular price'], '5000');
      assert.equal(vCrimson['In stock?'], '1');
      assert.equal(vCrimson.Stock, '6');

      // Out-of-stock & archived variant stock flags respected
      assert.equal(vEmerald['Regular price'], '5250');
      assert.equal(vEmerald['In stock?'], '0');
      assert.equal(vEmerald.Stock, '0');
      assert.equal(vIvory['In stock?'], '0');
      assert.equal(vIvory.Stock, '0');

      // Single out-of-stock variant product 201003 -> simple product with In stock?=0, Stock=0
      const simpleOos = rows.find((r) => r.Type === 'simple' && r.SKU === '201003');
      assert.ok(simpleOos);
      assert.equal(simpleOos['In stock?'], '0');
      assert.equal(simpleOos.Stock, '0');
      assert.equal(simpleOos['Regular price'], '4380'); // 3500*1.25=4375 -> 4380

      // Colors-only product 201004 -> variable + variations matching stockMap keys
      const colorsParent = rows.find((r) => r.Type === 'variable' && r.SKU === '201004');
      assert.ok(colorsParent);
      assert.equal(colorsParent['Attribute 1 value(s)'], 'Beige, Maroon');
      const vBeige = rows.find((r) => r.Type === 'variation' && r.Parent === '201004' && r['Attribute 1 value(s)'] === 'Beige');
      const vMaroon = rows.find((r) => r.Type === 'variation' && r.Parent === '201004' && r['Attribute 1 value(s)'] === 'Maroon');
      assert.ok(vBeige && vMaroon);
      assert.equal(vBeige.SKU, '201004-BEIGE-1');
      assert.equal(vMaroon.SKU, '201004-MAROON-2');
      assert.ok(stockMap[vBeige.SKU], `Stock map must contain ${vBeige.SKU}`);
      assert.ok(stockMap[vMaroon.SKU], `Stock map must contain ${vMaroon.SKU}`);
      assert.equal(vBeige.Stock, '9');
      assert.equal(vBeige['Regular price'], '4000'); // 3200 * 1.25 = 4000

      // Curated key boundary test against richCatalog
      mockKeys[hashCurated].selected_skus = ['201001'];
      const curatedRes = await handleDeveloperApiGet(
        new Request('https://www.weave365.com/api/v1/catalog.csv?format=woocommerce', {
          headers: { 'x-api-key': TEST_KEY_CURATED },
        }),
        ['v1', 'catalog.csv']
      );
      assert.equal(curatedRes.status, 200);
      const { parsed: curatedParsed } = await readWooCsvResponse(curatedRes);
      const curatedSkus = curatedParsed.data.map((r) => r.SKU);
      assert.equal(curatedSkus.includes('201001'), true);
      assert.equal(curatedSkus.includes('999888'), false, 'Unauthorized SKU 999888 must not appear');
      assert.equal(curatedSkus.includes('201003'), false, 'Non-selected SKU 201003 must not appear');

      // Direct formatter call check: BOM + archived filtering
      const directCsv = formatForWooCommerceCsv(richCatalog);
      assert.equal(directCsv.startsWith('\uFEFF'), true);
      assert.equal(directCsv.includes('201002'), false);
    });
  });

  describe('10. Instant Plan Unlock & Anti-Bypass Enforcement', () => {
    it('blocks inactive/unpaid subscription_status even if is_active is spoofed true', async () => {
      mockKeys[hashPro].subscription_status = 'inactive';
      mockKeys[hashPro].is_active = true;
      const res = await handleDeveloperApiGet(
        new Request('https://www.weave365.com/api/v1/catalog.json', {
          headers: { 'x-api-key': TEST_KEY_PRO },
        }),
        ['v1', 'catalog.json']
      );
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.code, 'SUBSCRIPTION_PENDING_PAYMENT');
    });

    it('blocks rejected API keys with 403 KEY_REJECTED', async () => {
      mockKeys[hashPro].approval_status = 'rejected';
      const res = await handleDeveloperApiGet(
        new Request('https://www.weave365.com/api/v1/catalog.json', {
          headers: { 'x-api-key': TEST_KEY_PRO },
        }),
        ['v1', 'catalog.json']
      );
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.code, 'KEY_REJECTED');
    });

    it('enforces server-side onboarding, blocks pre-payment key reveal, unlocks plan payment immediately, and blocks order_id replay', async () => {
      const dbKeys = [];
      const dbProfiles = {
        'user-1': {
          id: 'user-1',
          email: 'merchant@example.com',
          full_name: 'Aarav Store',
          business_name: 'Aarav Silks',
          role: 'buyer',
          qualification: {},
        },
      };

      const sessionSupabase = {
        auth: {
          getUser: async (token) => (
            token === 'valid-user-token'
              ? { data: { user: { id: 'user-1', email: 'merchant@example.com', user_metadata: {} } }, error: null }
              : { data: { user: null }, error: new Error('Invalid token') }
          ),
        },
        from: (table) => {
          if (table === 'profiles') {
            return {
              select: () => ({
                eq: (col, id) => ({
                  maybeSingle: async () => ({ data: dbProfiles[id] || null, error: null }),
                }),
              }),
              update: (patch) => ({
                eq: async (col, id) => {
                  dbProfiles[id] = { ...(dbProfiles[id] || {}), ...patch };
                  return { data: dbProfiles[id], error: null };
                },
              }),
            };
          }
          if (table === 'admin_notes') {
            return {
              insert: async () => ({ data: null, error: null }),
              select: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }),
            };
          }
          if (table === 'api_keys') {
            const makeFilter = (filters = {}) => {
              const chain = {
                eq: (col, val) => makeFilter({ ...filters, [col]: val }),
                order: () => chain,
                maybeSingle: async () => {
                  const found = dbKeys.find((k) =>
                    Object.entries(filters).every(([c, v]) => k[c] === v)
                  ) || null;
                  return { data: found, error: null };
                },
                select: () => chain,
                single: async () => {
                  const found = dbKeys.find((k) =>
                    Object.entries(filters).every(([c, v]) => k[c] === v)
                  ) || null;
                  return { data: found, error: null };
                },
              };
              return chain;
            };
            return {
              select: () => makeFilter(),
              insert: (rows) => ({
                select: () => ({
                  single: async () => {
                    const row = {
                      id: '11111111-2222-3333-4444-555555555555',
                      created_at: new Date().toISOString(),
                      ...rows[0],
                    };
                    dbKeys.push(row);
                    return { data: row, error: null };
                  },
                }),
              }),
              update: (patch) => ({
                eq: (col, val) => {
                  const idx = dbKeys.findIndex((k) => k[col] === val);
                  if (idx >= 0) dbKeys[idx] = { ...dbKeys[idx], ...patch };
                  const chain = {
                    then: (resolve) => resolve({ data: dbKeys[idx] || null, error: null }),
                    select: () => ({
                      single: async () => ({ data: dbKeys[idx] || null, error: null }),
                    }),
                  };
                  return chain;
                },
              }),
            };
          }
          if (table === 'api_subscription_payments') {
            return {
              select: () => {
                const chain = {
                  eq: () => chain,
                  maybeSingle: async () => ({ data: null, error: null }),
                };
                return chain;
              },
            };
          }
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
          };
        },
      };

      _setSupabaseClientForTesting(sessionSupabase);

      // A. Reject incomplete onboarding request
      const badFormRes = await handleDeveloperApiPost(
        new Request('https://www.weave365.com/api/developer/request-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer valid-user-token',
          },
          body: JSON.stringify({
            gstin: 'BAD',
            websiteUrl: 'https://store.example.com',
            platform: 'Shopify',
            apiUseCases: ['Catalog Sync'],
          }),
        }),
        ['developer', 'request-access']
      );
      assert.equal(badFormRes.status, 400);
      assert.equal((await badFormRes.json()).code, 'INVALID_GSTIN');

      // B. Valid onboarding request immediately unlocks payment stage without returning raw secret
      const okFormRes = await handleDeveloperApiPost(
        new Request('https://www.weave365.com/api/developer/request-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer valid-user-token',
          },
          body: JSON.stringify({
            gstin: '29ABCDE1234F1Z5',
            websiteUrl: 'https://aaravsilks.com',
            platform: 'Shopify',
            apiUseCases: ['Catalog Sync', 'Real-time Inventory'],
          }),
        }),
        ['developer', 'request-access']
      );
      assert.equal(okFormRes.status, 200);
      const okFormJson = await okFormRes.json();
      assert.equal(okFormJson.success, true);
      assert.equal(okFormJson.rawKey, undefined);
      assert.equal(okFormJson.rawSecretKey, undefined);
      assert.equal(okFormJson.keyRecord.key_hash, undefined);
      assert.equal(okFormJson.keyRecord.approval_status, 'approved');
      assert.equal(okFormJson.keyRecord.subscription_status, 'pending_payment');
      assert.equal(okFormJson.keyRecord.is_active, false);

      const createdKeyId = okFormJson.keyRecord.id;

      // C. Cannot reveal raw key before payment completes
      const prePayReveal = await handleDeveloperApiPost(
        new Request('https://www.weave365.com/api/developer/reveal-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer valid-user-token',
          },
          body: JSON.stringify({ keyId: createdKeyId }),
        }),
        ['developer', 'reveal-key']
      );
      assert.equal(prePayReveal.status, 403);
      assert.equal((await prePayReveal.json()).code, 'PAYMENT_REQUIRED');

      // D. Cannot activate using another key's order_id
      const replayVerify = await handleDeveloperApiPost(
        new Request('https://www.weave365.com/api/developer/verify-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer valid-user-token',
          },
          body: JSON.stringify({
            keyId: createdKeyId,
            gateway: 'cashfree',
            order_id: 'CF_SUB_999999999999_1M_123456',
          }),
        }),
        ['developer', 'verify-subscription']
      );
      assert.equal(replayVerify.status, 403);
      assert.equal((await replayVerify.json()).code, 'ORDER_KEY_MISMATCH');

      // E. Cannot start payment if form fields (GSTIN / URL) were never filled
      dbKeys.push({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        user_id: 'user-1',
        approval_status: 'pending',
        subscription_status: 'inactive',
        is_active: false,
        gst_number: '',
        client_website: '',
      });
      const incompleteSub = await handleDeveloperApiPost(
        new Request('https://www.weave365.com/api/developer/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer valid-user-token',
          },
          body: JSON.stringify({
            keyId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            plan: 'growth',
          }),
        }),
        ['developer', 'subscribe']
      );
      assert.equal(incompleteSub.status, 400);
      assert.equal((await incompleteSub.json()).code, 'FORM_INCOMPLETE');

      // F. Once key is paid/active, key owner can reveal full secret
      dbKeys[0].is_active = true;
      dbKeys[0].subscription_status = 'active';
      dbKeys[0].subscription_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const postPayReveal = await handleDeveloperApiPost(
        new Request('https://www.weave365.com/api/developer/reveal-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer valid-user-token',
          },
          body: JSON.stringify({ keyId: createdKeyId }),
        }),
        ['developer', 'reveal-key']
      );
      assert.equal(postPayReveal.status, 200);
      const revealedJson = await postPayReveal.json();
      assert.equal(revealedJson.success, true);
      assert.match(revealedJson.rawKey, /^w365_live_[a-f0-9]{48}$/);
    });
  });
});
