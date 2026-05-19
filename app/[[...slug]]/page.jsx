import App from '../../src/App.jsx';
import { storeConfig } from '../../src/config.js';
import { fetchConfigOptions, fetchHeroData, fetchProducts } from '../../src/productData.js';
import { seoLandingPages } from '../../src/data/seoLandingPages.js';
import { blogPosts } from '../../src/data/blogPosts.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const defaultConfigOptions = { priceRanges: [], categories: [], fabrics: [] };
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.in';

function cleanSlug(slug = []) {
  return Array.isArray(slug) ? slug : [];
}

function routeFromSlug(slug = []) {
  const [route = 'home', value = ''] = cleanSlug(slug);
  return {
    route,
    productId: route === 'product' ? decodeURIComponent(value) : '',
    sharedSlug: (route === 's' || route === 'partner') ? decodeURIComponent(value) : '',
    blogPostSlug: route === 'blog' ? decodeURIComponent(value) : '',
  };
}

function toSerializable(value) {
  return JSON.parse(JSON.stringify(value));
}

async function getInitialData() {
  const [productsResult, heroResult, configResult] = await Promise.allSettled([
    fetchProducts(),
    fetchHeroData(),
    fetchConfigOptions(),
  ]);

  const products = productsResult.status === 'fulfilled' ? productsResult.value : [];
  const heroSlides = heroResult.status === 'fulfilled' ? heroResult.value : [];
  const configOptions = configResult.status === 'fulfilled' ? configResult.value : defaultConfigOptions;
  const productError = productsResult.status === 'rejected' ? productsResult.reason : null;

  return toSerializable({
    hydrated: true,
    products,
    heroSlides,
    configOptions,
    status: productError ? 'error' : 'ready',
    error: productError?.message || '',
  });
}

function metadataForRoute(route, product, sharedSlug, blogPostSlug) {
  const buildMeta = (title, description, canonicalPath, imageUrl, extraOg = {}) => {
    const url = `${siteUrl}${canonicalPath === '/' ? '' : canonicalPath}`;
    const defaultImage = `${siteUrl}/logo.png`; // Fallback image if needed
    const finalImageUrl = imageUrl || defaultImage;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        type: extraOg.type || 'website',
        url,
        siteName: storeConfig.name,
        images: [{ url: finalImageUrl, alt: title, width: 1200, height: 630 }],
        ...extraOg,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [finalImageUrl],
      },
    };
  };

  // Dynamic Blog Routing Metadata
  if (route === 'blog') {
    if (blogPostSlug) {
      const post = blogPosts.find((p) => p.slug === blogPostSlug);
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

  if (route === 'catalog') {
    return buildMeta(
      'Wholesale Catalogue | Weave 365',
      'Browse the live Weave 365 wholesale Banarasi saree catalogue. Premium quality sarees for retailers and boutiques.',
      '/catalog'
    );
  }

  if (route === 'product' && product) {
    const image = product.images?.[0];
    const title = product.metaTitle || product.title || `${storeConfig.name} Product`;
    const description = product.metaDescription || product.summary || product.description || `View ${title} in the ${storeConfig.name} wholesale catalogue.`;

    return buildMeta(title, description, `/product/${encodeURIComponent(product.id)}`, image);
  }

  if (route === 'reseller-growth') {
    return buildMeta(
      'Reseller Program | Weave 365',
      'Grow your textile business with Weave 365 reseller tools and white-label catalogues. Join our network of successful saree resellers.',
      '/reseller-growth'
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
      '/new-arrivals'
    );
  }

  if (route === 'Trusted-Partner-Registration') {
    const imageUrl = `${siteUrl}/artisan_at_loom_premium.png`;
    const titleText = 'Trusted Partner Registration | Weave 365';
    const descText = 'Share your craft, capacity, and product details for manual review by the Weave 365 team. Become a trusted Banarasi saree vendor.';
    return buildMeta(titleText, descText, '/Trusted-Partner-Registration', imageUrl);
  }

  if (route === 'vendor-partnership') {
    return buildMeta(
      'Vendor Partnership | Weave 365',
      'List your products with Weave 365 and reach active wholesale saree buyers across India.',
      '/vendor-partnership'
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
      `Browse the exclusive saree collection by our trusted partner ${prettyPartnerName} on Weave 365.`,
      sharedSlug ? `/partner/${encodeURIComponent(sharedSlug)}` : '/partner'
    );
  }

  return {
    alternates: { canonical: siteUrl },
  };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { route, productId, sharedSlug, blogPostSlug } = routeFromSlug(resolvedParams?.slug);
  let product = null;

  if (route === 'product' && productId) {
    const data = await getInitialData();
    product = data.products.find((item) => item.id === productId);
  }

  return metadataForRoute(route, product, sharedSlug, blogPostSlug);
}

export default async function CatchAllPage() {
  const initialData = await getInitialData();

  return <App initialData={initialData} />;
}
