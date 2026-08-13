import ContactClient from './ContactClient.jsx';
import { siteUrl } from '../../src/config.js';

export const metadata = {
  title: 'Contact Us | Wholesale Banarasi Sarees Online | Weave 365',
  description: 'Get in touch with Weave 365, India\'s premier Banarasi saree supplier. Premium Banarasi sarees at wholesale prices for retailers, boutiques and resellers across India.',
  alternates: { canonical: `${siteUrl}/contact` },
};

export const runtime = 'edge';

export default function ContactPage() {
  return <ContactClient />;
}
