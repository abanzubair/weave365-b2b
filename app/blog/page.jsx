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

export function generateMetadata() {
  const defaultMeta = {
    title: 'Wholesale Banarasi Saree Sourcing & Reselling Blog | Weave 365',
    description: 'Expert business guides, boutique scaling strategies, saree reselling tips, and fabric guides for wholesale Banarasi sarees and suits direct from Varanasi weavers.',
    alternates: { canonical: 'https://www.weave365.com/blog' },
    openGraph: {
      title: 'Wholesale Banarasi Saree Sourcing & Reselling Blog | Weave 365',
      description: 'Expert business guides, boutique scaling strategies, saree reselling tips, and fabric guides for wholesale Banarasi sarees and suits direct from Varanasi weavers.',
      type: 'website',
      url: 'https://www.weave365.com/blog',
      siteName: 'Weave 365',
      images: [{ url: 'https://assets.weave365.com/assets/banner/favicon.svg', alt: 'Weave 365' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Wholesale Banarasi Saree Sourcing & Reselling Blog | Weave 365',
      description: 'Expert business guides, boutique scaling strategies, saree reselling tips, and fabric guides for wholesale Banarasi sarees and suits direct from Varanasi weavers.',
      images: ['https://assets.weave365.com/assets/banner/favicon.svg'],
    },
  };

  return getSeoMetadata('/blog', defaultMeta);
}

export default async function BlogListPage() {
  const initialData = await getInitialData();
  return <App initialData={initialData} />;
}
