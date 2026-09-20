/**
 * @file useCountryCurrency.js
 * @description Centralized Zustand store for country selection, dynamic exchange rates,
 * and user persistence (Cookie + localStorage).
 * 
 * Ensures manual country selection ALWAYS overrides automatic IP detection.
 */

import { create } from 'zustand';
import { DEFAULT_BASELINE_RATES } from '../services/exchangeRateService.js';
import { getLocalizedPrice, calculateLocalizedHybridProductPrice, calculateLocalizedHybridCartTotals, formatCurrency } from '../services/pricingService.js';

export const INITIAL_COUNTRIES = [
  {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    markupPercent: 0,
    flag: '🇮🇳',
    enabled: true,
    isBase: true,
  },
  {
    code: 'US',
    name: 'USA',
    currency: 'USD',
    currencySymbol: '$',
    markupPercent: 10,
    flag: '🇺🇸',
    enabled: true,
  },
  {
    code: 'QA',
    name: 'Qatar',
    currency: 'QAR',
    currencySymbol: 'QAR',
    markupPercent: 15,
    flag: '🇶🇦',
    enabled: true,
  },
  {
    code: 'AE',
    name: 'UAE',
    currency: 'AED',
    currencySymbol: 'AED',
    markupPercent: 12,
    flag: '🇦🇪',
    enabled: true,
  },
];

export const PRESET_ADDITIONAL_COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', currencySymbol: '£', markupPercent: 12, flag: '🇬🇧' },
  { code: 'EU', name: 'Eurozone', currency: 'EUR', currencySymbol: '€', markupPercent: 12, flag: '🇪🇺' },
  { code: 'CA', name: 'Canada', currency: 'CAD', currencySymbol: 'CA$', markupPercent: 12, flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', currency: 'AUD', currencySymbol: 'A$', markupPercent: 12, flag: '🇦🇺' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', currencySymbol: 'S$', markupPercent: 10, flag: '🇸🇬' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', currencySymbol: 'SAR', markupPercent: 15, flag: '🇸🇦' },
  { code: 'KW', name: 'Kuwait', currency: 'KWD', currencySymbol: 'KWD', markupPercent: 15, flag: '🇰🇼' },
  { code: 'OM', name: 'Oman', currency: 'OMR', currencySymbol: 'OMR', markupPercent: 15, flag: '🇴🇲' },
  { code: 'BH', name: 'Bahrain', currency: 'BHD', currencySymbol: 'BHD', markupPercent: 15, flag: '🇧🇭' },
];

const STORAGE_KEY_COUNTRY = 'weave365_country';
const STORAGE_KEY_MANUAL = 'weave365_country_manual';
const COOKIE_KEY_COUNTRY = 'weave365_country';

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const matches = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`));
  return matches ? decodeURIComponent(matches[1]) : null;
}

function setCookie(name, value, days = 365) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${date.toUTCString()}; SameSite=Lax`;
}

export const useCountryCurrency = create((set, get) => ({
  // State
  currentCountry: INITIAL_COUNTRIES[0], // Defaults to India
  countries: INITIAL_COUNTRIES,
  exchangeRates: DEFAULT_BASELINE_RATES,
  exchangeRateMeta: {
    provider: 'ExchangeRate-API (open.er-api.com)',
    lastUpdated: null,
    nextRefresh: null,
    cacheStatus: 'Active',
  },
  isManualSelection: false,
  isInitialized: false,

  // Actions
  setCountry: (countryOrCode, isManual = true) => {
    const { countries } = get();
    const code = typeof countryOrCode === 'string' ? countryOrCode.toUpperCase() : countryOrCode?.code?.toUpperCase();
    const matched = countries.find((c) => c.code.toUpperCase() === code && c.enabled !== false) || countries[0];

    set({
      currentCountry: matched,
      isManualSelection: isManual,
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_COUNTRY, matched.code);
        if (isManual) {
          localStorage.setItem(STORAGE_KEY_MANUAL, 'true');
        }
        setCookie(COOKIE_KEY_COUNTRY, matched.code);
      } catch (e) {
        // Ignore storage errors
      }
    }
  },

  setCountries: (countries) => {
    const current = get().currentCountry;
    const resolvedCountries = Array.isArray(countries) ? countries : INITIAL_COUNTRIES;
    const currentStillValid = resolvedCountries.find((c) => c.code === current.code && c.enabled !== false);
    set({
      countries: resolvedCountries,
      currentCountry: currentStillValid || resolvedCountries[0] || INITIAL_COUNTRIES[0],
    });
  },

  setExchangeRates: (exchangeRates, meta = null) => {
    set({
      exchangeRates: {
        ...DEFAULT_BASELINE_RATES,
        ...(exchangeRates || {}),
        INR: 1,
      },
      ...(meta ? { exchangeRateMeta: { ...get().exchangeRateMeta, ...meta } } : {}),
    });
  },

  // Initialize and hydrate country selection & rates
  initCountryCurrency: async () => {
    if (get().isInitialized) return;

    let savedCode = null;
    let isManual = false;

    if (typeof window !== 'undefined') {
      try {
        savedCode = localStorage.getItem(STORAGE_KEY_COUNTRY) || getCookie(COOKIE_KEY_COUNTRY);
        isManual = localStorage.getItem(STORAGE_KEY_MANUAL) === 'true';
      } catch (e) {
        // Ignore
      }
    }

    try {
      const res = await fetch('/api/country-pricing');
      if (res.ok) {
        const data = await res.json();

        const serverCountries = Array.isArray(data.countries) && data.countries.length > 0
          ? data.countries
          : INITIAL_COUNTRIES;

        const serverRates = data.exchangeRates || DEFAULT_BASELINE_RATES;
        const serverMeta = data.exchangeRateMeta || {};
        const detectedCode = (data.detectedCountry || 'IN').toUpperCase();

        // MANUAL SELECTION ALWAYS TAKES PRIORITY OVER AUTOMATIC DETECTION
        let targetCode = 'IN';
        if (isManual && savedCode) {
          targetCode = savedCode.toUpperCase();
        } else if (savedCode) {
          targetCode = savedCode.toUpperCase();
        } else if (detectedCode) {
          targetCode = detectedCode;
        }

        const selectedCountry = serverCountries.find((c) => c.code.toUpperCase() === targetCode && c.enabled !== false)
          || serverCountries.find((c) => c.code === 'IN')
          || serverCountries[0];

        set({
          countries: serverCountries,
          currentCountry: selectedCountry,
          exchangeRates: serverRates,
          exchangeRateMeta: serverMeta,
          isManualSelection: isManual,
          isInitialized: true,
        });

        // Persist initial detected country if not set
        if (typeof window !== 'undefined' && !savedCode) {
          try {
            localStorage.setItem(STORAGE_KEY_COUNTRY, selectedCountry.code);
            setCookie(COOKIE_KEY_COUNTRY, selectedCountry.code);
          } catch (e) {}
        }
        return;
      }
    } catch (err) {
      console.warn('[useCountryCurrency] Failed to fetch country pricing:', err.message);
    }

    // Fallback if API fails
    const initialCountries = get().countries;
    const selected = initialCountries.find((c) => c.code === (savedCode || 'IN')) || initialCountries[0];
    set({
      currentCountry: selected,
      isManualSelection: isManual,
      isInitialized: true,
    });
  },

  // Helper getters for convenience
  getPrice: (basePrice) => {
    const { currentCountry, exchangeRates } = get();
    return getLocalizedPrice(basePrice, currentCountry, exchangeRates);
  },

  formatPrice: (basePrice) => {
    const { currentCountry, exchangeRates } = get();
    const localized = getLocalizedPrice(basePrice, currentCountry, exchangeRates);
    return localized.formatted;
  },

  getHybridPrice: (product, qty, customVariant) => {
    const { currentCountry, exchangeRates } = get();
    return calculateLocalizedHybridProductPrice(product, qty, customVariant, currentCountry, exchangeRates);
  },

  getCartTotals: (items, priceAccess) => {
    const { currentCountry, exchangeRates } = get();
    return calculateLocalizedHybridCartTotals(items, priceAccess, currentCountry, exchangeRates);
  },
}));
