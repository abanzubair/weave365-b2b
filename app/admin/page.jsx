import { Suspense } from 'react';
import AdminClient from './AdminClient.jsx';

export const metadata = {
  title: 'Admin Dashboard | Weave 365',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminClient />
    </Suspense>
  );
}
