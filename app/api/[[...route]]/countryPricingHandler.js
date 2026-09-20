/**
 * @file countryPricingHandler.js
 * @description Edge API handler for country detection, country-specific pricing configurations,
 * and centralized dynamic exchange rates fetched directly from Supabase.
 */

export const runtime = 'edge';

import { getExchangeRates, refreshExchangeRates } from '../../../src/services/exchangeRateService.js';
import { INITIAL_COUNTRIES } from '../../../src/store/useCountryCurrency.js';

const ALLOWED_ADMIN_ORIGINS = [
  'https://www.weave365.com',
  'https://weave365.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function getCorsHeaders(request) {
  const origin = request?.headers?.get('origin');
  const isAllowed = origin && (ALLOWED_ADMIN_ORIGINS.includes(origin) || origin.endsWith('.weave365.com'));

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

let supabaseInstance = null;
async function getSupabase(token = null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const { createClient } = await import('@supabase/supabase-js');

  if (token) {
    return createClient(url, key, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

/**
 * Detects visitor country from reverse proxy / CDN headers
 */
function detectCountryFromHeaders(request) {
  const headers = request.headers;
  const cfCountry = headers.get('cf-ipcountry');
  const vercelCountry = headers.get('x-vercel-ip-country');
  const geoCountry = headers.get('x-country-code') || headers.get('geoip-country-code');

  const detected = cfCountry || vercelCountry || geoCountry;
  if (detected && detected !== 'XX' && detected !== 'T1') {
    return detected.trim().toUpperCase();
  }
  return 'IN';
}

/**
 * GET /api/country-pricing
 * Fetches country configurations and current exchange rates directly from Supabase
 */
export async function GET(request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const detectedCountry = detectCountryFromHeaders(request);
    const supabase = await getSupabase();

    let countries = [];

    if (supabase) {
      try {
        // 1. Primary: Fetch directly from country_pricing_configs table in Supabase
        const { data: dbRows, error: dbError } = await supabase
          .from('country_pricing_configs')
          .select('code, name, currency, currency_symbol, markup_percent, flag, enabled, is_base, sort_order')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true });

        if (!dbError && Array.isArray(dbRows) && dbRows.length > 0) {
          countries = dbRows.map((r) => ({
            code: r.code,
            name: r.name,
            currency: r.currency,
            currencySymbol: r.currency_symbol || r.currency,
            markupPercent: Number(r.markup_percent) || 0,
            flag: r.flag || '🌐',
            enabled: r.enabled !== false,
            isBase: Boolean(r.is_base),
            sortOrder: r.sort_order ?? 0,
          }));
        } else {
          // 2. Fallback: sheet_data table if country_pricing_configs is not yet created
          const { data: sheetData } = await supabase
            .from('sheet_data')
            .select('csv_data')
            .eq('id', 'country_pricing_config')
            .maybeSingle();

          if (sheetData?.csv_data) {
            const parsed = JSON.parse(sheetData.csv_data);
            if (Array.isArray(parsed) && parsed.length > 0) {
              countries = parsed;
            }
          }
        }
      } catch (err) {
        console.warn('[CountryPricingHandler] Supabase query error:', err.message);
      }
    }

    // Safety fallback only if Supabase returned zero records
    if (!countries || countries.length === 0) {
      countries = INITIAL_COUNTRIES;
    }

    const { rates, provider, lastUpdated, nextRefresh, cacheStatus } = await getExchangeRates();

    return new Response(
      JSON.stringify({
        success: true,
        detectedCountry,
        defaultCountry: 'IN',
        countries,
        exchangeRates: rates,
        exchangeRateMeta: {
          provider,
          lastUpdated,
          nextRefresh,
          cacheStatus,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=300',
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    console.error('[CountryPricingHandler] GET error:', err);
    return new Response(
      JSON.stringify({
        error: err.message || 'Internal server error',
        countries: INITIAL_COUNTRIES,
        detectedCountry: 'IN',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
}

/**
 * POST /api/admin/country-pricing
 * Admin management endpoint (save configs to Supabase, refresh rates)
 */
export async function POST(request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabase = await getSupabase(token);
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Database unconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 1. Authorize Admin
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing authentication token.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !authUser?.email) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session token.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const adminEmailsList = String(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = authUser.email.trim().toLowerCase();
    let isAuthorized = adminEmailsList.includes(userEmail);

    if (!isAuthorized) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin privileges required.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 2. Handle Actions
    const body = await request.json();
    const { action } = body;

    if (action === 'refresh_exchange_rates') {
      const refreshed = await refreshExchangeRates();
      return new Response(
        JSON.stringify({
          success: true,
          exchangeRates: refreshed.rates,
          exchangeRateMeta: {
            provider: refreshed.provider,
            lastUpdated: refreshed.lastUpdated,
            nextRefresh: refreshed.nextRefresh,
            cacheStatus: refreshed.cacheStatus,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (action === 'save_country_pricing') {
      const { countries } = body;
      if (!Array.isArray(countries) || countries.length === 0) {
        return new Response(JSON.stringify({ error: 'Invalid countries configuration.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Validate countries structure & numeric markups
      const validatedCountries = countries.map((c, index) => {
        const markup = Number(c.markupPercent);
        return {
          code: String(c.code || '').trim().toUpperCase(),
          name: String(c.name || '').trim(),
          currency: String(c.currency || 'INR').trim().toUpperCase(),
          currencySymbol: String(c.currencySymbol || c.currency || '').trim(),
          markupPercent: isNaN(markup) ? 0 : markup,
          flag: c.flag || '🌐',
          enabled: c.enabled !== false,
          isBase: Boolean(c.isBase),
          sortOrder: index + 1,
        };
      });

      const timestamp = new Date().toISOString();

      // 1. Save directly into Supabase country_pricing_configs table
      const rowsToUpsert = validatedCountries.map((c) => ({
        code: c.code,
        name: c.name,
        currency: c.currency,
        currency_symbol: c.currencySymbol,
        markup_percent: c.markupPercent,
        flag: c.flag,
        enabled: c.enabled,
        is_base: c.isBase,
        sort_order: c.sortOrder,
        updated_at: timestamp,
      }));

      const { error: upsertError } = await supabase
        .from('country_pricing_configs')
        .upsert(rowsToUpsert, { onConflict: 'code' });

      if (upsertError) {
        console.error('[CountryPricingHandler] country_pricing_configs upsert error:', upsertError);
        throw new Error(`Supabase table error: ${upsertError.message || JSON.stringify(upsertError)}`);
      }

      // 2. Remove deleted countries from database (except base country)
      const currentCodes = validatedCountries.map((c) => c.code);
      const { data: existingRows } = await supabase
        .from('country_pricing_configs')
        .select('code, is_base');

      if (Array.isArray(existingRows)) {
        const toDelete = existingRows
          .filter((r) => !r.is_base && !currentCodes.includes(r.code))
          .map((r) => r.code);

        if (toDelete.length > 0) {
          await supabase
            .from('country_pricing_configs')
            .delete()
            .in('code', toDelete);
        }
      }

      // 3. Also keep sheet_data updated as a secondary backup
      try {
        await supabase.from('sheet_data').upsert({
          id: 'country_pricing_config',
          csv_data: JSON.stringify(validatedCountries),
          updated_at: timestamp,
        });
      } catch (sheetErr) {
        console.warn('[CountryPricingHandler] sheet_data sync note:', sheetErr.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          countries: validatedCountries,
          timestamp,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('[CountryPricingHandler] POST error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
}

