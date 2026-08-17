import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl, storeConfig } from '../../src/config.js';
import WeaveComparisonClient from './WeaveComparisonClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Handloom vs Semi Handloom vs Powerloom Guide | Weave 365',
    description:
      'Understand the real difference between handloom, semi handloom and powerloom sarees to choose genuine handwoven textiles direct from Varanasi weavers.',
    alternates: { canonical: `${siteUrl}/handloom-vs-powerloom-guide` },
    openGraph: {
      title: 'Handloom vs Semi Handloom vs Powerloom Guide | Weave 365',
      description:
        'Understand the real difference between handloom, semi handloom and powerloom sarees to choose genuine handwoven textiles direct from Varanasi weavers.',
      url: `${siteUrl}/handloom-vs-powerloom-guide`,
    },
  };

  return getSeoMetadata('/handloom-vs-powerloom-guide', defaultMeta);
}

const comparisonGuideSchema = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Handloom vs Semi Handloom vs Powerloom Guide',
  description:
    'Understand the real difference between handloom, semi handloom and powerloom sarees to choose genuine handwoven textiles direct from Varanasi weavers.',
  author: {
    '@type': 'Organization',
    name: storeConfig.name || 'Weave 365',
  },
  publisher: {
    '@type': 'Organization',
    name: storeConfig.name || 'Weave 365',
    url: siteUrl,
  },
};

export default function HandloomVsPowerloomRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(comparisonGuideSchema).replace(/</g, '\\u003c'),
        }}
      />
      <WeaveComparisonClient />
    </>
  );
}
