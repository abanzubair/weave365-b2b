import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import PaymentPolicyClient from './PaymentPolicyClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Payment Policy, B2B Billing & Payment Methods | Weave 365',
    description:
      'Understand payment terms, advance billing, payment gateways, international transactions, taxes, and security for orders placed on Weave 365.',
    alternates: { canonical: `${siteUrl}/payment-policy` },
    openGraph: {
      title: 'Payment Policy, B2B Billing & Payment Methods | Weave 365',
      description:
        'Understand payment terms, advance billing, payment gateways, international transactions, taxes, and security for orders placed on Weave 365.',
      url: `${siteUrl}/payment-policy`,
    },
  };

  return getSeoMetadata('/payment-policy', defaultMeta);
}

export default function PaymentPolicyRoute() {
  return <PaymentPolicyClient />;
}
