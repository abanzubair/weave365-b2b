'use client';

import { useEffect } from 'react';
import { Admin } from '../../src/views/Admin.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { ErrorBoundary } from '../../src/components/ErrorBoundary.jsx';
import { AuthModal } from '../../src/components/AuthModal.jsx';
import { SiteHeader } from '../../src/components/SiteHeader.jsx';
import { Footer } from '../../src/components/Footer.jsx';
import { isSupabaseConfigured, supabase } from '../../src/supabaseClient.js';
import { loadProfileForUser, syncProfileFromUser } from '../../src/utils/profileHelpers.js';
import { fetchProducts, fetchSupabaseBlogPosts } from '../../src/productData.js';
import { useRouter } from 'next/navigation';

export default function AdminClient() {
  const router = useRouter();
  const {
    user,
    setUser,
    buyerProfile,
    setBuyerProfile,
    authOpen,
    setAuthOpen,
    setAuthInitialMode,
    blogs,
    setBlogs,
    products,
    setProducts,
    landingPages,
    setLandingPages,
  } = useStorefront();

  // 1. Hydrate Supabase auth session on mount
  useEffect(() => {
    if (!isSupabaseConfigured) {
      const localUser = localStorage.getItem('sareeva_user');
      if (localUser) {
        const parsedUser = JSON.parse(localUser);
        setUser(parsedUser);
        setBuyerProfile(parsedUser.user_metadata?.buyer_profile || parsedUser.buyer_profile || null);
      }
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user || null;
      setUser(sessionUser);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
    });

    return () => data.subscription.unsubscribe();
  }, [setUser, setBuyerProfile]);

  // 2. Hydrate user profile on user change
  useEffect(() => {
    let isActive = true;
    async function hydrateProfile() {
      if (!user) {
        setBuyerProfile(null);
        return;
      }
      if (isSupabaseConfigured) {
        await syncProfileFromUser(user);
      }
      const { profile } = await loadProfileForUser(user);
      if (isActive) {
        setBuyerProfile(profile);
      }
    }
    void hydrateProfile();
    return () => {
      isActive = false;
    };
  }, [user, setBuyerProfile]);

  // 3. Hydrate admin products, blogs if empty
  useEffect(() => {
    if (products.length === 0) {
      fetchProducts().then(setProducts).catch(console.error);
    }
    if (blogs.length === 0) {
      fetchSupabaseBlogPosts().then(setBlogs).catch(console.error);
    }
  }, [products.length, blogs.length, setProducts, setBlogs]);

  const navigate = (route) => {
    if (route === 'home') router.push('/');
    else router.push(`/${route}`);
  };

  return (
    <ErrorBoundary>
      <SiteHeader route="admin" navigate={navigate} />
      <Admin
        user={user}
        buyerProfile={buyerProfile}
        onProfileChange={setBuyerProfile}
        openAuth={() => { setAuthInitialMode('login'); setAuthOpen(true); }}
        blogs={blogs}
        setBlogs={setBlogs}
        products={products}
        landingPages={landingPages}
        setLandingPages={setLandingPages}
        navigate={navigate}
      />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        user={user}
        setUser={setUser}
        buyerProfile={buyerProfile}
        setBuyerProfile={setBuyerProfile}
      />
      <Footer navigate={navigate} />
    </ErrorBoundary>
  );
}
