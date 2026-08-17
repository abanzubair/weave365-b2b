'use client';

import { Admin } from '../../src/views/Admin.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function AdminClient() {
  const navigate = useAppNavigate();
  const {
    user,
    buyerProfile,
    setBuyerProfile,
    setAuthOpen,
    setAuthInitialMode,
    blogs,
    setBlogs,
    products,
    landingPages,
    setLandingPages,
  } = useStorefront();

  return (
    <Admin
      user={user}
      buyerProfile={buyerProfile}
      onProfileChange={setBuyerProfile}
      openAuth={() => {
        setAuthInitialMode('login');
        setAuthOpen(true);
      }}
      blogs={blogs}
      setBlogs={setBlogs}
      products={products}
      landingPages={landingPages}
      setLandingPages={setLandingPages}
      navigate={navigate}
    />
  );
}
