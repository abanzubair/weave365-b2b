import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import DeveloperApiDocClient from './DeveloperApiDocClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Developer API & Integration Docs | Shopify, WooCommerce & PrestaShop | Weave 365',
    description:
      'Official REST API documentation for Weave365 B2B partners. Connect Shopify, WooCommerce, and custom web applications for real-time catalog syncing, stock verification, and dropship order dispatch.',
    alternates: { canonical: `${siteUrl}/developer-api` },
    openGraph: {
      title: 'Developer API & Integration Docs | Shopify, WooCommerce & PrestaShop | Weave 365',
      description:
        'Official REST API documentation for Weave365 B2B partners. Connect Shopify, WooCommerce, and custom web applications for real-time catalog syncing, stock verification, and dropship order dispatch.',
      url: `${siteUrl}/developer-api`,
    },
  };

  return getSeoMetadata('/developer-api', defaultMeta);
}

const apiDocSchema = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Weave365 B2B Developer REST API Documentation',
  description: 'Technical guide and endpoints specification for integrating Weave365 handloom catalog with Shopify, WooCommerce, PrestaShop and custom web applications.',
  articleSection: 'API Documentation',
  author: {
    '@type': 'Organization',
    name: 'Weave 365',
    url: siteUrl,
  },
};

export default function DeveloperApiRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(apiDocSchema) }}
      />
      <DeveloperApiDocClient />
    </>
  );
}
