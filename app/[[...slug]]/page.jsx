import App from '../../src/App.jsx';
import { storeConfig } from '../../src/config.js';
import { fetchConfigOptions, fetchHeroData, fetchProducts } from '../../src/productData.js';

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

function metadataForRoute(route, product, sharedSlug) {
  if (route === 'catalog') {
    return {
      title: 'Wholesale Catalogue',
      description: 'Browse the live Weave 365 wholesale Banarasi saree catalogue.',
      alternates: { canonical: '/catalog' },
    };
  }

  if (route === 'product' && product) {
    const image = product.images?.[0];
    const title = product.metaTitle || product.title || `${storeConfig.name} Product`;
    const description = product.metaDescription || product.summary || product.description || `View ${title} in the ${storeConfig.name} wholesale catalogue.`;

    return {
      title,
      description,
      alternates: { canonical: `/product/${encodeURIComponent(product.id)}` },
      openGraph: {
        title,
        description,
        type: 'website',
        url: `/product/${encodeURIComponent(product.id)}`,
        images: image ? [{ url: image, alt: title }] : undefined,
      },
      twitter: {
        card: image ? 'summary_large_image' : 'summary',
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  }

  if (route === 'reseller-growth') {
    return {
      title: 'Reseller Program',
      description: 'Grow your textile business with Weave 365 reseller tools and white-label catalogues.',
      alternates: { canonical: '/reseller-growth' },
    };
  }

  if (route === 'Trusted-Partner-Registration') {
    const imageUrl = `${siteUrl}/artisan_at_loom_premium.png`;
    const titleText = 'Trusted Partner Registration';
    const descText = 'Share your craft, capacity, and product details for manual review by the Weave 365 team.';
    return {
      title: titleText,
      description: descText,
      alternates: { canonical: '/Trusted-Partner-Registration' },
      openGraph: {
        title: 'Trusted Partner Registration | Weave 365',
        description: descText,
        type: 'website',
        url: `${siteUrl}/Trusted-Partner-Registration`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: titleText,
          }
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Trusted Partner Registration | Weave 365',
        description: descText,
        images: [imageUrl],
      },
    };
  }

  if (route === 'vendor-partnership') {
    return {
      title: 'Vendor Partnership',
      description: 'List your products with Weave 365 and reach active wholesale saree buyers.',
      alternates: { canonical: '/vendor-partnership' },
    };
  }

  if (route === 's') {
    return {
      title: 'Shared Catalogue',
      description: 'A shared Weave 365 reseller catalogue.',
      alternates: { canonical: sharedSlug ? `/s/${encodeURIComponent(sharedSlug)}` : '/s' },
    };
  }

  if (route === 'partner') {
    const prettyPartnerName = sharedSlug
      ? sharedSlug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : '';
    return {
      title: `${prettyPartnerName}'s Collection | ${storeConfig.name}`,
      description: `Browse the exclusive saree collection by our trusted partner ${prettyPartnerName} on Weave 365.`,
      alternates: { canonical: sharedSlug ? `/partner/${encodeURIComponent(sharedSlug)}` : '/partner' },
    };
  }

  return {
    title: { absolute: storeConfig.name },
    description: 'Wholesale saree storefront with live product catalogue, saved cart, favourites, and WhatsApp ordering.',
    alternates: { canonical: siteUrl },
  };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { route, productId, sharedSlug } = routeFromSlug(resolvedParams?.slug);
  let product = null;

  if (route === 'product' && productId) {
    const data = await getInitialData();
    product = data.products.find((item) => item.id === productId);
  }

  return metadataForRoute(route, product, sharedSlug);
}

export default async function CatchAllPage() {
  const initialData = await getInitialData();

  return <App initialData={initialData} />;
}
