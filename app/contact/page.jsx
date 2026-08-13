import { Suspense } from 'react';
import ContactClient from './ContactClient.jsx';
import { siteUrl } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Contact Us | Wholesale Banarasi Sarees Online | Weave 365',
    description: 'Get in touch with Weave 365, India\'s premier Banarasi saree supplier. Premium Banarasi sarees at wholesale prices for retailers, boutiques and resellers across India.',
    alternates: { canonical: `${siteUrl}/contact` },
  };
  return getSeoMetadata('/contact', defaultMeta);
}

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactClient />
    </Suspense>
  );
}
