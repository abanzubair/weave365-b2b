'use client';

import { useEffect } from 'react';
import { TrustedPartnerRegistrationPage } from '../../src/views/TrustedPartnerRegistrationPage.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { SiteHeader } from '../../src/components/SiteHeader.jsx';
import { Footer } from '../../src/components/Footer.jsx';
import { AuthModal } from '../../src/components/AuthModal.jsx';
import { isSupabaseConfigured, supabase } from '../../src/supabaseClient.js';
import { useRouter } from 'next/navigation';

export default function RegistrationClient() {
  const router = useRouter();
  const {
    user,
    setUser,
    buyerProfile,
    setBuyerProfile,
    authOpen,
    setAuthOpen,
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
      <SiteHeader route="weaver-registration" navigate={navigate} />
      <TrustedPartnerRegistrationPage />
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
