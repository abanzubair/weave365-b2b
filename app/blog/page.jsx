import BlogClient from './BlogClient.jsx';
import { siteUrl } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Wholesale Banarasi Saree Sourcing & Reselling Blog | Weave 365',
    description: 'Expert business guides, boutique scaling strategies, saree reselling tips, and fabric guides for wholesale Banarasi sarees and suits direct from Varanasi weavers.',
    alternates: { canonical: `${siteUrl}/blog` },
  };
  return getSeoMetadata('/blog', defaultMeta);
}

export const runtime = 'edge';

export default function BlogPage() {
  return <BlogClient />;
}
