import { fetchProducts } from '../src/productData.js';
import { seoLandingPages } from '../src/data/seoLandingPages.js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.in';

export default async function sitemap() {
  // Static pages
  const staticPages = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/new-arrivals`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/reseller-growth`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/vendor-partnership`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/Trusted-Partner-Registration`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/bulk-inquiry`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic landing pages from SEO repository
  const seoLandingSitemaps = Object.keys(seoLandingPages).map((slug) => ({
    url: `${siteUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  // Dynamic pages from product data
  let productPages = [];
  let partnerPages = [];

  try {
    const products = await fetchProducts();
    const activeProducts = products.filter((p) => !p.isArchived);

    // Product detail pages
    productPages = activeProducts.map((product) => ({
      url: `${siteUrl}/product/${encodeURIComponent(product.id)}`,
      lastModified: product.stockInDate || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Partner collection pages
    const partnerNames = new Set();
    activeProducts.forEach((product) => {
      if (product.partner) partnerNames.add(product.partner);
    });

    partnerPages = Array.from(partnerNames).map((name) => ({
      url: `${siteUrl}/partner/${encodeURIComponent(name.toLowerCase().trim().replace(/\s+/g, '-'))}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Sitemap: Failed to fetch products:', error.message);
  }

  return [...staticPages, ...seoLandingSitemaps, ...productPages, ...partnerPages];
}
