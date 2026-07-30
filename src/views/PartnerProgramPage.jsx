/**
 * @file PartnerProgramPage.jsx
 * @description Out-of-Distribution Luxury Landing View for Weave365's partnership models:
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
      'Build a high-margin ethnic wear business with authentic Banarasi sarees and suits from Varanasi. Weave 365 provides direct loom sourcing, unbranded HD catalogues, white label support, and blind dropshipping to your customers.',
    badge: 'Private Label Program',
    h1: 'Sell Authentic Banarasi Weaves Under Your Own Brand',
    intro:
      'Build a high-margin ethnic wear business with authentic Banarasi sarees and suits from Varanasi. Weave 365 provides direct loom sourcing, unbranded HD catalogues, white label support, and blind dropshipping to your customers.',
    role:
      'A White Label Brand owns customer trust, brand identity, product curation, and retail growth, while Weave 365 acts as your silent, direct-from-loom manufacturing and white-label fulfillment backbone.',
    ctaText: 'Start White Label Inquiry',
    ctaRoute: 'bulk-inquiry',
    heroImage: 'https://assets.weave365.com/assets/banner/collab-brand-hero2.jpg',
    stats: [
      ['Margin', '40% – 70% Net'],
      ['Branding', 'Your Own Brand & Packaging'],
      ['Catalogs', 'Unbranded Images'],
      ['Shipping', 'Worldwide'],
    ],
    responsibilities: [
      'Build your brand positioning and customer pricing strategy.',
      'Curate Banarasi saree and suit collections for your target customers.',
      'Provide your logo and brand artwork for custom tags and packaging.',
      'Market your brand through WhatsApp, social media, marketplaces, or your own website.',
      'Manage customer enquiries, sales, and after-sales support.',
      'Set your retail prices and profit margins.',
    ],
    accountability: [
      'Supply authentic Banarasi sarees and suits sourced from Varanasi.',
      'Strict Zero-Poaching Guarantee, your customers always remain your customers.',
      'Perform a 5-point quality inspection before every dispatch.',
      'Pack every order using your approved branded packaging.',
      'Provide custom tagging, White Label fulfilment, and blind shipping.',
      'Maintain live stock availability and updated White Label catalogues.',
    ],
    guide: [
      {
        step: '01',
        title: 'Choose Your Collection',
        content:
          'Browse our ready-stock catalogue of authentic Banarasi sarees and suits, including Katan Silk, Organza, Chanderi, Georgette, Tissue, Soft Silk and unstitched suit sets. Select products based on fabric, weave, colour, design, and wholesale price.',
        icon: Compass,
      },
      {
        step: '02',
        title: 'Add Your Brand Identity',
        content:
          'We customise your orders with your brand name using custom tags, brand labels, branded packaging, and branding materials, helping you build your own ethnic wear brand while maintaining complete brand confidentiality.',
        icon: Tags,
      },
      {
        step: '03',
        title: 'Share, Download & List Products',
        content:
          'Access high-resolution, unbranded product images and catalogues to share on WhatsApp, Instagram, Facebook, and online marketplaces, or list products on your own website without Weave 365 branding. Start selling without holding inventory.',
        icon: Sparkles,
      },
      {
        step: '04',
        title: 'Blind Fulfilment & Shipping',
        content:
          'After you receive an order, we pack your products using your branded packaging and dispatch them directly to your customer. Every shipment is sent with blind fulfilment, without Weave 365 branding, helping you deliver a consistent branded customer experience.',
        icon: Truck,
      },
    ],
    faqs: [
      {
        q: 'What is included in the Weave 365 White Label Program?',
        a: 'The Weave 365 White Label Program includes unbranded HD catalogues, direct wholesale access to authentic Banarasi sarees and suits, custom tags, brand labels, branded packaging, White Label fulfilment, and blind dropshipping directly to your customers.',
      },
      {
        q: 'What is the Minimum Order Quantity (MOQ) for custom branded products?',
        a: 'We offer flexible MOQs starting from 5 to 10 pieces for White Label packaging. For custom branding, the initial setup requires a minimum order of 200 custom tags, which are securely stored at our fulfilment centre for future orders.',
      },
      {
        q: 'Will Weave 365 contact or sell directly to my customers?',
        a: 'No. We follow a strict Zero-Poaching Policy. Your customers always remain your customers. Every order is shipped through blind fulfilment using your brand name, and no Weave 365 invoices, promotional materials, or branding are included in the shipment.',
      },
      {
        q: 'What is required before placing a White Label order?',
        a: 'Before placing a White Label order, you need to finalise your brand name, provide your logo artwork, approve your custom tags and packaging design, and complete the initial custom tag setup. Once your branding materials are ready, all future orders can be fulfilled under your brand.',
      },
      {
        q: 'How do the unbranded White Label catalogues work?',
        a: 'After joining the Weave 365 White Label Program, you receive access to high-resolution, unbranded product images and catalogues of authentic Banarasi sarees and suits. You can add your own logo, pricing, and branding before sharing them on WhatsApp, Instagram, Facebook, online marketplaces, or your own website.',
      },
    ],
  },
  'sourcing-partners': {
    slug: 'sourcing-partners',
    metaTitle: 'Sourcing Partners for Banarasi Sarees & Suits | Weave 365',
    metaDescription:
      'Become a Banarasi saree and suit sourcing partner with Weave 365. Coordinate weavers, MOQ, wholesale pricing, catalog support, quality checks, stock updates, and dispatch.',
    badge: 'Backend Supply Chain Network',
    h1: 'Direct Loom Sourcing for Wholesale & Export Buyers',
    intro:
      'Act as the backend sourcing bridge for authentic Banarasi sarees, suits, fabrics, and bulk requirements. Coordinate loom production, quality inspection, pricing, and dispatch discipline across Varanasi weaving hubs.',
    role:
      'A Sourcing Partner coordinates, inspects, and manages the supply chain between artisan looms, master weavers, wholesalers, boutiques, and export networks.',
    ctaText: 'Start Sourcing Inquiry',
    ctaRoute: 'bulk-inquiry',
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
        content:
          'Link buyer demand directly with authentic Varanasi weaving looms, clarifying silk purity, zari grade, colorways, and weave readiness before orders begin.',
        icon: Factory,
      },
      {
        step: '02',
        title: 'Quality Documentation & Specs',
        content:
          'Audit zari purity, finishing, fabric weight, and weave density. Document catalog specs and photographs so buyers receive identical pieces.',
        icon: ScanSearch,
      },
      {
        step: '03',
        title: 'Timeline & Logistics Control',
        content:
          'Track loom weaving progress, dyeing schedules, finishing, and dispatch risks to guarantee order fulfillment for boutique launches and export shipments.',
        icon: Truck,
      },
      {
        step: '04',
        title: 'Bulk & Custom Sourcing',
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
    desc: 'Custom woven satin & damask labels stitched onto saree pallus, suit necklines, or dupatta edges with your brand name, logo, and wash care instructions.',
    icon: Tags,
    badge: 'Branding Core',
    previewText: 'YOUR BRAND NAME • HANDMADE BANARASI SILK',
  },
  {
    id: 'gift-boxes',
    title: 'Rigid Gold-Foil Gift Boxes',
    desc: 'Luxurious rigid boxes with gold or silver foil logo embossing, silk ribbon pulls, and tissue wraps that create an unforgettable unboxing experience.',
    icon: PackagePlus,
    badge: 'Luxury Unboxing',
    previewText: 'STAMPED WITH YOUR LOGO IN METALLIC GOLD',
  },
  {
    id: 'hd-catalogs',
    title: 'Unbranded 4K Digital Catalogs',
    desc: 'Access thousands of watermark-free, unbranded model photos and video reels ready to post directly to your website, Instagram feed, or WhatsApp catalogs.',
    icon: Sparkles,
    badge: 'Marketing Ready',
    previewText: 'WATERMARK-FREE 4K IMAGES & VIDEO REELS',
  },
  {
    id: 'blind-shipping',
    title: 'Blind Direct-to-Client Fulfillment',
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
    whiteLabel: '40% – 65% Net Margins (2.0x – 3.0x Retail Markup)',
    sourcingPartner: 'High-Volume Wholesale Spread & Sourcing Commissions',
    traditionalRetail: '15% – 25% Limited Margin After Middlemen',
  },
];

export function PartnerProgramPage({ type = 'white-label', navigate }) {
  const activeType = partnerPages[type] ? type : 'white-label';
  const page = partnerPages[activeType];

  const [expandedFaq, setExpandedFaq] = useState(0);
  const [selectedPkg, setSelectedPkg] = useState('neck-tags');

  // Profit Calculator State
  const [calcPriceRange, setCalcPriceRange] = useState('3000-4999');
  const [calcVolume, setCalcVolume] = useState(30);
  const [calcMarkup, setCalcMarkup] = useState(2.2);

  // Profit Calculator Logic
  const calcResults = useMemo(() => {
    const wholesalePrices = {
      '500-999': 750,
      '1000-1999': 1500,
      '3000-4999': 3800,
      '5000-9999': 7500,
    };
    const unitWholesale = wholesalePrices[calcPriceRange] || 3800;
    const unitRetail = Math.round(unitWholesale * calcMarkup);
    const unitProfit = unitRetail - unitWholesale;
    const monthlyCost = unitWholesale * calcVolume;
    const monthlyRevenue = unitRetail * calcVolume;
    const monthlyProfit = unitProfit * calcVolume;
    const marginPercent = Math.round((unitProfit / unitRetail) * 100);

    return {
      unitWholesale,
      unitRetail,
      unitProfit,
      monthlyCost,
      monthlyRevenue,
      monthlyProfit,
      marginPercent,
    };
  }, [calcPriceRange, calcVolume, calcMarkup]);

  const handleInquiry = () => {
    if (typeof navigate === 'function') {
      navigate(page.ctaRoute);
    } else {
      window.location.href = `/${page.ctaRoute}`;
    }
  };

  return (
    <div className="partner-atelier-view">
      {/* Hero Master Section */}
      <section className="atelier-hero-section">
        <div className="atelier-hero-grid">
          <div className="atelier-hero-content">
            <span className="atelier-badge">{page.badge}</span>
            <h1>{page.h1}</h1>
            <p className="atelier-hero-lead">{page.intro}</p>

            <div className="atelier-metrics-row">
              {page.stats.map(([lbl, val]) => (
                <div key={lbl} className="atelier-metric-item">
                  <span className="metric-lbl">{lbl}:</span>
                  <span className="metric-val">{val}</span>
                </div>
              ))}
            </div>

            <div className="atelier-hero-actions">
              <button
                type="button"
                className="atelier-btn-primary"
                onClick={handleInquiry}
              >
                <span>{page.ctaText}</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="atelier-btn-secondary"
                onClick={() => navigate('catalogue')}
              >
                <span>Explore Catalog</span>
              </button>
            </div>
          </div>

          <div className="atelier-hero-visual">
            <div className="visual-card-wrap">
              <img
                src={page.heroImage}
                alt={page.h1}
                className="visual-img"
              />
              <div className="visual-trust-badge">
                <ShieldCheck size={18} />
                <span>100% Genuine Varanasi Loom Certification</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Light Workflow Stepper */}
      <section className="atelier-capabilities-section">
        <div className="atelier-container">
          <div className="atelier-section-head">
            <h2>
              {activeType === 'white-label'
                ? 'How White Label Catalog, Fulfilment & Dropshipping Services Work'
                : 'How the Sourcing Program Works'}
            </h2>
            <p>
              {activeType === 'white-label'
                ? 'A simple process to source authentic Banarasi sarees and suits, access unbranded catalogues, and sell under your own brand with White Label fulfilment and dropshipping services.'
                : 'Designed for clarity, fast execution, and seamless business scaling.'}
            </p>
          </div>

          <div className="light-workflow-stepper">
            {page.guide.map((item) => {
              const StepIcon = item.icon;
              return (
                <div key={item.step} className="light-step-col">
                  <div className="light-step-header">
                    <span className="light-step-badge">{item.step}</span>
                    <StepIcon size={22} className="light-step-icon" />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Related Services — White Label only */}
      {activeType === 'white-label' && (
        <section className="related-services-section">
          <div className="atelier-container">
            <div className="atelier-section-head">
              <h2>Related Services</h2>
              <p>
                Weave 365 offers a complete ecosystem for resellers and online sellers. Start with a White Label Catalog, sell without inventory using Dropshipping Services, let our Order Fulfilment team handle dispatch, and access business resources through the Reseller Centre. Together, these services help you build and scale a Banarasi Sarees and Suits business with zero or lower investment and reduced operational complexity.
              </p>
            </div>

            <div className="related-services-list">
              {/* White Label Catalog */}
              <div className="related-service-row">
                <div className="related-service-header">
                  <span className="related-service-icon"><Tags size={20} /></span>
                  <h3>White Label Catalog</h3>
                </div>
                <p>
                  A White Label Catalog allows resellers, boutiques, online stores, and export buyers to sell authentic Banarasi sarees and suits under their own brand without revealing the supplier's identity. Weave 365 provides unbranded product catalogs that are ready to share on WhatsApp, Instagram, Facebook, or your own website. Simply add your own selling price and profit margin, then start selling without investing in product photography or catalogue creation. To complete the selling process, explore our Dropshipping Services, Order Fulfilment, and Reseller Centre.
                </p>
              </div>

              {/* Dropshipping Services */}
              <div className="related-service-row">
                <div className="related-service-header">
                  <span className="related-service-icon"><Truck size={20} /></span>
                  <h3>Dropshipping Services</h3>
                </div>
                <p>
                  Our Dropshipping Services help you sell Banarasi sarees and suits without purchasing inventory in advance. You receive customer orders, while Weave 365 manages product sourcing, quality inspection, packing, and shipping. This zero or low-investment business model is ideal for resellers, boutiques, home-based businesses, and online sellers who want to start or expand their business with minimal operational overhead.
                </p>
                <button
                  className="related-service-link"
                  onClick={() => navigate('dropshipping')}
                  aria-label="Learn more about Dropshipping Services"
                >
                  Learn More <ArrowRight size={15} />
                </button>
              </div>

              {/* Order Fulfilment */}
              <div className="related-service-row">
                <div className="related-service-header">
                  <span className="related-service-icon"><PackageCheck size={20} /></span>
                  <h3>Order Fulfilment</h3>
                </div>
                <p>
                  Order Fulfilment is the process of preparing and dispatching customer orders after they are confirmed. At Weave 365, every order goes through product inspection, dyeing and finishing where required, professional packing, and timely dispatch before being shipped to your customer or business address. Our fulfilment process helps you deliver authentic Banarasi sarees and suits professionally while eliminating the need to manage inventory, warehousing, or logistics.
                </p>
                <div className="related-service-links-row">
                  <button
                    className="related-service-link"
                    onClick={() => navigate('dropshipping')}
                    aria-label="Explore Dropshipping Services"
                  >
                    Dropshipping <ArrowRight size={15} />
                  </button>
                  <button
                    className="related-service-link"
                    onClick={() => navigate('resell-sarees-online')}
                    aria-label="Explore Reseller Centre"
                  >
                    Reseller Centre <ArrowRight size={15} />
                  </button>
                </div>
              </div>

              {/* Reseller Centre */}
              <div className="related-service-row">
                <div className="related-service-header">
                  <span className="related-service-icon"><Store size={20} /></span>
                  <h3>Reseller Centre</h3>
                </div>
                <p>
                  The Reseller Centre is a dedicated resource hub designed to help you start, manage, and grow your Banarasi sarees and suits business. Access white label catalogs, curated product collections, reseller resources, and business support from one place. Whether you sell through WhatsApp, Instagram, Facebook, marketplaces, or your own website, the Reseller Centre provides the tools and guidance needed to build a profitable reselling business.
                </p>
                <button
                  className="related-service-link"
                  onClick={() => navigate('resell-sarees-online')}
                  aria-label="Visit the Reseller Centre"
                >
                  Visit Reseller Centre <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Core Capability Showcase */}
      <section className="atelier-workflow-light">
        <div className="atelier-container">
          <div className="atelier-section-head">
            <h2>Why Partner With Weave 365</h2>
            <p>
              {activeType === 'white-label'
                ? 'Everything you need to source, brand, and sell authentic Banarasi sarees and suits from Varanasi.'
                : 'Direct Varanasi loom infrastructure built for rapid business growth.'}
            </p>
          </div>

          <div className="capabilities-grid">
            {activeType === 'white-label' ? (
              <>
                <div className="capability-row">
                  <div className="capability-icon">
                    <Factory size={24} />
                  </div>
                  <div className="capability-text">
                    <h3>Direct Loom Sourcing</h3>
                    <p>Source authentic Banarasi sarees and suits directly from Varanasi looms, ensuring genuine weaving, consistent quality, competitive wholesale pricing, and a reliable supply.</p>
                  </div>
                </div>

                <div className="capability-row">
                  <div className="capability-icon">
                    <Tags size={24} />
                  </div>
                  <div className="capability-text">
                    <h3>Private Label Support</h3>
                    <p>Sell authentic Banarasi sarees and suits under your own brand with custom tags, brand labels, branded packaging, and complete brand confidentiality.</p>
                  </div>
                </div>

                <div className="capability-row">
                  <div className="capability-icon">
                    <Boxes size={24} />
                  </div>
                  <div className="capability-text">
                    <h3>Zero Risk Inventory Model</h3>
                    <p>Access live ready-stock Banarasi sarees and suits with 1-piece dropshipping, white label catalogues, and blind shipping directly to your customers, without holding inventory.</p>
                  </div>
                </div>

                <div className="capability-row">
                  <div className="capability-icon">
                    <Coins size={24} />
                  </div>
                  <div className="capability-text">
                    <h3>High Retail Margins</h3>
                    <p>Benefit from direct-from-loom wholesale pricing, helping resellers, boutiques, online sellers, and private label brands achieve healthy retail profit margins.</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="capability-row">
                  <div className="capability-icon">
                    <Factory size={24} />
                  </div>
                  <div className="capability-text">
                    <h3>Direct Loom Rates</h3>
                    <p>Eliminate middleman commissions with pure master-weaver wholesale pricing straight from Varanasi looms.</p>
                  </div>
                </div>

                <div className="capability-row">
                  <div className="capability-icon">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="capability-text">
                    <h3>Pre-Dispatch Inspection</h3>
                    <p>Every saree and suit set undergoes strict 5-point checks for silk purity, zari weave, and finish.</p>
                  </div>
                </div>

                <div className="capability-row">
                  <div className="capability-icon">
                    <Truck size={24} />
                  </div>
                  <div className="capability-text">
                    <h3>Global Logistics SLAs</h3>
                    <p>Full export support, customs documentation, and priority air logistics across 45+ destinations.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* WHITE LABEL EXCLUSIVE: Profit & Margin Calculator */}
      {activeType === 'white-label' && (
        <section className="atelier-calculator-section">
          <div className="atelier-container">
            <div className="atelier-calculator-card">
              <div className="calc-left-info">
                <h2>White Label Profit Estimator</h2>
                <p>
                  Estimate your brand revenue and net profits when selling private label Banarasi sarees and suit sets.
                </p>

                <div className="calc-highlights-list">
                  <div className="highlight-item">
                    <CheckCircle2 size={16} />
                    <span><strong>2.0x – 3.0x Markup Potential:</strong> Authentic Varanasi craft commands premium retail prices.</span>
                  </div>
                  <div className="highlight-item">
                    <CheckCircle2 size={16} />
                    <span><strong>Zero Holding Costs:</strong> Leverage our Varanasi center for 1-piece dropship.</span>
                  </div>
                </div>
              </div>

              <div className="calc-right-form">
                <div className="calc-form-group">
                  <label className="price-range-label">Product Category with Price Range</label>
                  <div className="price-range-checkbox-grid">
                    {[
                      { id: '500-999', label: '₹500 - ₹999' },
                      { id: '1000-1999', label: '₹1,000 - ₹1,999' },
                      { id: '3000-4999', label: '₹3,000 - ₹4,999' },
                      { id: '5000-9999', label: '₹5,000 - ₹9,999' },
                    ].map((range) => {
                      const isSelected = calcPriceRange === range.id;
                      return (
                        <label key={range.id} className={`price-range-checkbox-item ${isSelected ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => setCalcPriceRange(range.id)}
                          />
                          <span>{range.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="calc-form-group">
                  <div className="label-val-header">
                    <label htmlFor="atelier-volume-slider">Monthly Sales Volume</label>
                    <span className="val-badge">{calcVolume} Pcs / mo</span>
                  </div>
                  <input
                    id="atelier-volume-slider"
                    type="range"
                    min="10"
                    max="300"
                    step="10"
                    value={calcVolume}
                    onChange={(e) => setCalcVolume(Number(e.target.value))}
                  />
                </div>

                <div className="calc-form-group">
                  <label>Target Retail Markup Multiplier</label>
                  <div className="markup-pill-grid">
                    {[1.8, 2.0, 2.5, 3.0].map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`markup-pill ${calcMarkup === m ? 'active' : ''}`}
                        onClick={() => setCalcMarkup(m)}
                      >
                        {m}x Retail
                      </button>
                    ))}
                  </div>
                </div>

                <div className="calc-output-box">
                  <div className="output-row">
                    <span>Wholesale Investment</span>
                    <strong>₹{calcResults.monthlyCost.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="output-row">
                    <span>Est. Retail Revenue</span>
                    <strong>₹{calcResults.monthlyRevenue.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="output-row highlight">
                    <span>Est. Monthly Net Profit</span>
                    <strong className="profit-val">₹{calcResults.monthlyProfit.toLocaleString('en-IN')} ({calcResults.marginPercent}%)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}



      {/* Split Responsibility */}
      <section className="atelier-split-section">
        <div className="atelier-container">
          <div className="split-grid-cols">
            <div className="split-col">
              <div className="col-head">
                <ClipboardCheck size={20} />
                <h2>Your Primary Focus</h2>
              </div>
              <ul className="split-list">
                {page.responsibilities.map((item) => (
                  <li key={item}>
                    <PackageCheck size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="split-col">
              <div className="col-head">
                <BadgeCheck size={20} />
                <h2>Our Service Commitment</h2>
              </div>
              <ul className="split-list">
                {page.accountability.map((item) => (
                  <li key={item}>
                    <ShieldCheck size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Model Comparison Table */}
      <section className="atelier-matrix-section">
        <div className="atelier-container">
          <div className="atelier-section-head">
            <h2>Comparing Partnership Models</h2>
            <p>See how White Label Branding compares with Sourcing Partnership and traditional retail buying.</p>
          </div>

          <div className="matrix-table-wrap">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th>Feature / Dimension</th>
                  <th className={activeType === 'white-label' ? 'highlight-th' : ''}>White Label Brand</th>
                  <th className={activeType === 'sourcing-partners' ? 'highlight-th' : ''}>Sourcing Partner</th>
                  <th>Traditional Retail Buy</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.feature}>
                    <td className="row-feature">{row.feature}</td>
                    <td className={activeType === 'white-label' ? 'highlight-td' : ''}>{row.whiteLabel}</td>
                    <td className={activeType === 'sourcing-partners' ? 'highlight-td' : ''}>{row.sourcingPartner}</td>
                    <td>{row.traditionalRetail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className="atelier-faq-section">
        <div className="atelier-container">
          <div className="faq-split-layout">
            <div className="faq-intro-col">
              <h2>Frequently Asked Questions</h2>
              <p>Everything you need to know about onboarding, custom branding, MOQ, and fulfillment SLAs.</p>
              <button
                type="button"
                className="faq-ask-btn"
                onClick={handleInquiry}
              >
                <span>Submit Inquiry Form</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="faq-accordion-col">
              {page.faqs.map((faq, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <div key={faq.q} className={`faq-row ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="faq-row-trigger"
                      onClick={() => setExpandedFaq(isOpen ? -1 : index)}
                    >
                      <h3>{faq.q}</h3>
                      <ChevronDown size={18} className={`faq-chevron-icon ${isOpen ? 'rotated' : ''}`} />
                    </button>
                    <div className="faq-row-body-wrapper">
                      <div className="faq-row-body-content">
                        <p>{faq.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PartnerProgramPage;
