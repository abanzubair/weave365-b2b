import { fetchProducts } from '../../../../src/productData.js';
import { getProductCategorySlug, storeConfig, siteUrl } from '../../../../src/config.js';

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

export async function GET() {
  try {
    const products = await fetchProducts();
    if (!products || !Array.isArray(products)) {
      throw new Error('Failed to retrieve products.');
    }

    const activeProducts = products.filter((p) => !p.isArchived);

    let itemsXml = '';
    for (const product of activeProducts) {
      const categorySlug = getProductCategorySlug(product.id, product.category);
      const prodUrl = `${siteUrl}/${categorySlug}/${product.id}`;
      const imageUrl = product.images?.[0] || 'https://assets.weave365.com/assets/banner/favicon.svg';

      // Resolve guest/crawler price (D2C single price)
      const variant = product.variants?.[0] || { code: product.id, prices: {} };
      const displayPrice = variant.prices?.single || variant.prices?.mrp || 2500;
      
      const availability = product.isOutOfStock ? 'out_of_stock' : 'in_stock';
      const brandName = storeConfig.name || 'Weave 365';
      const color = variant.color || product.colorOptions?.[0]?.name || 'multicolor';
      const size = String(product.category || '').toLowerCase() === 'saree' ? '6.3m' : 'one size';
      const weight = Number(product.weight) || 0.8;
      
      const googleCategory = String(product.category || '').toLowerCase() === 'saree'
        ? 'Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing > Sarees'
        : 'Apparel & Accessories > Clothing';

      itemsXml += `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(product.title)}</g:title>
      <g:description>${escapeXml(product.summary || product.description || `Premium handwoven Banarasi collection in ${product.fabric || 'pure silk'}.`)}</g:description>
      <g:link>${escapeXml(prodUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
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

    const feedXml = `<?xml version="1.0" encoding="utf-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(storeConfig.name)} Wholesale Catalogue</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Premium Banarasi sarees and suits direct from Varanasi weavers.</description>${itemsXml}
  </channel>
</rss>`;

    return new Response(feedXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
      },
    });

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
