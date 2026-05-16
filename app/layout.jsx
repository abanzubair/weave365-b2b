import '../src/styles.css';
import { storeConfig } from '../src/config.js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.in';
const siteDescription = 'Wholesale saree storefront with live product catalogue, saved cart, favourites, and WhatsApp ordering.';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: storeConfig.name,
    template: `%s | ${storeConfig.name}`,
  },
  description: siteDescription,
  openGraph: {
    type: 'website',
    siteName: storeConfig.name,
    title: storeConfig.name,
    description: siteDescription,
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: storeConfig.name,
    description: siteDescription,
  },
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
