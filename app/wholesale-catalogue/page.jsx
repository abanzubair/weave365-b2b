import App from '../../src/App.jsx';
import { fetchConfigOptions, fetchHeroData, fetchProducts, fetchSupabaseBlogPosts, fetchSupabaseLandingPages } from '../../src/productData.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';

export const revalidate = 900;
export const runtime = 'edge';

async function getInitialData() {
  const [productsResult, heroResult, configResult, blogsResult, landingPagesResult] = await Promise.allSettled([
    fetchProducts(),
    fetchHeroData(),
    fetchConfigOptions(),
    fetchSupabaseBlogPosts(),
    fetchSupabaseLandingPages(),
  ]);

  const products = productsResult.status === 'fulfilled' ? productsResult.value : [];
  const heroSlides = heroResult.status === 'fulfilled' ? heroResult.value : [];
  const configOptions = configResult.status === 'fulfilled' ? configResult.value : { priceRanges: [], categories: [], fabrics: [], weaves: [] };
  const dbPosts = blogsResult.status === 'fulfilled' ? blogsResult.value : [];
  const landingPages = landingPagesResult.status === 'fulfilled' ? landingPagesResult.value : [];

  const productError = productsResult.status === 'rejected' ? productsResult.reason : null;

  return JSON.parse(JSON.stringify({
    hydrated: true,
    products,
    heroSlides,
    configOptions,
    dbPosts,
    landingPages,
    status: productError ? 'error' : 'ready',
    error: productError?.message || '',
  }));
}

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.search;
  const category = resolvedSearchParams?.category;
  const fabric = resolvedSearchParams?.fabric;
  
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

  const url = `https://www.weave365.com${canonical}`;
  
  const defaultMeta = {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: 'Weave 365',
      images: [{ url: 'https://assets.weave365.com/assets/banner/favicon.svg', alt: 'Weave 365' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://assets.weave365.com/assets/banner/favicon.svg'],
    },
  };

  return getSeoMetadata('/wholesale-catalogue', defaultMeta);
}

export default async function CataloguePage() {
  const initialData = await getInitialData();
  return <App initialData={initialData} />;
}
