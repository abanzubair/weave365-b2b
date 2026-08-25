'use client';

import { DropshippingPage } from '../../src/views/DropshippingPage.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function DropshippingClient() {
  const navigate = useAppNavigate();
  const { user } = useStorefront();

  return (
    <DropshippingPage
      user={user}
      navigate={navigate}
      openAuth={() => navigate('signup', null, null, { type: 'reseller' })}
    />
  );
}
