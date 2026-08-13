'use client';

import { Admin } from '../../src/views/Admin.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { ErrorBoundary } from '../../src/components/ErrorBoundary.jsx';
import { useRouter } from 'next/navigation';

export default function AdminClient() {
  const router = useRouter();
  const {
    user,
    buyerProfile,
    setBuyerProfile,
    setAuthOpen,
    blogs,
    setBlogs,
    products,
    landingPages,
    setLandingPages,
  } = useStorefront();

  const navigate = (route) => {
    if (route === 'home') router.push('/');
    else router.push(`/${route}`);
  };

  return (
    <ErrorBoundary>
      <Admin
        user={user}
        buyerProfile={buyerProfile}
        onProfileChange={setBuyerProfile}
        openAuth={() => setAuthOpen(true)}
        blogs={blogs}
        setBlogs={setBlogs}
        products={products}
        landingPages={landingPages}
        setLandingPages={setLandingPages}
        navigate={navigate}
      />
    </ErrorBoundary>
  );
}
