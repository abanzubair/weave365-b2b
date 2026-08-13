'use client';

import { useEffect } from 'react';
import { ContactPage } from '../../src/views/ContactPage.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { SiteHeader } from '../../src/components/SiteHeader.jsx';
import { Footer } from '../../src/components/Footer.jsx';
import { AuthModal } from '../../src/components/AuthModal.jsx';
import { CartDrawer } from '../../src/components/CartDrawer.jsx';
import { isSupabaseConfigured, supabase } from '../../src/supabaseClient.js';
import { useRouter } from 'next/navigation';

export default function ContactClient() {
  const router = useRouter();
  const {
    user,
    setUser,
    buyerProfile,
    setBuyerProfile,
    authOpen,
    setAuthOpen,
    cartOpen,
    setCartOpen,
  } = useStorefront();

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

  const navigate = (route) => {
    if (route === 'home') router.push('/');
    else router.push(`/${route}`);
  };

  return (
    <>
      <SiteHeader route="contact" navigate={navigate} />
      <ContactPage navigate={navigate} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} navigate={navigate} />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        user={user}
        setUser={setUser}
        buyerProfile={buyerProfile}
        setBuyerProfile={setBuyerProfile}
      />
      <Footer navigate={navigate} />
    </>
  );
}
