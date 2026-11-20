export const metadata = {
  title: 'Checkout | Weave 365',
  robots: {
    index: false,
    follow: false,
  },
};

import CheckoutClient from './CheckoutClient.jsx';

export default function CheckoutRoute() {
  return <CheckoutClient />;
}
