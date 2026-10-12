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
  'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600',
  'CDN-Cache-Control': 'max-age=300',
  'Cloudflare-CDN-Cache-Control': 'max-age=300',
  ...corsHeaders,
};

function applyStockOverrides(products, stockRows) {
  if (!Array.isArray(products) || !Array.isArray(stockRows) || !stockRows.length) return products;
  const map = new Map();
  for (const row of stockRows) {
    if (row.product_id) {
      map.set(row.product_id, row);
    }
  }
  return products.map((product) => {
    const key = product.id || product.groupKey;
    const override = map.get(key);
    if (!override) return product;
    const stockKey = override.stock_status;
    const stockLabel = override.stock_status_label;
    const nonStockTags = (product.statusTags || []).filter(
      (tag) => !['ready-stock', 'pre-order', 'out-of-stock', 'back-soon', 'archived'].includes(tag.key)
    );
    const updatedTags = [
      { key: stockKey, label: stockLabel },
      ...nonStockTags,
    ];
    const isArchived = stockKey === 'archived'
      ? true
      : (['ready-stock', 'pre-order', 'out-of-stock', 'back-soon'].includes(stockKey)
          ? false
          : Boolean(product.isArchived));
    return {
      ...product,
      stockStatusOverride: stockKey,
      stockStatusLabel: stockLabel,
      stockLastUpdatedIST: override.updated_at_ist,
      stockLastUpdated: override.updated_at,
      statusTags: updatedTags,
      isOutOfStock: stockKey === 'out-of-stock',
      isReadyStock: stockKey === 'ready-stock',
      isPreOrder: stockKey === 'pre-order',
      isBackSoon: stockKey === 'back-soon',
      isArchived: isArchived,
    };
  });
}

function transformSellerProductToCatalog(sp) {
  if (!sp || !sp.sku) return null;
  const baseSku = sp.sku;
  const colors = Array.isArray(sp.colors) ? sp.colors : [];
  const images = Array.isArray(sp.images) ? sp.images : [];
  const coverImage = sp.cover_image || images[0] || '';
  
  const colorOptions = colors.map((c) => ({
    name: c.color || 'Standard',
    image: c.image_url || coverImage,
  }));
  
  const variants = colors.map((c, idx) => ({
    code: c.sku || `${baseSku}-${idx + 1}`,
    color: c.color || '',
    image: c.image_url || coverImage,
    prices: {
      mrp: sp.wholesale_price || null,
      b2r: null,
      single: null,
      cod: null,
      offer: null,
    },
  }));
  
  return {
    id: baseSku,
    groupKey: baseSku,
    categoryCode: sp.category_code || baseSku[0] || '1',
    vendorCode: sp.seller_code,
    designCode: sp.design_code,
    category: sp.category || 'Saree',
    partner: sp.seller_name || `Vendor ${sp.seller_code}`,
    fabric: sp.fabric,
    fabricTop: sp.fabric_top,
    fabricBottom: sp.fabric_bottom,
    fabricDupatta: sp.fabric_dupatta,
    work: sp.work,
    pattern: sp.pattern,
    weave: sp.weave,
    purity: sp.purity,
    type: sp.type,
    title: sp.title || `${sp.fabric} ${sp.work} ${sp.category}`,
    images: images.length ? images : (coverImage ? [coverImage] : []),
    cover: coverImage,
    variants,
    colorOptions,
    totalColors: colorOptions.length,
    status: 'Ready Stock',
    statusTags: [{ key: 'ready-stock', label: 'Ready Stock' }],
    isReadyStock: true,
    isOutOfStock: false,
    isArchived: false,
    raw: {
      ...sp,
      VID: sp.seller_code,
      B2B: sp.wholesale_price,
    },
  };
}

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
    };

    if (type === 'all') {
      const [{ data, error }, { data: stockData }, { data: approvedSellerProds }] = await Promise.all([
        supabase
          .from('sheet_data')
          .select('id, csv_data')
          .in('id', ['products_json', 'config_json', 'hero_json']),
        supabase
          .from('vendor_product_stock')
          .select('*'),
        supabase
          .from('seller_products')
          .select('*')
          .eq('status', 'approved'),
      ]);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const result = {
        products: [],
        config: { priceRanges: [], categories: [], fabrics: [], weaves: [], occasions: [] },
        hero: [],
      };

      (data || []).forEach((row) => {
        try {
          if (row.id === 'products_json' && row.csv_data) {
            const rawProds = JSON.parse(row.csv_data);
            result.products = Array.isArray(stockData) && stockData.length > 0
              ? applyStockOverrides(rawProds, stockData)
              : rawProds;
          }
          if (row.id === 'config_json' && row.csv_data) result.config = JSON.parse(row.csv_data);
          if (row.id === 'hero_json' && row.csv_data) result.hero = JSON.parse(row.csv_data);
        } catch (e) {
          console.warn(`[Catalog API] JSON parse error on ${row.id}:`, e.message);
        }
      });

      if (Array.isArray(approvedSellerProds) && approvedSellerProds.length > 0) {
        const approvedMapped = approvedSellerProds.map(transformSellerProductToCatalog).filter(Boolean);
        result.products = [...approvedMapped, ...result.products];
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: cdnCacheHeaders,
      });
    }

    if (type === 'products') {
      const [{ data, error }, { data: stockData }, { data: approvedSellerProds }] = await Promise.all([
        supabase
          .from('sheet_data')
          .select('csv_data')
          .eq('id', 'products_json')
          .single(),
        supabase
          .from('vendor_product_stock')
          .select('*'),
        supabase
          .from('seller_products')
          .select('*')
          .eq('status', 'approved'),
      ]);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      let products = [];
      try {
        products = JSON.parse(data?.csv_data || '[]');
      } catch (e) {
        products = [];
      }

      if (Array.isArray(stockData) && stockData.length > 0) {
        products = applyStockOverrides(products, stockData);
      }

      if (Array.isArray(approvedSellerProds) && approvedSellerProds.length > 0) {
        const approvedMapped = approvedSellerProds.map(transformSellerProductToCatalog).filter(Boolean);
        products = [...approvedMapped, ...products];
      }

      return new Response(JSON.stringify(products), {
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

    const rawJson = data?.csv_data || (type === 'hero' ? '[]' : '{}');

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
