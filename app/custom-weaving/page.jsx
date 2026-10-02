import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl, storeConfig } from '../../src/config.js';
import CustomWeavingClient from './CustomWeavingClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Custom Woven Banarasi Sarees | Weave 365',
    description:
      'Create custom woven Banarasi sarees with loom development. Learn the MOQ, process, sampling, pricing, production timeline, and private label options.',
    alternates: { canonical: `${siteUrl}/custom-weaving` },
    openGraph: {
      title: 'Custom Woven Banarasi Sarees | Weave 365',
      description:
        'Create custom woven Banarasi sarees with loom development. Learn the MOQ, process, sampling, pricing, production timeline, and private label options.',
      url: `${siteUrl}/custom-weaving`,
    },
  };

  return getSeoMetadata('/custom-weaving', defaultMeta);
}

const customWovenSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Custom Woven Banarasi Sarees & Loom Development',
  provider: {
    '@type': 'Organization',
    name: storeConfig.name || 'Weave 365',
    url: siteUrl,
  },
  serviceType: 'Custom Silk Weaving & Private Label Manufacturing',
  areaServed: 'Global',
  description:
    'Create custom woven Banarasi sarees with loom development, custom color palettes, motif customization, flexible MOQ, and private label production direct from Varanasi master weavers.',
};

export default function CustomWeavingRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(customWovenSchema).replace(/</g, '\\u003c'),
        }}
      />
      <CustomWeavingClient />
    </>
  );
}
