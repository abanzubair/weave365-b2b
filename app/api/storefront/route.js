/**
 * @file API route for D2C white-label storefronts.
 * Serves D2C-safe storefront configuration, theme color schemes, and filtered
 * product lists, completely removing DB keys and master sheet CSV from client browsers.
 * Also logs customer lead inquiries securely.
 */

import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

export const runtime = 'edge';

// Safe server-side client lazy initialization to prevent next build compilation errors
let supabaseInstance = null;
function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Use service role key if available to bypass RLS, otherwise fallback to public anon key
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      // Mock client returned during next build compilation phase
      return {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: null })
            })
          })
        })
      };
    }
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

const supabase = new Proxy({}, {
  get(target, prop) {
    return getSupabase()[prop];
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const domain = searchParams.get('domain');

    if (!slug && !domain) {
      return new Response(JSON.stringify({ error: 'Missing store query parameter (slug or domain)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let storefront = null;

    // 1. Resolve Storefront Branding & Settings
    if (slug) {
      const { data } = await supabase
        .from('reseller_storefronts')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      storefront = data;
    } else if (domain) {
      // Try exact and normalized custom domain variations matching the requested domain
      const cleanDomain = domain.toLowerCase().trim();
      const { data: stores } = await supabase
        .from('reseller_storefronts')
        .select('*')
        .eq('is_active', true);
      
      if (stores) {
        storefront = stores.find(s => {
          if (!s.custom_domain) return false;
          const sDom = s.custom_domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
          const reqDom = cleanDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
          return sDom === reqDom || sDom.includes(reqDom) || reqDom.includes(sDom);
        });
      }
    }

    if (!storefront) {
      return new Response(JSON.stringify({ error: 'Storefront not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 2. Fetch Active Reseller Shares & Catalog Items
    const { data: shares, error: sharesError } = await supabase
      .from('reseller_shares')
      .select('*, reseller_share_items (*)')
      .eq('reseller_id', storefront.reseller_id)
      .eq('is_active', true);

    if (sharesError) {
      console.error('[storefront API GET] shares fetch error:', sharesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch catalog shares' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const shareItems = (shares || []).flatMap(s => s.reseller_share_items || []);
    const shareItemsMap = new Map();
    for (const item of shareItems) {
      shareItemsMap.set(item.product_group_key, item);
    }

    // 3. Load Master Product CSV
    let csvText = '';
    const { data: sheetData } = await supabase
      .from('sheet_data')
      .select('csv_data')
      .eq('id', 'products')
      .maybeSingle();
    
    if (sheetData && sheetData.csv_data) {
      csvText = sheetData.csv_data;
    } else {
      // Server-side fallback to the public Google Sheet URL
      const fallbackUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRX1gaMx_CdSX-ozTHYarKfGNtsAsBTsvqvLoexBjR5FxEYiWVY3JlZKK6AD4g-KigjwOLOk5JvXDQ-/pub?gid=0&single=true&output=csv';
      const res = await fetch(fallbackUrl);
      csvText = await res.text();
    }

    if (!csvText) {
      return new Response(JSON.stringify({ error: 'Catalog data empty' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 4. Parse CSV & Filter Catalog Products
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    const getRowVal = (row, key) => {
      const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
      return foundKey ? row[foundKey].trim() : '';
    };
    
    const driveImageUrl = (link) => {
      const val = String(link || '').trim();
      if (!val) return '';
      if (val.includes('images.weave365.in') || val.includes('r2.cloudflarestorage.com') || val.includes('supabase.co')) return val;
      const idMatch = val.match(/\/d\/([^/]+)/) || val.match(/[?&]id=([^&]+)/);
      if (!idMatch) return val;
      return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1200`;
    };

    const products = [];
    for (const rawRow of parsed.data) {
      const code = getRowVal(rawRow, 'Code');
      const category = getRowVal(rawRow, 'Category') || 'Saree';
      const fabric = getRowVal(rawRow, 'Fabric');
      
      if (!code && !fabric && !category) continue;
      
      let groupKey = code.replace(/\s+/g, '');
      if (groupKey.includes('-')) {
        groupKey = groupKey.split('-')[0];
      } else if (groupKey.length > 6) {
        groupKey = groupKey.slice(0, 6);
      }
      
      if (!shareItemsMap.has(groupKey)) continue;
      
      const shareItem = shareItemsMap.get(groupKey);
      const imagesRaw = getRowVal(rawRow, 'Product Images') || getRowVal(rawRow, 'Product Link') || getRowVal(rawRow, 'Color') || '';
      const imageUrls = imagesRaw.split('|').map(s => s.trim()).filter(Boolean);
      const coverImage = driveImageUrl(getRowVal(rawRow, 'Cover Image') || getRowVal(rawRow, 'Cover') || imageUrls[0] || '');
      const uniqueImages = Array.from(new Set([coverImage, ...imageUrls.map(driveImageUrl)].filter(Boolean)));
      
      const fabricVal = fabric || 'Pure Silk';
      const weaveVal = getRowVal(rawRow, 'Weave') || 'Handloom';
      const customPrice = Number(shareItem.customer_price);
      
      // Build D2C-safe product details (EXCLUDING COST, SUPPLIER, VID, etc.)
      products.push({
        id: parseInt(groupKey) || 0,
        title: shareItem.custom_title || getRowVal(rawRow, 'Name') || getRowVal(rawRow, 'Product Name') || getRowVal(rawRow, 'Title') || `${fabricVal} ${category}`,
        fabric: fabricVal,
        price: customPrice,
        formattedPrice: `₹${customPrice.toLocaleString('en-IN')}`,
        description: shareItem.custom_description || getRowVal(rawRow, 'Description') || getRowVal(rawRow, 'Summary') || `An exquisite hand-loomed premium ${fabricVal} ${category} celebrating timeless craftsmanship.`,
        tag: getRowVal(rawRow, 'Tag') || getRowVal(rawRow, 'Status') || 'Exclusive',
        image: uniqueImages[0] || 'assets/hero_saree_banner.png',
        images: uniqueImages.length > 0 ? uniqueImages : ['assets/hero_saree_banner.png'],
        origin: getRowVal(rawRow, 'Origin') || (weaveVal.toLowerCase().includes('kanchipuram') ? 'Kanchipuram, Tamil Nadu' : 'Varanasi, Uttar Pradesh'),
        weaveTime: getRowVal(rawRow, 'Weave Time') || getRowVal(rawRow, 'WeaveTime') || '30 Days',
        zariType: getRowVal(rawRow, 'Zari Type') || getRowVal(rawRow, 'ZariType') || getRowVal(rawRow, 'Purity') || 'Tested Zari',
        yarnCount: getRowVal(rawRow, 'Yarn Count') || getRowVal(rawRow, 'YarnCount') || '120/120 Double Warp Mulberry Silk',
        weftDensity: getRowVal(rawRow, 'Weft Density') || getRowVal(rawRow, 'WeftDensity') || '80 threads per inch',
        zariComposition: getRowVal(rawRow, 'Zari Composition') || getRowVal(rawRow, 'ZariComposition') || 'Supplementary metallic yarn threads',
        heritageStory: getRowVal(rawRow, 'Heritage Story') || getRowVal(rawRow, 'HeritageStory') || `Woven by master artisans. The design represents mathematical precision in creating intricate brocade motifs passed down through generations.`
      });
    }

    return new Response(JSON.stringify({ storefront, products }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('[storefront API GET] Server crash:', err);
    return new Response(JSON.stringify({ error: err.message || 'Server encountered an error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    
    // Insert new inquiry lead securely into the database
    const { data, error } = await supabase
      .from('reseller_customer_inquiries')
      .insert({
        reseller_id: payload.reseller_id,
        share_id: payload.share_id || null,
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        items: payload.items || [],
        customer_total: payload.customer_total,
      })
      .select()
      .single();
      
    if (error) {
      console.error('[storefront API POST] Database inquiry insert error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('[storefront API POST] Server crash:', err);
    return new Response(JSON.stringify({ error: err.message || 'Server encountered an error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
