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
    sharedSlug: route === 's' ? decodeURIComponent(value) : '',
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
      description: 'Browse the live Weave365 wholesale Banarasi saree catalogue.',
      alternates: { canonical: '/catalog' },
    };
  }

  if (route === 'product' && product) {
    const image = product.images?.[0];
    const title = product.title || `${storeConfig.name} Product`;
    const description = product.summary || product.description || `View ${title} in the ${storeConfig.name} wholesale catalogue.`;

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
      description: 'Grow your textile business with Weave365 reseller tools and white-label catalogues.',
      alternates: { canonical: '/reseller-growth' },
    };
  }

  if (route === 'vendor-partnership') {
    return {
      title: 'Vendor Partnership',
      description: 'List your products with Weave365 and reach active wholesale saree buyers.',
      alternates: { canonical: '/vendor-partnership' },
    };
  }

  if (route === 's') {
    return {
      title: 'Shared Catalogue',
      description: 'A shared Weave365 reseller catalogue.',
      alternates: { canonical: sharedSlug ? `/s/${encodeURIComponent(sharedSlug)}` : '/s' },
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
