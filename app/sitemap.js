import { headers } from 'next/headers';
import { fetchProducts, fetchSupabaseBlogPosts, fetchSupabaseLandingPages, fetchSupabasePageSeoSettings } from '../src/productData.js';
import { getProductCategorySlug } from '../src/config.js';
import { blogPosts } from '../src/data/blogPosts.js';

export const runtime = 'edge';

export default async function sitemap() {
  const headersList = await headers();
  let host = headersList.get('host') || 'www.weave365.com';
  if (host === 'weave365.com') {
    host = 'www.weave365.com';
  }
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${host}`;
  const siteUrl = rawSiteUrl.replace(/\/$/, '');

  // Core static pages and landing routes
  const staticPages = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/catalogue`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/new-arrivals`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },

    // Main B2B & Business Landing Pages
    {
      url: `${siteUrl}/custom-woven`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/resell-sarees-online`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/white-label`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/dropshipping`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/affiliate-program`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/handloom-vs-powerloom-guide`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/sourcing-partners`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${siteUrl}/bulk-inquiry`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${siteUrl}/collaboration`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/weaver-onboarding`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/weaver-registration`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/reviews`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
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
      url: `${siteUrl}/early-access`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },

    // Category SEO Routes
    {
      url: `${siteUrl}/banarasi-sarees`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/banarasi-suits`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/banarasi-lehengas`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/banarasi-dupattas`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/banarasi-fabrics`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/under-999`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },

    // Policy & Legal Pages
    {
      url: `${siteUrl}/shipping-delivery`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/returns-cancellation`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy-security`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms-conditions`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },

    // Blog Index & Static Categories
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
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

  // Dynamic landing pages from Supabase
  let activeLandingPages = [];
  try {
    activeLandingPages = await fetchSupabaseLandingPages();
  } catch (err) {
    console.warn('Sitemap: Failed to fetch Supabase landing pages:', err.message);
  }

  const seoLandingSitemaps = activeLandingPages.map((page) => ({
    url: `${siteUrl}/${page.slug.replace(/^\//, '')}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // Fetch Admin Page SEO Settings from Supabase
  let pageSeoSettings = [];
  try {
    pageSeoSettings = await fetchSupabasePageSeoSettings();
  } catch (err) {
    console.warn('Sitemap: Failed to fetch Supabase page SEO settings:', err.message);
  }

  const pageSeoMap = new Map();
  if (Array.isArray(pageSeoSettings)) {
    pageSeoSettings.forEach((setting) => {
      if (setting && setting.path) {
        pageSeoMap.set(setting.path, setting);
      }
    });
  }

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

  // Combine entries
  const rawEntries = [
    ...staticPages,
    ...seoLandingSitemaps,
    ...productPages,
    ...partnerPages,
    ...blogPostPages,
    ...dynamicCategoryPages,
  ];

  // Dynamic admin SEO custom entries (if admin created a path not in default lists)
  if (Array.isArray(pageSeoSettings)) {
    pageSeoSettings.forEach((setting) => {
      if (setting && setting.path && setting.robotsIndex !== false) {
        const fullUrl = `${siteUrl}${setting.path === '/' ? '' : setting.path}`;
        rawEntries.push({
          url: fullUrl,
          lastModified: setting.updatedAt ? new Date(setting.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    });
  }

  const sitemapMap = new Map();
  rawEntries.forEach((entry) => {
    if (!entry || !entry.url) return;
    
    // Extract path to check admin SEO settings
    let entryPath = '/';
    try {
      const parsed = new URL(entry.url);
      entryPath = parsed.pathname || '/';
    } catch {
      entryPath = entry.url.replace(siteUrl, '') || '/';
    }
    if (entryPath.length > 1 && entryPath.endsWith('/')) {
      entryPath = entryPath.slice(0, -1);
    }

    const adminSeo = pageSeoMap.get(entryPath);

    // If Admin explicitly disabled indexing for this path in Admin Panel, omit from sitemap.xml
    if (adminSeo && adminSeo.robotsIndex === false) {
      return;
    }

    // If Admin configured a custom canonical path, update the URL
    let finalUrl = entry.url;
    if (adminSeo && adminSeo.canonicalPath && adminSeo.canonicalPath !== entryPath) {
      finalUrl = `${siteUrl}${adminSeo.canonicalPath === '/' ? '' : adminSeo.canonicalPath}`;
    }

    if (!sitemapMap.has(finalUrl)) {
      sitemapMap.set(finalUrl, { ...entry, url: finalUrl });
    }
  });

  return Array.from(sitemapMap.values());
}
