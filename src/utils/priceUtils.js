/**
 * Price & Currency Utilities
 * Purpose: Handles international multi-currency state management (INR, USD, GBP, AED, EUR, etc.),
 * dynamic currency conversion fetching, and premium B2B locale-specific money & weight formatting.
 */
import { useState, useEffect } from 'react';
import { priceForBuyer } from './buyerAccess.js';

export const CURRENCIES = [
  { code: 'INR', label: '🇮🇳 India (IND)', locale: 'en-IN', flag: 'in' },
  { code: 'USD', label: '🇺🇸 United States (USA)', locale: 'en-US', flag: 'us' },
  { code: 'GBP', label: '🇬🇧 United Kingdom (UK)', locale: 'en-GB', flag: 'gb' },
  { code: 'AED', label: '🇦🇪 United Arab Emirates (UAE)', locale: 'ar-AE', flag: 'ae' },
  { code: 'EUR', label: '🇪🇺 Euro (EUR)', locale: 'de-DE', flag: 'eu' },
  { code: 'SGD', label: '🇸🇬 Singapore', locale: 'en-SG', flag: 'sg' },
  { code: 'MYR', label: '🇲🇾 Malaysia', locale: 'ms-MY', flag: 'my' },
];

let currentCurrency = 'INR';
let exchangeRates = { INR: 1 };
const currencyListeners = new Set();

export const CurrencyManager = {
  get currency() { return currentCurrency; },
  get rates() { return exchangeRates; },
  setCurrency(c) {
    currentCurrency = c;
    currencyListeners.forEach(l => l());
  },
  setRates(r) {
    exchangeRates = { ...r, INR: 1 };
    currencyListeners.forEach(l => l());
  },
  subscribe(l) {
    currencyListeners.add(l);
    return () => currencyListeners.delete(l);
  }
};

export function useCurrency() {
  const [currency, setCurrencyState] = useState(CurrencyManager.currency);
  useEffect(() => {
    return CurrencyManager.subscribe(() => setCurrencyState(CurrencyManager.currency));
  }, []);
  return currency;
}

export function formatMoney(value) {
  if (value == null || Number.isNaN(value)) return 'On request';

  const currencyCode = CurrencyManager.currency;
  const rate = CurrencyManager.rates[currencyCode] || 1;
  const convertedValue = value * rate;

  const currencyInfo = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

  const formatter = new Intl.NumberFormat(currencyInfo.locale, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: currencyCode === 'INR' ? 0 : 2,
  });

  return formatter.format(convertedValue);
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

export function parsePositiveNumber(value) {
  const num = Number(value);
  return num > 0 ? num : 0;
}
