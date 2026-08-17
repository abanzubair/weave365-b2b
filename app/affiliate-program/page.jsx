import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl, storeConfig } from '../../src/config.js';
import AffiliateProgramClient from './AffiliateProgramClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Affiliate Partner Program | Earn Upto 15% Commission | Weave 365',
    description:
      'Join the Weave 365 Affiliate Partner Program. Share Banarasi collections (saree, suit, and more) and earn upto 15% commission on every order.',
    alternates: { canonical: `${siteUrl}/affiliate-program` },
    openGraph: {
      title: 'Affiliate Partner Program | Earn Upto 15% Commission | Weave 365',
      description:
        'Join the Weave 365 Affiliate Partner Program. Share Banarasi collections (saree, suit, and more) and earn upto 15% commission on every order.',
      url: `${siteUrl}/affiliate-program`,
    },
  };

  return getSeoMetadata('/affiliate-program', defaultMeta);
}

const affiliateSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Affiliate Partner Program | Earn Upto 15% Commission | Weave 365',
  description:
    'Join the Weave 365 Affiliate Partner Program. Share authentic Banarasi saree and suit collections to earn up to 15% commission on wholesale and reseller orders.',
  publisher: {
    '@type': 'Organization',
    name: storeConfig.name || 'Weave 365',
    url: siteUrl,
  },
};

export default function AffiliateProgramRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(affiliateSchema).replace(/</g, '\\u003c'),
        }}
      />
      <AffiliateProgramClient />
    </>
  );
}
