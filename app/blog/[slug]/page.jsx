import { notFound } from 'next/navigation';
import { siteUrl, storeConfig } from '../../../src/config.js';
import { blogPosts } from '../../../src/data/blogPosts.js';
import { fetchSupabaseBlogPosts } from '../../../src/productData.js';
import { getSeoMetadata } from '../../../src/utils/seoHelper.js';
import BlogPostClient from './BlogPostClient.jsx';

export const revalidate = 3600;
export const runtime = 'edge';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';
  const dbPosts = await fetchSupabaseBlogPosts().catch(() => []);
  const post = dbPosts.find((p) => p.slug === slug) || blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return { title: 'Blog Post | Weave 365' };
  }

  const defaultMeta = {
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

  return getSeoMetadata(`/blog/${encodeURIComponent(slug)}`, defaultMeta);
}

export default async function BlogPostPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';
  const dbPosts = await fetchSupabaseBlogPosts().catch(() => []);
  const allPosts = dbPosts.length > 0 ? dbPosts : blogPosts;
  const post = allPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.summary || post.metaDescription,
    image: post.image ? [post.image] : [],
    datePublished: post.date || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: post.author || storeConfig.name || 'Weave 365',
    },
    publisher: {
      '@type': 'Organization',
      name: storeConfig.name || 'Weave 365',
      url: siteUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema).replace(/</g, '\\u003c'),
        }}
      />
      <BlogPostClient slug={slug} initialBlogs={allPosts} />
    </>
  );
}
