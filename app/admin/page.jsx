import { Suspense } from 'react';
import AdminClient from './AdminClient.jsx';
import AdminLoadingScreen from '../../src/views/admin/AdminLoadingScreen.jsx';

export const metadata = {
  title: 'Admin Dashboard | Weave 365',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <section className="admin-loading-screen" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <AdminLoadingScreen
            title="Weave 365 Admin"
            subtitle="Initializing administrator dashboard…"
          />
        </section>
      }
    >
      <AdminClient />
    </Suspense>
  );
}
