import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl, storeConfig } from '../../src/config.js';
import WhiteLabelClient from './WhiteLabelClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'White Label Banarasi Sarees & Suits Brand Program | Weave 365',
    description:
      'Build a high-margin ethnic wear business with authentic Banarasi sarees and suits from Varanasi. Weave 365 provides direct loom sourcing, unbranded HD catalogues, white label support, and blind dropshipping to your customers.',
    alternates: { canonical: `${siteUrl}/white-label` },
    openGraph: {
      title: 'White Label Banarasi Sarees & Suits Brand Program | Weave 365',
      description:
        'Build a high-margin ethnic wear business with authentic Banarasi sarees and suits from Varanasi. Weave 365 provides direct loom sourcing, unbranded HD catalogues, white label support, and blind dropshipping to your customers.',
      url: `${siteUrl}/white-label`,
    },
  };

  return getSeoMetadata('/white-label', defaultMeta);
}

const whiteLabelSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'White Label Banarasi Sarees & Suits Brand Program',
  provider: {
    '@type': 'Organization',
    name: storeConfig.name || 'Weave 365',
    url: siteUrl,
  },
  serviceType: 'White Label Saree Supply & Blind Dropshipping',
  areaServed: 'Global',
  description:
    'Build your high-margin ethnic wear brand with direct Varanasi loom sourcing, unbranded HD image catalogues, white label packaging support, and blind dropshipping.',
};

export default function WhiteLabelRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(whiteLabelSchema).replace(/</g, '\\u003c'),
        }}
      />
      <WhiteLabelClient />
    </>
  );
}
