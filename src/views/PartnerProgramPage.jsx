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
      'Launch your private label Banarasi saree and suit brand with Weave 365. Source authentic weaves, customize tags & luxury packaging, get unbranded HD catalogs, and ship direct to your clients.',
    badge: 'Luxury Private Label Program',
    h1: 'Sell Authentic Banarasi Weaves Under Your Own Brand',
    intro:
      'Build a high-margin luxury ethnic label backed by direct Varanasi loom infrastructure. We supply authentic Banarasi weaves, custom woven neck-tags, rigid gold-foil boxes, unbranded HD catalogs, and blind dropshipping direct to your customers.',
    role:
      'A White Label Brand owns customer trust, brand identity, product curation, and retail growth, while Weave 365 acts as your silent, direct-from-loom manufacturing and white-label fulfillment backbone.',
    ctaText: 'Start White Label Inquiry',
    ctaRoute: 'bulk-inquiry',
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
        content:
          'Access our live catalog of Katan silk, Organza, Chanderi, Georgette sarees, and bridal suit sets. Filter by price point, weave technique, and color palettes.',
        icon: Compass,
      },
      {
        step: '02',
        title: 'Custom Branding & Packaging',
        content:
          'We craft high-density woven satin neck tags, wash-care cards, satin dust bags, and magnetic gold-foil boxes bearing your brand name and logo.',
        icon: Tags,
      },
      {
        step: '03',
        title: 'Unbranded HD Catalogs',
        content:
          'Download high-resolution, unbranded model photos, 4K product video reels, and PDF catalogs to publish immediately on your website or social media.',
        icon: Sparkles,
      },
      {
        step: '04',
        title: 'Blind Fulfillment & Shipping',
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
  const [calcCategory, setCalcCategory] = useState('katan');
  const [calcVolume, setCalcVolume] = useState(30);
  const [calcMarkup, setCalcMarkup] = useState(2.2);

  // Profit Calculator Logic
  const calcResults = useMemo(() => {
    const wholesalePrices = {
      katan: 3800,
      organza: 2600,
      bridal: 7500,
      suits: 1950,
    };
    const unitWholesale = wholesalePrices[calcCategory] || 3800;
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
  }, [calcCategory, calcVolume, calcMarkup]);

  const handleInquiry = () => {
    if (typeof navigate === 'function') {
      navigate(page.ctaRoute);
    } else {
      window.location.href = `/${page.ctaRoute}`;
    }
  };

  return (
    <div className="partner-atelier-view">
      {/* Dynamic Program Switcher Bar */}
      <nav className="atelier-nav-bar" aria-label="Partner Program Selection">
        <div className="atelier-nav-inner">
          <button
            type="button"
            className={`atelier-nav-tab ${activeType === 'white-label' ? 'active' : ''}`}
            onClick={() => navigate('white-label')}
          >
            <Tags size={16} />
            <span>White Label Brand</span>
          </button>
          <button
            type="button"
            className={`atelier-nav-tab ${activeType === 'sourcing-partners' ? 'active' : ''}`}
            onClick={() => navigate('sourcing-partners')}
          >
            <Factory size={16} />
            <span>Sourcing Partner</span>
          </button>
        </div>
      </nav>

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

      {/* Core Capability Showcase */}
      <section className="atelier-capabilities-section">
        <div className="atelier-container">
          <div className="atelier-section-head">
            <h2>Why Partner With Weave 365</h2>
            <p>Direct Varanasi loom infrastructure built for rapid business growth.</p>
          </div>

          <div className="capabilities-grid">
            {activeType === 'white-label' ? (
              <>
                <div className="capability-row">
                  <div className="capability-icon">
                    <Tags size={24} />
                  </div>
                  <div className="capability-text">
                    <h3>Private Label Autonomy</h3>
                    <p>Deploy your custom tags, woven labels, and luxury gold-foil boxes with 100% brand confidentiality.</p>
                  </div>
                </div>

                <div className="capability-row">
                  <div className="capability-icon">
                    <Boxes size={24} />
                  </div>
                  <div className="capability-text">
                    <h3>Zero Warehouse Risk</h3>
                    <p>Access our live Varanasi ready-stock catalog with 1-piece dropshipping directly to your end-clients.</p>
                  </div>
                </div>

                <div className="capability-row">
                  <div className="capability-icon">
                    <Coins size={24} />
                  </div>
                  <div className="capability-text">
                    <h3>High Retail Margins</h3>
                    <p>Enjoy direct-from-loom wholesale pricing supporting healthy 2.0x to 3.0x retail markup potential.</p>
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

      {/* Light Workflow Stepper */}
      <section className="atelier-workflow-light">
        <div className="atelier-container">
          <div className="atelier-section-head">
            <h2>How the {activeType === 'white-label' ? 'White Label' : 'Sourcing'} Program Works</h2>
            <p>Designed for clarity, fast execution, and seamless business scaling.</p>
          </div>

          <div className="light-workflow-stepper">
            {page.guide.map((item) => {
              const StepIcon = item.icon;
              return (
                <div key={item.step} className="light-step-col">
                  <div className="light-step-badge">
                    <span>{item.step}</span>
                  </div>
                  <StepIcon size={22} className="light-step-icon" />
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                </div>
              );
            })}
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
                  <label htmlFor="atelier-category-select">Product Category</label>
                  <select
                    id="atelier-category-select"
                    value={calcCategory}
                    onChange={(e) => setCalcCategory(e.target.value)}
                  >
                    <option value="katan">Katan Silk Sarees (Wholesale ~₹3,800)</option>
                    <option value="organza">Organza Sarees (Wholesale ~₹2,600)</option>
                    <option value="bridal">Heavy Bridal Sarees (Wholesale ~₹7,500)</option>
                    <option value="suits">Banarasi Suit Sets (Wholesale ~₹1,950)</option>
                  </select>
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

      {/* Packaging & Branding Options */}
      {activeType === 'white-label' && (
        <section className="atelier-packaging-section">
          <div className="atelier-container">
            <div className="atelier-section-head">
              <h2>Custom Packaging & Branding Options</h2>
              <p>Select your preferred white-label packaging and marketing support options.</p>
            </div>

            <div className="packaging-interactive-container">
              <div className="packaging-tab-buttons">
                {packagingOptions.map((pkg) => {
                  const PkgIcon = pkg.icon;
                  const isSelected = selectedPkg === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      className={`packaging-tab-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedPkg(pkg.id)}
                    >
                      <PkgIcon size={18} />
                      <span>{pkg.title}</span>
                    </button>
                  );
                })}
              </div>

              {packagingOptions
                .filter((pkg) => pkg.id === selectedPkg)
                .map((pkg) => (
                  <div key={pkg.id} className="packaging-active-display">
                    <div className="display-info">
                      <span className="display-badge">{pkg.badge}</span>
                      <h3>{pkg.title}</h3>
                      <p>{pkg.desc}</p>
                    </div>
                    <div className="display-code-preview">
                      <span className="lbl">Preview Standard:</span>
                      <code>{pkg.previewText}</code>
                    </div>
                  </div>
                ))}
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
