import { Suspense } from 'react';
import { siteUrl } from '../../../../src/config.js';
import { getSeoMetadata } from '../../../../src/utils/seoHelper.js';
import { fetchSupabaseBlogPosts } from '../../../../src/productData.js';
import BlogClient from '../../BlogClient.jsx';

export const revalidate = 3600;
export const runtime = 'edge';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const categorySlug = decodeURIComponent(resolvedParams?.category || '');
  const prettyCategoryName = categorySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const defaultMeta = {
    title: `${prettyCategoryName} Wholesale Saree Sourcing Guides | Weave 365`,
    description: `Explore all expert ${prettyCategoryName} guides and boutique reselling articles direct from Varanasi master weavers on Weave 365.`,
    alternates: { canonical: `${siteUrl}/blog/category/${encodeURIComponent(categorySlug)}` },
    openGraph: {
      title: `${prettyCategoryName} Wholesale Saree Sourcing Guides | Weave 365`,
      description: `Explore all expert ${prettyCategoryName} guides and boutique reselling articles direct from Varanasi master weavers on Weave 365.`,
      url: `${siteUrl}/blog/category/${encodeURIComponent(categorySlug)}`,
    },
  };

  return getSeoMetadata(`/blog/category/${encodeURIComponent(categorySlug)}`, defaultMeta);
}

export default async function BlogCategoryPage() {
  const blogs = await fetchSupabaseBlogPosts().catch(() => []);

  return (
    <Suspense fallback={null}>
      <BlogClient initialBlogs={blogs} />
    </Suspense>
  );
}
