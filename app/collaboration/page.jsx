import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import CollaborationClient from './CollaborationClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Brand Collaborations & Custom Weaving | Weave 365',
    description:
      'Partner with Weave 365 for custom Banarasi weaving collections, private label design manufacturing, and direct artisan collaborations in Varanasi.',
    alternates: { canonical: `${siteUrl}/collaboration` },
    openGraph: {
      title: 'Brand Collaborations & Custom Weaving | Weave 365',
      description:
        'Partner with Weave 365 for custom Banarasi weaving collections, private label design manufacturing, and direct artisan collaborations in Varanasi.',
      url: `${siteUrl}/collaboration`,
    },
  };

  return getSeoMetadata('/collaboration', defaultMeta);
}

export default function CollaborationRoute() {
  return <CollaborationClient />;
}
