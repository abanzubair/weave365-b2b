import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import DeveloperApiDocClient from './DeveloperApiDocClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Developer API | Direct Handloom Sourcing & Dropship Automation | Weave 365',
    description:
      'Official REST API for Weave365 B2B partners. Seamlessly connect Shopify, WooCommerce, and custom web apps for real-time Banarasi handloom catalog syncing, live stock verification, and automated white-label dropship order dispatch directly from Varanasi weavers.',
    keywords: [
      'Weave365 Developer API',
      'Handloom B2B API',
      'Banarasi Saree Dropshipping API',
      'Shopify SyncX Handloom Feed',
      'WooCommerce Handloom Catalog Sync',
      'Varanasi Silk Weaver REST API',
      'Automated Saree Order Dispatch API',
      'Fashion Dropshipping REST API India'
    ],
    alternates: { canonical: `${siteUrl}/developer-api` },
    openGraph: {
      title: 'Weave365 Developer API | Direct Handloom Sourcing & Dropship REST API',
      description:
        'Connect Shopify, WooCommerce, and custom platforms with Varanasi weavers. Real-time catalog feeds, sub-50ms stock checks, and automated white-label dropship dispatch.',
      url: `${siteUrl}/developer-api`,
      siteName: 'Weave 365 B2B',
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Weave365 Developer API | Direct Handloom Sourcing & Dropship REST API',
      description:
        'Connect your eCommerce store with Varanasi weavers. Real-time catalog feeds, sub-50ms stock checks, and automated dropship fulfillment.',
    },
  };

  return getSeoMetadata('/developer-api', defaultMeta);
}

export default function DeveloperApiRoute() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebAPI',
        '@id': `${siteUrl}/developer-api#webapi`,
        name: 'Weave365 Handloom Sourcing & Dropship REST API',
        description:
          'Official REST API and automated storefront feeds for synchronizing authentic Banarasi handloom inventory, checking live loom availability, and automating 100% white-label dropship order fulfillment.',
        documentation: `${siteUrl}/developer-api#docs`,
        termsOfService: `${siteUrl}/terms-conditions`,
        serviceType: 'B2B eCommerce & Handloom Dropshipping API',
        provider: {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: 'Weave 365',
          url: siteUrl,
          logo: `${siteUrl}/favicon.png`
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Developer API Subscription Tiers',
          itemListElement: [
            {
              '@type': 'Offer',
              name: 'Growth Partner API',
              price: '299',
              priceCurrency: 'INR',
              description: '10,000 requests/month (3 req/sec), real-time catalog feeds, stock checks, and Shopify/WooCommerce syncing.'
            },
            {
              '@type': 'Offer',
              name: 'Pro Scale API',
              price: '499',
              priceCurrency: 'INR',
              description: '25,000 requests/month (5 req/sec), full automated dropship order placement, and priority weaver dispatch.'
            }
          ]
        }
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${siteUrl}/developer-api#software`,
        name: 'Weave365 B2B Developer API Platform',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Cloud / Platform Independent',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'INR',
          lowPrice: '299',
          highPrice: '499',
          offerCount: '2'
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${siteUrl}/developer-api#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Developer API',
            item: `${siteUrl}/developer-api`
          }
        ]
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteUrl}/developer-api#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Can I connect Shopify without writing custom backend code?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. We provide dedicated pre-formatted JSON and CSV feed URLs compatible with Shopify apps like SyncX, Stock Sync, and Matrixify. You can configure hourly catalog sync, price markups (e.g. +30%), and color variants with zero programming.'
            }
          },
          {
            '@type': 'Question',
            name: 'Does the customer know the parcel came from Weave365?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. All dropship orders dispatched through the API feature 100% white-label packaging. The courier dispatch slip displays your store name as the sender, your customer retail purchase price, and includes zero Weave365 branding.'
            }
          },
          {
            '@type': 'Question',
            name: 'How does live loom stock verification work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Our GET /stock-status endpoint updates continuously with Varanasi loom production status. If an order is submitted for a SKU that is exhausted, the API immediately returns a 409 Conflict with the estimated loom replenishment date to prevent unexpected billing.'
            }
          },
          {
            '@type': 'Question',
            name: 'What rate limits and monthly quotas apply?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The Growth Partner plan (₹299/mo) provides 10,000 requests per month (3 req/sec), ideal for automated catalog and stock syncing. The Pro Scale plan (₹499/mo) provides 25,000 requests per month (5 req/sec), including full automated dropship order placement.'
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DeveloperApiDocClient />
    </>
  );
}
