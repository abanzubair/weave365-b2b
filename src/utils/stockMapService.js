/**
 * @file stockMapService.js
 * @description Decoupled lightweight stock availability cache architecture.
 * Extracts an ultra-compact map { [sku]: { in_stock, quantity, stock_status, ... } }
 * stored in Supabase `sheet_data` (id: 'stock_map') to replace 437 KB catalog transfers
 * and multi-millisecond Edge CPU parse spikes with <0.5ms lookups.
 */

/**
 * Generate a lightweight stock availability map from products and vendor overrides.
 *
 * @param {Array<Object>} products - Raw or pruned product list from products_json
 * @param {Array<Object>} [stockOverrides=[]] - Overrides from vendor_product_stock table
 * @returns {Record<string, { in_stock: boolean, quantity: number, stock_status: string, status: string, is_available: boolean, stock_label: string, title: string, updated_at: string }>}
 */
export function generateStockMap(products, stockOverrides = []) {
  if (!Array.isArray(products)) return {};

  const overrideMap = new Map();
  if (Array.isArray(stockOverrides)) {
    for (const row of stockOverrides) {
      if (row?.product_id) {
        overrideMap.set(String(row.product_id).trim(), row);
      }
    }
  }

  const stockMap = {};

  for (const product of products) {
    if (!product || typeof product !== 'object') continue;

    const sku = String(product.id || product.groupKey || '').trim();
    if (!sku) continue;

    // Check direct override or variant override
    let override = overrideMap.get(sku);
    if (!override && Array.isArray(product.variants)) {
      for (const v of product.variants) {
        const vCode = String(v?.code || '').trim();
        if (vCode && overrideMap.has(vCode)) {
          override = overrideMap.get(vCode);
          break;
        }
      }
    }

    const stockKey = override?.stock_status || product.stockStatusOverride;
    const isArchived = stockKey === 'archived' || Boolean(product.isArchived);
    const isOutOfStock = stockKey === 'out-of-stock' || isArchived || Boolean(product.isOutOfStock) || (typeof product.quantity === 'number' && product.quantity <= 0);

    // Quantity resolution
    let qty = 0;
    if (!isOutOfStock) {
      if (typeof product.quantity === 'number' && !isNaN(product.quantity)) {
        qty = Math.max(0, product.quantity);
      } else {
        qty = 5;
      }
    }

    const status = stockKey || (isOutOfStock ? 'out-of-stock' : 'ready-stock');
    const inStock = !isOutOfStock && qty > 0;

    let stockLabel = override?.stock_status_label || product.stockStatusLabel;
    if (!stockLabel) {
      if (isOutOfStock) {
        stockLabel = isArchived ? 'Archived (Hidden)' : 'Out of Stock';
      } else if (status === 'pre-order') {
        stockLabel = 'Pre-Order';
      } else if (status === 'back-soon') {
        stockLabel = 'Back Soon';
      } else {
        stockLabel = 'Ready Stock';
      }
    }

    const updatedAt = override?.updated_at_ist || override?.updated_at || product.stockLastUpdatedIST || product.stockLastUpdated || new Date().toISOString();

    stockMap[sku] = {
      in_stock: inStock,
      quantity: qty,
      stock_status: status,
      // Backwards-compatible aliases for existing API consumers:
      status: status,
      is_available: inStock,
      stock_label: stockLabel,
      title: product.title || product.name || '',
      updated_at: updatedAt,
    };
  }

  return stockMap;
}

/**
 * Pre-generate the stock map and save it into Supabase sheet_data (id: 'stock_map').
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<Record<string, any>>}
 */
export async function pregenerateAndSaveStockMap(supabase) {
  if (!supabase) throw new Error('Supabase client required for pregenerateAndSaveStockMap');

  // Fetch products_json and live vendor stock overrides in parallel
  const [{ data: sheetRow, error: sheetErr }, { data: stockRows, error: stockErr }] = await Promise.all([
    supabase.from('sheet_data').select('csv_data').eq('id', 'products_json').maybeSingle(),
    supabase.from('vendor_product_stock').select('*'),
  ]);

  if (sheetErr) {
    throw new Error(`Failed to fetch products_json from sheet_data: ${sheetErr.message}`);
  }

  let products = [];
  try {
    products = JSON.parse(sheetRow?.csv_data || '[]');
  } catch (err) {
    throw new Error(`Failed to parse products_json: ${err.message}`);
  }

  const stockMap = generateStockMap(products, stockRows || []);
  const timestamp = new Date().toISOString();
  const serialized = JSON.stringify(stockMap);

  const { error: upsertErr } = await supabase
    .from('sheet_data')
    .upsert({
      id: 'stock_map',
      csv_data: serialized,
      updated_at: timestamp,
    }, { onConflict: 'id' });

  if (upsertErr) {
    throw new Error(`Failed to upsert stock_map to sheet_data: ${upsertErr.message}`);
  }

  return stockMap;
}

/**
 * Write-through cache invalidation: updates specific products in sheet_data.stock_map
 * synchronously when admin/vendor toggles stock status.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Array<Object>|Object} updates - Array of or single { productId, stockStatus, stockStatusLabel, updatedAt }
 * @returns {Promise<boolean>}
 */
export async function updateStockMapWriteThrough(supabase, updates) {
  if (!supabase) return false;

  const updateList = Array.isArray(updates) ? updates : [updates];
  if (!updateList.length) return false;

  try {
    // 1. Fetch existing stock_map
    const { data: row, error: fetchErr } = await supabase
      .from('sheet_data')
      .select('csv_data')
      .eq('id', 'stock_map')
      .maybeSingle();

    let stockMap = {};
    if (!fetchErr && row?.csv_data) {
      try {
        stockMap = typeof row.csv_data === 'string' ? JSON.parse(row.csv_data) : row.csv_data;
      } catch {
        stockMap = {};
      }
    }

    // If stock_map was empty or missing, pregenerate it fresh first
    if (!stockMap || Object.keys(stockMap).length === 0) {
      stockMap = await pregenerateAndSaveStockMap(supabase);
    }

    const nowIso = new Date().toISOString();

    // 2. Apply modifications in place
    for (const update of updateList) {
      const pid = String(update.productId || update.id || '').trim();
      if (!pid) continue;

      const existing = stockMap[pid] || {};
      const status = update.stockStatus || existing.stock_status || 'ready-stock';
      const isArchived = status === 'archived';
      const isOutOfStock = status === 'out-of-stock' || isArchived;
      const qty = isOutOfStock ? 0 : (existing.quantity > 0 ? existing.quantity : 5);
      const inStock = !isOutOfStock && qty > 0;
      const label = update.stockStatusLabel || (isOutOfStock ? (isArchived ? 'Archived (Hidden)' : 'Out of Stock') : (status === 'pre-order' ? 'Pre-Order' : (status === 'back-soon' ? 'Back Soon' : 'Ready Stock')));

      stockMap[pid] = {
        ...existing,
        in_stock: inStock,
        quantity: qty,
        stock_status: status,
        status: status,
        is_available: inStock,
        stock_label: label,
        updated_at: update.updatedAt || nowIso,
      };
    }

    // 3. Persist back to sheet_data
    const { error: upsertErr } = await supabase
      .from('sheet_data')
      .upsert({
        id: 'stock_map',
        csv_data: JSON.stringify(stockMap),
        updated_at: nowIso,
      }, { onConflict: 'id' });

    if (upsertErr) {
      console.warn('[updateStockMapWriteThrough] Supabase upsert warning:', upsertErr.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[updateStockMapWriteThrough] Error updating stock_map:', err);
    return false;
  }
}
