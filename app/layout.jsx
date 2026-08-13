import '../src/styles.css';
import { siteUrl } from '../src/config.js';
import SchemaMarkup from '../src/components/SchemaMarkup.jsx';
import Script from 'next/script';
import { 
  Cormorant_Garamond, 
  Manrope, 
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

const marcellus = Marcellus({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-marcellus-next',
  display: 'swap',
});

export const metadata = {
  title: "Banarasi Sarees and Suits for Wholesale & Export | Weave 365",
  description:
    "Wholesale Banarasi sarees and suits for boutiques, retailers, sourcing partners and white label brands. Flexible MOQ. Global shipping & dropshipping support.",
  keywords: [
    "wholesale banarasi sarees",
    "wholesale saree supplier",
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  openGraph: {
    title: "Banarasi Sarees and Suits for Wholesale & Export | Weave 365",
    description:
      "Wholesale Banarasi sarees and suits for boutiques, retailers, sourcing partners and white label brands. Flexible MOQ. Global shipping & dropshipping support.",
    url: siteUrl,
    siteName: "Weave 365",
    images: [
      {
        url: "https://assets.weave365.com/assets/banner/Weave365.svg",
        width: 539,
        height: 100,
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
    images: ["https://assets.weave365.com/assets/banner/Weave365.svg"],
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
    icon: [
      {
        url: 'https://assets.weave365.com/assets/banner/favicon.ico',
        type: 'image/x-icon',
      },
    ],
    shortcut: 'https://assets.weave365.com/assets/banner/favicon.ico',
    apple: 'https://assets.weave365.com/assets/banner/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  const fontClasses = [
    cormorantGaramond.variable,
    manrope.variable,
    marcellus.variable,
  ].join(' ');

  return (
    <html lang="en" data-scroll-behavior="smooth" className={fontClasses} suppressHydrationWarning>
      <head>
        <SchemaMarkup />
        <link rel="preconnect" href="https://assets.weave365.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://assets.weave365.com" />
        <link
          rel="preload"
          as="image"
          href="/deskH.webp"
          media="(min-width: 768px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/mobH.webp"
          media="(max-width: 767px)"
          fetchPriority="high"
        />
        {/* Google tag (gtag.js) */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-4K369BHS5L" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-4K369BHS5L');
          `}
        </Script>
        <link rel="icon" type="image/x-icon" href="https://assets.weave365.com/assets/banner/favicon.ico" />
        <link rel="shortcut icon" href="https://assets.weave365.com/assets/banner/favicon.ico" />
        <link rel="apple-touch-icon" href="https://assets.weave365.com/assets/banner/favicon.ico" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        {process.env.NEXT_PUBLIC_R2_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_R2_URL} />
        )}
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
