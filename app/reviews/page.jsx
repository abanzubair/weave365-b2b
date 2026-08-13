import ReviewsClient from './ReviewsClient.jsx';
import { siteUrl } from '../../src/config.js';

export const metadata = {
  title: 'Client Sourcing Reviews | Partner Feedback | Weave 365',
  description: 'Verified reviews and feedback from boutique owners, apparel retailers, and saree resellers across India sourcing from Weave 365.',
  alternates: { canonical: `${siteUrl}/reviews` },
};

export const runtime = 'edge';

export default function ReviewsPage() {
  return <ReviewsClient />;
}
