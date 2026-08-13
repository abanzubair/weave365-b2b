import BlogClient from './BlogClient.jsx';
import { siteUrl } from '../../src/config.js';

export const metadata = {
  title: 'Wholesale Banarasi Saree Sourcing & Reselling Blog | Weave 365',
  description: 'Expert business guides, boutique scaling strategies, saree reselling tips, and fabric guides for wholesale Banarasi sarees and suits direct from Varanasi weavers.',
  alternates: { canonical: `${siteUrl}/blog` },
};

export const runtime = 'edge';

export default function BlogPage() {
  return <BlogClient />;
}
