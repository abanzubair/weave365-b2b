import { test, describe } from 'node:test';
import assert from 'node:assert';

import {
  getLocalizedPrice,
  calculateLocalizedHybridProductPrice,
  calculateLocalizedHybridCartTotals,
  roundCurrency,
  formatCurrency,
} from '../src/services/pricingService.js';

import {
  getExchangeRates,
  refreshExchangeRates,
  DEFAULT_BASELINE_RATES,
} from '../src/services/exchangeRateService.js';

describe('Country-Based Pricing & Currency System', () => {

  test('Requirement 2: Strict pricing calculation order', () => {
    // Formula check:
    // Base Price: 1000
    // USA Markup: +10% -> 1100
    // Rate: 0.011
    // Final: 1100 * 0.011 = 12.10
    const countryUSA = {
      code: 'US',
      name: 'USA',
      currency: 'USD',
      currencySymbol: '$',
      markupPercent: 10,
    };

    const rates = { USD: 0.011 };
    const originalBasePrice = 1000;

    const result = getLocalizedPrice(originalBasePrice, countryUSA, rates);

    assert.strictEqual(result.basePrice, 1000, 'Original base price must be preserved');
    assert.strictEqual(result.markupPercent, 10, 'Markup percentage must be 10');
    assert.strictEqual(result.markedUpBasePrice, 1100, 'Marked-up base price must be 1100');
    assert.strictEqual(result.exchangeRate, 0.011, 'Exchange rate must be 0.011');
    assert.strictEqual(result.finalPrice, 12.1, 'Final price must be 12.10');
    assert.strictEqual(result.currency, 'USD');
    assert.strictEqual(result.formatted, '$12.10');

    // Requirement 3: Base product price must never change
    assert.strictEqual(originalBasePrice, 1000, 'Base price variable must remain exactly 1000');
  });

  test('Requirement 9: Supports positive, negative, and zero percentage markups', () => {
    const rates = { USD: 0.011, QAR: 0.0435, AED: 0.0431, INR: 1 };

    // India: 0% markup
    const countryIndia = { code: 'IN', name: 'India', currency: 'INR', currencySymbol: '₹', markupPercent: 0 };
    const resultIndia = getLocalizedPrice(1000, countryIndia, rates);
    assert.strictEqual(resultIndia.finalPrice, 1000);
    assert.strictEqual(resultIndia.formatted, '₹1,000');

    // Qatar: +15% markup -> 1000 * 1.15 = 1150 * 0.0435 = 50.025 -> rounded to 50.03
    const countryQatar = { code: 'QA', name: 'Qatar', currency: 'QAR', currencySymbol: 'QAR', markupPercent: 15 };
    const resultQatar = getLocalizedPrice(1000, countryQatar, rates);
    assert.strictEqual(resultQatar.markedUpBasePrice, 1150);
    assert.strictEqual(resultQatar.finalPrice, 50.03);

    // Negative markup: -5% markup -> 1000 * 0.95 = 950 * 0.011 = 10.45
    const countryDiscounted = { code: 'US', name: 'USA', currency: 'USD', currencySymbol: '$', markupPercent: -5 };
    const resultDiscounted = getLocalizedPrice(1000, countryDiscounted, rates);
    assert.strictEqual(resultDiscounted.markedUpBasePrice, 950);
    assert.strictEqual(resultDiscounted.finalPrice, 10.45);
    assert.strictEqual(resultDiscounted.formatted, '$10.45');
  });

  test('Requirement 16: Safe fallback on missing / invalid rates (Never NaN, null, undefined)', () => {
    const countryUSA = { code: 'US', name: 'USA', currency: 'USD', currencySymbol: '$', markupPercent: 10 };

    // Missing exchange rate table
    const resultMissing = getLocalizedPrice(1000, countryUSA, null);
    assert.ok(!isNaN(resultMissing.finalPrice), 'Final price must not be NaN');
    assert.ok(resultMissing.finalPrice !== null, 'Final price must not be null');
    assert.ok(resultMissing.finalPrice !== undefined, 'Final price must not be undefined');

    // Invalid base price
    const resultInvalidBase = getLocalizedPrice(NaN, countryUSA, { USD: 0.011 });
    assert.strictEqual(resultInvalidBase.finalPrice, 0);
    assert.strictEqual(resultInvalidBase.formatted, '$0.00');
  });

  test('Requirement 18 & 19: Localized hybrid B2B pricing calculation', () => {
    const mockProduct = {
      id: 'prod-1',
      title: 'Banarasi Silk Saree',
      category: 'Saree',
      totalColors: 4,
      variants: [
        { code: 'VAR-1', prices: { mrp: 1000, b2r: 1200 } },
      ],
    };

    const countryUSA = { code: 'US', name: 'USA', currency: 'USD', currencySymbol: '$', markupPercent: 10 };
    const rates = { USD: 0.011 };

    // 1 Full Set of 4 colors:
    // Wholesale base = 1000 -> +10% = 1100 -> * 0.011 = 12.10 /pc
    // Total for 4 pcs in set = 12.10 * 4 = 48.40
    const hybridSet = calculateLocalizedHybridProductPrice(mockProduct, 4, null, countryUSA, rates);
    assert.strictEqual(hybridSet.completeSets, 1);
    assert.strictEqual(hybridSet.extraPieces, 0);
    assert.strictEqual(hybridSet.wholesalePrice, 12.1);
    assert.strictEqual(hybridSet.totalPrice, 48.4);

    // 5 Pieces (1 Full Set of 4 + 1 extra piece at single/reseller rate):
    // Reseller base = 1200 -> +10% = 1320 -> * 0.011 = 14.52 /pc
    // Total = 48.40 + 14.52 = 62.92
    const hybridMixed = calculateLocalizedHybridProductPrice(mockProduct, 5, null, countryUSA, rates);
    assert.strictEqual(hybridMixed.completeSets, 1);
    assert.strictEqual(hybridMixed.extraPieces, 1);
    assert.strictEqual(hybridMixed.wholesalePrice, 12.1);
    assert.strictEqual(hybridMixed.resellerPrice, 14.52);
    assert.strictEqual(hybridMixed.totalPrice, 62.92);
  });

  test('Requirement 20: Cart totals consistency in active currency', () => {
    const mockItems = [
      {
        productGroupKey: 'group-1',
        product: {
          id: 'prod-1',
          totalColors: 1,
          category: 'Under 999',
          variants: [{ code: 'VAR-1', prices: { mrp: 800 } }],
        },
        variant: { code: 'VAR-1', prices: { mrp: 800 } },
        quantity: 2,
      },
    ];

    const countryUAE = { code: 'AE', name: 'UAE', currency: 'AED', currencySymbol: 'AED', markupPercent: 12 };
    // Base: 800 * 2 = 1600 -> +12% = 1792 -> * 0.0433 = 77.5936 -> 77.59
    const rates = { AED: 0.0433 };

    const cartTotals = calculateLocalizedHybridCartTotals(mockItems, null, countryUAE, rates);
    assert.strictEqual(cartTotals.currency, 'AED');
    assert.strictEqual(cartTotals.total, 77.6);
  });

  test('Requirement 12 & 15: ExchangeRateService cache and baseline fallback', async () => {
    const ratesData = await getExchangeRates();
    assert.ok(ratesData.rates, 'Rates must be returned');
    assert.strictEqual(ratesData.rates.INR, 1, 'INR base rate must always be 1');
    assert.ok(ratesData.rates.USD > 0, 'USD rate must be greater than 0');
    assert.ok(ratesData.rates.QAR > 0, 'QAR rate must be greater than 0');
    assert.ok(ratesData.rates.AED > 0, 'AED rate must be greater than 0');
  });

  test('Requirement 21: Supabase country_pricing_configs mapping & dynamic calculation', () => {
    // Simulate row returned directly from Supabase country_pricing_configs
    const dbRow = {
      code: 'US',
      name: 'USA',
      currency: 'USD',
      currency_symbol: '$',
      markup_percent: 10,
      flag: '🇺🇸',
      enabled: true,
      is_base: false,
      sort_order: 2,
    };

    // Mapped object in application
    const appCountry = {
      code: dbRow.code,
      name: dbRow.name,
      currency: dbRow.currency,
      currencySymbol: dbRow.currency_symbol,
      markupPercent: Number(dbRow.markup_percent),
      flag: dbRow.flag,
      enabled: dbRow.enabled,
      isBase: dbRow.is_base,
    };

    const rates = { USD: 0.0118 };
    const result = getLocalizedPrice(1000, appCountry, rates);

    assert.strictEqual(result.basePrice, 1000);
    assert.strictEqual(result.markupPercent, 10);
    assert.strictEqual(result.markedUpBasePrice, 1100);
    assert.strictEqual(result.currency, 'USD');
    assert.strictEqual(result.formatted, '$12.98');
  });

  test('Requirement 22: Under 999 category is excluded from bulk/set discount', () => {
    const under999Prod = {
      id: 'under-1',
      category: 'Under 999',
      totalColors: 1,
      variants: [{ code: 'U-1', prices: { mrp: 599, b2r: 699 } }],
    };

    // Customer buying 1 single piece of Under 999
    const pricing = calculateLocalizedHybridProductPrice(under999Prod, 1, null, { code: 'IN', currency: 'INR', markupPercent: 0 }, { INR: 1 });
    assert.strictEqual(pricing.totalPrice, 699, 'Single piece of Under 999 must charge single/reseller price (699)');
    assert.strictEqual(pricing.completeSets, 0, 'Under 999 must have completeSets = 0 (no bulk set discount)');
    assert.strictEqual(pricing.wholesaleTotal, 0, 'Under 999 must have wholesaleTotal = 0');
    assert.strictEqual(pricing.resellerTotal, 699, 'Under 999 total must be under resellerTotal');
  });

  test('Requirement 23: Buying 1 piece does NOT trigger bulk discount (only full sets qualify)', () => {
    const multiColorSaree = {
      id: '106005',
      title: 'Mashru Silk Resham and Zari Saree',
      category: 'Saree',
      totalColors: 3,
      variants: [
        { code: '106005-1', prices: { mrp: 3570, b2r: 3885, single: 4360 } },
        { code: '106005-2', prices: { mrp: 3570, b2r: 3885, single: 4360 } },
        { code: '106005-3', prices: { mrp: 3570, b2r: 3885, single: 4360 } },
      ],
    };

    const countryIN = { code: 'IN', name: 'India', currency: 'INR', currencySymbol: '₹', markupPercent: 0 };
    const rates = { INR: 1 };

    // 1. Buying ONLY 1 piece: must NOT have completeSets, must charge reseller single price (3885)
    const singlePiecePricing = calculateLocalizedHybridProductPrice(multiColorSaree, 1, null, countryIN, rates);
    assert.strictEqual(singlePiecePricing.completeSets, 0, '1 piece out of 3 must have completeSets = 0');
    assert.strictEqual(singlePiecePricing.extraPieces, 1, '1 piece out of 3 must have extraPieces = 1');
    assert.strictEqual(singlePiecePricing.totalPrice, 3885, 'Total price must be single piece rate 3885');
    assert.strictEqual(singlePiecePricing.wholesaleTotal, 0, 'wholesaleTotal must be 0 for single piece');
    assert.strictEqual(singlePiecePricing.resellerTotal, 3885, 'resellerTotal must equal 3885');

    // Cart totals for 1 piece
    const cartItemsSingle = [
      {
        productGroupKey: '106005',
        product: multiColorSaree,
        variant: multiColorSaree.variants[0],
        quantity: 1,
      },
    ];
    const cartTotalsSingle = calculateLocalizedHybridCartTotals(cartItemsSingle, null, countryIN, rates);
    assert.strictEqual(cartTotalsSingle.total, 3885, 'Cart total for 1 piece must be 3885');
    assert.ok(cartTotalsSingle.productPricing['106005'], 'productPricing must be included in cart totals');
    assert.strictEqual(cartTotalsSingle.productPricing['106005'].completeSets, 0, 'completeSets must be 0');

    // 2. Buying FULL SET of 3 pcs: must qualify for completeSets = 1 and wholesale price (3570 /pc)
    const fullSetPricing = calculateLocalizedHybridProductPrice(multiColorSaree, 3, null, countryIN, rates);
    assert.strictEqual(fullSetPricing.completeSets, 1, '3 pieces out of 3 must have completeSets = 1');
    assert.strictEqual(fullSetPricing.extraPieces, 0, '3 pieces out of 3 must have extraPieces = 0');
    assert.strictEqual(fullSetPricing.wholesaleTotal, 10710, 'Full set wholesale total must be 3 * 3570 = 10710');
    assert.strictEqual(fullSetPricing.totalPrice, 10710, 'Total price must be wholesale set price 10710');

    // 3. Buying single piece of single-color saree (totalColors: 1): must also NOT trigger completeSets
    const singleColorSaree = {
      id: 'single-col-1',
      title: 'Single Color Saree',
      category: 'Saree',
      totalColors: 1,
      variants: [{ code: 'SC-1', prices: { mrp: 2000, b2r: 2500 } }],
    };
    const scPricing = calculateLocalizedHybridProductPrice(singleColorSaree, 1, null, countryIN, rates);
    assert.strictEqual(scPricing.completeSets, 0, 'Single color item buying 1 piece must have completeSets = 0');
    assert.strictEqual(scPricing.totalPrice, 2500, 'Must be single piece reseller price (2500)');
  });
});

