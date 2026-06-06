'use client';

import { useEffect, useState } from 'react';

import { BlogList } from '../../src/views/BlogList.jsx';

export default function BlogListRouteClient() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    let isActive = true;

    async function loadBlogs() {
      try {
        const { fetchSupabaseBlogPosts } = await import('../../src/productData.js');
        const nextBlogs = await fetchSupabaseBlogPosts();
        if (isActive) setBlogs(nextBlogs || []);
      } catch (err) {
        console.error('Unable to load blog posts:', err);
      }
    }

    void loadBlogs();
    return () => {
      isActive = false;
    };
  }, []);

  return <BlogList blogs={blogs} />;
}
