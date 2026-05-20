/**
 * @file priceService.js
 * @description B2B Price and Inventory Services. Connects to custom Supabase database functions
 * to dynamically fetch and apply role-specific pricing adjustments and custom variant rates
 * to catalog items, preserving clean caching tiers and reseller markups.
 * 
 * @module services/priceService
 */

import { isSupabaseConfigured, supabase } from '../supabaseClient.js';

export async function loadVisiblePrices() {
  if (!isSupabaseConfigured) {
    return { prices: [], error: null };
  }

  const { data, error } = await supabase.functions.invoke('get-visible-prices', {
    body: {},
  });

  if (error) {
    return { prices: [], error };
  }

  return { prices: data?.prices || [], error: null };
}

export function buildVisiblePriceMap(priceRows = []) {
  return priceRows.reduce((map, row) => {
    if (row?.variant_code) {
      map.set(row.variant_code, row.prices || {});
    }

    return map;
  }, new Map());
}

export function applyVisiblePricesToProducts(products, visiblePriceMap) {
  if (!visiblePriceMap?.size) return products;

  return products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => {
      const visiblePrices = visiblePriceMap.get(variant.code);
      if (!visiblePrices) return variant;

      return {
        ...variant,
        prices: {
          ...variant.prices,
          ...visiblePrices,
        },
      };
    }),
  }));
}
