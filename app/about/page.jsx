import AboutClient from './AboutClient.jsx';
import { siteUrl } from '../../src/config.js';

export const metadata = {
  title: 'About Weave 365 | Premium Banarasi Saree Wholesaler India',
  description: 'Discover Weave 365, India\'s leading Banarasi saree supplier. Learn about our heritage, meet our 200+ Varanasi artisan network, and explore our 5-step quality verification process.',
  alternates: { canonical: `${siteUrl}/about` },
};

export const runtime = 'edge';

export default function AboutPage() {
  return <AboutClient />;
}
