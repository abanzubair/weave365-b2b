import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import DisclaimerClient from './DisclaimerClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Product Disclaimer, Care & Usage Guidelines | Weave 365',
    description:
      'Review authentic handloom characteristics, tissue care, washing precautions, storing guidelines, and product specifications for Weave 365 collections.',
    alternates: { canonical: `${siteUrl}/disclaimer` },
    openGraph: {
      title: 'Product Disclaimer, Care & Usage Guidelines | Weave 365',
      description:
        'Review authentic handloom characteristics, tissue care, washing precautions, storing guidelines, and product specifications for Weave 365 collections.',
      url: `${siteUrl}/disclaimer`,
    },
  };

  return getSeoMetadata('/disclaimer', defaultMeta);
}

export default function DisclaimerRoute() {
  return <DisclaimerClient />;
}
