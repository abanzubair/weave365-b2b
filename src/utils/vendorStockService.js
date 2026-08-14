/**
 * @file vendorStockService.js
 * @description Data service for managing vendor product stock availability overrides and IST timestamps.
 * Handles persistence to Supabase (`vendor_product_stock`) and local browser cache,
 * and dispatches live events for real-time reactivity across storefront & account pages.
 */

import { supabase, isSupabaseConfigured } from '../supabaseClient.js';

export const VENDOR_STOCK_STORAGE_KEY = 'weave365_vendor_product_stock';
export const VENDOR_STOCK_UPDATED_EVENT = 'vendor-stock-updated';

export const STOCK_STATUS_OPTIONS = [
  { key: 'ready-stock', label: 'Ready Stock', number: 1, color: '#1b8042', bg: 'rgba(27, 128, 66, 0.1)', border: 'rgba(27, 128, 66, 0.25)' },
  { key: 'pre-order', label: 'Pre-Order', number: 2, color: '#b8860b', bg: 'rgba(184, 134, 11, 0.1)', border: 'rgba(184, 134, 11, 0.25)' },
  { key: 'out-of-stock', label: 'Out of Stock', number: 3, color: '#c93b2b', bg: 'rgba(201, 59, 43, 0.1)', border: 'rgba(201, 59, 43, 0.25)' },
  { key: 'back-soon', label: 'Back Soon', number: 4, color: '#6a3cbc', bg: 'rgba(106, 60, 188, 0.1)', border: 'rgba(106, 60, 188, 0.25)' }
];

export const VENDOR_STOCK_TABLE_SQL = `CREATE TABLE IF NOT EXISTS public.vendor_product_stock (
  product_id text PRIMARY KEY,
  vendor_code text,
  vendor_name text,
  stock_status text NOT NULL,
  stock_status_label text NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by text,
  updated_by_name text,
  updated_at_ist text NOT NULL
);

ALTER TABLE public.vendor_product_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read vendor stock" ON public.vendor_product_stock;
CREATE POLICY "public read vendor stock" ON public.vendor_product_stock FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public modify vendor stock" ON public.vendor_product_stock;
CREATE POLICY "public modify vendor stock" ON public.vendor_product_stock FOR ALL USING (true) WITH CHECK (true);`;

/**
 * Formats any Date or timestamp string into standard Indian Standard Time (IST).
 * Example output: "14 Aug 2026, 4:44 PM"
 */
export function formatISTDateTime(dateInput = new Date()) {
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (!date || isNaN(date.getTime())) return '';

    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(date);

    const day = parts.find((p) => p.type === 'day')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const year = parts.find((p) => p.type === 'year')?.value || '';
    const hour = parts.find((p) => p.type === 'hour')?.value || '';
    const minute = parts.find((p) => p.type === 'minute')?.value || '';
    const rawPeriod = parts.find((p) => p.type === 'dayPeriod')?.value || '';
    const dayPeriod = rawPeriod.toUpperCase();

    return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`;
  } catch (e) {
    console.warn('[vendorStockService] Error formatting IST date:', e);
    return new Date().toLocaleString('en-IN');
  }
}

/**
 * Synchronously retrieves stock overrides from local storage cache.
 * Returns an object keyed by product_id: { [productId]: { stock_status, stock_status_label, updated_at_ist, ... } }
 */
export function getVendorStockLocal() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(VENDOR_STOCK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.warn('[vendorStockService] Error reading local stock cache:', e);
  }
  return {};
}

/**
 * Saves stock overrides to local storage cache and notifies active components.
 */
function setVendorStockLocal(overrides) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VENDOR_STOCK_STORAGE_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new CustomEvent(VENDOR_STOCK_UPDATED_EVENT, { detail: overrides }));
  } catch (e) {
    console.warn('[vendorStockService] Error writing local stock cache:', e);
  }
}

// In-memory cache and in-flight request deduplication
let inFlightFetchPromise = null;
let lastFetchTimestamp = 0;
const FETCH_CACHE_TTL_MS = 15000; // 15 seconds in-memory TTL

// Debounced save timers keyed by productId to coalesce rapid clicks into a single DB write
const saveDebounceTimers = new Map();

/**
 * Fetches vendor product stock overrides from Supabase and syncs with local cache.
 * Deduplicates concurrent in-flight requests and uses a lightweight in-memory cache window.
 */
export async function fetchVendorStockOverrides(forceRefresh = false) {
  const localOverrides = getVendorStockLocal();
  if (!isSupabaseConfigured) return localOverrides;

  const now = Date.now();
  if (!forceRefresh && Object.keys(localOverrides).length > 0 && (now - lastFetchTimestamp < FETCH_CACHE_TTL_MS)) {
    return localOverrides;
  }

  if (inFlightFetchPromise) {
    return inFlightFetchPromise;
  }

  inFlightFetchPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_product_stock')
        .select('*');

      if (error) {
        console.warn('[vendorStockService] Remote fetch error (using local cache):', error.message);
        return localOverrides;
      }

      if (Array.isArray(data)) {
        const mapped = {};
        for (const row of data) {
          if (row.product_id) {
            mapped[row.product_id] = {
              productId: row.product_id,
              vendorCode: row.vendor_code,
              vendorName: row.vendor_name,
              stockStatus: row.stock_status,
              stockStatusLabel: row.stock_status_label,
              updatedAt: row.updated_at,
              updatedBy: row.updated_by,
              updatedByName: row.updated_by_name,
              updatedAtIST: row.updated_at_ist || formatISTDateTime(row.updated_at),
            };
          }
        }
        lastFetchTimestamp = Date.now();
        setVendorStockLocal(mapped);
        return mapped;
      }
    } catch (err) {
      console.error('[vendorStockService] Unexpected fetch error:', err);
    } finally {
      inFlightFetchPromise = null;
    }
    return localOverrides;
  })();

  return inFlightFetchPromise;
}

/**
 * Updates stock availability for a specific product.
 * Features:
 * - 0ms instant optimistic UI updates via local cache & event bus
 * - Debounced write coalescing: rapid successive clicks on the same product within 250ms
 *   are collapsed into a single minimal database upsert.
 */
export async function saveVendorProductStock({
  productId,
  vendorCode = '',
  vendorName = '',
  stockStatus,
  userId = null,
  userName = ''
}) {
  if (!productId || !stockStatus) {
    return { success: false, error: 'Product ID and stock status are required' };
  }

  const opt = STOCK_STATUS_OPTIONS.find((o) => o.key === stockStatus) || STOCK_STATUS_OPTIONS[0];
  const now = new Date();
  const timestampISO = now.toISOString();
  const timestampIST = formatISTDateTime(now);

  const updateItem = {
    productId,
    vendorCode: String(vendorCode || '').trim(),
    vendorName: String(vendorName || '').trim(),
    stockStatus: opt.key,
    stockStatusLabel: opt.label,
    updatedAt: timestampISO,
    updatedBy: userId ? String(userId) : null,
    updatedByName: String(userName || '').trim(),
    updatedAtIST: timestampIST,
  };

  // 1. Optimistically update local storage and broadcast to all tabs/components immediately (0ms lag)
  const currentOverrides = getVendorStockLocal();
  const updatedOverrides = {
    ...currentOverrides,
    [productId]: updateItem,
  };
  setVendorStockLocal(updatedOverrides);

  // 2. Coalesce rapid clicks into a single debounced Supabase write
  if (isSupabaseConfigured) {
    if (saveDebounceTimers.has(productId)) {
      clearTimeout(saveDebounceTimers.get(productId));
    }

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        saveDebounceTimers.delete(productId);
        try {
          const { error } = await supabase
            .from('vendor_product_stock')
            .upsert(
              {
                product_id: productId,
                vendor_code: updateItem.vendorCode,
                vendor_name: updateItem.vendorName,
                stock_status: updateItem.stockStatus,
                stock_status_label: updateItem.stockStatusLabel,
                updated_at: timestampISO,
                updated_by: updateItem.updatedBy,
                updated_by_name: updateItem.updatedByName,
                updated_at_ist: timestampIST,
              },
              { onConflict: 'product_id' }
            );

          if (error) {
            console.warn('[vendorStockService] Supabase upsert error:', error.message);
            resolve({ success: true, warning: 'Saved locally. DB warning: ' + error.message, item: updateItem });
            return;
          }
          resolve({ success: true, item: updateItem });
        } catch (err) {
          console.error('[vendorStockService] Save exception:', err);
          resolve({ success: true, warning: 'Saved locally.', item: updateItem });
        }
      }, 250);

      saveDebounceTimers.set(productId, timer);
    });
  }

  return { success: true, item: updateItem };
}

/**
 * Batch updates multiple products for a vendor.
 */
export async function batchSaveVendorStock({
  productIds = [],
  vendorCode = '',
  vendorName = '',
  stockStatus,
  userId = null,
  userName = ''
}) {
  if (!productIds.length || !stockStatus) {
    return { success: false, error: 'Product IDs and stock status are required' };
  }

  const opt = STOCK_STATUS_OPTIONS.find((o) => o.key === stockStatus) || STOCK_STATUS_OPTIONS[0];
  const now = new Date();
  const timestampISO = now.toISOString();
  const timestampIST = formatISTDateTime(now);

  const currentOverrides = getVendorStockLocal();
  const newOverrides = { ...currentOverrides };
  const dbRows = [];

  for (const pid of productIds) {
    const item = {
      productId: pid,
      vendorCode: String(vendorCode || '').trim(),
      vendorName: String(vendorName || '').trim(),
      stockStatus: opt.key,
      stockStatusLabel: opt.label,
      updatedAt: timestampISO,
      updatedBy: userId ? String(userId) : null,
      updatedByName: String(userName || '').trim(),
      updatedAtIST: timestampIST,
    };
    newOverrides[pid] = item;
    dbRows.push({
      product_id: pid,
      vendor_code: item.vendorCode,
      vendor_name: item.vendorName,
      stock_status: item.stockStatus,
      stock_status_label: item.stockStatusLabel,
      updated_at: timestampISO,
      updated_by: item.updatedBy,
      updated_by_name: item.updatedByName,
      updated_at_ist: timestampIST,
    });
  }

  setVendorStockLocal(newOverrides);

  if (isSupabaseConfigured && dbRows.length > 0) {
    try {
      const { error } = await supabase
        .from('vendor_product_stock')
        .upsert(dbRows, { onConflict: 'product_id' });

      if (error) {
        console.warn('[vendorStockService] Supabase batch upsert error:', error.message);
      }
    } catch (err) {
      console.error('[vendorStockService] Batch save exception:', err);
    }
  }

  return { success: true, count: productIds.length };
}

/**
 * Applies vendor stock status overrides onto an array of product items.
 */
export function applyStockOverridesToProducts(products = [], overrides = {}) {
  if (!Array.isArray(products) || !products.length) return [];
  if (!overrides || Object.keys(overrides).length === 0) return products;

  return products.map((product) => {
    const key = product.id || product.groupKey;
    const override = overrides[key];
    if (!override) return product;

    const stockKey = override.stockStatus;
    const stockLabel = override.stockStatusLabel;

    // Filter out existing stock tags and prepend the active override tag
    const nonStockTags = (product.statusTags || []).filter(
      (tag) => !['ready-stock', 'pre-order', 'out-of-stock', 'back-soon'].includes(tag.key)
    );

    const updatedTags = [
      { key: stockKey, label: stockLabel },
      ...nonStockTags,
    ];

    return {
      ...product,
      stockStatusOverride: stockKey,
      stockStatusLabel: stockLabel,
      stockLastUpdatedIST: override.updatedAtIST,
      stockLastUpdated: override.updatedAt,
      statusTags: updatedTags,
      isOutOfStock: stockKey === 'out-of-stock',
      isReadyStock: stockKey === 'ready-stock',
      isPreOrder: stockKey === 'pre-order',
      isBackSoon: stockKey === 'back-soon',
    };
  });
}
