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
  const siteUrl = 'https://www.weave365.com';
  const imageUrl = `${siteUrl}/artisan_at_loom_premium.webp`;
  const defaultMeta = {
    title: 'Trusted Weaver Registration | Weave 365',
    description: 'Share your craft, capacity, and product details for manual review by the Weave 365 team. Become a trusted Banarasi saree vendor.',
    alternates: { canonical: `${siteUrl}/weaver-registration` },
    openGraph: {
      title: 'Trusted Weaver Registration | Weave 365',
      description: 'Share your craft, capacity, and product details for manual review by the Weave 365 team. Become a trusted Banarasi saree vendor.',
      type: 'website',
      url: `${siteUrl}/weaver-registration`,
      siteName: 'Weave 365',
      images: [{ url: imageUrl, alt: 'Artisan weaving at loom' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Trusted Weaver Registration | Weave 365',
      description: 'Share your craft, capacity, and product details for manual review by the Weave 365 team. Become a trusted Banarasi saree vendor.',
      images: [imageUrl],
    },
  };

  return getSeoMetadata('/weaver-registration', defaultMeta);
}

export default async function WeaverRegistrationPage() {
  const initialData = await getInitialData();
  return <App initialData={initialData} />;
}
