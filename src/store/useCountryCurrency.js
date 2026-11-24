/**
 * @file useCountryCurrency.js
 * @description Centralized Zustand store for country selection, dynamic exchange rates,
 * and user persistence (Cookie + localStorage).
 * 
 * Ensures manual country selection ALWAYS overrides automatic IP detection.
 */

import { create } from 'zustand';
import { DEFAULT_BASELINE_RATES } from '../constants/currencyRates.js';
import { ALL_EXISTING_COUNTRIES } from '../constants/allCountries.js';
import { getLocalizedPrice, calculateLocalizedHybridProductPrice, calculateLocalizedHybridCartTotals, formatCurrency } from '../services/pricingService.js';

export const INITIAL_COUNTRIES = ALL_EXISTING_COUNTRIES;

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
const COOKIE_KEY_DETECTED = 'weave365_detected_country';

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
  // State: always initialize identically on server SSR and initial client hydration
  // to prevent hydration mismatch. Client storage (localStorage/cookie) is hydrated
  // immediately upon mount in initCountryCurrency().
  currentCountry: ALL_EXISTING_COUNTRIES[0],
  countries: ALL_EXISTING_COUNTRIES,
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
    const resolvedCountries = Array.isArray(countries) ? countries : ALL_EXISTING_COUNTRIES;
    const currentStillValid = resolvedCountries.find((c) => c.code === current.code && c.enabled !== false);
    set({
      countries: resolvedCountries,
      currentCountry: currentStillValid || resolvedCountries[0] || ALL_EXISTING_COUNTRIES[0],
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
        isManual = localStorage.getItem(STORAGE_KEY_MANUAL) === 'true';
        const manualCode = isManual ? (localStorage.getItem(STORAGE_KEY_COUNTRY) || getCookie(COOKIE_KEY_COUNTRY)) : null;
        const middlewareDetected = getCookie(COOKIE_KEY_DETECTED);
        const candidateCode = (manualCode || middlewareDetected || '').trim().toUpperCase();
        if (candidateCode) {
          const match = get().countries.find((c) => c.code.toUpperCase() === candidateCode && c.enabled !== false);
          if (match && match.code !== get().currentCountry?.code) {
            set({ currentCountry: match, isManualSelection: isManual });
          }
        }
        savedCode = localStorage.getItem(STORAGE_KEY_COUNTRY) || getCookie(COOKIE_KEY_COUNTRY);
      } catch (e) {
        // Ignore
      }
    }

    try {
      const res = await fetch('/api/country-pricing', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();

        const serverCountries = Array.isArray(data.countries) && data.countries.length > 0
          ? data.countries
          : [];

        // When admin has configured countries in database, use ONLY the admin-configured list.
        // Fallback to ALL_EXISTING_COUNTRIES only if database has zero configured countries.
        let resolvedCountries = [];
        if (serverCountries.length > 0) {
          resolvedCountries = serverCountries.map((sc) => {
            const base = ALL_EXISTING_COUNTRIES.find((b) => b.code?.toUpperCase() === sc.code?.toUpperCase());
            return {
              ...base,
              ...sc,
              flag: sc.flag && sc.flag !== '🌐' ? sc.flag : (base?.flag || sc.flag || '🌐'),
              shippingFee: Number(sc.shippingFee ?? sc.shipping_fee ?? 0),
              enabled: sc.enabled !== false,
            };
          });
        } else {
          resolvedCountries = ALL_EXISTING_COUNTRIES;
        }

        const serverRates = data.exchangeRates || DEFAULT_BASELINE_RATES;
        const serverMeta = data.exchangeRateMeta || {};
        const detectedCode = (data.detectedCountry || 'IN').toUpperCase();

        // MANUAL SELECTION ALWAYS TAKES PRIORITY OVER AUTOMATIC DETECTION.
        // Non-manual saved codes must NEVER block live IP detection (e.g. when traveling or after cache fixes).
        let targetCode = 'IN';
        if (isManual && savedCode) {
          targetCode = savedCode.toUpperCase();
        } else if (detectedCode) {
          targetCode = detectedCode;
        } else if (savedCode) {
          targetCode = savedCode.toUpperCase();
        }

        const selectedCountry = resolvedCountries.find((c) => c.code.toUpperCase() === targetCode && c.enabled !== false)
          || resolvedCountries.find((c) => c.code === 'IN' && c.enabled !== false)
          || resolvedCountries.find((c) => c.enabled !== false)
          || resolvedCountries[0];

        set({
          countries: resolvedCountries,
          currentCountry: selectedCountry,
          exchangeRates: serverRates,
          exchangeRateMeta: serverMeta,
          isManualSelection: isManual,
          isInitialized: true,
        });

        // Keep storage synced with current country without marking auto-detection as manual
        if (typeof window !== 'undefined') {
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

    // Fallback if API fails: respect manual selection, then middleware geo cookie, then savedCode
    const initialCountries = get().countries;
    const middlewareCode = typeof window !== 'undefined' ? getCookie(COOKIE_KEY_DETECTED) : null;
    const fallbackCode = (isManual && savedCode)
      ? savedCode.toUpperCase()
      : (middlewareCode || savedCode || 'IN').toUpperCase();
    const selected = initialCountries.find((c) => c.code.toUpperCase() === fallbackCode && c.enabled !== false) || initialCountries[0];
    set({
      countries: initialCountries,
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
