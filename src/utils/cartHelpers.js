import { supabase, isSupabaseConfigured } from '../supabaseClient.js';

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
  const cartVariantCode = encodeCartVariantCode(variant.code, colorName);
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
    return cart
      .map((item) => {
        if (item.productGroupKey === cartItem.productGroupKey && item.variantCode === nextVariantCode) {
          return { ...item, quantity: item.quantity + cartItem.quantity };
        }
        return item;
      })
      .filter((item) => !(
        item.productGroupKey === cartItem.productGroupKey && item.variantCode === cartItem.variantCode
      ));
  }

  return cart.map((item) => (
    item.productGroupKey === cartItem.productGroupKey && item.variantCode === cartItem.variantCode
      ? { ...item, variantCode: nextVariantCode }
      : item
  ));
}

export async function loadSavedState(userId) {
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
  if (!isSupabaseConfigured) {
    localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
    return;
  }

  await supabase.from('cart_items').delete().eq('user_id', userId);
  if (!cart.length) return;
  await supabase.from('cart_items').insert(
    cart.map((item) => ({
      user_id: userId,
      product_group_key: item.productGroupKey,
      variant_code: item.variantCode,
      quantity: item.quantity,
    })),
  );
}

export async function persistFavorites(favorites, userId) {
  if (!isSupabaseConfigured) {
    localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites));
    return;
  }

  await supabase.from('favorites').delete().eq('user_id', userId);
  if (!favorites.length) return;
  await supabase.from('favorites').insert(
    favorites.map((item) => ({
      user_id: userId,
      product_group_key: item.productGroupKey,
      variant_code: item.variantCode,
    })),
  );
}

export function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}
