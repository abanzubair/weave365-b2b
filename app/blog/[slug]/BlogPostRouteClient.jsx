'use client';

import { useEffect, useState } from 'react';

import { BlogPost } from '../../../src/views/BlogPost.jsx';
import { useStore } from '../../../src/context/StoreContext.jsx';

export default function BlogPostRouteClient({ slug }) {
  const { navigate } = useStore();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadBlogs() {
      try {
        const { fetchSupabaseBlogPosts } = await import('../../../src/productData.js');
        const nextBlogs = await fetchSupabaseBlogPosts();
        if (isActive) setBlogs(nextBlogs || []);
      } catch (err) {
        console.error('Unable to load blog post data:', err);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    void loadBlogs();
    return () => {
      isActive = false;
    };
  }, []);

  if (loading) {
    return <div className="blog-list-container" style={{ minHeight: '60vh' }} />;
  }

  return <BlogPost postSlug={slug} blogs={blogs} navigate={navigate} />;
}
