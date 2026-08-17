import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import TermsConditionsClient from './TermsConditionsClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Terms of Use, Wholesale MOQ & Trader Agreement | Weave 365',
    description:
      'Review our commercial wholesale portal terms, minimum order quantity rules (3-saree minimum), payment gateway guidelines, and Varanasi jurisdiction.',
    alternates: { canonical: `${siteUrl}/terms-conditions` },
    openGraph: {
      title: 'Terms of Use, Wholesale MOQ & Trader Agreement | Weave 365',
      description:
        'Review our commercial wholesale portal terms, minimum order quantity rules (3-saree minimum), payment gateway guidelines, and Varanasi jurisdiction.',
      url: `${siteUrl}/terms-conditions`,
    },
  };

  return getSeoMetadata('/terms-conditions', defaultMeta);
}

export default function TermsConditionsRoute() {
  return <TermsConditionsClient />;
}
