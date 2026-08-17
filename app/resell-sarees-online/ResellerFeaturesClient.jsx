'use client';

import { ResellerFeaturesPage } from '../../src/views/ResellerFeaturesPage.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function ResellerFeaturesClient() {
  const navigate = useAppNavigate();
  const { user, setAuthOpen } = useStorefront();

  return (
    <ResellerFeaturesPage
      user={user}
      navigate={navigate}
      openAuth={() => setAuthOpen(true)}
    />
  );
}
