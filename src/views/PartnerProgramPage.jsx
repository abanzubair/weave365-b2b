/**
 * @file PartnerProgramPage.jsx
 * @description Editorial & High-converting landing view for Weave365's partnership models:
 * "White Label Brands" (private-label boutique owners, online resellers, luxury ethnic labels) and
 * "Sourcing Partners" (loom-to-market coordinators managing Varanasi supply, MOQ slabs, quality checks).
 * Features interactive profit calculator, packaging showcase, workflow steps, comparison matrix, and dynamic JSON-LD schemas.
 * 
 * @module views/PartnerProgramPage
 * @param {Object} props
 * @param {string} [props.type='white-label'] - Partnership channel to display ('white-label' or 'sourcing-partners')
 * @param {Function} props.navigate - Client router transition callback
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Coins,
  Compass,
  Factory,
  Handshake,
  Layers,
  PackageCheck,
  PackagePlus,
  Percent,
  QrCode,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Store,
  Tags,
  Truck,
  Users,
  Zap,
} from 'lucide-react';
import { siteUrl } from '../config.js';

// Configuration data for White Label & Sourcing Partner pages
const partnerPages = {
  'white-label': {
    slug: 'white-label',
    metaTitle: 'White Label Banarasi Sarees & Suits Brand Program | Weave 365',
    metaDescription:
      'Launch your private label Banarasi saree and suit brand with Weave 365. Source authentic weaves, customize tags & luxury packaging, get unbranded HD catalogs, and ship direct to your clients.',
    eyebrow: 'WEAVE 365 PRIVATE LABEL ECOSYSTEM',
    badge: 'Market-to-Customer Brand Acceleration',
    h1: 'Launch & Scale Your Private Banarasi Ethnic Label',
    intro:
      'Build a high-margin luxury saree & suit brand backed by direct Varanasi loom infrastructure. We supply authentic Banarasi weaves, custom woven neck-tags, rigid brand boxes, unbranded HD catalogs, and blind dropshipping direct to your customers.',
    seoIntro:
      'The Weave 365 White Label Program empowers boutiques, fashion entrepreneurs, online sellers, and luxury ethnic brands to launch premium Banarasi collections without investing in weaving looms or warehouse inventory. Curate authentic Katan Silk, Organza, Georgette, and Tissue Banarasi sarees and suit sets, brand them with your custom labels and packaging, and leverage our Varanasi fulfillment ecosystem.',
    role:
      'A White Label Brand owns customer trust, brand identity, product curation, and retail growth, while Weave 365 acts as your silent, direct-from-loom manufacturing and white-label fulfillment backbone.',
    ctaText: 'Start White Label Inquiry',
    ctaRoute: 'bulk-inquiry',
    seal: 'BRAND',
    heroImage: 'https://assets.weave365.com/assets/banner/collab-brand-hero2.jpg',
    stats: [
      ['Margin', '40% – 65% Net'],
      ['Branding', 'Custom Tags & Packaging'],
      ['Catalogs', 'Unbranded HD 4K'],
      ['Shipping', 'Blind Worldwide'],
    ],
    responsibilities: [
      'Build brand positioning & customer pricing strategy',
      'Curate collections tailored to your target audience',
      'Provide custom logo artwork for tags & box packaging',
      'Drive marketing, social media, and client acquisition',
      'Manage client support & storefront experience',
      'Set retail prices and profit margins',
    ],
    accountability: [
      '100% Genuine Varanasi Craft & Silk Certification',
      'Strict Zero-Poaching Guarantee (Your clients stay yours)',
      'Pre-dispatch 5-Point Quality Inspection',
      'Custom packaging compliance on every dispatch',
      'Fast turnaround for custom tagging & blind shipping',
      'Live stock & catalog update access',
    ],
    guide: [
      {
        step: '01',
        title: 'Curate Your Collection',
        subtitle: 'Select from 1,000+ Varanasi Weaves',
        content:
          'Access our live catalog of Katan silk, Organza, Chanderi, Georgette sarees, and bridal suit sets. Filter by price point, weave technique (Kadwa, Cutwork, Tanchoi), and color palettes.',
        icon: Compass,
      },
      {
        step: '02',
        title: 'Custom Branding & Packaging',
        subtitle: 'Your Name on Every Item & Box',
        content:
          'We craft high-density woven satin neck tags, wash-care cards, satin dust bags, and magnetic gold-foil boxes bearing your brand name and logo.',
        icon: Tags,
      },
      {
        step: '03',
        title: 'Unbranded HD Catalogs',
        subtitle: 'Ready-to-Post Marketing Assets',
        content:
          'Download high-resolution, unbranded model photos, 4K product video reels, and PDF catalogs to publish immediately on your website, Instagram, or WhatsApp business store.',
        icon: Sparkles,
      },
      {
        step: '04',
        title: 'Blind Fulfillment & Shipping',
        subtitle: 'Direct to Customer with Your Sender ID',
        content:
          'When orders arrive, we pack with your custom boxes and dispatch directly to your end-client. Packages carry your brand sender address—zero Weave 365 markers.',
        icon: Truck,
      },
    ],
    faqs: [
      {
        q: 'What is included in the Weave 365 White Label Program?',
        a: 'The program includes direct wholesale access to authentic Banarasi sarees and suit sets, custom woven brand neck tags, customized luxury box packaging, unbranded 4K product photography and video reels, and blind direct-to-customer order fulfillment.',
      },
      {
        q: 'What is the Minimum Order Quantity (MOQ) for custom branded products?',
        a: 'We offer flexible MOQ slabs starting from as few as 5 to 10 pieces per order for private label packaging. For custom woven satin neck-tag production, initial tag setup starts at 200 tags, which are stored securely in our dispatch center.',
      },
      {
        q: 'Will Weave 365 contact or sell directly to my end-customers?',
        a: 'Never. We operate under a strict non-disclosure and anti-poaching agreement. Blind dispatches carry your brand name as the sender, and no Weave 365 invoices, flyers, or branding are ever included.',
      },
      {
        q: 'Can I request sample pieces before placing a larger white label order?',
        a: 'Yes! We encourage new white label partners to request a White Label Sample Kit containing fabric swatches, sample woven tags, sample luxury packaging boxes, and 2-3 sample sarees/suits.',
      },
      {
        q: 'How do digital unbranded catalogs work?',
        a: 'Upon joining, you get access to our cloud drive containing watermark-free, unbranded 4K photos and reels. You can add your logo or price tag and post directly to your social media or online store.',
      },
    ],
  },
  'sourcing-partners': {
    slug: 'sourcing-partners',
    metaTitle: 'Sourcing Partners for Banarasi Sarees & Suits | Weave 365',
    metaDescription:
      'Become a Banarasi saree and suit sourcing partner with Weave 365. Coordinate weavers, MOQ, wholesale pricing, catalog support, quality checks, stock updates, and dispatch.',
    eyebrow: 'LOOM-TO-MARKET SUPPLY ECOSYSTEM',
    badge: 'Backend Supply Chain Coordination',
    h1: 'Direct Sourcing Partnership for Banarasi Sarees & Suits',
    intro:
      'Act as the backend sourcing bridge for authentic Banarasi sarees, suits, fabrics, and bulk requirements. Coordinate loom production, quality inspection, pricing, and dispatch discipline across Varanasi weaving hubs.',
    seoIntro:
      'Weave 365 works with sourcing partners who understand the Banarasi textile ecosystem from loom-level production to boutique-ready inventory. The program is designed for partners who can source authentic Banarasi sarees, Banarasi suits, fabrics, bridal collections, and custom bulk requirements while protecting quality, dispatch timelines, and transparent wholesale pricing.',
    role:
      'A Sourcing Partner coordinates, inspects, and manages the supply chain between artisan looms, master weavers, wholesalers, boutiques, and export networks.',
    ctaText: 'Start Sourcing Inquiry',
    ctaRoute: 'bulk-inquiry',
    seal: 'SOURCE',
    heroImage: 'https://assets.weave365.com/assets/banner/weaver-partner.jpg',
    stats: [
      ['MOQ', 'Flexible Slabs'],
      ['QC', 'Pre-Dispatch Check'],
      ['Stock', 'Live Loom Sync'],
      ['Sourcing', 'Direct Varanasi'],
    ],
    responsibilities: [
      'Coordinate directly with weavers and master artisans',
      'Arrange latest Banarasi saree and suit weave collections',
      'Negotiate wholesale pricing, MOQ slabs, and fabric quality',
      'Maintain live stock availability and inventory communication',
      'Track production and dispatch timelines',
      'Inspect product quality before final packaging',
    ],
    accountability: [
      'Correct product delivery & weave specification match',
      'Consistent quality maintenance across bulk lots',
      'On-time dispatch SLA enforcement',
      'Transparent & competitive wholesale pricing',
      'Low defect ratio & instant replacement policy',
      'Ethical sourcing & genuine Banarasi artisan welfare',
    ],
    guide: [
      {
        step: '01',
        title: 'Weaver & Loom Coordination',
        subtitle: 'Connect Demand with Varanasi Artisans',
        content:
          'Link buyer demand directly with authentic Varanasi weaving looms, clarifying silk purity, zari grade, colorways, and weave readiness before orders begin.',
        icon: Factory,
      },
      {
        step: '02',
        title: 'Quality Documentation & Specs',
        subtitle: 'Pre-Dispatch Quality Assurance',
        content:
          'Audit zari purity, finishing, fabric weight, and weave density. Document catalog specs and photographs so buyers receive identical pieces.',
        icon: ScanSearch,
      },
      {
        step: '03',
        title: 'Timeline & Logistics Control',
        subtitle: 'Milestone Tracking for Orders',
        content:
          'Track loom weaving progress, dyeing schedules, finishing, and dispatch risks to guarantee order fulfillment for boutique launches and export shipments.',
        icon: Truck,
      },
      {
        step: '04',
        title: 'Bulk & Custom Sourcing',
        subtitle: 'Custom Weave & Color Matching',
        content:
          'Support bulk orders with clear MOQ slabs, custom color dyeing, motif customization, and alternate suggestions when stock shifts.',
        icon: Boxes,
      },
    ],
    faqs: [
      {
        q: 'Who is a Sourcing Partner best suited for?',
        a: 'This role is designed for textile professionals, agents, and coordinators with strong manufacturer/artisan connections in Varanasi who can manage quality control, stock updates, and dispatch accuracy.',
      },
      {
        q: 'Does a Sourcing Partner build their own consumer brand?',
        a: 'Not primarily. Sourcing partners focus on backend supply chain efficiency, quality control, loom coordination, and bulk fulfillment rather than consumer-facing retail branding.',
      },
      {
        q: 'Can Sourcing Partners manage custom bulk orders for export?',
        a: 'Yes. Custom bulk sourcing—including silk certification, custom colorways, zari customization, and export packaging—is a core capability of our sourcing partner network.',
      },
    ],
  },
};

// Packaging options dataset for White Label Brands
const packagingOptions = [
  {
    id: 'neck-tags',
    title: 'Custom Woven Satin Neck-Tags',
    subtitle: 'Luxury High-Density Woven Labels',
    desc: 'Custom woven satin & damask labels stitched onto saree pallus, suit necklines, or dupatta edges with your brand name, logo, and wash care instructions.',
    icon: Tags,
    badge: 'Branding Core',
    previewText: 'YOUR BRAND NAME • HANDMADE BANARASI SILK',
  },
  {
    id: 'gift-boxes',
    title: 'Rigid Gold-Foil Gift Boxes',
    subtitle: 'Magnetic Closure Premium Packaging',
    desc: 'Luxurious rigid boxes with gold or silver foil logo embossing, silk ribbon pulls, and tissue wraps that create an unforgettable unboxing experience.',
    icon: PackagePlus,
    badge: 'Luxury Unboxing',
    previewText: 'STAMPED WITH YOUR LOGO IN METALLIC GOLD',
  },
  {
    id: 'hd-catalogs',
    title: 'Unbranded 4K Digital Catalogs',
    subtitle: 'Studio Photography & Reels',
    desc: 'Access thousands of watermark-free, unbranded model photos and video reels ready to post directly to your website, Instagram feed, or WhatsApp catalogs.',
    icon: Sparkles,
    badge: 'Marketing Ready',
    previewText: 'WATERMARK-FREE 4K IMAGES & VIDEO REELS',
  },
  {
    id: 'blind-shipping',
    title: 'Blind Direct-to-Client Fulfillment',
    subtitle: 'Zero Weave 365 Markers',
    desc: 'We pack and ship directly to your end-customers. Shipping labels display YOUR brand name as the sender with zero Weave 365 invoices or branding.',
    icon: Truck,
    badge: 'White-Label Drop',
    previewText: 'SENDER: YOUR BRAND NAME • DESTINATION: CLIENT',
  },
];

// Side-by-side comparison data
const comparisonData = [
  {
    feature: 'Primary Focus',
    whiteLabel: 'Frontend Retail Brand, Marketing & Customer Retention',
    sourcingPartner: 'Backend Supply Chain, Weaver Coordination & QC',
    traditionalRetail: 'Reselling Generic Stock from Wholesalers',
  },
  {
    feature: 'Product Branding',
    whiteLabel: '100% Your Brand (Custom Tags, Boxes & Invoices)',
    sourcingPartner: 'Unbranded / Mill Tags for Bulk Trade',
    traditionalRetail: 'Third-party Mill / Supplier Branding',
  },
  {
    feature: 'Marketing Assets',
    whiteLabel: 'Unbranded HD Photos, 4K Reels & Digital Catalogs',
    sourcingPartner: 'Technical Spec Sheets & Live Inventory Lists',
    traditionalRetail: 'Low-res Supplier Photos with Watermarks',
  },
  {
    feature: 'Order Fulfillment',
    whiteLabel: 'Blind Direct Shipping to End-Clients under Your Brand',
    sourcingPartner: 'Bulk Warehouse / Dispatch to Retailers & Exporters',
    traditionalRetail: 'Self-handling & Storage in Local Store',
  },
  {
    feature: 'Profit Margin Potential',
    whiteLabel: '40% to 65%+ Net Margin via Brand Premium',
    sourcingPartner: 'Volume Commission / Sourcing Spread',
    traditionalRetail: '15% to 25% Low Margin Resell',
  },
];

// Related catalog links
const relatedSourcingLinks = [
  { label: 'Katan Silk Sarees', slug: 'katan-silk-sarees' },
  { label: 'Organza Banarasi Sarees', slug: 'organza-banarasi-sarees' },
  { label: 'Bridal Banarasi Sarees', slug: 'bridal-banarasi-sarees' },
  { label: 'Meenakari Silk Sarees', slug: 'meenakari-sarees' },
  { label: 'Banarasi Suit Sets', slug: 'banarasi-suits' },
  { label: 'Wholesale Saree Supplier India', slug: 'wholesale-saree-supplier-india' },
];

export function PartnerProgramPage({ type = 'white-label', navigate }) {
  const activeType = partnerPages[type] ? type : 'white-label';
  const page = partnerPages[activeType];
  const alternateType = activeType === 'white-label' ? 'sourcing-partners' : 'white-label';
  const alternatePage = partnerPages[alternateType];
  const pageUrl = `${siteUrl}/${page.slug}`;

  // Interactive Profit Calculator State (White Label feature)
  const [calcVolume, setCalcVolume] = useState(50); // Monthly units
  const [calcCategory, setCalcCategory] = useState('katan'); // katan, organza, bridal, suits
  const [calcMarkup, setCalcMarkup] = useState(2.2); // 1.8x, 2.2x, 2.5x

  // Category average wholesale price map
  const categoryPrices = {
    katan: { wholesale: 3800, name: 'Katan Silk Sarees' },
    organza: { wholesale: 2600, name: 'Organza Banarasi Sarees' },
    bridal: { wholesale: 7500, name: 'Heavy Bridal Sarees' },
    suits: { wholesale: 1950, name: 'Banarasi Suit Sets' },
  };

  const calcResults = useMemo(() => {
    const unitWholesale = categoryPrices[calcCategory].wholesale;
    const unitRetail = Math.round(unitWholesale * calcMarkup);
    const unitProfit = unitRetail - unitWholesale;
    const monthlyRevenue = unitRetail * calcVolume;
    const monthlyCost = unitWholesale * calcVolume;
    const monthlyProfit = unitProfit * calcVolume;
    const marginPercent = Math.round(((unitRetail - unitWholesale) / unitRetail) * 100);

    return {
      unitWholesale,
      unitRetail,
      unitProfit,
      monthlyRevenue,
      monthlyCost,
      monthlyProfit,
      marginPercent,
    };
  }, [calcVolume, calcCategory, calcMarkup]);

  // Selected Packaging Option State
  const [selectedPkg, setSelectedPkg] = useState('neck-tags');

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Quick inquiry modal trigger / navigation
  const handleInquiry = () => {
    const route = page.ctaRoute || 'bulk-inquiry';
    navigate(route);
  };

  // Structured Data Schemas
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: page.h1, item: pageUrl },
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
      url: siteUrl,
    },
    areaServed: ['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Canada', 'Australia'],
    serviceType: activeType === 'white-label' ? 'White label Banarasi ethnic wear program' : 'Banarasi textile sourcing partnership',
    url: pageUrl,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };

  return (
    <article className={`partner-program-page theme-${activeType}`}>
      {/* Schema Scripts */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Top Channel Navigation Bar */}
      <div className="partner-channel-selector-bar">
        <div className="partner-channel-selector-container">
          <span className="partner-channel-label">Select Partner Track:</span>
          <div className="partner-channel-tabs">
            <button
              type="button"
              className={`partner-channel-tab ${activeType === 'white-label' ? 'active' : ''}`}
              onClick={() => navigate('white-label')}
            >
              <Store size={15} />
              <span>White Label Brands</span>
              <span className="tab-pill">Boutique & Retail</span>
            </button>
            <button
              type="button"
              className={`partner-channel-tab ${activeType === 'sourcing-partners' ? 'active' : ''}`}
              onClick={() => navigate('sourcing-partners')}
            >
              <Factory size={15} />
              <span>Sourcing Partners</span>
              <span className="tab-pill">Loom & Supply</span>
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <nav className="seo-breadcrumbs partner-program-breadcrumbs" aria-label="Breadcrumb">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('home'); }}>Home</a>
        <ArrowRight size={12} className="chevron" />
        <span className="current">{page.h1}</span>
      </nav>

      {/* Hero Section */}
      <header className="partner-program-hero">
        <div className="partner-program-hero-copy">
          <span className="partner-program-eyebrow">{page.eyebrow}</span>
          <h1>{page.h1}</h1>
          <p className="partner-hero-intro">{page.intro}</p>

          <div className="partner-hero-highlights">
            <div className="partner-highlight-item">
              <CheckCircle2 size={16} className="highlight-icon" />
              <span>Direct Varanasi Loom Prices</span>
            </div>
            <div className="partner-highlight-item">
              <CheckCircle2 size={16} className="highlight-icon" />
              <span>100% Brand Confidentiality</span>
            </div>
            <div className="partner-highlight-item">
              <CheckCircle2 size={16} className="highlight-icon" />
              <span>No Minimum Inventory Risk</span>
            </div>
          </div>

          <div className="partner-program-actions">
            <button
              type="button"
              className="partner-program-primary"
              onClick={() => handleInquiry()}
            >
              <span>{page.ctaText}</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="partner-program-secondary"
              onClick={() => navigate(alternateType)}
            >
              <span>Switch to {alternatePage.seal} role</span>
            </button>
          </div>
        </div>

        {/* Hero Visual Panel (Refined Light Luxury Design) */}
        <aside className="partner-program-hero-panel">
          <div className="hero-panel-media" style={{ backgroundImage: `url(${page.heroImage})` }}>
            <div className="partner-seal-badge">
              <Handshake size={18} />
              <span>{page.seal} PROGRAM</span>
            </div>
          </div>

          <div className="hero-panel-body">
            <span className="partner-panel-kicker">{page.badge}</span>
            <p className="partner-panel-role">{page.role}</p>

            <div className="partner-spec-list">
              {page.stats.map(([label, value]) => (
                <div key={`${label}-${value}`} className="partner-spec-item">
                  <span className="spec-label">{label}</span>
                  <span className="spec-dots" aria-hidden="true" />
                  <strong className="spec-value">{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </header>

      {/* SEO Strategic Narrative */}
      <section className="partner-program-seo-copy">
        <div className="seo-copy-header">
          <span className="seo-subhead-badge">EXPERT ECOSYSTEM</span>
          <h2>
            {activeType === 'white-label'
              ? 'Empowering Boutique Owners & Online Sellers with Private Label Power'
              : 'Direct Varanasi Sourcing Infrastructure for Retailers & Export Buyers'}
          </h2>
        </div>
        <p>{page.seoIntro}</p>
      </section>

      {/* 4-Step Visual Partner Journey */}
      <section className="partner-journey-section">
        <div className="section-container">
          <div className="section-header-center">
            <span className="section-eyebrow">CLEAR 4-STEP WORKFLOW</span>
            <h2>How the {activeType === 'white-label' ? 'White Label' : 'Sourcing'} Program Works</h2>
            <p>Designed for clarity, fast execution, and seamless business growth.</p>
          </div>

          <div className="journey-grid">
            {page.guide.map((item) => {
              const StepIcon = item.icon;
              return (
                <div key={item.step} className="journey-card">
                  <div className="journey-card-top">
                    <div className="journey-icon-box">
                      <StepIcon size={22} />
                    </div>
                    <span className="journey-step-tag">{item.step}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <h4>{item.subtitle}</h4>
                  <p>{item.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHITE LABEL EXCLUSIVE: Interactive Profit & Margin Calculator */}
      {activeType === 'white-label' && (
        <section className="partner-calculator-section">
          <div className="section-container">
            <div className="calculator-wrapper">
              <div className="calculator-info">
                <div className="calc-badge">
                  <Coins size={18} />
                  <span>Interactive ROI Estimator</span>
                </div>
                <h2>White Label Profit & Margin Calculator</h2>
                <p>
                  Estimate your brand revenue and net profits when selling private label Banarasi sarees and suit sets to your customers.
                </p>

                <div className="calc-benefits">
                  <div className="benefit-row">
                    <CheckCircle2 size={16} />
                    <span><strong>High Markup Potential:</strong> Authenticity commands 2.0x to 3.0x retail markups.</span>
                  </div>
                  <div className="benefit-row">
                    <CheckCircle2 size={16} />
                    <span><strong>Zero Storage Costs:</strong> Leverage our Varanasi fulfillment center directly.</span>
                  </div>
                  <div className="benefit-row">
                    <CheckCircle2 size={16} />
                    <span><strong>Transparent Sourcing:</strong> Pay pure wholesale prices with no middleman markup.</span>
                  </div>
                </div>
              </div>

              <div className="calculator-card">
                <div className="calc-controls">
                  <div className="control-group">
                    <label htmlFor="calc-category-select">Product Category</label>
                    <select
                      id="calc-category-select"
                      value={calcCategory}
                      onChange={(e) => setCalcCategory(e.target.value)}
                    >
                      <option value="katan">Katan Silk Sarees (Avg Wholesale ₹3,800)</option>
                      <option value="organza">Organza Banarasi Sarees (Avg Wholesale ₹2,600)</option>
                      <option value="bridal">Heavy Bridal Sarees (Avg Wholesale ₹7,500)</option>
                      <option value="suits">Banarasi Suit Sets (Avg Wholesale ₹1,950)</option>
                    </select>
                  </div>

                  <div className="control-group">
                    <div className="label-with-val">
                      <label htmlFor="calc-volume-slider">Monthly Sales Volume</label>
                      <span className="slider-val-badge">{calcVolume} Pcs / month</span>
                    </div>
                    <input
                      id="calc-volume-slider"
                      type="range"
                      min="10"
                      max="300"
                      step="10"
                      value={calcVolume}
                      onChange={(e) => setCalcVolume(Number(e.target.value))}
                    />
                  </div>

                  <div className="control-group">
                    <label>Target Retail Markup Multiplier</label>
                    <div className="markup-btn-group">
                      {[
                        { val: 1.8, label: '1.8x (Conservative)' },
                        { val: 2.2, label: '2.2x (Standard)' },
                        { val: 2.5, label: '2.5x (Premium Boutique)' },
                      ].map((m) => (
                        <button
                          key={m.val}
                          type="button"
                          className={`markup-btn ${calcMarkup === m.val ? 'active' : ''}`}
                          onClick={() => setCalcMarkup(m.val)}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="calc-output-panel">
                  <div className="calc-stat-row">
                    <div className="calc-stat">
                      <span className="calc-stat-lbl">Wholesale Cost / Pc</span>
                      <strong className="calc-stat-val">₹{calcResults.unitWholesale.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="calc-stat">
                      <span className="calc-stat-lbl">Selling Price / Pc</span>
                      <strong className="calc-stat-val highlight">₹{calcResults.unitRetail.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="calc-stat">
                      <span className="calc-stat-lbl">Net Margin %</span>
                      <strong className="calc-stat-val calc-margin-val">{calcResults.marginPercent}%</strong>
                    </div>
                  </div>

                  <div className="calc-divider" />

                  <div className="calc-total-box">
                    <div>
                      <span className="calc-total-lbl">Estimated Monthly Net Profit</span>
                      <strong className="calc-total-val">₹{calcResults.monthlyProfit.toLocaleString('en-IN')}</strong>
                    </div>
                    <button
                      type="button"
                      className="calc-apply-btn"
                      onClick={() => handleInquiry()}
                    >
                      <span>Get Started</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* WHITE LABEL EXCLUSIVE: Packaging & Branding Options Showcase */}
      {activeType === 'white-label' && (
        <section className="partner-packaging-section">
          <div className="section-container">
            <div className="section-header-center">
              <span className="section-eyebrow">CUSTOM PACKAGING & BRANDING</span>
              <h2>Your Brand Identity on Every Product & Package</h2>
              <p>Select your preferred white-label packaging and marketing support options.</p>
            </div>

            <div className="packaging-grid">
              {packagingOptions.map((pkg) => {
                const PkgIcon = pkg.icon;
                const isSelected = selectedPkg === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className={`packaging-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedPkg(pkg.id)}
                  >
                    <div className="pkg-card-top">
                      <div className="pkg-icon-badge">
                        <PkgIcon size={20} />
                      </div>
                      <span className="pkg-badge">{pkg.badge}</span>
                    </div>
                    <h3>{pkg.title}</h3>
                    <h4>{pkg.subtitle}</h4>
                    <p>{pkg.desc}</p>
                    <div className="pkg-preview-box">
                      <span className="preview-lbl">Preview Standard:</span>
                      <code>{pkg.previewText}</code>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Split Responsibility & Accountability Grid */}
      <section className="partner-program-split">
        <div className="partner-program-list-panel">
          <div className="partner-program-section-head">
            <ClipboardCheck size={22} />
            <div>
              <h2>Your Primary Focus</h2>
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
              <h2>Our Service Commitment to You</h2>
            </div>
          </div>
          <ul>
            {page.accountability.map((item) => (
              <li key={item}>
                <ShieldCheck size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Side-by-Side Comparison Matrix */}
      <section className="partner-program-difference">
        <div className="section-container">
          <div className="partner-program-section-head centered">
            <Handshake size={22} />
            <div>
              <h2>Comparing Business Models</h2>
              <p className="sub-desc">See how White Label Branding compares with Sourcing Partnership and traditional retail buying.</p>
            </div>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table" aria-label="Partner Program comparison table">
              <thead>
                <tr>
                  <th>Feature / Dimension</th>
                  <th className={activeType === 'white-label' ? 'active-col' : ''}>White Label Brand</th>
                  <th className={activeType === 'sourcing-partners' ? 'active-col' : ''}>Sourcing Partner</th>
                  <th>Traditional Retail Buy</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.feature}>
                    <td className="row-feature">{row.feature}</td>
                    <td className={activeType === 'white-label' ? 'active-col' : ''}>{row.whiteLabel}</td>
                    <td className={activeType === 'sourcing-partners' ? 'active-col' : ''}>{row.sourcingPartner}</td>
                    <td>{row.traditionalRetail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Related Wholesale Catalog Links */}
      <section className="partner-program-related">
        <div className="section-container">
          <div className="partner-program-section-head centered">
            <Store size={22} />
            <div>
              <h2>Explore Wholesale Banarasi Collections</h2>
            </div>
          </div>
          <div className="partner-program-related-grid">
            {relatedSourcingLinks.map((link) => (
              <a
                key={link.slug}
                href={`/${link.slug}`}
                className="related-cat-card"
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
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className="partner-faq-section">
        <div className="section-container">
          <div className="faq-split-grid">
            <div className="faq-intro-card">
              <span className="faq-badge">TRANSPARENCY FIRST</span>
              <h2>Frequently Asked Questions</h2>
              <p>Everything you need to know about onboarding, custom branding, MOQ, and fulfillment SLAs.</p>
              <div className="faq-cta-box">
                <p>Have custom requirements?</p>
                <button
                  type="button"
                  className="faq-cta-btn"
                  onClick={() => handleInquiry()}
                >
                  <span>Submit Inquiry Form</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className="faq-accordion-list">
              {page.faqs.map((faq, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <div
                    key={faq.q}
                    className={`faq-accordion-item ${isOpen ? 'open' : ''}`}
                  >
                    <button
                      type="button"
                      className="faq-accordion-trigger"
                      onClick={() => setExpandedFaq(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                    >
                      <h3>{faq.q}</h3>
                      <ChevronDown size={18} className={`faq-chevron ${isOpen ? 'rotated' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="faq-accordion-body">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}

export default PartnerProgramPage;
