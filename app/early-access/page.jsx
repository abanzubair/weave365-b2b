import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import EarlyAccessClient from './EarlyAccessClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Request Early Access | Weave 365 Wholesale Banarasi Sarees',
    description:
      'Get early access to our wholesale Banarasi saree new arrivals. Verified boutique owners, retailers, and resellers can join our premium updates.',
    alternates: { canonical: `${siteUrl}/early-access` },
    openGraph: {
      title: 'Request Early Access | Weave 365 Wholesale Banarasi Sarees',
      description:
        'Get early access to our wholesale Banarasi saree new arrivals. Verified boutique owners, retailers, and resellers can join our premium updates.',
      url: `${siteUrl}/early-access`,
    },
  };

  return getSeoMetadata('/early-access', defaultMeta);
}

export default function EarlyAccessRoute() {
  return <EarlyAccessClient />;
}
