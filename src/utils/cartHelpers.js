import { supabase, isSupabaseConfigured } from '../supabaseClient.js';

export function upsertCart(cart, product, variant, quantity) {
  const existing = cart.find((item) => item.variantCode === variant.code);
  if (existing) {
    return cart.map((item) =>
      item.variantCode === variant.code ? { ...item, quantity: item.quantity + quantity } : item,
    );
  }
  return [
    ...cart,
    {
      productGroupKey: product.id,
      variantCode: variant.code,
      quantity,
    },
  ];
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
