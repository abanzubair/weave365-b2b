import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import ResellerFeaturesClient from './ResellerFeaturesClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Resell Sarees Online | WhatsApp Catalog Sharing & Social Media Reseller Tools | Weave 365',
    description:
      'Resell authentic Banarasi sarees on WhatsApp, Instagram & Facebook with free tools from Weave 365. Share ready-made catalogs, add your markup, collect orders — we handle the rest. No inventory needed.',
    alternates: { canonical: `${siteUrl}/resell-sarees-online` },
    openGraph: {
      title: 'Resell Sarees Online | WhatsApp Catalog Sharing & Social Media Reseller Tools | Weave 365',
      description:
        'Resell authentic Banarasi sarees on WhatsApp, Instagram & Facebook with free tools from Weave 365. Share ready-made catalogs, add your markup, collect orders — we handle the rest. No inventory needed.',
      url: `${siteUrl}/resell-sarees-online`,
    },
  };

  return getSeoMetadata('/resell-sarees-online', defaultMeta);
}

const resellFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the Weave 365 reseller platform differ from standard dropshipping?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'While dropshipping refers specifically to the fulfillment method (shipping directly to your customer), our reseller platform provides the complete digital toolkit for social and web commerce. This includes instant WhatsApp sharing cards, bulk imagery downloads for social media posting, custom markup calculators, a built-in customer lead CRM, and the ability to launch a white-label website under your own domain name.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you charge any monthly fees to use the reseller tools?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Access to our catalogue, core WhatsApp sharing tools, custom pricing markups, bulk downloads, and order tracking is 100% free with no monthly subscription costs. The White-Label Website tool (which allows you to link a custom domain and auto-sync our live catalog) is available as an optional premium add-on.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I resell sarees and suits on platforms like Instagram and Facebook?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, absolutely. Most of our successful partners resell sarees online by sharing curated images on Instagram Stories/Reels or running private Facebook Groups. Our Catalog Download feature lets you export high-resolution product photography and complete fabric specifications in one click to populate your social feeds.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is packaging handled? Will my customers know about Weave 365?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'All orders are shipped under strict blind-fulfillment conditions. The package sent to your customer lists your business name as the sender, and contains no Weave 365 logos, invoices, or retail pricing leaflets. Your customer remains entirely yours.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the earnings potential, and how do I receive payments?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your earnings are entirely up to your markup rules. We charge you the trade price listed on our portal. When you share a design or host a storefront, you set your own selling price. When your customer pays you, you place the order on our site, pay us the trade price, and keep the difference as instant profit. No payment delays or commission waiting periods.',
      },
    },
  ],
};

export default function ResellSareesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(resellFaqSchema).replace(/</g, '\\u003c'),
        }}
      />
      <ResellerFeaturesClient />
    </>
  );
}
