'use client';

import { SellerLandingPage } from '../../src/views/SellerLandingPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function SellerPageClient() {
  const navigate = useAppNavigate();
  return <SellerLandingPage navigate={navigate} />;
}
