import App from '../../src/App.jsx';
import { cache } from 'react';
import { storeConfig, NON_PRODUCT_ROUTES, getProductCategorySlug, seoCategoryRoutes, siteUrl } from '../../src/config.js';
import { fetchConfigOptions, fetchHeroData, fetchProducts, fetchSupabaseBlogPosts, fetchSupabasePageSeoSettings, fetchSupabaseLandingPages } from '../../src/productData.js';
import { seoLandingPages } from '../../src/data/seoLandingPages.js';
import { blogPosts } from '../../src/data/blogPosts.js';
import { notFound } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '../../src/supabaseClient.js';

export const revalidate = 900; // Cache and revalidate at most every 15 minutes
export const runtime = 'edge';

const defaultConfigOptions = { priceRanges: [], categories: [], fabrics: [], weaves: [] };

function cleanSlug(slug = []) {
  return Array.isArray(slug) ? slug : [];
}

function getStaticLandingPagesFallback() {
  return Object.entries(seoLandingPages).map(([slug, page]) => ({
    slug,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    ogTitle: page.ogTitle || page.metaTitle,
    ogDescription: page.ogDescription || page.metaDescription,
    imageUrl: page.imageUrl,
    canonicalPath: page.canonicalPath || ('/' + slug),
    robotsIndex: page.robotsIndex !== false,
    robotsFollow: page.robotsFollow !== false,
    h1: page.h1,
    introTitle: page.introTitle,
    introText: page.introText,
    buyerGuideTitle: page.buyerGuideTitle,
    buyerGuideSections: page.buyerGuideSections || [],
    faqs: page.faqs || [],
    filter: page.filter || {},
    comparisonSections: page.comparisonSections || []
  }));
}

function isRouteStructureValid(slug, landingPages = []) {
  const clean = cleanSlug(slug);
  const rawRoute = clean[0] || 'home';
  const activeLandingPages = landingPages.length > 0 ? landingPages : getStaticLandingPagesFallback();

  // 1. Path too deep
  if (clean.length > 3) {
    return false;
  }

  // 2. Blog category: /blog/category/[category]
  if (clean.length === 3) {
    return rawRoute === 'blog' && clean[1] === 'category' && Boolean(clean[2]);
  }

  // 3. Segment length is 2
  if (clean.length === 2) {
    if (rawRoute === 'blog') {
      return clean[1] !== 'category';
    }
    if (rawRoute === 's' || rawRoute === 'partner' || rawRoute === 'order-tracking') {
      return true;
    }
    // Product route /[category-slug]/[productId]
    const isLandingPage = activeLandingPages.some(p => p.slug === rawRoute);
    const isProductRoute = !NON_PRODUCT_ROUTES.has(rawRoute) && !isLandingPage;
    return isProductRoute;
  }

  // 4. Segment length is 1
  if (clean.length === 1) {
    if (rawRoute === 'product') {
      return false; // /product is not a valid endpoint on its own
    }
    const isLandingPage = activeLandingPages.some(p => p.slug === rawRoute);
    return (
      NON_PRODUCT_ROUTES.has(rawRoute) ||
      Object.keys(seoCategoryRoutes).includes(rawRoute) ||
      isLandingPage ||
      rawRoute === 'favorites' ||
      rawRoute === 'account'
    );
  }

  // Segment length is 0 (home page)
  return true;
}

function routeFromSlug(slug = [], landingPages = []) {
  const clean = cleanSlug(slug);
  const rawRoute = clean[0] || 'home';
  const isBlogCategory = rawRoute === 'blog' && clean[1] === 'category';
  const activeLandingPages = landingPages.length > 0 ? landingPages : getStaticLandingPagesFallback();

  // A route is a product route if it has exactly 2 segments, and rawRoute is not a known non-product route, and it's not a known SEO landing page slug
  const isLandingPage = activeLandingPages.some(p => p.slug === rawRoute);
  const isProductRoute = clean.length === 2 && !NON_PRODUCT_ROUTES.has(rawRoute) && !isLandingPage;
  const route = isProductRoute ? 'product' : rawRoute;

  return {
    route,
    productId: route === 'product' ? decodeURIComponent(clean[1] || '') : '',
    sharedSlug: (route === 's' || route === 'partner') ? decodeURIComponent(clean[1] || '') : '',
    blogPostSlug: route === 'blog' && !isBlogCategory ? decodeURIComponent(clean[1] || '') : '',
    blogCategorySlug: isBlogCategory ? decodeURIComponent(clean[2] || '') : '',
  };
}

function toSerializable(value) {
  return JSON.parse(JSON.stringify(value));
}

const getInitialData = cache(async () => {
  const [productsResult, heroResult, configResult, blogsResult, landingPagesResult] = await Promise.allSettled([
    fetchProducts(),
    fetchHeroData(),
    fetchConfigOptions(),
    fetchSupabaseBlogPosts(),
    fetchSupabaseLandingPages(),
  ]);

  const products = productsResult.status === 'fulfilled' ? productsResult.value : [];
  const heroSlides = heroResult.status === 'fulfilled' ? heroResult.value : [];
  const configOptions = configResult.status === 'fulfilled' ? configResult.value : defaultConfigOptions;
  const dbPosts = blogsResult.status === 'fulfilled' ? blogsResult.value : [];
  
  let landingPages = landingPagesResult.status === 'fulfilled' ? landingPagesResult.value : [];
  if (landingPages.length === 0) {
    landingPages = getStaticLandingPagesFallback();
  }

  const productError = productsResult.status === 'rejected' ? productsResult.reason : null;

  return toSerializable({
    hydrated: true,
    products,
    heroSlides,
    configOptions,
    dbPosts,
    landingPages,
    status: productError ? 'error' : 'ready',
    error: productError?.message || '',
  });
});

function normalizeSeoPath(path) {
  const cleaned = String(path || '/').trim();
  if (!cleaned || cleaned === 'home') return '/';
  const pathOnly = cleaned.split('?')[0];
  const withSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return withSlash.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

function seoOverrideForPath(pageSeoSettings, canonicalPath) {
  const normalized = normalizeSeoPath(canonicalPath);
  return pageSeoSettings.find((setting) => normalizeSeoPath(setting.path) === normalized);
}

function metadataForRoute(route, product, sharedSlug, blogPostSlug, searchParams = {}, dbPosts = [], blogCategorySlug = '', defaultPageImage = null, pageSeoSettings = [], landingPages = []) {
  const buildMeta = (title, description, canonicalPath, imageUrl, extraOg = {}) => {
    const override = seoOverrideForPath(pageSeoSettings, canonicalPath);
    const finalTitle = override?.metaTitle || title;
    const finalDescription = override?.metaDescription || description;
    const finalCanonicalPath = override?.canonicalPath || canonicalPath;
    const url = `${siteUrl}${finalCanonicalPath === '/' ? '' : finalCanonicalPath}`;
    const defaultImage = "https://assets.weave365.com/assets/banner/favicon.svg"; // Fallback image if needed
    let finalImageUrl = override?.imageUrl || imageUrl || defaultPageImage || defaultImage;

    // Ensure image URL is absolute
    if (finalImageUrl && finalImageUrl.startsWith('/')) {
      finalImageUrl = `${siteUrl}${finalImageUrl}`;
    }

    // Handle image proxying and optimization for metadata:
    if (finalImageUrl && finalImageUrl !== defaultImage) {
      if (finalImageUrl.includes('weave365.in') || finalImageUrl.includes('assets.weave365.com') || finalImageUrl.includes('r2.cloudflarestorage.com')) {
        // 🚀 Cloudflare R2 images: serve directly through our native edge-bound API endpoint on our main domain
        // This completely bypasses Cloudflare WAF/Bot Fight Mode for WhatsApp crawler bots with zero egress cost
        finalImageUrl = `${siteUrl}/api/image?url=${encodeURIComponent(finalImageUrl)}`;
      }
    }

    return {
      title: finalTitle,
      description: finalDescription,
      alternates: { canonical: url },
      openGraph: {
        title: override?.ogTitle || finalTitle,
        description: override?.ogDescription || finalDescription,
        type: extraOg.type || 'website',
        url,
        siteName: storeConfig.name,
        images: [{ url: finalImageUrl, alt: finalTitle, width: 1200, height: 630 }],
        ...extraOg,
      },
      twitter: {
        card: 'summary_large_image',
        title: override?.ogTitle || finalTitle,
        description: override?.ogDescription || finalDescription,
        images: [finalImageUrl],
      },
      robots: override ? {
        index: override.robotsIndex !== false,
        follow: override.robotsFollow !== false,
        googleBot: {
          index: override.robotsIndex !== false,
          follow: override.robotsFollow !== false,
        },
      } : extraOg.robots,
    };
  };

  // Dynamic Homepage Routing Metadata
  if (route === 'home') {
    return buildMeta(
      'Wholesale Banarasi Sarees Online | Saree Supplier India | Weave 365',
      'Premium Banarasi sarees at wholesale prices for retailers, boutiques and resellers across India. Explore silk, organza, katan and designer Banarasi collections.',
      '/'
    );
  }

  // Dynamic Blog Routing Metadata
  if (route === 'blog') {
    if (blogCategorySlug) {
      const prettyCategoryName = blogCategorySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return buildMeta(
        `${prettyCategoryName} Wholesale Saree Sourcing Guides | Weave 365`,
        `Explore all expert ${prettyCategoryName} guides and boutique reselling articles direct from Varanasi master weavers on Weave 365.`,
        `/blog/category/${blogCategorySlug}`
      );
    }
    if (blogPostSlug) {
      const post = dbPosts.find((p) => p.slug === blogPostSlug) || blogPosts.find((p) => p.slug === blogPostSlug);
      if (post) {
        return buildMeta(
          post.metaTitle,
          post.metaDescription,
          `/blog/${encodeURIComponent(blogPostSlug)}`,
          post.image
        );
      }
    }
    return buildMeta(
      'Wholesale Banarasi Saree Sourcing & Reselling Blog | Weave 365',
      'Expert business guides, boutique scaling strategies, saree reselling tips, and fabric guides for wholesale Banarasi sarees and suits direct from Varanasi weavers.',
      '/blog'
    );
  }

  // Intercept new custom premium SEO landing pages
  const landingPageData = landingPages.find(p => p.slug === route);
  if (landingPageData) {
    return buildMeta(
      landingPageData.metaTitle,
      landingPageData.metaDescription,
      `/${landingPageData.slug}`,
      landingPageData.imageUrl
    );
  }

  // Dynamic Category Routing Metadata
  const isSeoCategoryRoute = Object.keys(seoCategoryRoutes).includes(route);
  if (isSeoCategoryRoute) {
    const categoryName = seoCategoryRoutes[route];
    const pluralName = categoryName === 'Under 999' ? categoryName : (categoryName.endsWith('s') ? categoryName : `${categoryName}s`);
    return buildMeta(
      `Wholesale Banarasi ${pluralName} Online | Weave 365`,
      `Buy handwoven premium Banarasi ${pluralName.toLowerCase()} at wholesale prices direct from Varanasi weavers. High quality, verified silk collections.`,
      `/${route}`
    );
  }

  if (route === 'wholesale-catalogue' || route === 'catalogue') {
    const search = searchParams?.search;
    const category = searchParams?.category;
    const fabric = searchParams?.fabric;
    
    let title = 'Wholesale Saree & Suit Catalogue | Weave 365';
    let description = 'Browse our live Banarasi saree and suit wholesale catalogue. Sourced directly from Varanasi weavers for boutiques and retailers.';
    let canonical = '/catalogue';
    
    if (search) {
      title = `Wholesale Banarasi Sarees matching "${search}" | Weave 365`;
      description = `Explore wholesale Banarasi sarees matching "${search}" at direct-from-weaver wholesale prices with flexible MOQ for resellers and boutiques.`;
      canonical = `/catalogue?search=${encodeURIComponent(search)}`;
    } else if (category && category !== 'all') {
      const prettyCategory = category.charAt(0).toUpperCase() + category.slice(1);
      title = `Wholesale Banarasi ${prettyCategory} Collection | Weave 365`;
      description = `Shop premium wholesale Banarasi ${prettyCategory} direct from Varanasi weavers. High quality, flexible MOQ, and worldwide delivery for resellers.`;
      canonical = `/catalogue?category=${encodeURIComponent(category)}`;
    } else if (fabric && fabric !== 'all') {
      const prettyFabric = fabric.charAt(0).toUpperCase() + fabric.slice(1);
      title = `Pure ${prettyFabric} Silk Banarasi Sarees Wholesale | Weave 365`;
      description = `Discover handwoven pure ${prettyFabric} Banarasi sarees at wholesale prices. Certified quality checks and worldwide shipping for boutique owners.`;
      canonical = `/catalogue?fabric=${encodeURIComponent(fabric)}`;
    }
    
    return buildMeta(
      title,
      description,
      canonical
    );
  }

  if (route === 'product' && product) {
    const image = product.images?.[0];
    const title = product.metaTitle || product.title || `${storeConfig.name} Product`;
    const description = product.metaDescription || product.summary || product.description || `View ${title} in the ${storeConfig.name} wholesale catalogue.`;
    const catSlug = getProductCategorySlug(product.id, product.category);

    return buildMeta(title, description, `/${catSlug}/${encodeURIComponent(product.id)}`, image);
  }

  if (route === 'admin') {
    return buildMeta(
      'Admin Portal | Weave 365',
      'Administrative portal for Weave 365. Manage products, blogs, reviews, and vendors.',
      '/admin',
      null,
      { robots: { index: false, follow: false } }
    );
  }

  if (route === 'contact') {
    return buildMeta(
      'Contact Us | Wholesale Banarasi Sarees Online | Weave 365',
      'Get in touch with Weave 365, India\'s premier Banarasi saree supplier. Premium Banarasi sarees at wholesale prices for retailers, boutiques and resellers across India.',
      '/contact'
    );
  }

  if (route === 'about') {
    return buildMeta(
      'About Weave 365 | Premium Banarasi Saree Wholesaler India',
      'Discover Weave 365, India\'s leading Banarasi saree supplier. Learn about our heritage, meet our 200+ Varanasi artisan network, and explore our 5-step quality verification process.',
      '/about'
    );
  }

  if (route === 'reviews') {
    return buildMeta(
      'Client Sourcing Reviews | Partner Feedback | Weave 365',
      'Verified reviews and feedback from boutique owners, apparel retailers, and saree resellers across India sourcing from Weave 365.',
      '/reviews'
    );
  }

  if (route === 'early-access') {
    return buildMeta(
      'Request Early Access | Weave 365 Wholesale Banarasi Sarees',
      'Get early access to our wholesale Banarasi saree new arrivals. Verified boutique owners, retailers, and resellers can join our premium updates.',
      '/early-access'
    );
  }

  if (route === 'disclaimer') {
    return buildMeta(
      'Product Disclaimer & Heritage Weave Variations | Weave 365',
      'Understand the handwoven integrity, color calibration, and textile variations of our premium Varanasi silk sarees. Essential reading for wholesale buyers.',
      '/disclaimer'
    );
  }

  if (route === 'shipping-delivery') {
    return buildMeta(
      'Wholesale Saree Shipping & Worldwide Logistics | Weave 365',
      'Direct Varanasi warehouse dispatch, express domestic delivery, international courier timelines (US, UK, UAE), and bulk freight cargo configurations.',
      '/shipping-delivery'
    );
  }

  if (route === 'returns-cancellation') {
    return buildMeta(
      'Wholesale Saree Returns & Cancellation Policies | Weave 365',
      'Verify our transparent wholesale policies. Information on manufacturing defect exchanges, unboxing video requirements, and ready-to-ship cancellations.',
      '/returns-cancellation'
    );
  }

  if (route === 'privacy-security') {
    return buildMeta(
      'Data Privacy, GST Security & Transaction Safety | Weave 365',
      'How we secure your wholesale trade records, verify business profiles, protect GST numbers, and encrypt commercial transactions with top payment gateways.',
      '/privacy-security'
    );
  }

  if (route === 'terms-conditions') {
    return buildMeta(
      'Terms of Use, Wholesale MOQ & Trader Agreement | Weave 365',
      'Review our commercial wholesale portal terms, minimum order quantity rules (3-saree minimum), payment gateway guidelines, and Varanasi jurisdiction.',
      '/terms-conditions'
    );
  }

  if (route === 'partner-program') {
    return buildMeta(
      'Wholesale & Reseller Partner Program | Weave 365',
      'Grow your textile business with Weave 365 reseller tools and white-label catalogues. Join our network of successful saree resellers.',
      '/partner-program'
    );
  }

  if (route === 'affiliate-program') {
    return buildMeta(
      'Affiliate Partner Program | Earn Upto 15% Commission | Weave 365',
      'Join the Weave 365 Affiliate Partner Program. Share Banarasi collections (saree, suit, and more) and earn upto 15% commission on every order.',
      '/affiliate-program'
    );
  }

  if (route === 'bulk-inquiry') {
    return buildMeta(
      'Banarasi Saree Wholesale Bulk Inquiry & Sourcing | Weave 365',
      'Submit a bulk inquiry for premium Banarasi sarees and suits. We curate custom catalogs for boutiques, retailers, and exporters with flexible MOQ.',
      '/bulk-inquiry'
    );
  }

  if (route === 'new-arrivals') {
    return buildMeta(
      'New Arrivals: Latest Wholesale Banarasi Sarees & Suits | Weave 365',
      'Explore our latest collection of handwoven pure silk Banarasi sarees, suits, and fabrics direct from Varanasi weavers. Updated weekly with fresh designs.',
      '/new-arrivals',
      defaultPageImage
    );
  }

  if (route === 'sourcing-partners') {
    return buildMeta(
      'Sourcing Partners for Banarasi Sarees & Suits | Weave 365',
      'Become a Banarasi saree and suit sourcing partner with Weave 365. Coordinate weavers, MOQ, wholesale pricing, catalog support, quality checks, stock updates, and dispatch.',
      '/sourcing-partners'
    );
  }

  if (route === 'white-label') {
    return buildMeta(
      'White Label Banarasi Sarees & Suits Brand Program | Weave 365',
      'Launch a white label Banarasi saree and suit brand with Weave 365. Source products, customize labels and packaging, build catalogs, and grow reseller channels.',
      '/white-label'
    );
  }

  if (route === 'weaver-registration') {
    const imageUrl = `${siteUrl}/artisan_at_loom_premium.webp`;
    const titleText = 'Trusted Weaver Registration | Weave 365';
    const descText = 'Share your craft, capacity, and product details for manual review by the Weave 365 team. Become a trusted Banarasi saree vendor.';
    return buildMeta(titleText, descText, '/weaver-registration', imageUrl);
  }

  if (route === 'weaver-onboarding') {
    return buildMeta(
      'Vendor Partnership | Weave 365',
      'List your products with Weave 365 and reach active wholesale saree buyers across India.',
      '/weaver-onboarding'
    );
  }

  if (route === 's') {
    return buildMeta(
      'Shared Catalogue | Weave 365',
      'A shared Weave 365 reseller catalogue featuring premium wholesale Banarasi sarees.',
      sharedSlug ? `/s/${encodeURIComponent(sharedSlug)}` : '/s'
    );
  }

  if (route === 'partner') {
    const prettyPartnerName = sharedSlug
      ? sharedSlug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : '';
    return buildMeta(
      `${prettyPartnerName}'s Collection | ${storeConfig.name}`,
      `Browse the exclusive saree collection by our weaver partner ${prettyPartnerName} on Weave 365.`,
      sharedSlug ? `/partner/${encodeURIComponent(sharedSlug)}` : '/partner'
    );
  }

  return {
    alternates: { canonical: siteUrl },
  };
}

function getFirstImageOnPage(route, data, searchParams) {
  if (!data) return null;

  // 1. Home page -> First Hero slide image
  if (route === 'home') {
    return data.heroSlides?.[0]?.image || null;
  }

  // 2. Category pages (SEO category routes)
  const isSeoCategoryRoute = Object.keys(seoCategoryRoutes).includes(route);
  if (isSeoCategoryRoute) {
    const categoryName = seoCategoryRoutes[route];
    const firstProduct = data.products?.find(p => p.category === categoryName && !p.isArchived);
    return firstProduct?.images?.[0] || null;
  }

  // 3. Catalogue page
  if (route === 'wholesale-catalogue' || route === 'catalogue') {
    const category = searchParams?.category;
    const fabric = searchParams?.fabric;
    let filtered = data.products?.filter(p => !p.isArchived) || [];
    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }
    if (fabric && fabric !== 'all') {
      filtered = filtered.filter(p => p.fabric?.toLowerCase() === fabric.toLowerCase());
    }
    return filtered[0]?.images?.[0] || data.products?.[0]?.images?.[0] || null;
  }

  // 4. New Arrivals page
  if (route === 'new-arrivals') {
    let filtered = data.products?.filter(p => p.isNew && !p.isArchived) || [];
    if (filtered.length === 0) {
      filtered = data.products?.filter(p => !p.isArchived) || [];
    }
    return filtered[0]?.images?.[0] || null;
  }

  // 5. Generic fallback -> first product image in catalog
  return data.products?.[0]?.images?.[0] || null;
}

export async function generateMetadata({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = resolvedParams?.slug || [];

  const landingPages = await fetchSupabaseLandingPages();
  const activeLandingPages = landingPages.length > 0 ? landingPages : getStaticLandingPagesFallback();

  if (!isRouteStructureValid(slug, activeLandingPages)) {
    notFound();
  }

  const { route, productId, sharedSlug, blogPostSlug, blogCategorySlug } = routeFromSlug(slug, activeLandingPages);
  let product = null;
  let dbPosts = [];
  let defaultPageImage = null;
  const pageSeoSettings = await fetchSupabasePageSeoSettings();

  const isLandingPage = activeLandingPages.some(p => p.slug === route);
  const needsData = [
    'home',
    'product',
    'blog',
    'new-arrivals',
    'wholesale-catalogue',
    'catalogue',
    's',
    'partner'
  ].includes(route) || Object.keys(seoCategoryRoutes).includes(route) || isLandingPage;

  if (needsData) {
    const data = await getInitialData();
    if (productId) {
      product = data.products.find((item) => item.id === productId);
      if (!product || product.isArchived) {
        notFound();
      }
    }
    if (blogPostSlug) {
      dbPosts = data.dbPosts || [];
      const postExists = dbPosts.some((p) => p.slug === blogPostSlug) || 
                         blogPosts.some((p) => p.slug === blogPostSlug);
      if (!postExists) {
        notFound();
      }
    }
    if (route === 'new-arrivals' && data.products) {
      const productsWithIndex = data.products.map((p, idx) => ({ ...p, _originalIndex: idx }));
      let filtered = productsWithIndex.filter(p => p.isNew && !p.isArchived);
      
      // Sort by stockInDate descending; tie-breaker: reverse sheet order (latest first)
      filtered.sort((a, b) => {
        const dateA = a.stockInDate ? new Date(a.stockInDate).getTime() : 0;
        const dateB = b.stockInDate ? new Date(b.stockInDate).getTime() : 0;
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        return b._originalIndex - a._originalIndex;
      });

      if (filtered.length === 0) {
        filtered = [...productsWithIndex]
          .filter(p => !p.isArchived)
          .sort((a, b) => {
            const dateA = a.stockInDate ? new Date(a.stockInDate).getTime() : 0;
            const dateB = b.stockInDate ? new Date(b.stockInDate).getTime() : 0;
            if (dateA !== dateB) {
              return dateB - dateA;
            }
            return b._originalIndex - a._originalIndex;
          })
          .slice(0, 16);
      }

      if (filtered.length > 0) {
        defaultPageImage = filtered[0].images?.[0] || null;
      }
    } else {
      defaultPageImage = getFirstImageOnPage(route, data, resolvedSearchParams);
    }
  }

  return metadataForRoute(route, product, sharedSlug, blogPostSlug, resolvedSearchParams, dbPosts, blogCategorySlug, defaultPageImage, pageSeoSettings, activeLandingPages);
}

function generateProductSchemas(product, activeReviews = []) {
  if (!product) return null;
  
  const categorySlug = getProductCategorySlug(product.id, product.category);
  const prodUrl = `${siteUrl}/${categorySlug}/${product.id}`;
  
  const totalColors = product.totalColors ?? (product.variants?.length > 1 ? product.variants.length : Math.max(1, Math.min(product.images?.length || 0, 4)));
  const variant = product.variants?.[0] || { code: product.id, prices: {} };
  const displayPrice = variant.prices?.single || variant.prices?.mrp || 2500;
  
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title || product.metaTitle,
    "image": product.images || [],
    "description": product.description || `Elegant handwoven Banarasi saree styled in ${product.fabric || 'pure silk'}. Sourced directly from Varanasi.`,
    "sku": product.id || variant.code,
    "mpn": variant.code || product.id,
    "brand": {
      "@type": "Brand",
      "name": storeConfig.name || "Weave 365"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "INR",
      "lowPrice": displayPrice,
      "highPrice": Math.round(displayPrice * 1.5),
      "offerCount": totalColors,
      "availability": "https://schema.org/InStock",
      "url": prodUrl
    }
  };

  if (activeReviews && activeReviews.length > 0) {
    const total = activeReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const count = activeReviews.length;
    const avg = (total / count).toFixed(1);
    
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": avg,
      "reviewCount": count,
      "bestRating": "5",
      "worstRating": "1"
    };

    productSchema.review = activeReviews.map((r) => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": r.reviewer_name || "Verified Buyer"
      },
      "datePublished": r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      "reviewBody": r.comment || "",
      "name": r.title || "Product Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": String(r.rating || 5),
        "bestRating": "5",
        "worstRating": "1"
      }
    }));
  }

  const isUnder999 = String(product.category || '').toLowerCase() === 'under 999';
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the Minimum Order Quantity (MOQ) for wholesale?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": isUnder999
            ? "For retailers and boutique owners, our MOQ starts at just 1 piece. This allows you to test our premium Banarasi collection with minimal upfront capital."
            : "For retailers and boutique owners, our MOQ starts at just 1 set (which typically contains all available color variants of the design). This allows you to test our premium Banarasi collection with minimal upfront capital."
        }
      },
      {
        "@type": "Question",
        "name": "Are these Banarasi sarees authentically sourced?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all Weave 365 sarees and suits are crafted directly in Varanasi by expert weavers. We use premium pure katan silk, organza, and georgette with authentic gold and silver zari work, preserving the heritage weaving tradition."
        }
      },
      {
        "@type": "Question",
        "name": "Do you support resellers, boutiques, and dropshipping?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely! We support boutiques, resellers, and global export partners. Registered resellers get access to our white-labeled marketing toolkit, live catalog links, and dedicated support for direct boutique dispatch."
        }
      },
      {
        "@type": "Question",
        "name": "Is international shipping available for wholesale orders?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we ship globally including USA, UK, Canada, UAE, Europe, and Australia. We handle standard custom declarations and cargo documentation to ensure door-to-door delivery."
        }
      }
    ]
  };

  return { productSchema, faqSchema };
}

export default async function CatchAllPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || [];

  const initialData = await getInitialData();
  const landingPages = initialData.landingPages || [];

  if (!isRouteStructureValid(slug, landingPages)) {
    notFound();
  }

  const { route, productId, blogPostSlug } = routeFromSlug(slug, landingPages);

  let product = null;
  let activeReviews = [];

  if (route === 'product' && productId) {
    product = (initialData.products || []).find((item) => item.id === productId);
    if (!product || product.isArchived) {
      notFound();
    }
    
    // Fetch product reviews on the server for schema generation
    try {
      if (isSupabaseConfigured) {
        const { data, error: dbError } = await supabase
          .from('product_reviews')
          .select('*')
          .eq('product_id', product.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (!dbError && data) {
          activeReviews = data;
        }
      }
    } catch (err) {
      console.warn('[SSR] Failed to fetch product reviews:', err.message);
    }
  }

  if (route === 'blog' && blogPostSlug) {
    const postExists = (initialData.dbPosts || []).some((p) => p.slug === blogPostSlug) || 
                       blogPosts.some((p) => p.slug === blogPostSlug);
    if (!postExists) {
      notFound();
    }
  }

  const schemas = product ? generateProductSchemas(product, activeReviews) : null;

  const landingPageData = landingPages.find(p => p.slug === route);
  let landingPageFaqSchema = null;
  if (landingPageData && landingPageData.faqs && landingPageData.faqs.length > 0) {
    landingPageFaqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": landingPageData.faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    };
  }

  return (
    <>
      {schemas?.productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.productSchema).replace(/</g, '\\u003c') }}
        />
      )}

      {schemas?.faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.faqSchema).replace(/</g, '\\u003c') }}
        />
      )}

      {landingPageFaqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(landingPageFaqSchema).replace(/</g, '\\u003c') }}
        />
      )}
      <App initialData={initialData} />
    </>
  );
}
