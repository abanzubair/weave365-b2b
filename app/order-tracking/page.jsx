import { Suspense } from 'react';
import OrderTrackingClient from './OrderTrackingClient.jsx';

export const metadata = {
  title: 'Wholesale Order & Inquiry Tracking | Weave 365',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OrderTrackingRoute({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const inquiryId = resolvedSearchParams?.id || resolvedSearchParams?.order_id || '';
  return (
    <Suspense fallback={null}>
      <OrderTrackingClient inquiryId={inquiryId} />
    </Suspense>
  );
}
