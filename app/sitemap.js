
import { fetchProducts, fetchSupabaseBlogPosts } from '../src/productData.js';
import { getProductCategorySlug } from '../src/config.js';
import { seoLandingPages } from '../src/data/seoLandingPages.js';
import { blogPosts } from '../src/data/blogPosts.js';

export const runtime = 'edge';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.com';

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
      url: `${siteUrl}/wholesale-catalogue`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/new-arrivals`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/wholesale-partner-program`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/sourcing-partners`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/white-label-brands`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/weaver-onboarding`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/weaver-registration`,
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
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Blog category pages
    {
      url: `${siteUrl}/blog/category/wholesale-guides`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${siteUrl}/blog/category/reseller-business`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${siteUrl}/blog/category/banarasi-insights`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${siteUrl}/blog/category/business-growth`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
  ];

  // Dynamic landing pages from SEO repository
  const seoLandingSitemaps = Object.keys(seoLandingPages).map((slug) => ({
    url: `${siteUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // Dynamic pages from product data
  let productPages = [];
  let partnerPages = [];

  try {
    const products = await fetchProducts();
    if (products && Array.isArray(products)) {
      const activeProducts = products.filter((p) => !p.isArchived);

      // Product detail pages
      productPages = activeProducts.map((product) => ({
        url: `${siteUrl}/${getProductCategorySlug(product.id, product.category)}/${encodeURIComponent(product.id)}`,
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
    }
  } catch (error) {
    console.warn('Sitemap: Failed to fetch products (falling back to static pages):', error.message || error);
  }

  // Dynamic blog post pages
  let blogPostPages = [];
  let dynamicCategoryPages = [];
  try {
    let dbPosts = [];
    try {
      dbPosts = await fetchSupabaseBlogPosts();
    } catch (dbError) {
      console.warn('Sitemap: Failed to fetch Supabase blog posts:', dbError.message || dbError);
    }
    const slugMap = new Map();
    const categorySet = new Set();
    const slugifyCategory = (cat) => cat.toLowerCase().trim().replace(/\s+/g, '-');

    // 1. Add hardcoded blog posts
    blogPosts.forEach((post) => {
      let parsedDate = new Date(post.date);
      if (isNaN(parsedDate.getTime())) parsedDate = new Date();
      slugMap.set(post.slug, { slug: post.slug, date: parsedDate });
      if (post.category) categorySet.add(post.category);
    });

    // 2. Add Supabase blog posts
    if (dbPosts && Array.isArray(dbPosts)) {
      dbPosts.forEach((post) => {
        let parsedDate = post.createdAt
          ? new Date(post.createdAt)
          : post.date
          ? new Date(post.date)
          : new Date();
        if (isNaN(parsedDate.getTime())) parsedDate = new Date();
        slugMap.set(post.slug, { slug: post.slug, date: parsedDate });
        if (post.category) categorySet.add(post.category);
      });
    }

    blogPostPages = Array.from(slugMap.values()).map((post) => ({
      url: `${siteUrl}/blog/${encodeURIComponent(post.slug)}`,
      lastModified: post.date,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Dynamic category pages (any categories not already in static list)
    const staticCatSlugs = new Set([
      'wholesale-guides',
      'reseller-business',
      'banarasi-insights',
      'business-growth',
    ]);
    dynamicCategoryPages = Array.from(categorySet).reduce((acc, cat) => {
      const slug = slugifyCategory(cat);
      if (!staticCatSlugs.has(slug)) {
        acc.push({
          url: `${siteUrl}/blog/category/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
      return acc;
    }, []);
  } catch (error) {
    console.warn('Sitemap: Failed to fetch blog posts for sitemap:', error.message || error);
  }

  return [
    ...staticPages,
    ...seoLandingSitemaps,
    ...productPages,
    ...partnerPages,
    ...blogPostPages,
    ...dynamicCategoryPages,
  ];
}
