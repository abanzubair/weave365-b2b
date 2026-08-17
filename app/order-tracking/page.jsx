import { Suspense } from 'react';
import OrderTrackingClient from './OrderTrackingClient.jsx';

export const metadata = {
  title: 'Wholesale Order & Inquiry Tracking | Weave 365',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderTrackingRoute() {
  return (
    <Suspense fallback={null}>
      <OrderTrackingClient />
    </Suspense>
  );
}
