export default function SchemaMarkup() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.weave365.in/#organization",
        name: "Weave 365",
        url: "https://www.weave365.in",
        logo: {
          "@type": "ImageObject",
          url: "https://www.weave365.in/logo.webp",
          width: 800,
          height: 800,
        },
        description:
          "Weave 365 is India's trusted B2B wholesale platform for premium Banarasi sarees, suits, lehengas and ethnic fabrics.",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+91-9919101369",
          contactType: "customer service",
          availableLanguage: ["English", "Hindi"],
          hoursAvailable: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ],
            opens: "10:00",
            closes: "18:00",
          },
        },
        email: "weave365@gmail.com",
        sameAs: [
          "https://www.instagram.com/weaves365.wholesale",
          "https://www.facebook.com/weaves365",
          "https://www.linkedin.com/company/weaves365",
          "https://www.youtube.com/@weaves365",
          "https://in.pinterest.com/weaves365/",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://www.weave365.in/#website",
        url: "https://www.weave365.in",
        name: "Weave 365",
        alternateName: ["Weave365", "Weave 365 B2B", "Weave365 B2B"],
        publisher: {
          "@id": "https://www.weave365.in/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate:
              "https://www.weave365.in/catalog?search={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Store",
        "@id": "https://www.weave365.in/#store",
        name: "Weave 365 Wholesale",
        url: "https://www.weave365.in",
        image: "https://www.weave365.in/logo.webp",
        description:
          "Wholesale Banarasi sarees, suits, lehengas and ethnic fabrics for B2B buyers, resellers and boutiques across India.",
        priceRange: "₹₹",
        currenciesAccepted: "INR",
        paymentAccepted: "Cash, Bank Transfer, UPI",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Varanasi",
          addressRegion: "Uttar Pradesh",
          addressCountry: "IN",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Banarasi Saree Wholesale Catalogue",
          itemListElement: [
            {
              "@type": "OfferCatalog",
              name: "Banarasi Sarees",
              url: "https://www.weave365.in/catalog?category=saree",
            },
            {
              "@type": "OfferCatalog",
              name: "Suits",
              url: "https://www.weave365.in/catalog?category=suit",
            },
            {
              "@type": "OfferCatalog",
              name: "Lehengas",
              url: "https://www.weave365.in/catalog?category=lehenga",
            },
            {
              "@type": "OfferCatalog",
              name: "Dupattas",
              url: "https://www.weave365.in/catalog?category=dupatta",
            },
          ],
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
