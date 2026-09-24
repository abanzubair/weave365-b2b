import { siteUrl } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { fetchSupabaseBlogPosts } from '../../src/productData.js';
import { getOptimizedImageUrl, getImageSrcSet } from '../../src/utils/imageOptimizer.js';
import BlogClient from './BlogClient.jsx';

export const revalidate = 3600;
export const runtime = 'edge';

export function generateMetadata() {
  const title = 'Wholesale Banarasi Saree Sourcing & Reselling Blog | Weave 365';
  const description =
    'Expert business guides, boutique scaling strategies, saree reselling tips, and fabric guides for wholesale Banarasi sarees and suits direct from Varanasi weavers.';
  const canonical = `${siteUrl}/blog`;
  const ogImage = `${siteUrl}/reseller_premium_catalog_display.webp`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Weave 365',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function BlogPage() {
  const blogs = await fetchSupabaseBlogPosts().catch(() => []);

  const trimmedBlogs = (blogs || []).map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    intro: b.intro || '',
    image: b.image || '',
    category: b.category || '',
    date: b.date || '',
    readTime: b.readTime || '',
  }));

  return <BlogClient initialBlogs={trimmedBlogs} />;
}
