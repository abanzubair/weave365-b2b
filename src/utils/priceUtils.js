
/**
 * Price Utilities
 * Purpose: Provides standard Indian Rupee (INR) formatting, weight formatting, and hybrid B2B pricing calculations.
 */
import { priceForBuyer } from './buyerAccess.js';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatMoney(value) {
  if (value == null || Number.isNaN(value)) return 'On request';
  return inrFormatter.format(Number(value));
}

export function formatWeight(weightInKg) {
  const w = Number(weightInKg) || 0;
  if (w < 1 && w > 0) {
    return `${Number((w * 1000).toFixed(2))} Grams`;
  }
  return `${Number(w.toFixed(2))} KG`;
}

export function customerPrice(prices, priceAccess) {
  return priceForBuyer(prices, priceAccess);
}

export function calculateHybridProductPrice(product, groupItemsOrQty = 1, customVariant = null) {
  if (!product) {
    return {
      setSize: 1,
      totalQty: 0,
      completeSets: 0,
      extraPieces: 0,
      wholesalePrice: 0,
      resellerPrice: 0,
      wholesaleTotal: 0,
      resellerTotal: 0,
      totalPrice: 0,
    };
  }

  const setSize = product.totalColors || product.colorOptions?.length || product.variants?.length || 1;
  const isUnder999 = String(product.category || '').toLowerCase() === 'under 999';

  const firstPrices = customVariant?.prices
    || (Array.isArray(groupItemsOrQty) && groupItemsOrQty[0]?.variant?.prices)
    || product.variants?.[0]?.prices
    || {};

  const wholesalePrice = Number(firstPrices.mrp || firstPrices.offer || 0);
  const resellerPrice = Number(firstPrices.b2r || firstPrices.single || wholesalePrice);

  const totalQty = Array.isArray(groupItemsOrQty)
    ? groupItemsOrQty.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
    : Math.max(0, Number(groupItemsOrQty) || 0);

  if (isUnder999 || setSize <= 1) {
    const totalPrice = totalQty * wholesalePrice;
    return {
      setSize: 1,
      totalQty,
      completeSets: totalQty,
      extraPieces: 0,
      wholesalePrice,
      resellerPrice,
      wholesaleTotal: totalPrice,
      resellerTotal: 0,
      totalPrice,
    };
  }

  const completeSets = Math.floor(totalQty / setSize);
  const extraPieces = totalQty % setSize;
  const wholesaleTotal = completeSets * setSize * wholesalePrice;
  const resellerTotal = extraPieces * resellerPrice;
  const totalPrice = wholesaleTotal + resellerTotal;

  return {
    setSize,
    totalQty,
    completeSets,
    extraPieces,
    wholesalePrice,
    resellerPrice,
    wholesaleTotal,
    resellerTotal,
    totalPrice,
  };
}

export function calculateHybridCartTotals(items = [], priceAccess) {
  if (!items || !items.length) {
    return { subtotal: 0, discount: 0, total: 0, groups: [] };
  }

  const groupMap = new Map();
  items.forEach((item) => {
    const key = item.productGroupKey || item.product?.id || 'unknown';
    const group = groupMap.get(key) || {
      key,
      product: item.product,
      variant: item.variant,
      colorOptions: item.colorOptions || item.product?.colorOptions || [],
      items: [],
    };
    group.items.push(item);
    groupMap.set(key, group);
  });

  let subtotal = 0;
  const groups = [];

  groupMap.forEach((group) => {
    const pricing = calculateHybridProductPrice(group.product, group.items);
    subtotal += pricing.totalPrice;
    groups.push({
      ...group,
      pricing,
    });
  });

  const roundedSubtotal = Math.round(subtotal);
  return {
    subtotal: roundedSubtotal,
    discount: 0,
    total: roundedSubtotal,
    groups,
  };
}

export function parsePositiveNumber(value) {
  const num = Number(value);
  return num > 0 ? num : 0;
}

export function checkProductPriceInRange(product, priceRangeStr, priceAccess) {
  if (!priceRangeStr || priceRangeStr.toLowerCase() === 'all') {
    return true;
  }

  // Get active price if user has price access
  let price = 0;
  if (priceAccess?.canViewPrices !== false && product.variants && product.variants[0]) {
    price = priceForBuyer(product.variants[0].prices, priceAccess);
  }
  
  // Fallback to mrp (wholesale price) if price is not found or not authorized (to maintain consistent categorization)
  if (price == null || Number.isNaN(price) || price === 0) {
    if (product.variants && product.variants[0] && product.variants[0].prices) {
      price = Number(product.variants[0].prices.mrp) || 0;
    }
  }

  // If still no price, check if string matches
  if (!price) {
    return !!(product.priceRange && product.priceRange.trim() === priceRangeStr.trim());
  }

  // Parse the priceRangeStr to get limits
  const clean = priceRangeStr.replace(/[₹$,\s]/g, '').replace(/–/g, '-');
  
  let min = 0;
  let max = Infinity;

  if (clean.includes('+') || clean.toLowerCase().includes('above')) {
    min = parseFloat(clean.replace(/[^\d.]/g, ''));
  } else if (clean.toLowerCase().includes('below') || clean.toLowerCase().includes('under')) {
    max = parseFloat(clean.replace(/[^\d.]/g, ''));
  } else {
    const parts = clean.split('-');
    if (parts.length === 2) {
      min = parseFloat(parts[0].replace(/[^\d.]/g, ''));
      max = parseFloat(parts[1].replace(/[^\d.]/g, ''));
    } else {
      const num = parseFloat(clean.replace(/[^\d.]/g, ''));
      if (!isNaN(num)) {
        min = num;
        max = num;
      }
    }
  }

  // Apply a 50 rupee buffer at the boundaries
  const minWithBuffer = Math.max(0, min - 50);
  const maxWithBuffer = max === Infinity ? Infinity : max + 50;

  return price >= minWithBuffer && price <= maxWithBuffer;
}
