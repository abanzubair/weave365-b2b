'use client';

import dynamic from 'next/dynamic';

const AdminWrapper = dynamic(
  () => import('../../src/views/Admin.jsx').then((mod) => mod.AdminWrapper),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function AdminPageClient() {
  return <AdminWrapper />;
}
