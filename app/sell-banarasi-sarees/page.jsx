import { Suspense } from 'react';
import SellerPageClient from './SellerPageClient.jsx';
import { siteUrl } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Sell Banarasi Sarees Online | Varanasi Sellers | Weave 365',
    description:
      'Varanasi weavers and sellers: list Banarasi sarees & suits on Weave 365, reach B2B & B2C buyers across India and worldwide, with fulfilment support.',
    alternates: { canonical: `${siteUrl}/sell-banarasi-sarees` },
    openGraph: {
      title: 'Sell Banarasi Sarees Online | Varanasi Sellers | Weave 365',
      description:
        'Varanasi weavers and sellers: list Banarasi sarees & suits on Weave 365, reach B2B & B2C buyers across India and worldwide, with fulfilment support.',
      url: `${siteUrl}/sell-banarasi-sarees`,
      siteName: 'Weave 365',
      type: 'website',
      images: [
        {
          url: 'https://assets.weave365.com/assets/banner/sellersHero.webp',
          width: 1200,
          height: 630,
          alt: 'Sell Banarasi Sarees Online - Weave 365 Varanasi Seller Program',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Sell Banarasi Sarees Online | Varanasi Sellers | Weave 365',
      description:
        'Varanasi weavers and sellers: list Banarasi sarees & suits on Weave 365, reach B2B & B2C buyers across India and worldwide, with fulfilment support.',
      images: ['https://assets.weave365.com/assets/banner/sellersHero.webp'],
    },
  };

  return getSeoMetadata('/sell-banarasi-sarees', defaultMeta);
}

// Structured Data: FAQPage Schema (All 10 FAQs for Google Rich Accordion Snippets)
const sellerFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '01- Kya registration free hai?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Haan. Weave 365 par Seller registration bilkul free hai. Koi monthly ya yearly fee nahi hai.',
      },
    },
    {
      '@type': 'Question',
      name: '02 - Kya mujhe apni poori collection Weave 365 par list karni hogi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nahi. Aapko apni poori collection list karne ki zaroorat nahi hai. Aap apne selected products hi Weave 365 par list kar sakte hain. Aap product ki photo aur details share kar dijiye. Baaki listing ka kaam hum kar lenge. Jitna product available hoga, utna hi aap sell kar sakte hain.',
      },
    },
    {
      '@type': 'Question',
      name: '03 - Kya main saree ke saath suit, lehenga and dupatta bhi list kar sakta hoon?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Haan. Aap Banarasi Sarees ke saath Suits, Dupattas aur Lehengas bhi list kar sakte hain. Aap jo products sell karna chahte hain, unki photo aur details share karna hoga.',
      },
    },
    {
      '@type': 'Question',
      name: '04 - Kya meri collection online catalog mein show hogi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Haan. Aapke approved products Weave 365 ke online catalog mein show kiye jayenge. Aapko extra listing ya product promotion fee dene ki zaroorat nahi hai. Marketplace ki tarah apne products ko upar dikhane ke liye alag se paid promotion karna nahi padega. Aap product ki photos aur details share kijiye. Hum unhe catalog mein add karke customers ke liye available karenge. Aapka fayda: Aap apne products ko bina extra promotion fee ke India aur worldwide customers tak pahucha sakte hain. Agar aapke product ki price competitive hogi, to customers ke order aane ke chances bhi zyada honge. Weave 365 website customer demand aur price ke basis par products ko automatically promote karegi — iske liye aapko koi extra promotion fee nahi deni hogi.',
      },
    },
    {
      '@type': 'Question',
      name: '05 - Kya mujhe marketplace ki tarah customer returns manage karne padenge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nahi. Customer return, cancellation ka kaam Weave 365 handle karega. Aapko ko sirf product ki quality check karke jo photo diya hai wahi product hamare warehouse tak bhejna hai. Product mein koi quality problem ya galat product ho, to uske liye alag claim process rahega.',
      },
    },
    {
      '@type': 'Question',
      name: '06 - NDR aur RTO ka kya hoga?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'NDR ke liye aap zimmedaar nahi honge. RTO ke rules order process karne se pehle clear kar diye jayenge. Aapko order lene se pehle saari terms aur zimmedari clearly bata di jayegi.',
      },
    },
    {
      '@type': 'Question',
      name: '07 - GST ka kya hoga?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'GST ka rule aapke business aur order ke hisaab se rahega. Weave 365 applicable transaction ka GST invoice provide karega. Aapke customer ko sale par GST ki zimmedari aapke business par ho sakti hai, jo aapke GST registration aur business setup par depend karegi.',
      },
    },
    {
      '@type': 'Question',
      name: '08 - Kya main apna existing business bhi continue kar sakta hoon?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Haan. Aap apna existing business jaise chal raha hai waise hi continue kar sakte hain. Weave 365 ko aap extra business line ki tarah use kar sakte hain.',
      },
    },
    {
      '@type': 'Question',
      name: '09 - Weave 365 par sell karna marketplace se kaise alag hai?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Weave 365 par seller ko sirf product list karke competition mein nahi chhod diya jata. Aapke approved products ko Weave 365 ke catalog mein customers ke liye available kiya jata hai. Aapko monthly fee ya paid promotion ke bina apne products showcase karne ka option milta hai. Aapka kaam product ki quality aur availability maintain karna hai. Baaki sales aur fulfilment ka process Weave 365 handle karta hai.',
      },
    },
    {
      '@type': 'Question',
      name: '10 - Mujhe apne products Weave 365 ke through hi kyun sell karne chahiye?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kyuki aapko apna alag online store banane aur customers lane ka poora burden nahi lena padta. Aap apne Banarasi products Weave 365 par list kijiye aur naye customers tak pahunchiye. Aap product ki quality check karke hamare warehouse tak product bhejiye; sales aur fulfilment Weave 365 handle karega. Isse aap apna existing business bhi continue kar sakte hain aur Weave 365 ko ek additional sales channel ke roop mein use kar sakte hain.',
      },
    },
  ],
};

// Structured Data: HowTo Schema (6-Step Registration & Fulfilment Workflow)
const sellerHowToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Sell Banarasi Sarees and Suits on Weave 365',
  description: 'A 6-step guide for Varanasi weavers and manufacturers to list and sell authentic Banarasi weaves without marketplace friction.',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Register Your Business',
      text: 'Apna naam, business details, location aur collection information submit kijiye.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Share Your Collection',
      text: 'Banarasi sarees, suits, lehengas, dupattas ya other Varanasi textile collections ke photos, specifications aur pricing details share kijiye.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Collection Verification',
      text: 'Our team product details, quality information aur sourcing credentials review karta hai.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Professional Cataloging',
      text: 'Approved products ko Weave 365 ke B2B & B2C catalog aur sourcing network ke liye professionally present kiya jata hai.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Buyer Discovery',
      text: 'Boutiques, retailers, resellers, exporters aur other business buyers aapki available collection discover kar sakte hain.',
    },
    {
      '@type': 'HowToStep',
      position: 6,
      name: 'Order & Fulfilment',
      text: 'Approved commercial terms ke according orders process, dispatch aur payout kiye jaate hain.',
    },
  ],
};

// Structured Data: BreadcrumbList Schema
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Sell Banarasi Sarees',
      item: `${siteUrl}/sell-banarasi-sarees`,
    },
  ],
};

export default function SellBanarasiSareesRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(sellerFaqSchema).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(sellerHowToSchema).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c'),
        }}
      />
      <Suspense fallback={null}>
        <SellerPageClient />
      </Suspense>
    </>
  );
}
