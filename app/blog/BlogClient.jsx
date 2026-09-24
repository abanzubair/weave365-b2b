'use client';

import { useEffect } from 'react';
import { BlogList } from '../../src/views/BlogList.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function BlogClient({ initialBlogs = [] }) {
  const navigate = useAppNavigate();
  const { blogs, setBlogs } = useStorefront();

  useEffect(() => {
    if (initialBlogs.length > blogs.length) {
      setBlogs(initialBlogs);
    } else if (blogs.length === 0) {
      import('../../src/productData.js')
        .then((m) => m.fetchSupabaseBlogPosts())
        .then(setBlogs)
        .catch(console.error);
    }
  }, [initialBlogs, blogs.length, setBlogs]);

  const activeBlogs = initialBlogs.length >= blogs.length ? initialBlogs : blogs;

  return <BlogList navigate={navigate} blogs={activeBlogs} />;
}

