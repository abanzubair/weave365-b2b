'use client';

import { useEffect, useMemo } from 'react';
import { BlogPost } from '../../../src/views/BlogPost.jsx';
import { useStorefront } from '../../../src/store/useStorefront.js';
import { useAppNavigate } from '../../../src/hooks/useAppNavigate.js';
import { fetchSupabaseBlogPosts } from '../../../src/productData.js';

export default function BlogPostClient({ slug, initialBlogs = [] }) {
  const navigate = useAppNavigate();
  const { blogs, setBlogs } = useStorefront();

  useEffect(() => {
    if (initialBlogs.length > 0) {
      const initialHasFullContent = initialBlogs.some((p) => p.slug === slug && p.content);
      const storeHasFullContent = blogs.some((p) => p.slug === slug && p.content);
      if (initialHasFullContent && (!storeHasFullContent || initialBlogs.length > blogs.length)) {
        setBlogs(initialBlogs);
      }
    } else if (blogs.length === 0) {
      fetchSupabaseBlogPosts().then(setBlogs).catch(console.error);
    }
  }, [initialBlogs, blogs, slug, setBlogs]);

  const activeBlogs = useMemo(() => {
    const initialHasPost = initialBlogs.some((p) => p.slug === slug && p.content);
    if (initialHasPost) return initialBlogs;
    const storeHasPost = blogs.some((p) => p.slug === slug && p.content);
    if (storeHasPost) return blogs;
    return initialBlogs.length > 0 ? initialBlogs : blogs;
  }, [initialBlogs, blogs, slug]);

  return <BlogPost postSlug={slug} navigate={navigate} blogs={activeBlogs} />;
}

