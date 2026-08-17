import { Suspense } from 'react';
import AccountClient from './AccountClient.jsx';

export const metadata = {
  title: 'My Account & Trade Profile | Weave 365',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountRoute() {
  return (
    <Suspense fallback={null}>
      <AccountClient />
    </Suspense>
  );
}
