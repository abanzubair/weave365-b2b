import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import DisclaimerClient from './DisclaimerClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Product Disclaimer & Heritage Weave Variations | Weave 365',
    description:
      'Understand the handwoven integrity, color calibration, and textile variations of our premium Varanasi silk sarees. Essential reading for wholesale buyers.',
    alternates: { canonical: `${siteUrl}/disclaimer` },
    openGraph: {
      title: 'Product Disclaimer & Heritage Weave Variations | Weave 365',
      description:
        'Understand the handwoven integrity, color calibration, and textile variations of our premium Varanasi silk sarees. Essential reading for wholesale buyers.',
      url: `${siteUrl}/disclaimer`,
    },
  };

  return getSeoMetadata('/disclaimer', defaultMeta);
}

export default function DisclaimerRoute() {
  return <DisclaimerClient />;
}
