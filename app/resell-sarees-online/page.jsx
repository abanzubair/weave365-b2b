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
      name: 'Is registration free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Registration is free for the standard reseller and dropshipping programme. There is no registration fee, setup fee or monthly subscription fee.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to maintain stock or buy inventory upfront?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. You do not need to maintain inventory for eligible dropshipping products. You first receive the order from your customer and then place the corresponding order with Weave 365.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I place a single-piece order?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Eligible reseller and dropshipping orders can be placed for a single piece. Regular wholesale and bulk orders may have separate minimum order quantities or commercial terms.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I pay Weave 365 before dispatch?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The applicable Weave 365 payment must be received before the reseller or dropshipping order is processed and dispatched, unless different payment terms have been approved in writing.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I make a profit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You purchase the product from Weave 365 at the applicable reseller price and decide your own customer selling price, subject to applicable law and any specific commercial arrangement. Your gross margin is the difference between the price charged to your customer and the amount payable to Weave 365, before your other business costs.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I sell products under my own brand?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Eligible products can be sold under your own brand name through the white-label reseller programme. Weave 365 may provide approved white-label catalogues, product images and product information for this purpose.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can products be shipped without Weave 365 branding?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, for eligible white-label dropshipping orders. The external customer-facing shipment may be arranged without Weave 365 branding and may be processed under the reseller’s brand, subject to the applicable fulfilment arrangement.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where can I sell Weave 365 products?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can sell eligible products through channels such as WhatsApp, Instagram, Facebook and your own website or online store using approved product images and catalogues.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are the shipping charges for India and international orders?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Eligible reseller and dropshipping orders may qualify for free shipping within India, as stated at the time of order. International shipping charges depend on destination, parcel weight, courier rates and customs duties.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is COD available?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. COD is not available for standard reseller and dropshipping orders unless Weave 365 specifically agrees otherwise.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the return policy for reseller orders?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For reseller and dropshipping orders, returns are generally not accepted for change of mind, customer preference, slow-moving stock or normal product variations. A return or remedy may be considered for verified incorrect products or qualifying manufacturing defects.',
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
