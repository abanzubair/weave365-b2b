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

    const parentOverride = overrideMap.get(sku) ||
      (product.id && overrideMap.get(String(product.id).trim())) ||
      (product.groupKey && overrideMap.get(String(product.groupKey).trim()));

    const parentStockKey = parentOverride?.stock_status || product.stockStatusOverride;
    const isDirectParentArchived = parentStockKey === 'archived' || Boolean(product.isArchived);
    const isDirectParentOos = parentStockKey === 'out-of-stock' || isDirectParentArchived || Boolean(product.isOutOfStock) || (typeof product.quantity === 'number' && product.quantity <= 0);

    const hasExplicitVariants = Array.isArray(product.variants) && product.variants.length > 0;
    const variantStockItems = [];

    if (hasExplicitVariants) {
      product.variants.forEach((v, idx) => {
        if (!v || typeof v !== 'object') return;

        const vCode = String(v.code || '').trim();
        const vSkuProp = String(v.sku || '').trim();
        const vIdProp = String(v.id || '').trim();
        const vIndexSku = `${sku}-${idx + 1}`;
        const colorSlug = (v.color || `VAR${idx + 1}`).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16) || `V${idx + 1}`;
        const vMatrixifySku = `${sku}-${colorSlug}-${idx + 1}`;

        // Look up variant-specific override first, falling back to parent override
        const vOverride = (vCode && overrideMap.get(vCode)) ||
                          (vSkuProp && overrideMap.get(vSkuProp)) ||
                          (vIdProp && overrideMap.get(vIdProp)) ||
                          overrideMap.get(vIndexSku) ||
                          overrideMap.get(vMatrixifySku) ||
                          parentOverride;

        const vStockKey = vOverride?.stock_status || v.stockStatusOverride || (isDirectParentOos ? 'out-of-stock' : parentStockKey);
        const vIsArchived = vStockKey === 'archived' || Boolean(v.isArchived) || isDirectParentArchived;
        const vIsOutOfStock = isDirectParentOos || vIsArchived || vStockKey === 'out-of-stock' || Boolean(v.isOutOfStock) || (typeof v.quantity === 'number' && v.quantity <= 0);

        let vQty = 0;
        if (!vIsOutOfStock) {
          if (typeof v.quantity === 'number' && !isNaN(v.quantity)) {
            vQty = Math.max(0, v.quantity);
          } else if (typeof vOverride?.quantity === 'number' && !isNaN(vOverride.quantity)) {
            vQty = Math.max(0, vOverride.quantity);
          } else if (typeof product.quantity === 'number' && !isNaN(product.quantity)) {
            vQty = Math.max(0, product.quantity);
          } else {
            vQty = 5;
          }
        }

        const vStatus = vStockKey || (vIsOutOfStock ? 'out-of-stock' : 'ready-stock');
        const vInStock = !vIsOutOfStock && vQty > 0;

        let vStockLabel = vOverride?.stock_status_label || v.stockStatusLabel;
        if (!vStockLabel) {
          if (vIsOutOfStock) {
            vStockLabel = vIsArchived ? 'Archived (Hidden)' : 'Out of Stock';
          } else if (vStatus === 'pre-order') {
            vStockLabel = 'Pre-Order';
          } else if (vStatus === 'back-soon') {
            vStockLabel = 'Back Soon';
          } else {
            vStockLabel = 'Ready Stock';
          }
        }

        const vUpdatedAt = vOverride?.updated_at_ist || vOverride?.updated_at || product.stockLastUpdatedIST || product.stockLastUpdated || new Date().toISOString();
        const vTitle = v.title || (product.title || product.name ? `${product.title || product.name}${v.color ? ` - ${v.color}` : ''}` : '');

        const variantStockItem = {
          in_stock: vInStock,
          quantity: vQty,
          stock_status: vStatus,
          status: vStatus,
          is_available: vInStock,
          stock_label: vStockLabel,
          title: vTitle,
          updated_at: vUpdatedAt,
        };

        const keysForVariant = new Set();
        if (vCode) keysForVariant.add(vCode);
        if (vSkuProp) keysForVariant.add(vSkuProp);
        if (vIdProp) keysForVariant.add(vIdProp);
        keysForVariant.add(vIndexSku);
        keysForVariant.add(vMatrixifySku);

        variantStockItems.push({ item: variantStockItem, keys: keysForVariant });
      });
    }

    let isArchived = isDirectParentArchived;
    let isOutOfStock = isDirectParentOos;
    let qty = 0;

    if (hasExplicitVariants && variantStockItems.length > 0) {
      const inStockVariants = variantStockItems.filter((v) => v.item.in_stock);
      const totalInStockVariantQty = inStockVariants.reduce((sum, v) => sum + v.item.quantity, 0);

      if (isDirectParentOos) {
        isOutOfStock = true;
        qty = 0;
      } else if (inStockVariants.length === 0) {
        isOutOfStock = true;
        qty = 0;
      } else {
        isOutOfStock = false;
        qty = typeof product.quantity === 'number' && !isNaN(product.quantity)
          ? Math.max(0, product.quantity)
          : totalInStockVariantQty;
      }
    } else {
      if (!isOutOfStock) {
        if (typeof product.quantity === 'number' && !isNaN(product.quantity)) {
          qty = Math.max(0, product.quantity);
        } else {
          qty = 5;
        }
      }
    }

    const status = parentStockKey || (isOutOfStock ? 'out-of-stock' : 'ready-stock');
    const inStock = !isOutOfStock && qty > 0;

    let stockLabel = parentOverride?.stock_status_label || product.stockStatusLabel;
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

    const updatedAt = parentOverride?.updated_at_ist || parentOverride?.updated_at || product.stockLastUpdatedIST || product.stockLastUpdated || new Date().toISOString();

    const parentStockItem = {
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

    // 1. Register parent SKU & alias keys (e.g. '102001', product.id, product.groupKey)
    stockMap[sku] = parentStockItem;
    if (product.id && String(product.id).trim() !== sku) {
      stockMap[String(product.id).trim()] = parentStockItem;
    }
    if (product.groupKey && String(product.groupKey).trim() !== sku) {
      stockMap[String(product.groupKey).trim()] = parentStockItem;
    }

    // 2. Register all individual variant SKUs from explicit variants
    for (const { item, keys } of variantStockItems) {
      for (const k of keys) {
        const trimmedK = String(k || '').trim();
        if (trimmedK && trimmedK !== sku) {
          stockMap[trimmedK] = item;
        }
      }
    }

    if (!hasExplicitVariants && Array.isArray(product.colors) && product.colors.length > 0) {
      product.colors.forEach((color, idx) => {
        const c = String(color || `Option ${idx + 1}`).trim();
        const colorSlug = c.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16) || `V${idx + 1}`;
        const vIndexSku = `${sku}-${idx + 1}`;
        const vMatrixifySku = `${sku}-${colorSlug}-${idx + 1}`;
        const vTitle = product.title || product.name ? `${product.title || product.name} - ${c}` : '';

        const variantStockItem = {
          in_stock: inStock,
          quantity: qty,
          stock_status: status,
          status: status,
          is_available: inStock,
          stock_label: stockLabel,
          title: vTitle,
          updated_at: updatedAt,
        };

        const keysForVariant = new Set([vIndexSku, vMatrixifySku]);

        for (const k of keysForVariant) {
          const trimmedK = String(k || '').trim();
          if (trimmedK && trimmedK !== sku) {
            stockMap[trimmedK] = variantStockItem;
          }
        }
      });
    }
  }

  return stockMap;
}

export const buildGlobalStockMap = generateStockMap;
export const buildStockMap = generateStockMap;

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

      // Cascade out-of-stock/archived to any variant keys of this product
      if (isOutOfStock) {
        const prefix = `${pid}-`;
        for (const [k, v] of Object.entries(stockMap)) {
          if (k.startsWith(prefix) && v && typeof v === 'object') {
            stockMap[k] = {
              ...v,
              in_stock: false,
              quantity: 0,
              stock_status: status,
              status: status,
              is_available: false,
              stock_label: label,
              updated_at: update.updatedAt || nowIso,
            };
          }
        }
      }
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
