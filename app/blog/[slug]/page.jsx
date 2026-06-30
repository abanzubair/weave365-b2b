import App from '../../../src/App.jsx';
import { fetchConfigOptions, fetchHeroData, fetchProducts, fetchSupabaseBlogPosts, fetchSupabaseLandingPages } from '../../../src/productData.js';
import { blogPosts } from '../../../src/data/blogPosts.js';
import { notFound } from 'next/navigation';
import { getSeoMetadata } from '../../../src/utils/seoHelper.js';

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

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams?.slug || '');
  const initialData = await getInitialData();
  const dbPosts = initialData.dbPosts || [];
  
  const post = dbPosts.find((p) => p.slug === slug) || blogPosts.find((p) => p.slug === slug);
  if (!post) {
    return {};
  }

  const url = `https://www.weave365.com/blog/${encodeURIComponent(slug)}`;
  let imageUrl = post.image || "https://assets.weave365.com/assets/banner/favicon.svg";
  if (imageUrl.startsWith('/')) {
    imageUrl = `https://www.weave365.com${imageUrl}`;
  }

  const defaultMeta = {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.summary,
    alternates: { canonical: url },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.summary,
      type: 'article',
      url,
      siteName: 'Weave 365',
      images: [{ url: imageUrl, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.summary,
      images: [imageUrl],
    },
  };

  return getSeoMetadata(`/blog/${slug}`, defaultMeta);
}

export default async function BlogPostPage({ params }) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams?.slug || '');
  const initialData = await getInitialData();
  
  const dbPosts = initialData.dbPosts || [];
  const postExists = dbPosts.some((p) => p.slug === slug) || blogPosts.some((p) => p.slug === slug);
  if (!postExists) {
    notFound();
  }

  return <App initialData={initialData} />;
}
