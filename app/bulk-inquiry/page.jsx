import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import BulkInquiryClient from './BulkInquiryClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Banarasi Saree Wholesale Bulk Inquiry & Sourcing | Weave 365',
    description:
      'Submit a bulk inquiry for premium Banarasi sarees and suits. We curate custom catalogs for boutiques, retailers, and exporters with flexible MOQ.',
    alternates: { canonical: `${siteUrl}/bulk-inquiry` },
    openGraph: {
      title: 'Banarasi Saree Wholesale Bulk Inquiry & Sourcing | Weave 365',
      description:
        'Submit a bulk inquiry for premium Banarasi sarees and suits. We curate custom catalogs for boutiques, retailers, and exporters with flexible MOQ.',
      url: `${siteUrl}/bulk-inquiry`,
    },
  };

  return getSeoMetadata('/bulk-inquiry', defaultMeta);
}

export default function BulkInquiryRoute() {
  return <BulkInquiryClient />;
}
