/**
 * @file cartHelpers.js
 * @description Cart and favorites state persistence and encoding utilities. Coordinates
 * local draft order lists and favorites lists, serializing compound color selection markers into
 * unique composite database-compatible variant keys. Synchronizes state seamlessly between browser
 * localStorage fallbacks and Supabase DB tables.
 * 
 * @module utils/cartHelpers
 */

async function getSupabase() {
  const mod = await import('../supabaseClient.js');
  return mod.isSupabaseConfigured && mod.supabase ? mod.supabase : null;
}

const colorKeyMarker = '::color=';

export function encodeCartVariantCode(variantCode, colorName = '') {
  const cleanVariantCode = String(variantCode || '').trim();
  const cleanColorName = String(colorName || '').trim();
  if (!cleanColorName) return cleanVariantCode;
  return `${cleanVariantCode}${colorKeyMarker}${encodeURIComponent(cleanColorName)}`;
}

export function parseCartVariantCode(variantCode = '') {
  const value = String(variantCode || '');
  const markerIndex = value.indexOf(colorKeyMarker);
  if (markerIndex === -1) {
    return {
      baseVariantCode: value,
      colorName: '',
    };
  }

  return {
    baseVariantCode: value.slice(0, markerIndex),
    colorName: decodeURIComponent(value.slice(markerIndex + colorKeyMarker.length)),
  };
}

function resolveCartColor(product, variant, colorSelection = {}) {
  return (
    colorSelection.colorName
    || colorSelection.name
    || variant?.color
    || product?.colorOptions?.[0]?.name
    || ''
  );
}

export function upsertCart(cart, product, variant, quantity, colorSelection = {}) {
  const colorName = resolveCartColor(product, variant, colorSelection);
  const targetVariant = (function() {
    if (colorName && product?.variants?.length) {
      const matchDashed = product.variants.find(
        (v) => v.code && v.code.includes('-') && String(v.color || '').trim().toLowerCase() === colorName.trim().toLowerCase()
      );
      if (matchDashed) return matchDashed;
    }
    return variant;
  })();
  const effectiveVariant = targetVariant || variant;
  const cartVariantCode = encodeCartVariantCode(effectiveVariant?.code, colorName);
  const existing = cart.find((item) => (
    item.productGroupKey === product.id && item.variantCode === cartVariantCode
  ));
  if (existing) {
    return cart.map((item) =>
      item.productGroupKey === product.id && item.variantCode === cartVariantCode
        ? { ...item, quantity: item.quantity + quantity }
        : item,
    );
  }
  return [
    ...cart,
    {
      productGroupKey: product.id,
      variantCode: cartVariantCode,
      quantity,
    },
  ];
}

export function upsertCartSelections(cart, product, selections) {
  return selections.reduce((nextCart, selection) => {
    if (!selection?.variant || !selection.quantity) return nextCart;
    return upsertCart(nextCart, product, selection.variant, selection.quantity, selection);
  }, cart);
}

export function changeCartColor(cart, cartItem, nextColorName) {
  const { baseVariantCode } = parseCartVariantCode(cartItem.variantCode);
  const nextVariantCode = encodeCartVariantCode(baseVariantCode, nextColorName);

  if (nextVariantCode === cartItem.variantCode) return cart;

  const existing = cart.find((item) => (
    item.productGroupKey === cartItem.productGroupKey && item.variantCode === nextVariantCode
  ));

  if (existing) {
    return cart.reduce((acc, item) => {
      const isOldItem = item.productGroupKey === cartItem.productGroupKey && item.variantCode === cartItem.variantCode;
      if (!isOldItem) {
        if (item.productGroupKey === cartItem.productGroupKey && item.variantCode === nextVariantCode) {
          acc.push({ ...item, quantity: item.quantity + cartItem.quantity });
        } else {
          acc.push(item);
        }
      }
      return acc;
    }, []);
  }

  return cart.map((item) => (
    item.productGroupKey === cartItem.productGroupKey && item.variantCode === cartItem.variantCode
      ? { ...item, variantCode: nextVariantCode }
      : item
  ));
}

export async function loadSavedState(userId) {
  const supabase = await getSupabase();
  if (!supabase) return { savedCart: [], savedFavorites: [] };

  const [cartResult, favoriteResult] = await Promise.all([
    supabase.from('cart_items').select('product_group_key, variant_code, quantity').eq('user_id', userId),
    supabase.from('favorites').select('product_group_key, variant_code').eq('user_id', userId),
  ]);

  return {
    savedCart: (cartResult.data || []).map((item) => ({
      productGroupKey: item.product_group_key,
      variantCode: item.variant_code,
      quantity: item.quantity,
    })),
    savedFavorites: (favoriteResult.data || []).map((item) => ({
      productGroupKey: item.product_group_key,
      variantCode: item.variant_code,
    })),
  };
}

export async function persistCart(cart, userId) {
  const supabase = await getSupabase();
  if (!supabase) {
    localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
    return;
  }

  const variantCodesInCart = cart.map((item) => item.variantCode);

  if (variantCodesInCart.length > 0) {
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .not('variant_code', 'in', `(${variantCodesInCart.join(',')})`);
      
    await supabase.from('cart_items').upsert(
      cart.map((item) => ({
        user_id: userId,
        product_group_key: item.productGroupKey,
        variant_code: item.variantCode,
        quantity: item.quantity,
      })),
      { onConflict: 'user_id,variant_code' }
    );
  } else {
    await supabase.from('cart_items').delete().eq('user_id', userId);
  }
}

export async function persistFavorites(favorites, userId) {
  const supabase = await getSupabase();
  if (!supabase) {
    localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites));
    return;
  }

  const productKeysInFavorites = favorites.map((item) => item.productGroupKey);

  if (productKeysInFavorites.length > 0) {
    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .not('product_group_key', 'in', `(${productKeysInFavorites.join(',')})`);

    await supabase.from('favorites').upsert(
      favorites.map((item) => ({
        user_id: userId,
        product_group_key: item.productGroupKey,
        variant_code: item.variantCode,
      })),
      { onConflict: 'user_id,product_group_key' }
    );
  } else {
    await supabase.from('favorites').delete().eq('user_id', userId);
  }
}

export function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

/**
 * Resolves an item's canonical SKU code in xxxxxx-x format (e.g. "102038-1", "102038-6").
 * Strips internal encoding markers (e.g. "::color=Peach") and matches the variant by code,
 * color name, or color index position.
 *
 * @param {Object} product - Product catalog item with variants and colorOptions
 * @param {string} rawVariantCode - Stored variant code (may contain ::color=...)
 * @param {string} productGroupKey - Product ID or group key (e.g. "102038")
 * @param {string} explicitColorName - Optional explicitly known color name
 * @returns {string} Clean canonical SKU in xxxxxx-x format
 */
export function resolveItemSku(product, rawVariantCode = '', productGroupKey = '', explicitColorName = '') {
  const { baseVariantCode, colorName } = parseCartVariantCode(rawVariantCode);
  const cleanColor = String(explicitColorName || colorName || '').trim().toLowerCase();
  const baseCode = String(baseVariantCode || productGroupKey || product?.id || product?.groupKey || '').trim();
  const cleanBase = baseCode.includes('-') ? baseCode.split('-')[0].trim() : baseCode;

  // 1. If baseVariantCode already has a dash format (e.g. 102038-1), verify or match by color
  if (baseVariantCode && /^[A-Za-z0-9]+-[A-Za-z0-9]+$/.test(baseVariantCode)) {
    if (cleanColor && product?.variants?.length) {
      const colorVar = product.variants.find(
        (v) => v.code && v.code.includes('-') && String(v.color || '').trim().toLowerCase() === cleanColor
      );
      if (colorVar?.code) return colorVar.code;
    }
    return baseVariantCode;
  }

  // 2. Try to find matched variant in product.variants by color (preferring dashed codes)
  if (cleanColor && product?.variants?.length) {
    const variantWithDash = product.variants.find(
      (v) => v.code && v.code.includes('-') && String(v.color || '').trim().toLowerCase() === cleanColor
    );
    if (variantWithDash?.code) return variantWithDash.code;

    const anyColorVar = product.variants.find(
      (v) => String(v.color || '').trim().toLowerCase() === cleanColor
    );
    if (anyColorVar?.code && anyColorVar.code.includes('-')) return anyColorVar.code;
  }

  // 3. Try to match by baseVariantCode in product.variants
  if (baseVariantCode && product?.variants?.length) {
    const varByCode = product.variants.find((v) => v.code === baseVariantCode);
    if (varByCode?.code && varByCode.code.includes('-')) return varByCode.code;
  }

  // 4. Derive from color index if color is known in colorOptions or variants
  if (cleanColor && cleanBase) {
    if (product?.colorOptions?.length) {
      const idx = product.colorOptions.findIndex(
        (c) => String(c.name || c || '').trim().toLowerCase() === cleanColor
      );
      if (idx !== -1) {
        return `${cleanBase}-${idx + 1}`;
      }
    }
    if (product?.variants?.length) {
      const dashedVariants = product.variants.filter((v) => v.code && v.code.includes('-'));
      if (dashedVariants.length) {
        const vIdx = dashedVariants.findIndex(
          (v) => String(v.color || '').trim().toLowerCase() === cleanColor
        );
        if (vIdx !== -1) {
          return dashedVariants[vIdx].code;
        }
      }
      const idx = product.variants.findIndex(
        (v) => String(v.color || '').trim().toLowerCase() === cleanColor
      );
      if (idx !== -1) {
        return `${cleanBase}-${idx + 1}`;
      }
    }
  }

  // 5. Fallback: if product has variants with dashes, use the first non-cover variant code
  if (product?.variants?.length) {
    const firstDashed = product.variants.find((v) => v.code && v.code.includes('-') && !v.code.endsWith('-0'));
    if (firstDashed?.code) return firstDashed.code;
  }

  // 6. Ensure clean xxxxxx-x format for cleanBase
  if (cleanBase && !cleanBase.includes('-')) {
    return `${cleanBase}-1`;
  }

  return cleanBase || 'N/A';
}

/**
 * Resolves the appropriate variant object from a product given a raw variant code or color name.
 * 
 * @param {Object} product - Product catalog item
 * @param {string} rawVariantCode - Stored variant code
 * @param {string} explicitColorName - Optional explicit color name
 * @returns {Object|null} Matching variant object
 */
export function resolveItemVariant(product, rawVariantCode = '', explicitColorName = '') {
  if (!product?.variants?.length) return null;
  const { baseVariantCode, colorName } = parseCartVariantCode(rawVariantCode);
  const cleanColor = String(explicitColorName || colorName || '').trim().toLowerCase();

  if (cleanColor) {
    const matchDashed = product.variants.find(
      (v) => v.code && v.code.includes('-') && String(v.color || '').trim().toLowerCase() === cleanColor
    );
    if (matchDashed) return matchDashed;

    const matchAnyColor = product.variants.find(
      (v) => String(v.color || '').trim().toLowerCase() === cleanColor
    );
    if (matchAnyColor) return matchAnyColor;
  }

  if (baseVariantCode) {
    const matchCode = product.variants.find((v) => v.code === baseVariantCode);
    if (matchCode) return matchCode;
  }

  const nonCover = product.variants.find((v) => v.code && !v.code.endsWith('-0'));
  return nonCover || product.variants[0] || null;
}

