'use client';

import { ResellerDashboard } from '../../src/views/ResellerDashboard.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function ResellerDashboardClient() {
  const navigate = useAppNavigate();
  const { user, buyerProfile } = useStorefront();

  return <ResellerDashboard user={user} buyerProfile={buyerProfile} navigate={navigate} />;
}
