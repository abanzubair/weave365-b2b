import { Suspense } from 'react';
import { siteUrl } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { fetchSupabaseBlogPosts } from '../../src/productData.js';
import BlogClient from './BlogClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Wholesale Banarasi Saree Sourcing & Reselling Blog | Weave 365',
    description:
      'Expert business guides, boutique scaling strategies, saree reselling tips, and fabric guides for wholesale Banarasi sarees and suits direct from Varanasi weavers.',
    alternates: { canonical: `${siteUrl}/blog` },
    openGraph: {
      title: 'Wholesale Banarasi Saree Sourcing & Reselling Blog | Weave 365',
      description:
        'Expert business guides, boutique scaling strategies, saree reselling tips, and fabric guides for wholesale Banarasi sarees and suits direct from Varanasi weavers.',
      url: `${siteUrl}/blog`,
    },
  };
  return getSeoMetadata('/blog', defaultMeta);
}

export default async function BlogPage() {
  const blogs = await fetchSupabaseBlogPosts().catch(() => []);

  return (
    <Suspense fallback={null}>
      <BlogClient initialBlogs={blogs} />
    </Suspense>
  );
}
