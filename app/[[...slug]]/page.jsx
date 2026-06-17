import App from '../../src/App.jsx';
import { storeConfig } from '../../src/config.js';
import { fetchConfigOptions, fetchHeroData, fetchProducts, fetchSupabaseBlogPosts, fetchSupabasePageSeoSettings } from '../../src/productData.js';
import { seoLandingPages } from '../../src/data/seoLandingPages.js';
import { blogPosts } from '../../src/data/blogPosts.js';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const defaultConfigOptions = { priceRanges: [], categories: [], fabrics: [], weaves: [] };
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.in';

function cleanSlug(slug = []) {
  return Array.isArray(slug) ? slug : [];
}

function routeFromSlug(slug = []) {
  const clean = cleanSlug(slug);
  const route = clean[0] || 'home';
  const isBlogCategory = route === 'blog' && clean[1] === 'category';
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

async function getInitialData() {
  const [productsResult, heroResult, configResult, blogsResult] = await Promise.allSettled([
    fetchProducts(),
    fetchHeroData(),
    fetchConfigOptions(),
    fetchSupabaseBlogPosts(),
  ]);

  const products = productsResult.status === 'fulfilled' ? productsResult.value : [];
  const heroSlides = heroResult.status === 'fulfilled' ? heroResult.value : [];
  const configOptions = configResult.status === 'fulfilled' ? configResult.value : defaultConfigOptions;
  const dbPosts = blogsResult.status === 'fulfilled' ? blogsResult.value : [];
  const productError = productsResult.status === 'rejected' ? productsResult.reason : null;

  return toSerializable({
    hydrated: true,
    products,
    heroSlides,
    configOptions,
    dbPosts,
    status: productError ? 'error' : 'ready',
    error: productError?.message || '',
  });
}

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

function metadataForRoute(route, product, sharedSlug, blogPostSlug, searchParams = {}, dbPosts = [], blogCategorySlug = '', newestProductImage = null, pageSeoSettings = []) {
  const buildMeta = (title, description, canonicalPath, imageUrl, extraOg = {}) => {
    const override = seoOverrideForPath(pageSeoSettings, canonicalPath);
    const finalTitle = override?.metaTitle || title;
    const finalDescription = override?.metaDescription || description;
    const finalCanonicalPath = override?.canonicalPath || canonicalPath;
    const url = `${siteUrl}${finalCanonicalPath === '/' ? '' : finalCanonicalPath}`;
    const defaultImage = `${siteUrl}/logo.webp`; // Fallback image if needed
    let finalImageUrl = override?.imageUrl || imageUrl || defaultImage;

    // Ensure image URL is absolute
    if (finalImageUrl && finalImageUrl.startsWith('/')) {
      finalImageUrl = `${siteUrl}${finalImageUrl}`;
    }

    // Handle image proxying and optimization for metadata:
    if (finalImageUrl && finalImageUrl !== defaultImage) {
      if (finalImageUrl.includes('weave365.in') || finalImageUrl.includes('r2.cloudflarestorage.com')) {
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
      } : undefined,
    };
  };

  // Dynamic Homepage Routing Metadata
  if (route === 'home') {
    return buildMeta(
      'Wholesale Banarasi Sarees Online | B2B Saree Supplier India | Weave 365',
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
        `Explore all expert B2B ${prettyCategoryName} guides and boutique reselling articles direct from Varanasi master weavers on Weave 365.`,
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
  if (seoLandingPages[route]) {
    const pageData = seoLandingPages[route];
    return buildMeta(
      pageData.metaTitle,
      pageData.metaDescription,
      `/${pageData.slug}`
    );
  }

  if (route === 'wholesale-catalogue') {
    const search = searchParams?.search;
    const category = searchParams?.category;
    const fabric = searchParams?.fabric;
    
    let title = 'Wholesale Saree & Suit Catalogue | Weave 365';
    let description = 'Browse our live Banarasi saree and suit wholesale catalogue. Sourced directly from Varanasi weavers for boutiques and retailers.';
    let canonical = '/wholesale-catalogue';
    
    if (search) {
      title = `Wholesale Banarasi Sarees matching "${search}" | Weave 365`;
      description = `Explore wholesale Banarasi sarees matching "${search}" at direct-from-weaver wholesale prices with flexible MOQ for resellers and boutiques.`;
      canonical = `/wholesale-catalogue?search=${encodeURIComponent(search)}`;
    } else if (category && category !== 'all') {
      const prettyCategory = category.charAt(0).toUpperCase() + category.slice(1);
      title = `Wholesale Banarasi ${prettyCategory} Collection | Weave 365`;
      description = `Shop premium wholesale Banarasi ${prettyCategory} direct from Varanasi weavers. High quality, flexible MOQ, and worldwide delivery for resellers.`;
      canonical = `/wholesale-catalogue?category=${encodeURIComponent(category)}`;
    } else if (fabric && fabric !== 'all') {
      const prettyFabric = fabric.charAt(0).toUpperCase() + fabric.slice(1);
      title = `Pure ${prettyFabric} Silk Banarasi Sarees Wholesale | Weave 365`;
      description = `Discover handwoven pure ${prettyFabric} Banarasi sarees at wholesale prices. Certified quality checks and worldwide shipping for boutique owners.`;
      canonical = `/wholesale-catalogue?fabric=${encodeURIComponent(fabric)}`;
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

    return buildMeta(title, description, `/product/${encodeURIComponent(product.id)}`, image);
  }

  if (route === 'contact') {
    return buildMeta(
      'Contact Us | Wholesale Banarasi Sarees Online | Weave 365',
      'Get in touch with Weave 365, India\'s premier B2B Banarasi saree supplier. Premium Banarasi sarees at wholesale prices for retailers, boutiques and resellers across India.',
      '/contact'
    );
  }

  if (route === 'about') {
    return buildMeta(
      'About Weave 365 | Premium B2B Banarasi Saree Wholesaler India',
      'Discover Weave 365, India\'s leading B2B Banarasi saree supplier. Learn about our heritage, meet our 200+ Varanasi artisan network, and explore our 5-step quality verification process.',
      '/about'
    );
  }

  if (route === 'reviews') {
    return buildMeta(
      'Client Sourcing Reviews | B2B Partner Feedback | Weave 365',
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
      'B2B Saree Returns & Cancellation Policies | Weave 365',
      'Verify our transparent B2B wholesale policies. Information on manufacturing defect exchanges, unboxing video requirements, and ready-to-ship cancellations.',
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
      'B2B Terms of Use, Wholesale MOQ & Trader Agreement | Weave 365',
      'Review our commercial wholesale portal terms, minimum order quantity rules (3-saree minimum), payment gateway guidelines, and Varanasi jurisdiction.',
      '/terms-conditions'
    );
  }

  if (route === 'wholesale-partner-program') {
    return buildMeta(
      'Wholesale & Reseller Partner Program | Weave 365',
      'Grow your textile business with Weave 365 reseller tools and white-label catalogues. Join our network of successful saree resellers.',
      '/wholesale-partner-program'
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
      newestProductImage
    );
  }

  if (route === 'sourcing-partners') {
    return buildMeta(
      'Sourcing Partners for Banarasi Sarees & Suits | Weave 365',
      'Become a Banarasi saree and suit sourcing partner with Weave 365. Coordinate weavers, MOQ, wholesale pricing, catalog support, quality checks, stock updates, and dispatch.',
      '/sourcing-partners'
    );
  }

  if (route === 'white-label-brands') {
    return buildMeta(
      'White Label Banarasi Sarees & Suits Brand Program | Weave 365',
      'Launch a white label Banarasi saree and suit brand with Weave 365. Source products, customize labels and packaging, build catalogs, and grow reseller channels.',
      '/white-label-brands'
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

export async function generateMetadata({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { route, productId, sharedSlug, blogPostSlug, blogCategorySlug } = routeFromSlug(resolvedParams?.slug);
  let product = null;
  let dbPosts = [];
  let newestProductImage = null;
  const pageSeoSettings = await fetchSupabasePageSeoSettings();

  if ((route === 'product' && productId) || (route === 'blog' && blogPostSlug) || route === 'new-arrivals') {
    const data = await getInitialData();
    if (productId) {
      product = data.products.find((item) => item.id === productId);
    }
    if (blogPostSlug) {
      dbPosts = data.dbPosts || [];
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
        newestProductImage = filtered[0].images?.[0] || null;
      }
    }
  }

  return metadataForRoute(route, product, sharedSlug, blogPostSlug, resolvedSearchParams, dbPosts, blogCategorySlug, newestProductImage, pageSeoSettings);
}

export default async function CatchAllPage() {
  const initialData = await getInitialData();

  return <App initialData={initialData} />;
}
