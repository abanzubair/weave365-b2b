'use client';

import { AffiliateProgramPage } from '../../src/views/AffiliateProgramPage.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function AffiliateProgramClient() {
  const navigate = useAppNavigate();
  const { user } = useStorefront();

  return (
    <AffiliateProgramPage
      user={user}
      navigate={navigate}
      openAuth={() => navigate('signup', null, null, { type: 'reseller' })}
    />
  );
}
