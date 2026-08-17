/**
 * @file Edge API handler for serving CDN-cached catalog data.
 * Sets aggressive Cloudflare Edge & Browser cache headers to eliminate
 * Supabase PostgREST egress on catalog reads.
 */

export const runtime = 'edge';

let supabaseInstance = null;
async function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const { createClient } = await import('@supabase/supabase-js');
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const cdnCacheHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  'CDN-Cache-Control': 'max-age=3600',
  'Cloudflare-CDN-Cache-Control': 'max-age=3600',
  ...corsHeaders,
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'products';

    const supabase = await getSupabase();
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Database unconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const typeToKey = {
      products: 'products_json',
      config: 'config_json',
      hero: 'hero_json',
      customizer: 'site_customizer_json',
    };

    if (type === 'all') {
      const { data, error } = await supabase
        .from('sheet_data')
        .select('id, csv_data')
        .in('id', ['products_json', 'config_json', 'hero_json', 'site_customizer_json']);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const result = {
        products: [],
        config: { priceRanges: [], categories: [], fabrics: [], weaves: [] },
        hero: [],
        customizer: null,
      };

      (data || []).forEach((row) => {
        try {
          if (row.id === 'products_json' && row.csv_data) result.products = JSON.parse(row.csv_data);
          if (row.id === 'config_json' && row.csv_data) result.config = JSON.parse(row.csv_data);
          if (row.id === 'hero_json' && row.csv_data) result.hero = JSON.parse(row.csv_data);
          if (row.id === 'site_customizer_json' && row.csv_data) result.customizer = JSON.parse(row.csv_data);
        } catch (e) {
          console.warn(`[Catalog API] JSON parse error on ${row.id}:`, e.message);
        }
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: cdnCacheHeaders,
      });
    }

    const targetKey = typeToKey[type] || 'products_json';
    const { data, error } = await supabase
      .from('sheet_data')
      .select('csv_data')
      .eq('id', targetKey)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Return the pre-stringified JSON directly without re-parsing to save CPU
    const rawJson = data?.csv_data || (type === 'products' || type === 'hero' ? '[]' : '{}');

    return new Response(rawJson, {
      status: 200,
      headers: cdnCacheHeaders,
    });
  } catch (err) {
    console.error('[Catalog API] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
