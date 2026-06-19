/**
 * @file PartnerProgramPage.jsx
 * @description Editorial landing view representing Weave365's two primary partnership models:
 * "Sourcing Partners" (loom-to-market coordinators managing Varanasi supply, MOQ slabs, quality checks) and
 * "White Label Brands" (market-to-customer boutique private labels using our backend supply ecosystem).
 * Integrates JSON-LD Breadcrumb, Service, and FAQ rich schemas dynamically based on selected partnership type.
 * 
 * @module views/PartnerProgramPage
 * @param {Object} props
 * @param {string} [props.type='sourcing-partners'] - The partnership channel to display ('sourcing-partners' or 'white-label-brands')
 * @param {Function} props.navigate - Client router transition callback
 */

import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  ClipboardCheck,
  Factory,
  Handshake,
  PackageCheck,
  ScanSearch,
  Sparkles,
  Store,
  Tags,
  Truck,
  Users,
} from 'lucide-react';

const partnerPages = {
  'sourcing-partners': {
    slug: 'sourcing-partners',
    metaTitle: 'Sourcing Partners for Banarasi Sarees & Suits | Weave 365',
    metaDescription:
      'Become a Banarasi saree and suit sourcing partner with Weave 365. Coordinate weavers, MOQ, wholesale pricing, catalog support, quality checks, stock updates, and dispatch.',
    eyebrow: 'Partner Program',
    badge: 'Loom to Market Bridge',
    h1: 'Sourcing Partners for Banarasi Sarees & Suits',
    intro:
      'Work with Weave 365 as the backend sourcing bridge for authentic Banarasi sarees, suits, fabrics, and bulk requirements. This role is built for partners who can coordinate product discovery, quality, pricing, stock visibility, and dispatch discipline across the Varanasi supply chain.',
    seoIntro:
      'Weave 365 works with sourcing partners who understand the Banarasi textile ecosystem from loom-level production to boutique-ready inventory. The program is designed for partners who can source authentic Banarasi sarees, Banarasi suits, fabrics, bridal collections, and custom bulk requirements while protecting quality, dispatch timelines, and transparent wholesale pricing. For retailers and exporters, this creates a reliable supply-side layer backed by real Varanasi craftsmanship and consistent inventory communication.',
    role:
      'A sourcing partner arranges, manages, and keeps the supply chain smooth between weavers, manufacturers, wholesalers, boutiques, and resale networks.',
    ctaText: 'Start Sourcing Inquiry',
    ctaRoute: 'bulk-inquiry',
    seal: 'SOURCE',
    stats: [
      ['MOQ', 'Flexible'],
      ['QC', 'Before Dispatch'],
      ['Stock', 'Live Updates'],
    ],
    responsibilities: [
      'Coordinate directly with weavers and manufacturers',
      'Arrange latest Banarasi saree and suit collections',
      'Negotiate MOQ, wholesale pricing, and fabric quality',
      'Maintain stock availability and inventory communication',
      'Track dispatch and production timelines',
      'Provide product images, specifications, and catalog inputs',
      'Inspect quality before shipping',
      'Suggest trend-based sourcing opportunities',
      'Manage custom bulk requirements',
    ],
    accountability: [
      'Correct product delivery',
      'Consistent quality maintenance',
      'On-time dispatch',
      'Competitive wholesale pricing',
      'Low defect and return ratio',
      'Accurate inventory communication',
      'Ethical sourcing and genuine Banarasi craftsmanship',
    ],
    guide: [
      {
        icon: Factory,
        title: 'Weaver Coordination',
        content:
          'Connect demand with reliable Varanasi weaving and manufacturing capacity, keeping fabric, work, color, and production readiness clear before orders move.',
      },
      {
        icon: ScanSearch,
        title: 'Quality and Specs',
        content:
          'Document fabric quality, finishing, zari work, catalog photos, and pre-dispatch inspection notes so buyers receive exactly what was promised.',
      },
      {
        icon: Truck,
        title: 'Timeline Control',
        content:
          'Track production, packing, dispatch, and replacement risks early, especially for boutique launches, wedding stock, and export timelines.',
      },
      {
        icon: Boxes,
        title: 'Bulk Readiness',
        content:
          'Support custom bulk needs with clear MOQ slabs, availability checks, mix-and-match options, and alternate suggestions when stock changes.',
      },
    ],
    faqs: [
      {
        q: 'Who is a sourcing partner best suited for?',
        a: 'This route is best for people or teams with strong manufacturer connections, product judgment, and the ability to manage quality, pricing, stock updates, and dispatch coordination.',
      },
      {
        q: 'Does a sourcing partner sell under their own brand?',
        a: 'Not primarily. A sourcing partner focuses on backend supply, product arrangement, negotiation, and operational accuracy rather than building a consumer-facing brand.',
      },
      {
        q: 'Can sourcing partners handle custom bulk orders?',
        a: 'Yes. Custom bulk handling is a core responsibility, including fabric, color, price point, MOQ, dispatch timeline, and quality expectations.',
      },
    ],
  },
  'white-label-brands': {
    slug: 'white-label-brands',
    metaTitle: 'White Label Banarasi Sarees & Suits Brand Program | Weave 365',
    metaDescription:
      'Launch a white label Banarasi saree and suit brand with Weave 365. Source products, customize labels and packaging, build catalogs, and grow reseller channels.',
    eyebrow: 'Partner Program',
    badge: 'Market to Customer Face',
    h1: 'White Label Brands for Banarasi Sarees & Suits',
    intro:
      'Build your own ethnic wear brand with Banarasi sarees and suits sourced through trusted manufacturing networks. This page is for brands that want to sell curated products under their own name with customized presentation, packaging, catalog, and customer experience.',
    seoIntro:
      'The Weave 365 white label program helps boutiques, online sellers, and reseller-led brands build a customer-facing Banarasi ethnic wear label without starting from manufacturing infrastructure. Partners can curate wholesale Banarasi sarees, suits, fabrics, and occasion-led collections, then sell them under their own brand identity with improved product presentation, labeling, packaging, catalog storytelling, and reseller support.',
    role:
      'A white label brand selects products from manufacturers or sourcing networks and sells them under its own brand identity, focusing on market trust, presentation, sales, and customer relationships.',
    ctaText: 'Discuss White Labeling',
    ctaRoute: 'bulk-inquiry',
    seal: 'BRAND',
    stats: [
      ['Brand', 'Identity'],
      ['Catalog', 'Presentation'],
      ['Sales', 'Network'],
    ],
    responsibilities: [
      'Build a clear brand identity and product position',
      'Customize packaging, labels, tags, and brand presentation',
      'Select products according to the target market',
      'Grow marketing channels and reseller networks',
      'Manage social media, catalogs, and promotions',
      'Handle customer support and after-sales communication',
      'Maintain consistent brand positioning',
      'Improve product photography and presentation',
      'Manage marketplace or storefront operations',
    ],
    accountability: [
      'Brand reputation maintenance',
      'Customer satisfaction',
      'Sales growth and reseller retention',
      'Consistent product presentation',
      'Return and refund management',
      'Market trust building',
      'Proper branding compliance on every product',
    ],
    guide: [
      {
        icon: Tags,
        title: 'Private Label Setup',
        content:
          'Plan labels, wash-care tags, packaging inserts, catalog language, and presentation standards before the first customer-facing drop.',
      },
      {
        icon: Store,
        title: 'Market Positioning',
        content:
          'Choose product ranges by customer segment, price band, occasion, region, and repeat-sale potential instead of buying only by design appeal.',
      },
      {
        icon: Sparkles,
        title: 'Catalog Experience',
        content:
          'Use clean photos, clear fabric notes, color accuracy, styling cues, and brand-consistent product names to improve conversion and trust.',
      },
      {
        icon: Users,
        title: 'Customer Retention',
        content:
          'Own the frontend relationship through support, returns, reseller education, promotions, and a reliable post-purchase experience.',
      },
    ],
    faqs: [
      {
        q: 'What does white labeling include?',
        a: 'White labeling can include custom brand labels, packaging, product presentation, private catalogs, and product selection aligned with your audience.',
      },
      {
        q: 'Can a white label brand use Weave 365 products under its own name?',
        a: 'Yes, suitable wholesale and bulk products can be curated for private-label selling, subject to product availability and branding requirements.',
      },
      {
        q: 'Is white labeling different from sourcing partnership?',
        a: 'Yes. White labeling is frontend brand and customer focused, while sourcing partnership is backend supply, pricing, quality, and inventory focused.',
      },
    ],
  },
};

const differenceRows = [
  ['Sourcing Partner', 'White Label Brand'],
  ['Arranges products', 'Sells products under its own name'],
  ['Backend supply focus', 'Frontend brand focus'],
  ['Strong manufacturer connection', 'Strong customer connection'],
  ['Manages pricing and sourcing', 'Manages branding and sales'],
  ['Supply-chain driven', 'Market driven'],
];

const relatedSourcingLinks = [
  { label: 'Wholesale Banarasi Sarees', slug: 'wholesale-banarasi-sarees' },
  { label: 'Katan Silk Sarees', slug: 'katan-silk-sarees' },
  { label: 'Organza Banarasi Sarees', slug: 'organza-banarasi-sarees' },
  { label: 'Bridal Banarasi Sarees', slug: 'bridal-banarasi-sarees' },
  { label: 'Meenakari Sarees', slug: 'meenakari-sarees' },
  { label: 'Soft Silk Sarees', slug: 'soft-silk-sarees' },
  { label: 'Wholesale Saree Supplier India', slug: 'wholesale-saree-supplier-india' },
];

export function PartnerProgramPage({ type = 'sourcing-partners', navigate }) {
  const page = partnerPages[type] || partnerPages['sourcing-partners'];
  const alternateType = type === 'sourcing-partners' ? 'white-label-brands' : 'sourcing-partners';
  const alternatePage = partnerPages[alternateType];
  const pageUrl = `https://www.weave365.com/${page.slug}`;
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.weave365.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.h1,
        item: pageUrl,
      },
    ],
  };
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.h1,
    description: page.metaDescription,
    provider: {
      '@type': 'Organization',
      name: 'Weave 365',
      url: 'https://www.weave365.com',
    },
    areaServed: ['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Canada', 'Australia'],
    serviceType: type === 'sourcing-partners' ? 'Banarasi textile sourcing partnership' : 'White label Banarasi ethnic wear program',
    url: pageUrl,
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <article className="partner-program-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <nav className="seo-breadcrumbs partner-program-breadcrumbs" aria-label="Breadcrumb">
        <a href="/" onClick={(event) => { event.preventDefault(); navigate('home'); }}>Home</a>
        <ArrowRight size={12} className="chevron" />
        <span className="current">{page.h1}</span>
      </nav>

      <header className="partner-program-hero">
        <div className="partner-program-hero-copy">
          <span className="partner-program-eyebrow">{page.eyebrow}</span>
          <h1>{page.h1}</h1>
          <p>{page.intro}</p>
          <div className="partner-program-actions">
            <a
              href={`/${page.ctaRoute}`}
              className="partner-program-primary"
              onClick={(event) => {
                event.preventDefault();
                navigate(page.ctaRoute);
              }}
            >
              {page.ctaText}
              <ArrowRight size={16} />
            </a>
            <a
              href={`/${alternateType}`}
              className="partner-program-secondary"
              onClick={(event) => {
                event.preventDefault();
                navigate(alternateType);
              }}
            >
              View {alternatePage.seal.toLowerCase()} role
            </a>
          </div>
        </div>
        <aside className="partner-program-hero-panel" aria-label="Partner role summary">
          <div className="partner-program-seal">
            <Handshake size={26} />
            <span>{page.seal}</span>
          </div>
          <span className="partner-program-panel-kicker">{page.badge}</span>
          <p>{page.role}</p>
          <div className="partner-program-stat-grid">
            {page.stats.map(([label, value]) => (
              <div key={`${label}-${value}`} className="partner-program-stat">
                <strong>{label}</strong>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </aside>
      </header>

      <section className="partner-program-seo-copy">
        <div>
          <span className="partner-program-eyebrow">Banarasi B2B Partner Network</span>
          <h2>{type === 'sourcing-partners' ? 'Direct Varanasi Sourcing Support for Retailers and Export Buyers' : 'Private Label Banarasi Collections for Boutiques and Resellers'}</h2>
        </div>
        <p>{page.seoIntro}</p>
      </section>

      <section className="partner-program-split">
        <div className="partner-program-list-panel">
          <div className="partner-program-section-head">
            <ClipboardCheck size={22} />
            <div>
              <span>Operational Scope</span>
              <h2>Responsibilities</h2>
            </div>
          </div>
          <ul>
            {page.responsibilities.map((item) => (
              <li key={item}>
                <PackageCheck size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="partner-program-list-panel">
          <div className="partner-program-section-head">
            <BadgeCheck size={22} />
            <div>
              <span>Success Standards</span>
              <h2>Accountability</h2>
            </div>
          </div>
          <ul>
            {page.accountability.map((item) => (
              <li key={item}>
                <BadgeCheck size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="seo-guide-section partner-program-guide">
        <div className="seo-guide-container">
          <div className="seo-guide-header">
            <h2>{type === 'sourcing-partners' ? 'Sourcing Workflow Inspired by B2B Buying Pages' : 'Brand Workflow Inspired by White-Label Sourcing'}</h2>
            <p>Structured for Banarasi saree and suit partners who need clarity before scale.</p>
          </div>
          <div className="seo-guide-grid">
            {page.guide.map((section, index) => {
              const Icon = section.icon;
              return (
                <article className="seo-guide-card" key={section.title}>
                  <h3>
                    <Icon size={20} className="seo-card-icon" />
                    {section.title}
                  </h3>
                  <p>{section.content}</p>
                  <div className="seo-step-num">0{index + 1}</div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="partner-program-difference">
        <div className="partner-program-section-head centered">
          <Handshake size={22} />
          <div>
            <span>Simple Difference</span>
            <h2>Sourcing Partner vs White Label Brand</h2>
          </div>
        </div>
        <div className="partner-program-table" role="table" aria-label="Sourcing partner and white label brand comparison">
          {differenceRows.map((row, index) => (
            <div className={index === 0 ? 'partner-program-table-row header' : 'partner-program-table-row'} role="row" key={`${row[0]}-${row[1]}`}>
              <div role="cell">{row[0]}</div>
              <div role="cell">{row[1]}</div>
            </div>
          ))}
        </div>
        <div className="partner-program-callout">
          <p><strong>Sourcing Partner</strong> is the bridge between loom and market.</p>
          <p><strong>White Label Brand</strong> is the face between market and customer.</p>
        </div>
      </section>

      <section className="partner-program-related">
        <div className="partner-program-section-head centered">
          <Store size={22} />
          <div>
            <span>Explore Sourcing Categories</span>
            <h2>Related Banarasi Wholesale Pages</h2>
          </div>
        </div>
        <div className="partner-program-related-grid">
          {relatedSourcingLinks.map((link) => (
            <a
              key={link.slug}
              href={`/${link.slug}`}
              onClick={(event) => {
                event.preventDefault();
                navigate(link.slug);
              }}
            >
              <span>{link.label}</span>
              <ArrowRight size={14} />
            </a>
          ))}
        </div>
      </section>

      <section className="seo-faq-section partner-program-faq">
        <div className="seo-faq-split-container">
          <div className="seo-faq-sticky-left">
            <div className="seo-faq-icon-badge">
              <Handshake size={24} />
            </div>
            <h2>Partner Clarity Before Onboarding</h2>
            <p>Choose the route that matches your strength: supply-side control, or customer-facing brand growth.</p>
            <a
              href={`/${page.ctaRoute}`}
              className="seo-faq-inquiry-btn"
              onClick={(event) => {
                event.preventDefault();
                navigate(page.ctaRoute);
              }}
            >
              <span>Submit Inquiry</span>
              <ArrowRight size={16} />
            </a>
          </div>
          <div className="seo-faq-list">
            {page.faqs.map((faq) => (
              <div className="seo-faq-item active" key={faq.q}>
                <div className="seo-faq-trigger partner-program-faq-static">
                  <h3>{faq.q}</h3>
                </div>
                <div className="seo-faq-content">
                  <div className="seo-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
