/**
 * @file API route for D2C white-label storefronts.
 * Serves D2C-safe storefront configuration, theme color schemes, and filtered
 * product lists, completely removing DB keys and master sheet CSV from client browsers.
 * Also logs customer lead inquiries securely.
 */

export const runtime = 'edge';

// Safe server-side client lazy initialization to prevent next build compilation errors
let supabaseInstance = null;
async function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Use service role key if available to bypass RLS, otherwise fallback to public anon key
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      return null;
    }
    const { createClient } = await import('@supabase/supabase-js');
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

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

const getRowVal = (row, key) => {
  const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
  return foundKey ? row[foundKey].trim() : '';
};

const driveImageUrl = (link) => {
  const val = String(link || '').trim();
  if (!val) return '';
  if (val.includes('weave365.in') || val.includes('weave365.com') || val.includes('r2.cloudflarestorage.com') || val.includes('supabase.co')) return val;
  const idMatch = val.match(/\/d\/([^/]+)/) || val.match(/[?&]id=([^&]+)/);
  if (!idMatch) return val;
  return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1200`;
};

// Lazy secondary database client for tenant data
let storefrontDbInstance = null;
async function getStorefrontDb() {
  if (!storefrontDbInstance) {
    const url = process.env.NEXT_PUBLIC_STOREFRONT_SUPABASE_URL || 'https://agsldsqeynzydujmijgc.supabase.co';
    const key = process.env.STOREFRONT_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_STOREFRONT_SUPABASE_ANON_KEY;
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js');
      storefrontDbInstance = createClient(url, key, { auth: { persistSession: false } });
    }
  }
  return storefrontDbInstance;
}

export async function GET(request) {
  try {
    const supabase = await getSupabase();
    const sfDb = await getStorefrontDb();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const domain = searchParams.get('domain');
    const resellerId = searchParams.get('reseller_id') || searchParams.get('userId');

    if (!slug && !domain && !resellerId) {
      return new Response(JSON.stringify({ error: 'Missing store query parameter (slug, domain, or reseller_id)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let storefront = null;

    // 1. Resolve Storefront Branding & Settings exclusively from Secondary DB (boutique_tenants)
    if (sfDb) {
      if (resellerId) {
        const { data } = await sfDb
          .from('boutique_tenants')
          .select('*')
          .ilike('about_text', `%${resellerId}%`)
          .eq('is_active', true)
          .maybeSingle();
        storefront = data;
      } else if (slug) {
        const { data } = await sfDb
          .from('boutique_tenants')
          .select('*')
          .eq('slug', slug.toLowerCase().trim())
          .eq('is_active', true)
          .maybeSingle();
        storefront = data;
      } else if (domain) {
        const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
        const { data: stores } = await sfDb
          .from('boutique_tenants')
          .select('*')
          .eq('is_active', true);
        
        if (stores) {
          storefront = stores.find(s => {
            if (!s.custom_domain) return false;
            const sDom = s.custom_domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
            return sDom === cleanDomain || sDom.includes(cleanDomain) || cleanDomain.includes(sDom);
          });
        }
      }
    }

    if (storefront) {
      const parsedResellerId = resellerId || storefront.owner_id || storefront.about_text?.match(/"reseller_id":"([^"]+)"/)?.[1] || null;
      storefront.reseller_id = parsedResellerId;
      storefront.theme_settings = storefront.theme_settings || {
        theme_id: storefront.theme_color || 'vrtx-studio',
        accent_color: storefront.accent_color || '#b58342'
      };
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

    // 3. Load pre-parsed products JSON directly from Supabase
    const { data: sheetRecord } = await supabase
      .from('sheet_data')
      .select('csv_data')
      .eq('id', 'products_json')
      .single();

    if (!sheetRecord || !sheetRecord.csv_data) {
      return new Response(JSON.stringify({ error: 'Catalog data empty. Please run sync first.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let productsList = [];
    try {
      productsList = JSON.parse(sheetRecord.csv_data);
    } catch (e) {
      console.error('[storefront API GET] Failed to parse products_json:', e);
      return new Response(JSON.stringify({ error: 'Catalog data corrupted.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 4. Filter Catalog Products matching reseller shares
    const productsMap = new Map();
    for (const product of productsList) {
      const groupKey = product.groupKey;
      if (!shareItemsMap.has(groupKey)) continue;

      const shareItem = shareItemsMap.get(groupKey);
      const rawRow = product.raw || {};
      
      const getVal = (key) => {
        const foundKey = Object.keys(rawRow).find(k => k.trim().toLowerCase() === key.toLowerCase());
        return foundKey ? rawRow[foundKey].trim() : '';
      };

      const fabricVal = product.fabric || 'Pure Silk';
      const weaveVal = product.weave || 'Handloom';
      const customPrice = Number(shareItem.customer_price);
      
      const uniqueImages = product.images || [];
      const imagesList = uniqueImages.length > 0 ? uniqueImages : ['assets/hero_saree_banner.png'];
      
      const existing = productsMap.get(groupKey);
      if (existing) {
        existing.images = Array.from(new Set([...existing.images, ...imagesList]));
        if ((existing.image === 'assets/hero_saree_banner.png' || !existing.image) && uniqueImages.length > 0) {
          existing.image = uniqueImages[0];
        }
      } else {
        productsMap.set(groupKey, {
          id: parseInt(groupKey) || 0,
          title: shareItem.custom_title || getVal('Name') || getVal('Product Name') || getVal('Title') || `${fabricVal} ${product.category}`,
          fabric: fabricVal,
          fabricTop: getVal('Fabric Top') || getVal('FabricTop') || '',
          fabricBottom: getVal('Fabric Bottom') || getVal('FabricBottom') || '',
          fabricDupatta: getVal('Fabric Dupatta') || getVal('FabricDupatta') || '',
          price: customPrice,
          formattedPrice: `₹${customPrice.toLocaleString('en-IN')}`,
          description: shareItem.custom_description || getVal('Description') || getVal('Summary') || `An exquisite hand-loomed premium ${fabricVal} ${product.category} celebrating timeless craftsmanship.`,
          tag: getVal('Tag') || getVal('Status') || 'Exclusive',
          image: uniqueImages[0] || 'assets/hero_saree_banner.png',
          images: imagesList,
          origin: getVal('Origin') || (weaveVal.toLowerCase().includes('kanchipuram') ? 'Kanchipuram, Tamil Nadu' : 'Varanasi, Uttar Pradesh'),
          weaveTime: getVal('Weave Time') || getVal('WeaveTime') || '30 Days',
          zariType: getVal('Zari Type') || getVal('ZariType') || getVal('Purity') || 'Tested Zari',
          yarnCount: getVal('Yarn Count') || getVal('YarnCount') || '120/120 Double Warp Mulberry Silk',
          weftDensity: getVal('Weft Density') || getVal('WeftDensity') || '80 threads per inch',
          zariComposition: getVal('Zari Composition') || getVal('ZariComposition') || 'Supplementary metallic yarn threads',
          heritageStory: getVal('Heritage Story') || getVal('HeritageStory') || `Woven by master artisans. The design represents mathematical precision in creating intricate brocade motifs passed down through generations.`,
          weave: weaveVal,
          work: getVal('Work') || 'Zari Work'
        });
      }
    }

    const products = Array.from(productsMap.values());

    return new Response(JSON.stringify({ storefront, products }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json', 
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        ...corsHeaders 
      },
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
    const supabase = await getSupabase();
    const payload = await request.json();
    
    // Insert new inquiry lead securely into the database
    const { data, error } = await supabase
      .from('reseller_customer_inquiries')
      .insert({
        reseller_id: payload.reseller_id,
        share_id: payload.share_id || null,
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone || 'N/A',
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
