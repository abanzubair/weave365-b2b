'use client';

import { useEffect } from 'react';
import { Admin } from '../../src/views/Admin.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';
import { fetchSupabaseBlogPosts, fetchSupabaseLandingPages } from '../../src/productData.js';

export default function AdminClient() {
  const navigate = useAppNavigate();
  const {
    user,
    buyerProfile,
    setBuyerProfile,
    blogs,
    setBlogs,
    products,
    landingPages,
    setLandingPages,
  } = useStorefront();

  useEffect(() => {
    if (!blogs || blogs.length === 0) {
      fetchSupabaseBlogPosts()
        .then((posts) => {
          if (Array.isArray(posts) && posts.length > 0 && setBlogs) {
            setBlogs(posts);
          }
        })
        .catch(console.error);
    }
    if (!landingPages || landingPages.length === 0) {
      fetchSupabaseLandingPages()
        .then((pages) => {
          if (Array.isArray(pages) && pages.length > 0 && setLandingPages) {
            setLandingPages(pages);
          }
        })
        .catch(console.error);
    }
  }, [blogs, landingPages, setBlogs, setLandingPages]);

  return (
    <Admin
      user={user}
      buyerProfile={buyerProfile}
      onProfileChange={setBuyerProfile}
      openAuth={() => navigate('signup', null, null, { mode: 'login' })}
      blogs={blogs}
      setBlogs={setBlogs}
      products={products}
      landingPages={landingPages}
      setLandingPages={setLandingPages}
      navigate={navigate}
    />
  );
}
