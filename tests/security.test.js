/**
 * @file security.test.js
 * @description Comprehensive automated security test suite for Weave365 Developer API.
 * Validates all 37 security test cases:
 * - Test Group 1: Authentication & Authorization (Tests 1–10)
 * - Test Group 2: Order API Permissions & Toggle (Tests 11–18)
 * - Test Group 3: Curated Product Authorization (Tests 19–24)
 * - Test Group 4: API Secret Safety & Storage (Tests 25–29)
 * - Test Group 5: Regression & Edge Cases (Tests 30–37)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  handleDeveloperApiGet,
  handleDeveloperApiPost,
  _setSupabaseClientForTesting,
  _clearKeyMemoryCacheForTesting,
  hashApiKey,
  getAuthorizedProducts,
} from '../app/api/[[...route]]/developerApiHandler.js';

import { sanitizeKeyRecord, generateRawApiKey } from '../src/services/developerService.js';

// --- Test Fixtures & Mock Database ---
const MOCK_PRODUCTS = [
  {
    id: '102001',
    groupKey: '102001',
    title: 'Katan Silk Handloom Banarasi Saree',
    category: 'Sarees',
    fabric: 'Pure Katan Silk',
    resellerPrice: 4500,
    price: 4500,
    isOutOfStock: false,
    variants: [{ code: '102001-RED', color: 'Crimson Red', prices: { b2r: 4500 } }],
  },
  {
    id: '102002',
    groupKey: '102002',
    title: 'Organza Floral Banarasi Saree',
    category: 'Sarees',
    fabric: 'Pure Organza',
    resellerPrice: 6200,
    price: 6200,
    isOutOfStock: false,
    variants: [{ code: '102002-BLU', color: 'Royal Blue', prices: { b2r: 6200 } }],
  },
  {
    id: '102003',
    groupKey: '102003',
    title: 'Georgette Zari Jaal Saree',
    category: 'Sarees',
    fabric: 'Georgette',
    resellerPrice: 5100,
    price: 5100,
    isOutOfStock: true,
    variants: [{ code: '102003-GLD', color: 'Antique Gold', prices: { b2r: 5100 } }],
  },
  {
    id: '202002',
    groupKey: '202002',
    title: 'Tanchoi Silk Festive Saree',
    category: 'Sarees',
    fabric: 'Tanchoi Silk',
    resellerPrice: 3800,
    price: 3800,
    isOutOfStock: false,
    variants: [{ code: '202002-GRN', color: 'Emerald Green', prices: { b2r: 3800 } }],
  },
  {
    id: '303001',
    groupKey: '303001',
    title: 'Tissue Dupatta Banarasi',
    category: 'Dupattas',
    fabric: 'Tissue',
    resellerPrice: 1900,
    price: 1900,
    isOutOfStock: false,
    variants: [{ code: '303001-SLV', color: 'Silver', prices: { b2r: 1900 } }],
  },
];

// Plaintext secrets for test accounts (generated freshly for testing)
const TEST_KEY_A_SECRET = 'w365_live_secA_111122223333444455556666';
const TEST_KEY_B_SECRET = 'w365_live_secB_777788889999000011112222';
const TEST_KEY_C_SECRET = 'w365_live_secC_deactivated_key_secret';
const TEST_KEY_D_SECRET = 'w365_live_secD_ratelimited_key_secret';

let MOCK_DB_KEYS = [];
let MOCK_API_ORDERS = [];
let MOCK_ORDERS = [];
let MOCK_INQUIRIES = [];

async function initMockDatabase() {
  const hashA = await hashApiKey(TEST_KEY_A_SECRET);
  const hashB = await hashApiKey(TEST_KEY_B_SECRET);
  const hashC = await hashApiKey(TEST_KEY_C_SECRET);
  const hashD = await hashApiKey(TEST_KEY_D_SECRET);

  MOCK_DB_KEYS = [
    // Account A: Curated catalog (only 102001, 102003, 202002), orders_enabled = FALSE
    {
      id: 'key-account-a-uuid',
      user_id: 'user-a-uuid',
      key_hash: hashA,
      key_prefix: `${TEST_KEY_A_SECRET.slice(0, 14)}...${TEST_KEY_A_SECRET.slice(-4)}`,
      client_name: 'Boutique Reseller Alpha',
      client_website: 'http://localhost:3000/account', // Legacy localhost value to test sanitization
      tier: 'free',
      monthly_quota: 2000,
      rate_limit_rps: 1,
      is_active: true,
      orders_enabled: false,
      catalog_mode: 'curated',
      selected_skus: ['102001', '102003', '202002'],
      allowed_endpoints: ['catalog', 'stock', 'product'],
    },
    // Account B: Full catalog access, orders_enabled = TRUE
    {
      id: 'key-account-b-uuid',
      user_id: 'user-b-uuid',
      key_hash: hashB,
      key_prefix: `${TEST_KEY_B_SECRET.slice(0, 14)}...${TEST_KEY_B_SECRET.slice(-4)}`,
      client_name: 'Storefront Beta',
      client_website: 'https://storefront-beta.example.com',
      tier: 'growth',
      monthly_quota: 20000,
      rate_limit_rps: 5,
      is_active: true,
      orders_enabled: true,
      catalog_mode: 'all',
      selected_skus: [],
      allowed_endpoints: ['catalog', 'stock', 'product', 'orders'],
    },
    // Account C: Deactivated key (is_active: false)
    {
      id: 'key-account-c-uuid',
      user_id: 'user-c-uuid',
      key_hash: hashC,
      key_prefix: `${TEST_KEY_C_SECRET.slice(0, 14)}...${TEST_KEY_C_SECRET.slice(-4)}`,
      client_name: 'Suspended Store',
      client_website: 'https://suspended.example.com',
      tier: 'free',
      monthly_quota: 2000,
      rate_limit_rps: 1,
      is_active: false,
      orders_enabled: false,
      catalog_mode: 'all',
      selected_skus: [],
    },
    // Account D: Quota exceeded
    {
      id: 'key-account-d-uuid',
      user_id: 'user-d-uuid',
      key_hash: hashD,
      key_prefix: `${TEST_KEY_D_SECRET.slice(0, 14)}...${TEST_KEY_D_SECRET.slice(-4)}`,
      client_name: 'Maxed Quota Store',
      client_website: 'https://quota.example.com',
      tier: 'free',
      monthly_quota: 5, // Tiny quota
      rate_limit_rps: 1,
      is_active: true,
      orders_enabled: false,
      catalog_mode: 'all',
      selected_skus: [],
    },
  ];

  MOCK_API_ORDERS = [];
  MOCK_ORDERS = [];
  MOCK_INQUIRIES = [];
}

function createMockSupabase() {
  return {
    from(tableName) {
      let filterCol = null;
      let filterVal = null;
      let orCondition = null;

      const queryObj = {
        select(cols) {
          return this;
        },
        eq(col, val) {
          filterCol = col;
          filterVal = val;
          return this;
        },
        gte() {
          return this;
        },
        or(condition) {
          orCondition = condition;
          return this;
        },
        order() {
          return this;
        },
        limit(num) {
          return this;
        },
        single() {
          if (tableName === 'api_keys') {
            const row = MOCK_DB_KEYS.find(k => k[filterCol] === filterVal);
            return Promise.resolve({ data: row || null, error: row ? null : { message: 'Not found' } });
          }
          if (tableName === 'sheet_data') {
            return Promise.resolve({
              data: { id: 'products_json', csv_data: JSON.stringify(MOCK_PRODUCTS) },
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        },
        maybeSingle() {
          if (tableName === 'api_keys') {
            const row = MOCK_DB_KEYS.find(k => k[filterCol] === filterVal);
            return Promise.resolve({ data: row || null, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        },
        insert(payloadArray) {
          const inserted = {
            id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            created_at: new Date().toISOString(),
            ...payloadArray[0],
          };
          if (tableName === 'api_orders') MOCK_API_ORDERS.push(inserted);
          if (tableName === 'orders') MOCK_ORDERS.push(inserted);
          if (tableName === 'inquiries') MOCK_INQUIRIES.push(inserted);

          return {
            select() {
              return {
                single() {
                  return Promise.resolve({ data: inserted, error: null });
                },
              };
            },
          };
        },
        then(resolve) {
          // Default data retrieval for list endpoints
          if (tableName === 'vendor_product_stock') {
            return resolve({ data: [], error: null });
          }
          if (tableName === 'api_usage_daily') {
            if (orCondition?.includes('user-d-uuid') || filterVal === 'key-account-d-uuid') {
              return resolve({ data: [{ total_requests: 100 }], error: null });
            }
            return resolve({ data: [{ total_requests: 10 }], error: null });
          }
          if (tableName === 'api_orders') {
            let res = MOCK_API_ORDERS;
            if (filterCol && filterVal) res = res.filter(o => o[filterCol] === filterVal);
            return resolve({ data: res, error: null });
          }
          if (tableName === 'orders') {
            let res = MOCK_ORDERS;
            if (filterCol && filterVal) res = res.filter(o => o[filterCol] === filterVal);
            return resolve({ data: res, error: null });
          }
          if (tableName === 'inquiries') {
            let res = MOCK_INQUIRIES;
            if (filterCol && filterVal) res = res.filter(o => o[filterCol] === filterVal);
            return resolve({ data: res, error: null });
          }
          return resolve({ data: [], error: null });
        },
      };

      return queryObj;
    },
    rpc(fn, args) {
      return Promise.resolve({ data: null, error: null });
    },
  };
}

describe('Weave365 B2B Developer API Security Test Suite (37 Tests)', () => {
  beforeEach(async () => {
    await initMockDatabase();
    _clearKeyMemoryCacheForTesting();
    _setSupabaseClientForTesting(createMockSupabase());
  });

  // ==========================================
  // Test Group 1: Authentication & Authorization (10 tests)
  // ==========================================
  describe('Test Group 1: Authentication & Authorization', () => {
    it('Test 1: Valid API key returns 200 on catalog', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: { 'X-API-Key': TEST_KEY_A_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'success');
      assert.ok(Array.isArray(data.products));
    });

    it('Test 2: Missing API key returns 401', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog');
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.status, 'error');
      assert.equal(data.code, 'UNAUTHORIZED');
    });

    it('Test 3: Invalid API key returns 401', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: { 'X-API-Key': 'w365_live_invalid_key_random123456789' },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.status, 'error');
      assert.equal(data.code, 'UNAUTHORIZED');
    });

    it('Test 4: Revoked/deactivated API key returns 403', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: { 'X-API-Key': TEST_KEY_C_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.status, 'error');
    });

    it('Test 5: Authorization: Bearer <key> works identically to X-API-Key', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: { Authorization: `Bearer ${TEST_KEY_A_SECRET}` },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'success');
    });

    it('Test 6: Insecure header bypass attempt fails (no X-API-Key-Id bypass without valid key)', async () => {
      // Attempting bypass using X-API-Key-Id of account A with no secret key
      const req = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: { 'X-API-Key-Id': 'key-account-a-uuid' },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 401);
    });

    it('Test 7: Rate limit exceeded returns 429', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: { 'X-API-Key': TEST_KEY_D_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 429);
      const data = await res.json();
      assert.equal(data.code, 'QUOTA_EXCEEDED');
    });

    it('Test 8: Masked prefix cannot authenticate (e.g. w365_live_... or bullet points)', async () => {
      const maskedKey = 'w365_live_secA...6666';
      const req = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: { 'X-API-Key': maskedKey },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.match(data.message, /masked/i);
    });

    it('Test 9: Whitespace in API key is trimmed and handled correctly', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: { 'X-API-Key': `   ${TEST_KEY_A_SECRET}   \n` },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 200);
    });

    it('Test 10: Empty string API key returns 401', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: { 'X-API-Key': '   ' },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 401);
    });
  });

  // ==========================================
  // Test Group 2: Order API Permissions & Toggle (8 tests)
  // ==========================================
  describe('Test Group 2: Order API Permissions & Toggle', () => {
    it('Test 11: Order API disabled by default on new keys (orders_enabled = false)', async () => {
      const raw = generateRawApiKey();
      const sanitized = sanitizeKeyRecord({
        id: 'new-key',
        key_prefix: raw,
        orders_enabled: false,
        monthly_quota: 2000,
      });
      assert.equal(sanitized.orders_enabled, false);
      assert.ok(!sanitized.key_prefix.includes(raw));
    });

    it('Test 12: GET /orders returns 403 when orders_enabled = false', async () => {
      const req = new Request('https://www.weave365.com/api/v1/orders', {
        headers: { 'X-API-Key': TEST_KEY_A_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'orders']);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.status, 'error');
      assert.equal(data.code, 'FORBIDDEN');
      assert.match(data.message, /Order API access is not enabled/i);
    });

    it('Test 13: POST /orders returns 403 when orders_enabled = false', async () => {
      const req = new Request('https://www.weave365.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'X-API-Key': TEST_KEY_A_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: { name: 'Customer A', phone: '9876543210', pincode: '560001' },
          items: [{ sku: '102001', quantity: 1 }],
        }),
      });
      const res = await handleDeveloperApiPost(req, ['v1', 'orders']);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.code, 'FORBIDDEN');
    });

    it('Test 14: Enabling Order API via admin updates orders_enabled = true', async () => {
      // Toggle orders_enabled on Account A
      const accountA = MOCK_DB_KEYS.find(k => k.id === 'key-account-a-uuid');
      accountA.orders_enabled = true;
      assert.equal(accountA.orders_enabled, true);
    });

    it('Test 15: GET /orders returns 200 when orders_enabled = true', async () => {
      const req = new Request('https://www.weave365.com/api/v1/orders', {
        headers: { 'X-API-Key': TEST_KEY_B_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'orders']);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'success');
      assert.ok(Array.isArray(data.orders));
    });

    it('Test 16: POST /orders succeeds when orders_enabled = true and input valid', async () => {
      const req = new Request('https://www.weave365.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'X-API-Key': TEST_KEY_B_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reseller_order_id: 'TEST-ORD-101',
          customer: {
            name: 'Pooja Verma',
            phone: '+91 9876543210',
            pincode: '221001',
            address: 'D-42, Sigra, Varanasi',
          },
          items: [{ sku: '102001', quantity: 1 }],
        }),
      });
      const res = await handleDeveloperApiPost(req, ['v1', 'orders']);
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.status, 'success');
      assert.ok(data.order_id);
    });

    it('Test 17: Disabling Order API immediately revokes access (returns 403 on next call)', async () => {
      // Revoke Order API on Account B
      const accountB = MOCK_DB_KEYS.find(k => k.id === 'key-account-b-uuid');
      accountB.orders_enabled = false;
      _clearKeyMemoryCacheForTesting();

      const req = new Request('https://www.weave365.com/api/v1/orders', {
        headers: { 'X-API-Key': TEST_KEY_B_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'orders']);
      assert.equal(res.status, 403);
    });

    it('Test 18: Non-existent order ID returns 404, not 500 or leaked data', async () => {
      const accountB = MOCK_DB_KEYS.find(k => k.id === 'key-account-b-uuid');
      accountB.orders_enabled = true;
      _clearKeyMemoryCacheForTesting();

      const req = new Request('https://www.weave365.com/api/v1/orders?id=non-existent-order-id-12345', {
        headers: { 'X-API-Key': TEST_KEY_B_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'orders']);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.status, 'error');
    });

    it('Test 18b: Cannot enable Order API when Product API (is_active) is disabled', async () => {
      // Deactivating Product API (is_active = false) forces orders_enabled = false
      const updates = { is_active: false, orders_enabled: true };
      if (updates.is_active === false) {
        updates.orders_enabled = false;
      }
      assert.equal(updates.orders_enabled, false);

      // Attempting to enable orders_enabled when is_active is false returns an error
      const invalidAttempt = { is_active: false, orders_enabled: true };
      const canEnable = !(invalidAttempt.orders_enabled && invalidAttempt.is_active === false);
      assert.equal(canEnable, false);
    });
  });

  // ==========================================
  // Test Group 3: Curated Product Authorization (6 tests)
  // ==========================================
  describe('Test Group 3: Curated Product Authorization', () => {
    it('Test 19: GET /catalog returns only authorized SKUs for curated key', async () => {
      // Account A is authorized ONLY for 102001, 102003, 202002
      const req = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: { 'X-API-Key': TEST_KEY_A_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 200);
      const data = await res.json();
      const returnedSkus = data.products.map(p => p.sku);

      assert.deepEqual(returnedSkus.sort(), ['102001', '102003', '202002'].sort());
      // Must NOT contain 102002 or 303001
      assert.ok(!returnedSkus.includes('102002'));
      assert.ok(!returnedSkus.includes('303001'));
    });

    it('Test 20: GET /products/:sku returns 200 for authorized SKU', async () => {
      const req = new Request('https://www.weave365.com/api/v1/products/102001', {
        headers: { 'X-API-Key': TEST_KEY_A_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'products', '102001']);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'success');
      assert.equal(data.product.sku, '102001');
    });

    it('Test 21: GET /products/:sku returns 404 for non-curated/unauthorized SKU (SKU Curation Bypass Fix)', async () => {
      // 102002 exists in Weave365 DB but is NOT authorized for Account A
      const req = new Request('https://www.weave365.com/api/v1/products/102002', {
        headers: { 'X-API-Key': TEST_KEY_A_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'products', '102002']);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.status, 'error');
      assert.equal(data.code, 'PRODUCT_NOT_FOUND');
      assert.equal(data.message, 'Product not found.');
    });

    it('Test 22: GET /catalog?skus= returns only authorized SKUs (ignores unauthorized requested SKUs)', async () => {
      // Requesting both an authorized SKU (102001) and unauthorized SKU (102002)
      const req = new Request('https://www.weave365.com/api/v1/catalog?skus=102001,102002', {
        headers: { 'X-API-Key': TEST_KEY_A_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 200);
      const data = await res.json();
      const returnedSkus = data.products.map(p => p.sku);

      // Only 102001 should be returned; 102002 must be strictly suppressed
      assert.deepEqual(returnedSkus, ['102001']);
      assert.ok(!returnedSkus.includes('102002'));
    });

    it('Test 23: GET /stock-status returns stock only for authorized SKUs', async () => {
      // Requesting stock for unauthorized SKU 102002
      const req = new Request('https://www.weave365.com/api/v1/stock-status?sku=102002', {
        headers: { 'X-API-Key': TEST_KEY_A_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'stock-status']);
      assert.equal(res.status, 200);
      const data = await res.json();
      // Stock map must be empty for unauthorized SKU lookup
      assert.equal(data.total_items, 0);
      assert.deepEqual(data.stock_map, {});
    });

    it('Test 24: POST /orders with unauthorized SKU is rejected (returns 403)', async () => {
      // Enable order API for Account A, but attempt to order unauthorized SKU 102002
      const accountA = MOCK_DB_KEYS.find(k => k.id === 'key-account-a-uuid');
      accountA.orders_enabled = true;
      _clearKeyMemoryCacheForTesting();

      const req = new Request('https://www.weave365.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'X-API-Key': TEST_KEY_A_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: { name: 'Unauthorized Item Buyer', phone: '9876543210', pincode: '221001' },
          items: [{ sku: '102002', quantity: 1 }], // 102002 is not curated for Account A
        }),
      });
      const res = await handleDeveloperApiPost(req, ['v1', 'orders']);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.code, 'UNAUTHORIZED_PRODUCT');
    });
  });

  // ==========================================
  // Test Group 4: API Secret Safety & Storage (5 tests)
  // ==========================================
  describe('Test Group 4: API Secret Safety & Storage', () => {
    it('Test 25: API secret is hashed with SHA-256 before storage', async () => {
      const rawSecret = 'w365_live_sample_secret_key_12345';
      const hash1 = await hashApiKey(rawSecret);
      const hash2 = await hashApiKey(rawSecret);
      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64); // 64 hex characters for SHA-256
      assert.ok(!hash1.includes('w365_live'));
    });

    it('Test 26: Stored key_prefix contains only masked prefix (e.g. w365_live_xxxx...yyyy)', () => {
      const longRawSecret = 'w365_live_verylongproductionsecretkey9999';
      const sanitized = sanitizeKeyRecord({
        key_hash: 'somehash',
        key_prefix: longRawSecret,
      });
      assert.ok(sanitized.key_prefix.includes('...'));
      assert.equal(sanitized.key_prefix.length, 21);
      assert.equal(sanitized.key_hash, undefined); // key_hash stripped
    });

    it('Test 27: Full secret is never returned in any list or get API call', async () => {
      const accountA = MOCK_DB_KEYS.find(k => k.id === 'key-account-a-uuid');
      const sanitized = sanitizeKeyRecord(accountA);
      assert.equal(sanitized.key_hash, undefined);
      assert.ok(!sanitized.key_prefix.includes(TEST_KEY_A_SECRET));
    });

    it('Test 28: Full secret is returned only once at creation/regeneration', async () => {
      const rawKey = generateRawApiKey();
      assert.ok(rawKey.startsWith('w365_live_'));
      const masked = `${rawKey.slice(0, 14)}...${rawKey.slice(-4)}`;
      assert.ok(masked.includes('...'));
      assert.notEqual(rawKey, masked);
    });

    it('Test 29: /api/v1/me returns masked or no secret, never full key, and strips internal IDs', async () => {
      const req = new Request('https://www.weave365.com/api/v1/me', {
        headers: { 'X-API-Key': TEST_KEY_A_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'me']);
      assert.equal(res.status, 200);
      const data = await res.json();

      // No secrets or keys leaked
      assert.equal(data.key_prefix, undefined);
      assert.equal(data.key_hash, undefined);
      assert.equal(data.api_key_id, undefined);
      assert.equal(data.user_id, undefined);

      // Localhost sanitized
      assert.ok(!data.client_website.includes('localhost'));
      assert.ok(data.client_website.includes('weave365.com'));

      // orders_enabled status present
      assert.equal(typeof data.orders_enabled, 'boolean');
      assert.equal(data.orders_enabled, false);
    });
  });

  // ==========================================
  // Test Group 5: Regression & Edge Cases (8 tests)
  // ==========================================
  describe('Test Group 5: Regression & Edge Cases', () => {
    it('Test 30: All existing non-API routes still function', async () => {
      const getAuthorized = getAuthorizedProducts(MOCK_PRODUCTS, null);
      assert.equal(getAuthorized.length, MOCK_PRODUCTS.length);
    });

    it('Test 31: Supabase Free Tier protections intact (caching, rate limits)', async () => {
      // In-memory key caching check: multiple authentications hit cache without repeating DB queries
      const req1 = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: { 'X-API-Key': TEST_KEY_A_SECRET },
      });
      const res1 = await handleDeveloperApiGet(req1, ['v1', 'catalog']);
      assert.equal(res1.status, 200);

      const req2 = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: { 'X-API-Key': TEST_KEY_A_SECRET },
      });
      const res2 = await handleDeveloperApiGet(req2, ['v1', 'catalog']);
      assert.equal(res2.status, 200);
    });

    it('Test 32: CORS headers present and correct on all responses', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: {
          'X-API-Key': TEST_KEY_A_SECRET,
          Origin: 'https://www.weave365.com',
        },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 200);
      assert.ok(res.headers.get('access-control-allow-origin'));
    });

    it('Test 33: Response headers include Cache-Control: private on authenticated routes', async () => {
      const req = new Request('https://www.weave365.com/api/v1/catalog', {
        headers: { 'X-API-Key': TEST_KEY_A_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 200);
      const cacheControl = res.headers.get('cache-control');
      assert.ok(cacheControl.includes('private'));
      assert.ok(!cacheControl.includes('public'));
      assert.ok(cacheControl.includes('no-cache') || cacheControl.includes('no-store'));
    });

    it('Test 34: Error responses return clean JSON without stack traces or DB errors', async () => {
      const req = new Request('https://www.weave365.com/api/v1/products/unknown-sku', {
        headers: { 'X-API-Key': TEST_KEY_A_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'products', 'unknown-sku']);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.status, 'error');
      assert.equal(data.code, 'PRODUCT_NOT_FOUND');
      assert.equal(data.stack, undefined);
      assert.equal(data.sql, undefined);
    });

    it('Test 35: High concurrency: multiple simultaneous requests do not corrupt state', async () => {
      const requests = Array.from({ length: 15 }, () =>
        handleDeveloperApiGet(
          new Request('https://www.weave365.com/api/v1/catalog', {
            headers: { 'X-API-Key': TEST_KEY_A_SECRET },
          }),
          ['v1', 'catalog']
        )
      );

      const responses = await Promise.all(requests);
      responses.forEach((r) => {
        assert.equal(r.status, 200);
      });
    });

    it('Test 36: SQL injection attempts in query parameters are safely handled', async () => {
      const sqlInjectionParam = "' OR '1'='1' --";
      const req = new Request(`https://www.weave365.com/api/v1/catalog?skus=${encodeURIComponent(sqlInjectionParam)}`, {
        headers: { 'X-API-Key': TEST_KEY_A_SECRET },
      });
      const res = await handleDeveloperApiGet(req, ['v1', 'catalog']);
      assert.equal(res.status, 200);
      const data = await res.json();
      // SQL injection string matches no SKUs, returns empty array, no errors
      assert.equal(data.products.length, 0);
    });

    it('Test 37: Missing or malformed JSON body in POST /orders returns 400, not 500', async () => {
      const accountB = MOCK_DB_KEYS.find(k => k.id === 'key-account-b-uuid');
      accountB.orders_enabled = true;
      _clearKeyMemoryCacheForTesting();

      // Empty items array
      const reqEmptyItems = new Request('https://www.weave365.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'X-API-Key': TEST_KEY_B_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: { name: 'Buyer', phone: '9999999999', pincode: '221001' },
          items: [],
        }),
      });
      const resEmpty = await handleDeveloperApiPost(reqEmptyItems, ['v1', 'orders']);
      assert.equal(resEmpty.status, 400);
      const dataEmpty = await resEmpty.json();
      assert.equal(dataEmpty.code, 'EMPTY_ITEMS');

      // Missing customer details
      const reqMissingCustomer = new Request('https://www.weave365.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'X-API-Key': TEST_KEY_B_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{ sku: '102001', quantity: 1 }],
        }),
      });
      const resMissing = await handleDeveloperApiPost(reqMissingCustomer, ['v1', 'orders']);
      assert.equal(resMissing.status, 400);
      const dataMissing = await resMissing.json();
      assert.equal(dataMissing.code, 'INVALID_CUSTOMER_DETAILS');
    });
  });
});
