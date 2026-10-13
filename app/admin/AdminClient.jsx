'use client';

import { useEffect } from 'react';
import { Admin } from '../../src/views/Admin.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';
import { fetchSupabaseBlogPosts, fetchSupabaseLandingPages, fetchProducts } from '../../src/productData.js';

export default function AdminClient() {
  const navigate = useAppNavigate();
  const {
    user,
    setUser,
    buyerProfile,
    setBuyerProfile,
    isProfileHydrated,
    blogs,
    setBlogs,
    products,
    setProducts,
    isCatalogHydrated,
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
    if (!isCatalogHydrated || !products || products.length < 25) {
      fetchProducts()
        .then((all) => {
          if (Array.isArray(all) && all.length > 0 && setProducts) {
            setProducts(all, true);
          }
        })
        .catch((err) => console.error('[AdminClient] Error loading full catalog:', err));
    }
  }, [blogs, landingPages, isCatalogHydrated, products, setBlogs, setLandingPages, setProducts]);

  return (
    <Admin
      user={user}
      setUser={setUser}
      buyerProfile={buyerProfile}
      onProfileChange={setBuyerProfile}
      isProfileHydrated={isProfileHydrated}
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
