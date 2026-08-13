import AdminClient from './AdminClient.jsx';

export const metadata = {
  title: 'Admin Portal | Weave 365',
  description: 'Administrative portal for Weave 365. Manage products, blogs, reviews, and vendors.',
  robots: {
    index: false,
    follow: false,
  },
};

export const runtime = 'edge';

export default function AdminPage() {
  return <AdminClient />;
}
