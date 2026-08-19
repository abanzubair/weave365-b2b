'use client';

import { useSearchParams } from 'next/navigation';
import { SignupPage } from '../../src/views/SignupPage.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function SignupClient() {
  const searchParams = useSearchParams();
  const navigate = useAppNavigate();

  const {
    user,
    setUser,
    buyerProfile,
    setBuyerProfile,
  } = useStorefront();

  const initialMode = searchParams?.get('mode') || 'login';
  const initialType = searchParams?.get('type') || null;

  return (
    <SignupPage
      user={user}
      setUser={setUser}
      buyerProfile={buyerProfile}
      setBuyerProfile={setBuyerProfile}
      navigate={navigate}
      initialMode={initialMode}
      initialType={initialType}
    />
  );
}
