export const metadata = {
  title: 'Reseller Business Center | Weave 365',
  robots: {
    index: false,
    follow: false,
  },
};

import ResellerDashboardClient from './ResellerDashboardClient.jsx';

export default function ResellerDashboardRoute() {
  return <ResellerDashboardClient />;
}
