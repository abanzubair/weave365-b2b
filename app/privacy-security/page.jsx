import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import PrivacySecurityClient from './PrivacySecurityClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Data Privacy, GST Security & Transaction Safety | Weave 365',
    description:
      'How we secure your wholesale trade records, verify business profiles, protect GST numbers, and encrypt commercial transactions with top payment gateways.',
    alternates: { canonical: `${siteUrl}/privacy-security` },
    openGraph: {
      title: 'Data Privacy, GST Security & Transaction Safety | Weave 365',
      description:
        'How we secure your wholesale trade records, verify business profiles, protect GST numbers, and encrypt commercial transactions with top payment gateways.',
      url: `${siteUrl}/privacy-security`,
    },
  };

  return getSeoMetadata('/privacy-security', defaultMeta);
}

export default function PrivacySecurityRoute() {
  return <PrivacySecurityClient />;
}
