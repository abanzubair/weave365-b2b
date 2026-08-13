import ReviewsClient from './ReviewsClient.jsx';
import { siteUrl } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Client Sourcing Reviews | Partner Feedback | Weave 365',
    description: 'Verified reviews and feedback from boutique owners, apparel retailers, and saree resellers across India sourcing from Weave 365.',
    alternates: { canonical: `${siteUrl}/reviews` },
  };
  return getSeoMetadata('/reviews', defaultMeta);
}

export const runtime = 'edge';

export default function ReviewsPage() {
  return <ReviewsClient />;
}
