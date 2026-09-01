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
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <SchemaMarkup />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Marcellus&display=swap"
          rel="stylesheet"
        />
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
