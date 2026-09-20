/**
 * @file pricingService.js
 * @description Centralized pricing engine enforcing the strict pricing architecture:
 * 
 * BASE PRODUCT PRICE (INR)
 *         ↓
 * COUNTRY MARKUP (%)
 *         ↓
 * MARKED-UP PRICE (INR)
 *         ↓
 * CURRENT EXCHANGE RATE
 *         ↓
 * LOCAL CURRENCY
 *         ↓
 * ROUNDING
 *         ↓
 * FINAL DISPLAY PRICE
 */

// Zero decimal currencies according to ISO standards
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
]);

/**
 * Applies currency-specific rounding conventions.
 * E.g., USD, EUR, QAR, AED -> 2 decimal places.
 * JPY, KRW -> 0 decimal places.
 * INR -> 0 decimal places for whole numbers or standard rounding.
 */
export function roundCurrency(amount, currency = 'INR', forceDecimals = null) {
  if (amount == null || isNaN(amount)) return 0;
  const curr = String(currency || 'INR').toUpperCase();

  if (ZERO_DECIMAL_CURRENCIES.has(curr)) {
    return Math.round(Number(amount));
  }

  if (forceDecimals !== null && typeof forceDecimals === 'number') {
    const factor = Math.pow(10, forceDecimals);
    return Math.round(Number(amount) * factor) / factor;
  }

  // Standard 2 decimal places for international currencies
  return Math.round(Number(amount) * 100) / 100;
}

/**
 * Formats a numeric value into a localized currency string using Intl.NumberFormat
 */
export function formatCurrency(amount, currency = 'INR', options = {}) {
  if (amount == null || isNaN(amount)) return 'On request';

  const num = Number(amount);
  const curr = String(currency || 'INR').toUpperCase();
  const decimals = typeof options === 'number' ? options : (options?.fractionDigits ?? options?.decimals);

  const localeMap = {
    INR: 'en-IN',
    USD: 'en-US',
    GBP: 'en-GB',
    EUR: 'de-DE',
    QAR: 'en-QA',
    AED: 'en-AE',
    CAD: 'en-CA',
    AUD: 'en-AU',
    SGD: 'en-SG',
    SAR: 'en-SA',
    KWD: 'en-KW',
    OMR: 'en-OM',
    BHD: 'en-BH',
  };

  const locale = options?.locale || localeMap[curr] || 'en-US';

  try {
    const formatOpts = {
      style: 'currency',
      currency: curr,
    };

    if (decimals !== undefined) {
      formatOpts.minimumFractionDigits = decimals;
      formatOpts.maximumFractionDigits = decimals;
    } else if (curr === 'INR') {
      // In India B2B, integers are preferred unless decimals exist
      formatOpts.minimumFractionDigits = num % 1 === 0 ? 0 : 2;
      formatOpts.maximumFractionDigits = 2;
    } else if (ZERO_DECIMAL_CURRENCIES.has(curr)) {
      formatOpts.minimumFractionDigits = 0;
      formatOpts.maximumFractionDigits = 0;
    } else {
      formatOpts.minimumFractionDigits = 2;
      formatOpts.maximumFractionDigits = 2;
    }

    return new Intl.NumberFormat(locale, formatOpts).format(num);
  } catch (err) {
    const symbol = options?.currencySymbol || curr;
    return `${symbol} ${num.toFixed(decimals !== undefined ? decimals : 2)}`;
  }
}

/**
 * Primary calculation function.
 * Calculates the localized price from a base product price (stored in INR).
 * 
 * @param {number} basePrice - Base product price in INR (never modified)
 * @param {Object} countryConfig - Country configuration { code, name, currency, currencySymbol, markupPercent }
 * @param {Object|number} exchangeRates - Exchange rate map (INR base) or direct exchange rate number
 * @returns {Object} Localized pricing metadata and final price
 */
export function getLocalizedPrice(basePrice, countryConfig, exchangeRates) {
  const base = Number(basePrice) || 0;
  const markupPercent = Number(countryConfig?.markupPercent || 0);

  // 1. Apply Country Markup to Base Price
  const markedUpBasePrice = base * (1 + markupPercent / 100);

  // 2. Resolve Current Exchange Rate (INR -> Target Currency)
  const currency = (countryConfig?.currency || 'INR').toUpperCase();
  let rate = 1;

  if (typeof exchangeRates === 'number') {
    rate = exchangeRates;
  } else if (exchangeRates && typeof exchangeRates === 'object') {
    rate = Number(exchangeRates[currency] || (currency === 'INR' ? 1 : 0)) || 1;
  }

  // 3. Convert Marked-Up Amount
  const rawConverted = markedUpBasePrice * rate;

  // 4. Currency Rounding
  const finalPrice = roundCurrency(rawConverted, currency);

  // 5. Formatted Display String
  const formatted = formatCurrency(finalPrice, currency, {
    currencySymbol: countryConfig?.currencySymbol,
  });

  return {
    basePrice: base,
    markupPercent,
    markedUpBasePrice: roundCurrency(markedUpBasePrice, 'INR'),
    exchangeRate: rate,
    currency,
    currencySymbol: countryConfig?.currencySymbol || currency,
    countryCode: countryConfig?.code || 'IN',
    countryName: countryConfig?.name || 'India',
    finalPrice,
    formatted,
  };
}

/**
 * Calculates localized B2B hybrid product price (wholesale sets vs extra reseller pieces)
 * following the exact pricing pipeline.
 */
export function calculateLocalizedHybridProductPrice(
  product,
  groupItemsOrQty = 1,
  customVariant = null,
  countryConfig = null,
  exchangeRates = null
) {
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
      formattedTotalPrice: formatCurrency(0, countryConfig?.currency || 'INR'),
    };
  }

  const setSize = product.totalColors || product.colorOptions?.length || product.variants?.length || 1;
  const isUnder999 = String(product.category || '').toLowerCase() === 'under 999';

  const firstPrices = customVariant?.prices
    || (Array.isArray(groupItemsOrQty) && groupItemsOrQty[0]?.variant?.prices)
    || product.variants?.[0]?.prices
    || {};

  // Base prices in INR
  const baseWholesale = Number(firstPrices.mrp || firstPrices.offer || 0);
  const baseReseller = Number(firstPrices.b2r || firstPrices.single || baseWholesale);

  // Localized unit prices
  const localizedWholesale = getLocalizedPrice(baseWholesale, countryConfig, exchangeRates);
  const localizedReseller = getLocalizedPrice(baseReseller, countryConfig, exchangeRates);

  const totalQty = Array.isArray(groupItemsOrQty)
    ? groupItemsOrQty.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
    : Math.max(0, Number(groupItemsOrQty) || 0);

  const currency = countryConfig?.currency || 'INR';

  if (isUnder999 || setSize <= 1) {
    const totalPrice = roundCurrency(totalQty * localizedWholesale.finalPrice, currency);
    return {
      setSize: 1,
      totalQty,
      completeSets: totalQty,
      extraPieces: 0,
      wholesalePrice: localizedWholesale.finalPrice,
      resellerPrice: localizedReseller.finalPrice,
      wholesaleTotal: totalPrice,
      resellerTotal: 0,
      totalPrice,
      formattedTotalPrice: formatCurrency(totalPrice, currency),
      localizedWholesale,
      localizedReseller,
      currency,
    };
  }

  const completeSets = Math.floor(totalQty / setSize);
  const extraPieces = totalQty % setSize;
  const wholesaleTotal = roundCurrency(completeSets * setSize * localizedWholesale.finalPrice, currency);
  const resellerTotal = roundCurrency(extraPieces * localizedReseller.finalPrice, currency);
  const totalPrice = roundCurrency(wholesaleTotal + resellerTotal, currency);

  return {
    setSize,
    totalQty,
    completeSets,
    extraPieces,
    wholesalePrice: localizedWholesale.finalPrice,
    resellerPrice: localizedReseller.finalPrice,
    wholesaleTotal,
    resellerTotal,
    totalPrice,
    formattedTotalPrice: formatCurrency(totalPrice, currency),
    localizedWholesale,
    localizedReseller,
    currency,
  };
}

/**
 * Calculates localized cart totals across all grouped items
 */
export function calculateLocalizedHybridCartTotals(items = [], priceAccess = null, countryConfig = null, exchangeRates = null) {
  const currency = countryConfig?.currency || 'INR';

  if (!items || !items.length) {
    return {
      subtotal: 0,
      discount: 0,
      total: 0,
      groups: [],
      currency,
      formattedTotal: formatCurrency(0, currency),
    };
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
    const pricing = calculateLocalizedHybridProductPrice(
      group.product,
      group.items,
      null,
      countryConfig,
      exchangeRates
    );
    subtotal += pricing.totalPrice;
    groups.push({
      ...group,
      pricing,
    });
  });

  const roundedSubtotal = roundCurrency(subtotal, currency);

  return {
    subtotal: roundedSubtotal,
    discount: 0,
    total: roundedSubtotal,
    groups,
    currency,
    formattedSubtotal: formatCurrency(roundedSubtotal, currency),
    formattedTotal: formatCurrency(roundedSubtotal, currency),
  };
}
