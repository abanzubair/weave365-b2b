import '../src/styles.css';
import { storeConfig } from '../src/config.js';
import SchemaMarkup from '../src/components/SchemaMarkup.jsx';
import Script from 'next/script';
import { 
  Cormorant_Garamond, 
  Manrope, 
  Cormorant, 
  Marcellus
} from 'next/font/google';

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-cormorant-garamond-next',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope-next',
  display: 'swap',
});

const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant-next',
  display: 'swap',
});

const marcellus = Marcellus({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-marcellus-next',
  display: 'swap',
});

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
        url: `${siteUrl}/logo.webp`,
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
    images: [`${siteUrl}/logo.webp`],
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
    icon: 'https://weave365.in/assets/banner/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  const fontClasses = [
    cormorantGaramond.variable,
    manrope.variable,
    cormorant.variable,
    marcellus.variable,
  ].join(' ');


  return (
    <html lang="en" data-scroll-behavior="smooth" className={fontClasses}>
      <head>
        <SchemaMarkup />
        {/* Google tag (gtag.js) */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-2S63N2WPVM" />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-2S63N2WPVM');
          `}
        </Script>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        {process.env.NEXT_PUBLIC_R2_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_R2_URL} />
        )}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
