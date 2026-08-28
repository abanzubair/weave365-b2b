import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import ResellerFaqsClient from './ResellerFaqsClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Reseller & Dropshipping FAQs | Weave 365 Information Desk',
    description:
      'Official FAQs for Weave 365 resellers and dropshippers. Understand free onboarding, zero inventory rules, profit markups, white-label shipping, NDR/RTO handling, and GST compliance.',
    alternates: { canonical: `${siteUrl}/reseller-faqs` },
    openGraph: {
      title: 'Reseller & Dropshipping FAQs | Weave 365 Information Desk',
      description:
        'Official FAQs for Weave 365 resellers and dropshippers. Understand free onboarding, zero inventory rules, profit markups, white-label shipping, NDR/RTO handling, and GST compliance.',
      url: `${siteUrl}/reseller-faqs`,
    },
  };

  return getSeoMetadata('/reseller-faqs', defaultMeta);
}

export default function ResellerFaqsRoute() {
  return <ResellerFaqsClient />;
}
