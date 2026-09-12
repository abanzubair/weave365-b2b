import '../src/styles.css';
import { siteUrl } from '../src/config.js';
import SchemaMarkup from '../src/components/SchemaMarkup.jsx';
import { AppShell } from '../src/components/AppShell.jsx';
import Script from 'next/script';


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
        url: `${siteUrl}/og-image.png`,
        secureUrl: `${siteUrl}/og-image.png`,
        type: 'image/png',
        width: 1200,
        height: 630,
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
    images: [`${siteUrl}/og-image.png`],
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
      { url: '/favicon.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      prefix="og: https://ogp.me/ns#"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <SchemaMarkup />
        <link rel="dns-prefetch" href="https://assets.weave365.com" />
        {/* Preload critical LCP hero image for mobile and desktop FIRST */}
        <link
          rel="preload"
          as="image"
          href="/assets/banner/heroFreeWebsite-400.webp"
          media="(max-width: 640px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/assets/banner/heroFreeWebsite-600.webp"
          media="(min-width: 641px)"
          fetchPriority="high"
        />
        {/* Preload critical primary UI body font and heading font */}
        <link
          rel="preload"
          href="/fonts/manrope-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/cormorant-garamond-600.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Google tag (gtag.js) */}
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
              var s = document.createElement('script');
              s.async = true;
              s.src = 'https://www.googletagmanager.com/gtag/js?id=G-4K369BHS5L';
              document.head.appendChild(s);
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-4K369BHS5L');
            }
          `}
        </Script>
        {process.env.NEXT_PUBLIC_R2_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_R2_URL} />
        )}
      </head>
      <body suppressHydrationWarning>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
