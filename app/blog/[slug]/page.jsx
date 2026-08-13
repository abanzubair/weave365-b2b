import BlogPostClient from './BlogPostClient.jsx';
import { siteUrl } from '../../../src/config.js';
import { blogPosts } from '../../../src/data/blogPosts.js';
import { fetchSupabaseBlogPosts } from '../../../src/productData.js';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';
  const dbPosts = await fetchSupabaseBlogPosts().catch(() => []);
  const post = dbPosts.find((p) => p.slug === slug) || blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return { title: 'Blog Post | Weave 365' };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.summary,
    alternates: { canonical: `${siteUrl}/blog/${encodeURIComponent(slug)}` },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.summary,
      url: `${siteUrl}/blog/${encodeURIComponent(slug)}`,
      images: post.image ? [{ url: post.image }] : [],
    },
  };
}

export const runtime = 'edge';

export default async function BlogPostPage({ params }) {
  const resolvedParams = await params;
  return <BlogPostClient slug={resolvedParams?.slug} />;
}
