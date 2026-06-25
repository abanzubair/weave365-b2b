/**
 * @file app/api/admin/sync/route.js
 * @description Secure administrative catalog syncing endpoint.
 * Fetches Google Sheet CSV configurations using server-only credentials,
 * and updates the Supabase cached sheet database.
 */

import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { email } = payload;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing authorized administrator email.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 1. Verify administrator email credentials
    const adminEmails = String(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const cleanEmail = String(email).trim().toLowerCase();
    if (!adminEmails.includes(cleanEmail)) {
      return new Response(JSON.stringify({ error: 'Unauthorized administrative access.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 2. Initialize Supabase Client securely
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configurations are missing on the server.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Define Google Sheets endpoints with secure server-only fallbacks
    const csvUrl = process.env.GOOGLE_SHEET_PRODUCTS_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRX1gaMx_CdSX-ozTHYarKfGNtsAsBTsvqvLoexBjR5FxEYiWVY3JlZKK6AD4g-KigjwOLOk5JvXDQ-/pub?gid=0&single=true&output=csv';
    const heroCsvUrl = process.env.GOOGLE_SHEET_HERO_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0sRjHxpdyuxJ6KsXmnEKnakC8ryFTDSSZozFRhfXPfI82PYYQqDlk2fNPBMptKit3hVXEAdxeagLq/pub?gid=0&single=true&output=csv';
    const configCsvUrl = process.env.GOOGLE_SHEET_CONFIG_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRX1gaMx_CdSX-ozTHYarKfGNtsAsBTsvqvLoexBjR5FxEYiWVY3JlZKK6AD4g-KigjwOLOk5JvXDQ-/pub?gid=2140935109&single=true&output=csv';

    const categoryCsvUrls = {
      'Under 999': process.env.GOOGLE_SHEET_UNDER_999_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRX1gaMx_CdSX-ozTHYarKfGNtsAsBTsvqvLoexBjR5FxEYiWVY3JlZKK6AD4g-KigjwOLOk5JvXDQ-/pub?gid=464893428&single=true&output=csv',
      'Suit': process.env.GOOGLE_SHEET_SUIT_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRX1gaMx_CdSX-ozTHYarKfGNtsAsBTsvqvLoexBjR5FxEYiWVY3JlZKK6AD4g-KigjwOLOk5JvXDQ-/pub?gid=1506466857&single=true&output=csv',
    };

    const fetchText = async (url) => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Fetch failed for URL: ${url}`);
      return res.text();
    };

    const fetchHeroText = async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return await res.text();
      } catch (err) {
        console.warn(`Optional hero sheet fetch failed, skipping hero update:`, err.message);
        return null;
      }
    };

    // 4. Fetch main sheets + category sheets in parallel
    const categoryEntries = Object.entries(categoryCsvUrls);
    const categoryFetches = categoryEntries.map(([catName, catUrl]) =>
      fetchHeroText(catUrl).then((text) => ({ catName, text }))
    );

    const [products, hero, config, ...categoryResults] = await Promise.all([
      fetchText(csvUrl),
      fetchHeroText(heroCsvUrl),
      fetchText(configCsvUrl),
      ...categoryFetches,
    ]);

    const timestamp = new Date().toISOString();

    const updates = [
      { id: 'products', csv_data: products, updated_at: timestamp },
      { id: 'config', csv_data: config, updated_at: timestamp },
    ];

    if (hero !== null) {
      updates.push({ id: 'hero', csv_data: hero, updated_at: timestamp });
    }

    for (const result of categoryResults) {
      if (result?.text) {
        const supabaseId = 'products_' + result.catName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        updates.push({ id: supabaseId, csv_data: result.text, updated_at: timestamp });
      }
    }

    // 5. Upsert sheet data cache into Supabase
    const { error } = await supabase.from('sheet_data').upsert(updates);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, timestamp }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('[admin sync API POST] Sync error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Server encountered an error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
