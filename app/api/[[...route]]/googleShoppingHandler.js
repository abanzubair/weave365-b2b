import { fetchProducts } from '../../../src/productData.js';
import { getProductCategorySlug, storeConfig, siteUrl } from '../../../src/config.js';

export const runtime = 'edge';
export const revalidate = 21600; // Cache for 6 hours (6 * 3600 seconds)

function escapeXml(unsafe) {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isCoverVariantCode(code = '') {
  return /-0$/i.test(String(code || '').trim());
}

function getImagesForVariant(product, variant, hasSubVariants) {
  const images = [];
  if (variant.image) {
    images.push(variant.image);
  }

  const vColor = String(variant.color || '').trim().toLowerCase();
  const vCode = String(variant.code || '').trim().toLowerCase();

  // Find other variant main images to avoid cross-assigning them
  const otherVariantImages = (product.variants || [])
    .filter(v => v.code !== variant.code)
    .map(v => v.image)
    .filter(Boolean);

  // Compile other color names to ensure we don't match them
  const otherColors = (product.variants || [])
    .filter(v => v.code !== variant.code && v.color && v.color !== variant.color)
    .map(v => v.color.trim().toLowerCase())
    .filter(Boolean);

  const codeRegex = new RegExp(vCode.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '([^0-9]|$)', 'i');

  const allImages = product.images || [];

  for (const img of allImages) {
    if (img === variant.image) continue;

    // Skip if it's the main image of another variant
    if (otherVariantImages.includes(img)) continue;

    let isMatch = false;

    // 1. Match by variant code
    if (codeRegex.test(img)) {
      isMatch = true;
    }

    // 2. Match by color name (if non-empty)
    if (vColor && img.toLowerCase().includes(vColor)) {
      const matchesOtherColor = otherColors.some(other => img.toLowerCase().includes(other));
      if (!matchesOtherColor) {
        isMatch = true;
      }
    }

    if (isMatch && !images.includes(img)) {
      images.push(img);
    }
  }

  return images;
}

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

let cachedShoppingXml = null;
let shoppingCacheTime = 0;
const SHOPPING_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Builds the complete Google Shopping XML feed RSS string from a list of products.
 */
export function buildGoogleShoppingXml(products, siteUrlOverride = null) {
  if (!products || !Array.isArray(products)) {
    throw new Error('Failed to retrieve products.');
  }

  const effectiveSiteUrl = (siteUrlOverride || siteUrl || 'https://www.weave365.com').replace(/\/$/, '');
  const activeProducts = products.filter((p) => !p.isArchived);

  let itemsXml = '';
  for (const product of activeProducts) {
    const categorySlug = getProductCategorySlug(product.id, product.category);
    const prodUrl = `${effectiveSiteUrl}/${categorySlug}/${product.id}`;

    // Check if product has sub-variants (variant codes containing '-')
    const hasSubVariants = product.variants && product.variants.some(v => v.code && v.code.includes('-'));

    // Determine which variants to export
    let activeVariants = [];
    if (product.variants && product.variants.length > 0) {
      if (hasSubVariants) {
        // Keep only actual color variants, filter out the cover/parent variant
        activeVariants = product.variants.filter(v => v.code && v.code.includes('-') && !isCoverVariantCode(v.code));
      } else {
        activeVariants = product.variants;
      }
    }

    // Fallback if no variants are present
    if (activeVariants.length === 0) {
      activeVariants = [{
        code: product.id,
        color: product.colorOptions?.[0]?.name || 'multicolor',
        image: product.images?.[0] || 'https://assets.weave365.com/assets/banner/favicon.svg',
        prices: {}
      }];
    }

    const brandName = storeConfig?.name || 'Weave 365';
    const size = String(product.category || '').toLowerCase() === 'saree' ? '6.3m' : 'one size';
    const weight = Number(product.weight) || 0.8;
    const availability = product.isOutOfStock ? 'out_of_stock' : 'in_stock';

    const googleCategory = String(product.category || '').toLowerCase() === 'saree'
      ? 'Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing > Sarees'
      : 'Apparel & Accessories > Clothing';

    for (const variant of activeVariants) {
      const displayPrice = variant.prices?.single || variant.prices?.mrp || 2500;
      const color = variant.color || 'multicolor';

      // Construct a variant-specific URL linking back to the landing page with the selected color parameter
      const variantUrl = variant.color 
        ? `${prodUrl}?color=${encodeURIComponent(variant.color.toLowerCase())}` 
        : prodUrl;

      // Enhance title to include the variant color name if not already present
      let title = product.title || product.metaTitle || 'Premium Banarasi Collection';
      if (variant.color && !title.toLowerCase().includes(variant.color.toLowerCase())) {
        title = `${title} - ${variant.color}`;
      }

      // Map variant images (first is main image, subsequent are additional images)
      const variantImages = getImagesForVariant(product, variant, hasSubVariants);
      const mainImage = variantImages[0] || 'https://assets.weave365.com/assets/banner/favicon.svg';
      const additionalImages = variantImages.slice(1, 11); // Max 10 additional images per Google Merchant specs

      let additionalImageXml = '';
      for (const img of additionalImages) {
        additionalImageXml += `\n      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`;
      }

      // Include item_group_id if the product has multiple color variants
      const itemGroupIdXml = (activeVariants.length > 1 || (product.variants && product.variants.length > 1))
        ? `\n      <g:item_group_id>${escapeXml(product.id)}</g:item_group_id>`
        : '';

      itemsXml += `
    <item>
      <g:id>${escapeXml(variant.code)}</g:id>${itemGroupIdXml}
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(product.summary || product.description || `Premium handwoven Banarasi collection in ${product.fabric || 'pure silk'}.`)}</g:description>
      <g:link>${escapeXml(variantUrl)}</g:link>
      <g:image_link>${escapeXml(mainImage)}</g:image_link>${additionalImageXml}
      <g:availability>${escapeXml(availability)}</g:availability>
      <g:price>${displayPrice} INR</g:price>
      <g:brand>${escapeXml(brandName)}</g:brand>
      <g:condition>new</g:condition>
      <g:age_group>adult</g:age_group>
      <g:gender>female</g:gender>
      <g:color>${escapeXml(color)}</g:color>
      <g:size>${escapeXml(size)}</g:size>
      <g:shipping_weight>${weight} kg</g:shipping_weight>
      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
    </item>`;
    }
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(storeConfig?.name || 'Weave 365')} Wholesale Catalogue</title>
    <link>${escapeXml(effectiveSiteUrl)}</link>
    <description>Premium Banarasi sarees and suits direct from Varanasi weavers.</description>${itemsXml}
  </channel>
</rss>`;
}

/**
 * Pre-generate Google Shopping XML and save into Supabase sheet_data table.
 * Used during catalog sync to offload generation completely from edge requests.
 */
export async function pregenerateAndSaveGoogleShopping(supabaseOverride = null, customSiteUrl = null) {
  try {
    const supabase = supabaseOverride || await getSupabase();
    if (!supabase) {
      console.warn('[pregenerateAndSaveGoogleShopping] Supabase client not available.');
      return null;
    }
    const products = await fetchProducts();
    if (!products || !Array.isArray(products)) {
      throw new Error('Failed to retrieve products for Google Shopping XML.');
    }
    const siteUrlToUse = (customSiteUrl || process.env.NEXT_PUBLIC_SITE_URL || siteUrl || 'https://www.weave365.com').replace(/\/$/, '');
    const xml = buildGoogleShoppingXml(products, siteUrlToUse);
    if (xml) {
      const { error } = await supabase.from('sheet_data').upsert({
        id: 'google_shopping_xml',
        csv_data: xml,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        throw error;
      }
      cachedShoppingXml = xml;
      shoppingCacheTime = Date.now();
      console.log('✅ Successfully pre-generated and stored google_shopping_xml in Supabase sheet_data.');
      return xml;
    }
  } catch (err) {
    console.error('[pregenerateAndSaveGoogleShopping] Failed to pre-generate Google Shopping XML:', err.message);
    throw err;
  }
  return null;
}

export async function GET(request) {
  try {
    const shoppingResponseHeaders = {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'max-age=86400',
      'Cloudflare-CDN-Cache-Control': 'max-age=86400',
    };

    // 1. In-memory cache check (returns in < 0.05ms CPU)
    if (cachedShoppingXml && (Date.now() - shoppingCacheTime < SHOPPING_TTL_MS)) {
      return new Response(cachedShoppingXml, {
        status: 200,
        headers: shoppingResponseHeaders,
      });
    }

    // 2. Cloudflare Edge Cache check (shared across isolates)
    const cache = typeof caches !== 'undefined' && caches?.default ? caches.default : null;
    const cacheUrl = request?.url || `${siteUrl}/api/feed/google-shopping`;
    const cacheKey = new Request(cacheUrl, { method: 'GET' });

    if (cache) {
      try {
        const match = await cache.match(cacheKey);
        if (match) {
          return match;
        }
      } catch (e) {
        // Ignore cache match error
      }
    }

    // 3. Fast Database Read of Pre-generated Feed (< 0.5ms CPU)
    const supabase = await getSupabase();
    if (supabase) {
      try {
        const { data: sheetRow } = await supabase
          .from('sheet_data')
          .select('csv_data')
          .eq('id', 'google_shopping_xml')
          .maybeSingle();

        if (sheetRow?.csv_data) {
          cachedShoppingXml = sheetRow.csv_data;
          shoppingCacheTime = Date.now();
          const response = new Response(sheetRow.csv_data, {
            status: 200,
            headers: shoppingResponseHeaders,
          });
          if (cache) {
            try { await cache.put(cacheKey, response.clone()); } catch {}
          }
          return response;
        }
      } catch (dbErr) {
        console.warn('[Google Shopping] Failed to read pre-generated feed from sheet_data:', dbErr.message);
      }
    }

    // 4. Cold Fallback: If google_shopping_xml is not yet pre-generated in sheet_data, build it once and store it
    console.log('[Google Shopping] Generating XML feed on edge (cold fallback)...');
    const products = await fetchProducts();
    if (!products || !Array.isArray(products)) {
      throw new Error('Failed to retrieve products.');
    }

    const hostHeader = request?.headers?.get('host') || 'www.weave365.com';
    const host = hostHeader === 'weave365.com' ? 'www.weave365.com' : hostHeader;
    const requestSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${host}`;

    const feedXml = buildGoogleShoppingXml(products, requestSiteUrl);

    cachedShoppingXml = feedXml;
    shoppingCacheTime = Date.now();

    const response = new Response(feedXml, {
      status: 200,
      headers: shoppingResponseHeaders,
    });

    if (cache) {
      try {
        await cache.put(cacheKey, response.clone());
      } catch (e) {
        // Ignore cache put error
      }
    }

    // Asynchronously persist to sheet_data for all future requests without blocking response
    if (supabase) {
      supabase.from('sheet_data').upsert({
        id: 'google_shopping_xml',
        csv_data: feedXml,
        updated_at: new Date().toISOString(),
      }).then(() => {
        console.log('✅ Saved cold-fallback google_shopping_xml to sheet_data');
      }).catch((e) => {
        console.warn('[Google Shopping] Failed to persist cold fallback to sheet_data:', e.message);
      });
    }

    return response;

  } catch (err) {
    console.error('Error generating Google Shopping XML feed:', err);
    return new Response(
      `<?xml version="1.0" encoding="utf-8"?>\n<error><message>${escapeXml(err.message || 'Server error generating feed')}</message></error>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
        },
      }
    );
  }
}
