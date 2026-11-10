import { siteUrl, storeConfig } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import WholesaleSareesClient from './WholesaleSareesClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const title = 'Wholesale Banarasi Saree Manufacturer, Exporter & Supplier | Weave 365';
  const description =
    'Direct Banarasi saree manufacturer, exporter & wholesale supplier from Varanasi weaving clusters. Flexible MOQ, B2B Trial Pack (4-5 sarees) & worldwide shipping.';
  const canonical = `${siteUrl}/wholesale-banarasi-sarees`;
  const ogImage = `${siteUrl}/wholesale-banarasi-saree-hero.webp`;

  const defaultMeta = {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: storeConfig.name || 'Weave 365',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };

  return getSeoMetadata('/wholesale-banarasi-sarees', defaultMeta);
}

export default function WholesaleSareesRoute() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the B2B Starter Trial Pack (Buy Any 4–5 Sarees at Wholesale Rates)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The B2B Starter Trial Pack allows boutiques, retailers, and online resellers to test authentic Varanasi Banarasi sarees before committing to large bulk volumes. Business buyers can select any 4 to 5 sarees across our catalog—mixing fabrics like Katan silk, Kora Organza, Khaddi Georgette, and Tissue—at true wholesale prices. Under our Trial Pack Cost Adjustment Guarantee, when you place subsequent bulk orders, 10% of each bulk order value is credited back until 100% of your trial pack cost is fully adjusted.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you enforce mandatory multi-piece design sets, or can buyers mix and match?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, Weave 365 does not enforce rigid color or design sets. Unlike traditional Chowk wholesale traders who force buyers to purchase 10 to 20 identical sarees of one design, we allow complete curation flexibility. You can handpick individual sarees across different fabrics, weaves, colors, and price points to match your specific customer demand.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does Weave 365 verify fabric quality and authentic weaving without middlemen?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Every saree undergoes a rigorous 4-point artisan quality audit before packing—inspecting warp-weft alignment, zari float trimming, weave uniformity, and fabric finish. We provide 100% material transparency by detailing yarn composition (pure silk, semi-silk, organza, tissue) on tech specs, and provide high-definition inspection videos and weave swatches so buyers can order with complete peace of mind.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can overseas boutiques and international retailers import wholesale Banarasi sarees directly from Varanasi?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Weave 365 exports authentic Banarasi sarees directly from Varanasi to boutiques and distributors across the USA, UK, UAE, Canada, Australia, Singapore, and Malaysia. We manage complete export documentation, standard HS Code 5007 classifications, commercial invoices, and doorstep air express courier delivery via DHL, Blue Dart, Aramex, and India Post with full shipment tracking.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can fashion designers and private labels order custom Banarasi weaves and bespoke designs?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. We partner with fashion designers, couture labels, and private brands for custom captive weaving. You can provide your tech-packs, bespoke motifs, Pantone references, or CAD graph cards. Our Varanasi master weavers will produce strike-off sample swatches for approval before running the production batch, complete with custom boutique labels, hangtags, and branded packaging.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does order-based captive manufacturing work for wholesale Banarasi sarees at Weave 365?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Weave 365 operates an on-demand captive manufacturing model connecting buyers directly to Varanasi weaving clusters. Instead of holding speculative warehouse dead-stock, dedicated looms in clusters like Madanpura, Bajardiha, Pilikothi, and Lohta are allocated exclusively to your order. This eliminates distributor markups, guarantees freshly woven sarees, enables custom colorways, and passes authentic loom-level wholesale pricing directly to you.',
        },
      },
    ],
  };

  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'WholesaleStore',
    name: 'Weave 365',
    legalName: storeConfig.companyName || 'Nexrize Ventures',
    description:
      'Premier B2B Banarasi saree manufacturer, global exporter, and wholesale supplier connecting businesses directly to master artisan weaving clusters in Varanasi.',
    url: `${siteUrl}/wholesale-banarasi-sarees`,
    telephone: `+91${String(storeConfig.phone || '9919101369').replace(/\D/g, '')}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Varanasi',
      addressRegion: 'Uttar Pradesh',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '25.3176',
      longitude: '82.9739',
    },
    priceRange: '₹₹',
    currenciesAccepted: 'INR, USD, EUR, GBP, AED, CAD, AUD',
    paymentAccepted: 'Bank Transfer (RTGS/NEFT), Credit Card, Wire Transfer',
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Wholesale Sarees',
        item: `${siteUrl}/wholesale-banarasi-sarees`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(businessSchema).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c'),
        }}
      />
      <WholesaleSareesClient />
    </>
  );
}
