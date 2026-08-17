import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import ReturnsCancellationClient from './ReturnsCancellationClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Wholesale Saree Returns & Cancellation Policies | Weave 365',
    description:
      'Verify our transparent wholesale policies. Information on manufacturing defect exchanges, unboxing video requirements, and ready-to-ship cancellations.',
    alternates: { canonical: `${siteUrl}/returns-cancellation` },
    openGraph: {
      title: 'Wholesale Saree Returns & Cancellation Policies | Weave 365',
      description:
        'Verify our transparent wholesale policies. Information on manufacturing defect exchanges, unboxing video requirements, and ready-to-ship cancellations.',
      url: `${siteUrl}/returns-cancellation`,
    },
  };

  return getSeoMetadata('/returns-cancellation', defaultMeta);
}

export default function ReturnsCancellationRoute() {
  return <ReturnsCancellationClient />;
}
