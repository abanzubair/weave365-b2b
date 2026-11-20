import { Suspense } from 'react';
import OrderTrackingClient from '../OrderTrackingClient.jsx';

export const runtime = 'edge';

export const metadata = {
  title: 'Wholesale Order & Inquiry Tracking | Weave 365',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OrderTrackingDetailRoute({ params }) {
  const resolvedParams = await params;
  const inquiryId = decodeURIComponent(resolvedParams?.inquiryId || '');

  return (
    <Suspense fallback={null}>
      <OrderTrackingClient inquiryId={inquiryId} />
    </Suspense>
  );
}
