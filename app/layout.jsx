import '../src/styles.css';
import { storeConfig } from '../src/config.js';
import SchemaMarkup from '../src/components/SchemaMarkup.jsx';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.in';

export const metadata = {
  title: "Banarasi Sarees and Suits for Wholesale & Export | Weave 365",
  description:
    "Wholesale Banarasi sarees and suits for boutiques, retailers, sourcing partners and white label brands. Flexible MOQ. Global shipping & dropshipping support.",
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
    title: "Banarasi Sarees and Suits for Wholesale & Export | Weave 365",
    description:
      "Wholesale Banarasi sarees and suits for boutiques, retailers, sourcing partners and white label brands. Flexible MOQ. Global shipping & dropshipping support.",
    url: siteUrl,
    siteName: "Weave 365",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Banarasi Sarees and Suits for Wholesale & Export | Weave 365",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Banarasi Sarees and Suits for Wholesale & Export | Weave 365",
    description:
      "Wholesale Banarasi sarees and suits for boutiques, retailers, sourcing partners and white label brands. Flexible MOQ. Global shipping & dropshipping support.",
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
