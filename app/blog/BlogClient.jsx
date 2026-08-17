'use client';

import { useEffect } from 'react';
import { BlogList } from '../../src/views/BlogList.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';
import { fetchSupabaseBlogPosts } from '../../src/productData.js';

export default function BlogClient({ initialBlogs = [] }) {
  const navigate = useAppNavigate();
  const { blogs, setBlogs } = useStorefront();

  useEffect(() => {
    if (initialBlogs.length > 0 && blogs.length === 0) {
      setBlogs(initialBlogs);
    } else if (blogs.length === 0) {
      fetchSupabaseBlogPosts().then(setBlogs).catch(console.error);
    }
  }, [initialBlogs, blogs.length, setBlogs]);

  const activeBlogs = blogs.length > 0 ? blogs : initialBlogs;

  return <BlogList navigate={navigate} blogs={activeBlogs} />;
}
