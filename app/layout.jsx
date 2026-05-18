import '../src/styles.css';
import { storeConfig } from '../src/config.js';
import SchemaMarkup from '../src/components/SchemaMarkup.jsx';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.in';

export const metadata = {
  title: "Weave 365 – Wholesale Banarasi Sarees | B2B Saree Supplier Online",
  description:
    "Buy premium Banarasi silk sarees at wholesale prices. Weave 365 is India's trusted B2B saree platform for resellers, boutiques & retailers. Browse live catalogue & order via WhatsApp.",
  keywords: [
    "wholesale banarasi sarees",
    "B2B saree supplier",
    "banarasi silk saree wholesale",
    "saree wholesaler online India",
    "bulk saree order",
    "banarasi saree manufacturer",
    "weave 365",
  ],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Weave 365 – Wholesale Banarasi Sarees | B2B Saree Supplier",
    description:
      "India's trusted B2B Banarasi saree platform. Premium quality, wholesale prices, bulk order support. Browse our live catalogue today.",
    url: siteUrl,
    siteName: "Weave 365",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Weave 365 – Wholesale Banarasi Sarees",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weave 365 – Wholesale Banarasi Sarees",
    description:
      "India's trusted B2B Banarasi saree platform. Premium quality, wholesale prices, bulk order support.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <SchemaMarkup />
      </head>
      <body>{children}</body>
    </html>
  );
}
