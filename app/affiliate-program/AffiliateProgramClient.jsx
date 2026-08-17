'use client';

import { AffiliateProgramPage } from '../../src/views/AffiliateProgramPage.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function AffiliateProgramClient() {
  const navigate = useAppNavigate();
  const { user, setAuthOpen } = useStorefront();

  return (
    <AffiliateProgramPage
      user={user}
      navigate={navigate}
      openAuth={() => setAuthOpen(true)}
    />
  );
}
