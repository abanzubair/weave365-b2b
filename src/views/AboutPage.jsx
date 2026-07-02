/**
 * AboutPage View
 * Purpose: Renders Weave 365's modern, minimal B2B about experience.
 * Typographic-first layout with zero heavy images, a compact hero header,
 * interactive sourcing comparison widget, metrics grid, B2B procurement standards,
 * founder's quote block, and crawlable SEO structural data.
 */
import React, { useState } from 'react';
import {
  ChevronDown,
  Linkedin,
  ShieldCheck,
  Scale,
  Truck,
  Sparkles,
  Layers,
  Globe,
  Percent,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { storeConfig, siteUrl } from '../config.js';
import { WhatsappIcon } from '../components/WhatsappIcon.jsx';

export function AboutPage({ navigate }) {
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [sourcingMode, setSourcingMode] = useState('direct'); // 'direct' | 'traditional'

  const faqs = [
    {
      question: "What is the Minimum Order Quantity (MOQ) for wholesale purchase?",
      answer: "Our B2B model is designed for flexibility. For retail boutiques, online resellers, and new business test orders, we offer an MOQ of just 5 sarees across our entire catalog (mix-and-match allowed). For custom designs or volume manufacturing, MOQ starts at 15 pieces per design."
    },
    {
      question: "What kinds of fabrics and materials are available in your catalogue?",
      answer: "Our catalog spans a wide range of collections to meet different market demands. We offer pure natural silk sarees (available with Silk Mark certification upon request), semi-silk blends, art silks, georgette, organza, and synthetic materials. Each product listing clearly specifies the yarn composition, zari type, and weaving method (handloom or powerloom) so you can make informed decisions based on your target price and customer base."
    },
    {
      question: "Do you support white-label branding and custom packaging for boutique owners?",
      answer: "Yes, we support boutique clients globally. Under our White Label Program, we coordinate direct labeling with your custom brand tags and labels. All goods are dispatched in secure, unmarked packaging, keeping Weave 365 anonymous so you can add your custom packaging at your store."
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaqIndex(activeFaqIndex === index ? null : index);
  };

  const whatsappLink = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(
    'Hi Weave 365 B2B Desk, I would like to learn more about wholesale sourcing, pricing groups, and boutique reseller onboarding.'
  )}`;

  // JSON-LD structured data for Google Search crawling
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Weave 365",
    "description": "B2B Banarasi saree wholesaler and manufacturer directly partnering with Varanasi master weavers.",
    "telephone": storeConfig.phone,
    "email": storeConfig.email,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Varanasi",
      "addressRegion": "Uttar Pradesh",
      "addressCountry": "India"
    },
    "url": `${siteUrl}/about`,
    "priceRange": "$$$$",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "512"
    },
    "review": [
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Aisha Rahman"
        },
        "reviewBody": "Sourcing directly from Varanasi master weavers has completely transformed our boutique's profit margins. Highly authentic.",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5"
        }
      },
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Devika Sen"
        },
        "reviewBody": "Ultimate backend supplier for international B2B saree wholesale. The weatherproof transit packaging is impeccable.",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5"
        }
      }
    ]
  };

  React.useEffect(() => {
    document.documentElement.classList.add('header-over-dark');
    return () => {
      document.documentElement.classList.remove('header-over-dark');
    };
  }, []);

  return (
    <div className="about-page-container">
      {/* Dynamic JSON-LD Structured SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* 1. COMPREHENSIVE BRAND STORY (Replaces old Hero) */}
      <section className="about-section typographic-story" style={{ padding: 'clamp(40px, 6vw, 64px) var(--site-padding)', backgroundColor: 'var(--paper)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>

          <div className="story-text-block">
            <nav className="about-breadcrumbs" aria-label="Breadcrumb" style={{ marginBottom: '2rem' }}>
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('home'); }}>Home</a>
              <span className="separator">/</span>
              <span className="current">About</span>
            </nav>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}>About Weave 365</h1>
            <p>Weave 365 is a B2B sourcing platform based in Varanasi. It connects wholesalers, retailers, boutiques, resellers, online stores, designers and exporters, in India and abroad, directly to the weaving hubs and manufacturing networks of the city.</p>
            <p>The idea is simple: Varanasi produces some of the finest Banarasi sarees, suits, dress materials and textiles in the world. Getting access to them, reliably and at fair wholesale prices, has always been the hard part. Weave 365 handles the coordination, across multiple weavers and fabric grades, so making it easier for buyers to source the right products.</p>
            <p>The platform covers the full sourcing chain. That means quality inspection at the Varanasi hub, logistics packaging, India and international shipping via DTDC, Delhivery, Blue Dart, DHL and FedEx, with full tracking. Orders start at five pieces, mix-and-match allowed, which makes it practical for smaller boutiques and resellers to test new fabric grades before committing to bulk.</p>
            <p>The catalog runs across handwoven pure silk, semi-silk, organza, georgette, art silk, blended and faux fabrics, each listing with clear details on fabric, zari, and weave type, and whether the piece is handloom or powerloom. No guesswork about what you're actually buying.</p>
            <p>For online stores, boutique owners and resellers who want to keep their own branding, Weave 365 also runs a white-label program, custom tags, unmarked packaging, no Weave 365 branding on dispatch.</p>
          </div>

          <div className="story-text-block">
            <h2>What Makes Weave 365 Different</h2>
            <p>Most of the wholesale saree market still runs through multiple middlemen. A buyer or boutique owner in Bengaluru, Mumbai, Kolkata, New York, London or Singapore typically buys from a city trader, who buys from a regional distributor, who bought from someone closer to the weaver. Each hand in the chain adds margin and removes information, you often don't know the actual fabric grade or weave origin until the parcel arrives.</p>
            <p>Weave 365 pulls sourcing back to Varanasi. The team works directly across 15+ weaving hubs in the city, which means buyers get actual trade prices without paying for layers they don't need. The MOQ of five pieces keeps things accessible, you can sample three fabric grades and two weave styles in a single order, which is genuinely useful when you're building a boutique catalog.</p>
            <p>There's also the transparency piece. Every listing on the platform specifies material honestly, pure katan silk is listed as that, art silk is listed as that. That distinction matters when your customer is paying for the real thing.</p>
          </div>

          <div className="story-text-block">
            <h2>About the Founder</h2>
            <p>Zubair Ahmad is the founder of Weave 365, built on a background in Banarasi saree and textile development and a close understanding of how Varanasi's weaving economy actually works.</p>
            <p>He started Weave 365 to solve a sourcing problem he saw directly: Varanasi's weavers produce extraordinary cloth, but buyers, especially those outside Varanasi, have had no clean, reliable way to reach them. The supply chain between loom and retailer has historically been long, opaque, and expensive for everyone except the people in the middle.</p>
            <p>His work sits at an intersection that doesn't have many players: translating Banarasi textile, a craft tradition with serious technical depth, from katan silk to meenakari brocades, into the language of modern wholesale. That means catalog infrastructure, logistics, quality checks, and white-label programs, not just beautiful fabric.</p>
            <p>He's also exploring what Banarasi weaving looks like when it moves into couture, taking the loom's vocabulary of zari, jamdani, and kimkhwab into fashion contexts beyond the traditional saree format. That part of the work is about building a couture house grounded in Banaras, not borrowing its aesthetic but actually building from inside its making tradition.</p>
            <p style={{ marginTop: '1.5rem' }}><a href="https://www.linkedin.com/in/hellozubair/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-dark)', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Linkedin size={16} /> Connect with Zubair on LinkedIn</a></p>
          </div>

        </div>
      </section>

      {/* 2. TRUSTED B2B METRICS GRID */}
      <section className="about-metrics-section">
        <div className="about-metrics-grid">
          <div className="metric-card">
            <span className="metric-value">Direct</span>
            <span className="metric-title">Sourcing Network</span>
            <span className="metric-desc">Sourcing directly from Varanasi weaving hubs to offer competitive margins.</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">Diverse</span>
            <span className="metric-title">Catalog Variety</span>
            <span className="metric-desc">A wide selection of fabrics, weaves, and price ranges matching different retail markets.</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">15+</span>
            <span className="metric-title">Weaving Hubs</span>
            <span className="metric-desc">Links with weavers and manufacturers across major Varanasi production hubs.</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">Checked</span>
            <span className="metric-title">Quality Checks</span>
            <span className="metric-desc">Standard inspections for weaving consistency, dimensions, and materials.</span>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE SUPPLY CHAIN FLOW COMPARISON */}
      <section className="about-section about-interactive-flow">
        <div className="section-header-centered">
          <h2>Sourcing Channel Comparison</h2>
          <p>Compare traditional supply channels against Weave 365's sourcing model.</p>
        </div>

        <div className="flow-tab-container">
          <div className="flow-tabs" role="tablist">
            <button type="button"
              className={`flow-tab-btn ${sourcingMode === 'direct' ? 'active' : ''}`}
              onClick={() => setSourcingMode('direct')}
              role="tab"
              aria-selected={sourcingMode === 'direct'}
            >
              <Sparkles size={16} /> Direct Sourcing Model
            </button>
            <button type="button"
              className={`flow-tab-btn traditional-tab ${sourcingMode === 'traditional' ? 'active' : ''}`}
              onClick={() => setSourcingMode('traditional')}
              role="tab"
              aria-selected={sourcingMode === 'traditional'}
            >
              <AlertCircle size={16} /> Traditional Supply Chain
            </button>
          </div>
        </div>

        <div className="flow-visual-panel">
          {sourcingMode === 'direct' ? (
            <div className="flow-nodes-container direct-flow-layout">
              <div className="flow-node">
                <div className="node-icon-wrapper"><Layers size={20} /></div>
                <h4>Varanasi Weavers</h4>
                <p>Artisans produce sarees based on direct order commitments, ensuring standard wages.</p>
                <span className="node-stat">Standard Rates</span>
              </div>

              <div className="flow-connector"><ArrowRight size={20} /></div>

              <div className="flow-node highlight-node">
                <div className="node-icon-wrapper"><ShieldCheck size={20} /></div>
                <h4>Weave 365 Platform</h4>
                <p>Sourcing hub handles order collection, sorting, standard quality checks, and logistics packaging.</p>
                <span className="node-stat">Flat Sourcing Cost</span>
              </div>

              <div className="flow-connector"><ArrowRight size={20} /></div>

              <div className="flow-node">
                <div className="node-icon-wrapper"><Globe size={20} /></div>
                <h4>Boutique / Reseller</h4>
                <p>Receives products matching order specifications and chosen fabric grades.</p>
                <span className="node-stat">Direct Sourcing Cost</span>
              </div>
            </div>
          ) : (
            <div className="flow-nodes-container traditional-flow-layout">
              <div className="flow-node border-error">
                <div className="node-icon-wrapper"><Layers size={20} /></div>
                <h4>Varanasi Weavers</h4>
                <p>Weavers sell to local brokers based on immediate cash requirements.</p>
                <span className="node-stat text-error">Market Pricing</span>
              </div>

              <div className="flow-connector"><ArrowRight size={20} /></div>

              <div className="flow-node border-error">
                <div className="node-icon-wrapper"><TrendingUp size={20} /></div>
                <h4>Local Broker (Arhatia)</h4>
                <p>Collects finished sarees and coordinates deals with agents.</p>
                <span className="node-stat text-error">Broker Commission</span>
              </div>

              <div className="flow-connector"><ArrowRight size={20} /></div>

              <div className="flow-node border-error">
                <div className="node-icon-wrapper"><TrendingUp size={20} /></div>
                <h4>Commission Agent</h4>
                <p>Markets products to regional wholesalers and merchant warehouses.</p>
                <span className="node-stat text-error">Agent Fee</span>
              </div>

              <div className="flow-connector"><ArrowRight size={20} /></div>

              <div className="flow-node border-error">
                <div className="node-icon-wrapper"><TrendingUp size={20} /></div>
                <h4>Regional Wholesaler</h4>
                <p>Stocks and sells bulk inventories to retail outlets.</p>
                <span className="node-stat text-error">Wholesale Markup</span>
              </div>

              <div className="flow-connector"><ArrowRight size={20} /></div>

              <div className="flow-node border-error">
                <div className="node-icon-wrapper"><AlertCircle size={20} /></div>
                <h4>Boutique Owner</h4>
                <p>Purchases from regional wholesalers with multi-tier costs.</p>
                <span className="node-stat text-error">Retailer Sourcing Cost</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Section Removed (Content merged into Brand Story) */}

      {/* 5. B2B STANDARDS GRID */}
      <section className="about-section about-standards">
        <div className="section-header-centered">
          <h2>Sourcing Parameters</h2>
          <p>We follow standard procedures to support boutique orders and retail business clients.</p>
        </div>

        <div className="standards-cards-grid">
          <div className="standard-card">
            <div className="standard-card-icon"><ShieldCheck size={24} /></div>
            <h3>Quality Inspection</h3>
            <p>Every order is inspected at the hub for weaving consistency, color accuracy, and defects before final packing.</p>
          </div>

          <div className="standard-card">
            <div className="standard-card-icon"><Scale size={24} /></div>
            <h3>Material Options</h3>
            <p>We offer a range of material options, clearly detailing pure silk, semi-silk, art silk, and mixed yarn contents to suit your target price point.</p>
          </div>

          <div className="standard-card">
            <div className="standard-card-icon"><Truck size={24} /></div>
            <h3>Logistics Support</h3>
            <p>All orders are packed securely for transit and shipped globally via DHL/FedEx, with fully tracked logistics.</p>
          </div>

          <div className="standard-card">
            <div className="standard-card-icon"><Percent size={24} /></div>
            <h3>Flexible Order Minimums</h3>
            <p>Orders start with a minimum of 5 sarees (mix-and-match allowed), making it easy to sample different fabric grades and styles.</p>
          </div>
        </div>
      </section>

      {/* 6. Section Removed (Founder content moved to Brand Story) */}

      {/* 7. FAQ Accordions */}
      <section className="about-section about-faq">
        <div className="faq-container-box">
          <h2>FAQ</h2>
          <p className="faq-header-lead">
            Frequently asked questions regarding order minimums, fabric checks, and packaging options.
          </p>

          <div className="faq-accordion-list-block">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-accordion-card ${activeFaqIndex === index ? 'expanded' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-trigger"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={activeFaqIndex === index ? 'true' : 'false'}
                >
                  <span>{faq.question}</span>
                  <ChevronDown size={18} className="faq-trigger-icon" />
                </button>
                <div className="faq-answer-collapse-panel">
                  <div className="faq-answer-content-inner">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. B2B ACTION FOOTER CALL */}
      <section className="about-cta-footer">
        <div className="about-cta-card-wrapper">
          <div className="cta-card-bg-glow"></div>
          <div className="about-cta-card-content">
            <h2>Sourcing from Varanasi</h2>
            <p>Register on Weave 365 to view our diverse catalogs, trade prices, and shipping logistics across all material grades.</p>
            <div className="about-cta-buttons">
              <a
                href="/wholesale-catalogue"
                onClick={(e) => { e.preventDefault(); navigate('wholesale-catalogue'); }}
                className="cta-btn-primary"
              >
                View Catalogue
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-btn-whatsapp"
              >
                <WhatsappIcon size={16} /> WhatsApp Concierge
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
