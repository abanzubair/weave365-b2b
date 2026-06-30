import App from '../../src/App.jsx';
import { fetchConfigOptions, fetchHeroData, fetchProducts, fetchSupabaseBlogPosts, fetchSupabaseLandingPages } from '../../src/productData.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';

export const revalidate = 0; // Admin page shouldn't be cached statically at the edge
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

export function generateMetadata() {
  const defaultMeta = {
    title: 'Admin Portal | Weave 365',
    description: 'Administrative portal for Weave 365. Manage products, blogs, reviews, and vendors.',
    robots: { index: false, follow: false },
  };

  return getSeoMetadata('/admin', defaultMeta);
}

export default async function AdminPage() {
  const initialData = await getInitialData();
  return <App initialData={initialData} />;
}
