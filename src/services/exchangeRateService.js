/**
 * @file exchangeRateService.js
 * @description Centralized exchange rate service with caching, TTL, concurrent-request stampede protection,
 * and graceful failure handling.
 * 
 * Base Reference Currency: INR (Indian Rupee)
 */

import { supabase, isSupabaseConfigured } from '../supabaseClient.js';

import { DEFAULT_BASELINE_RATES } from '../constants/currencyRates.js';
export { DEFAULT_BASELINE_RATES };

const DEFAULT_PROVIDER = 'ExchangeRate-API (open.er-api.com)';
const DEFAULT_API_URL = 'https://open.er-api.com/v6/latest/INR';
const DEFAULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours default TTL

// In-memory cache
let inMemoryCache = {
  rates: null,
  provider: DEFAULT_PROVIDER,
  lastUpdated: null,
  nextRefresh: null,
  expiresAt: 0,
};

// Single-flight lock promise to prevent cache stampede
let inFlightFetchPromise = null;

/**
 * Resolves the configured cache TTL in milliseconds
 */
export function getCacheTtlMs() {
  const envHours = typeof process !== 'undefined' && process.env?.EXCHANGE_RATE_CACHE_TTL_HOURS;
  if (envHours && !isNaN(Number(envHours)) && Number(envHours) > 0) {
    return Number(envHours) * 60 * 60 * 1000;
  }
  return DEFAULT_CACHE_TTL_MS;
}

/**
 * Loads cached exchange rates from Supabase storage (exchange_rates_cache table)
 */
async function loadPersistentCache() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    // 1. Primary: exchange_rates_cache table
    const { data, error } = await supabase
      .from('exchange_rates_cache')
      .select('*')
      .eq('id', 'INR')
      .maybeSingle();

    if (!error && data?.rates && typeof data.rates === 'object' && Object.keys(data.rates).length > 0) {
      return {
        rates: data.rates,
        provider: data.provider || DEFAULT_PROVIDER,
        lastUpdated: data.last_updated,
        nextRefresh: data.next_refresh,
        expiresAt: data.expires_at || 0,
      };
    }

    // 2. Fallback: sheet_data table
    const { data: sheetData } = await supabase
      .from('sheet_data')
      .select('csv_data, updated_at')
      .eq('id', 'exchange_rates_cache')
      .maybeSingle();

    if (sheetData?.csv_data) {
      const parsed = JSON.parse(sheetData.csv_data);
      return {
        rates: parsed.rates,
        provider: parsed.provider || DEFAULT_PROVIDER,
        lastUpdated: parsed.lastUpdated || sheetData.updated_at,
        nextRefresh: parsed.nextRefresh,
        expiresAt: parsed.expiresAt || 0,
      };
    }
  } catch (err) {
    console.warn('[ExchangeRateService] Persistent cache load error:', err.message);
  }
  return null;
}

/**
 * Saves cached exchange rates to Supabase storage (exchange_rates_cache table)
 */
async function savePersistentCache(cacheData) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    // 1. Save to exchange_rates_cache table
    await supabase.from('exchange_rates_cache').upsert({
      id: 'INR',
      rates: cacheData.rates,
      provider: cacheData.provider,
      last_updated: cacheData.lastUpdated,
      next_refresh: cacheData.nextRefresh,
      expires_at: cacheData.expiresAt,
    });

    // 2. Also keep sheet_data in sync
    await supabase.from('sheet_data').upsert({
      id: 'exchange_rates_cache',
      csv_data: JSON.stringify(cacheData),
      updated_at: cacheData.lastUpdated,
    });
  } catch (err) {
    console.warn('[ExchangeRateService] Persistent cache save error:', err.message);
  }
}

/**
 * Fetches current exchange rates from the external provider with fallback
 */
async function fetchRatesFromProvider() {
  const apiUrl = (typeof process !== 'undefined' && process.env?.EXCHANGE_RATE_API_URL) || DEFAULT_API_URL;
  const apiKey = typeof process !== 'undefined' && process.env?.EXCHANGE_RATE_API_KEY;

  let requestUrl = apiUrl;
  if (apiKey && !apiUrl.includes(apiKey)) {
    requestUrl = `${apiUrl.replace(/\/$/, '')}/${apiKey}/latest/INR`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const res = await fetch(requestUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const rawRates = data.rates || data.conversion_rates;

    if (!rawRates || typeof rawRates !== 'object') {
      throw new Error('Invalid rate data structure received from provider');
    }

    // Ensure INR is always 1
    const rates = {
      ...DEFAULT_BASELINE_RATES,
      ...rawRates,
      INR: 1,
    };

    const now = Date.now();
    const ttlMs = getCacheTtlMs();
    const lastUpdated = new Date(now).toISOString();
    const nextRefresh = new Date(now + ttlMs).toISOString();

    const newCache = {
      rates,
      provider: data.provider || DEFAULT_PROVIDER,
      lastUpdated,
      nextRefresh,
      expiresAt: now + ttlMs,
    };

    // Update in-memory cache
    inMemoryCache = newCache;

    // Asynchronously save to persistent storage
    void savePersistentCache(newCache);

    return newCache;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[ExchangeRateService] External API fetch failed:', err.message);

    // Graceful fallback 1: Existing in-memory cache (even if expired)
    if (inMemoryCache.rates) {
      console.warn('[ExchangeRateService] Using previous in-memory cache as fallback.');
      return inMemoryCache;
    }

    // Graceful fallback 2: Persistent database cache
    const persistent = await loadPersistentCache();
    if (persistent?.rates) {
      console.warn('[ExchangeRateService] Using previous database cache as fallback.');
      inMemoryCache = persistent;
      return persistent;
    }

    // Graceful fallback 3: Built-in safe baseline rates
    console.warn('[ExchangeRateService] Using default baseline rates as safety fallback.');
    const now = Date.now();
    const baselineCache = {
      rates: { ...DEFAULT_BASELINE_RATES },
      provider: `${DEFAULT_PROVIDER} (Baseline Fallback)`,
      lastUpdated: new Date(now).toISOString(),
      nextRefresh: new Date(now + getCacheTtlMs()).toISOString(),
      expiresAt: now + getCacheTtlMs(),
    };
    inMemoryCache = baselineCache;
    return baselineCache;
  }
}

/**
 * Get current exchange rates.
 * Implements:
 * 1. Cache hit check
 * 2. Single-flight lock protection against stampede
 * 3. Graceful degradation
 */
export async function getExchangeRates(forceRefresh = false) {
  const now = Date.now();

  // 1. If in-memory cache is valid and not forced, return immediately
  if (!forceRefresh && inMemoryCache.rates && inMemoryCache.expiresAt > now) {
    return {
      rates: inMemoryCache.rates,
      provider: inMemoryCache.provider,
      lastUpdated: inMemoryCache.lastUpdated,
      nextRefresh: inMemoryCache.nextRefresh,
      cacheStatus: 'Active',
    };
  }

  // 2. If memory cache is empty, try loading persistent cache from database first
  if (!forceRefresh && !inMemoryCache.rates) {
    const persistent = await loadPersistentCache();
    if (persistent?.rates && persistent.expiresAt > now) {
      inMemoryCache = persistent;
      return {
        rates: persistent.rates,
        provider: persistent.provider,
        lastUpdated: persistent.lastUpdated,
        nextRefresh: persistent.nextRefresh,
        cacheStatus: 'Active (Database Cache)',
      };
    }
  }

  // 3. Single-flight lock: If a fetch is already in progress, await the same promise
  if (inFlightFetchPromise) {
    const result = await inFlightFetchPromise;
    return {
      rates: result.rates,
      provider: result.provider,
      lastUpdated: result.lastUpdated,
      nextRefresh: result.nextRefresh,
      cacheStatus: 'Refreshed (Single-Flight)',
    };
  }

  // 4. Initiate fresh fetch protected by single-flight lock
  try {
    inFlightFetchPromise = fetchRatesFromProvider();
    const result = await inFlightFetchPromise;
    return {
      rates: result.rates,
      provider: result.provider,
      lastUpdated: result.lastUpdated,
      nextRefresh: result.nextRefresh,
      cacheStatus: 'Refreshed',
    };
  } finally {
    inFlightFetchPromise = null;
  }
}

/**
 * Forces an immediate refresh of exchange rates
 */
export async function refreshExchangeRates() {
  return getExchangeRates(true);
}
