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
import { storeConfig } from '../config.js';
import { WhatsappIcon } from '../storefrontShared.jsx';

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
    "url": "https://www.weave365.in/about",
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

      {/* 1. EDITORIAL ASYMMETRIC HERO SECTION */}
      <header className="about-hero-overhaul">
        <div className="hero-overhaul-grid">
          <div className="hero-left-col">
            <nav className="about-breadcrumbs" aria-label="Breadcrumb">
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('home'); }}>Home</a>
              <span className="separator">/</span>
              <span className="current">About</span>
            </nav>
            <h1 className="hero-headline">
              Sourcing Varanasi’s textiles. Direct and simplified.
            </h1>
          </div>
          <div className="hero-right-col">
            <p className="hero-description">
              Weave 365 is a B2B sourcing platform connecting Varanasi weaving networks with retail boutiques and resellers globally. We coordinate production across multiple fabric grades, manage quality verification, and handle shipping logistics.
            </p>
            <div className="hero-action-link">
              <a 
                href="/wholesale-catalogue" 
                onClick={(e) => { e.preventDefault(); navigate('wholesale-catalogue'); }}
                className="hero-primary-link"
              >
                Browse Catalogue <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </header>

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
            <button 
              className={`flow-tab-btn ${sourcingMode === 'direct' ? 'active' : ''}`}
              onClick={() => setSourcingMode('direct')}
              role="tab"
              aria-selected={sourcingMode === 'direct'}
            >
              <Sparkles size={16} /> Direct Sourcing Model
            </button>
            <button 
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

      {/* 4. HERITAGE & MODERN LOGISTICS (Pure Typographic Split) */}
      <section className="about-section about-story-split typographic-story">
        <div className="story-split-grid">
          <div className="story-text-block">
            <h2>Varanasi Textile Heritage</h2>
            <p>
              Varanasi is home to a rich history of textile weaving, ranging from traditional handlooms to modern powerlooms. To cater to diverse retail requirements, Weave 365 sources a broad variety of collections. We coordinate with local weaving networks and manufacturing hubs to compile catalogs that cover premium handwoven silks as well as accessible art silk and blended fabrics.
            </p>
          </div>
          <div className="story-text-block">
            <h2>Sourcing and Logistics</h2>
            <p>
              We operate a centralized logistics and coordination hub in Varanasi to streamline wholesale procurement. Our team inspects items for consistency against order details, handles product packaging, and manages shipping logistics, coordinating domestic and international deliveries with reliable express carriers.
            </p>
          </div>
        </div>
      </section>

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

      {/* 6. FOUNDER PROFILE Spotlight (Typographic Centered Quote) */}
      <section className="about-section about-founder typographic-founder">
        <div className="founder-spotlight-centered">
          <h2>Vision</h2>
          <blockquote className="founder-editorial-quote">
            "Weave 365 connects Varanasi's diverse weaving styles with boutique and retail sourcing needs."
          </blockquote>
          <p className="founder-bio-p">
            Founded by Zubair Ahmad, who has a background in textile development, Weave 365 provides sourcing services, quality checks, and logistics support for global boutiques looking for a wide range of Varanasi textiles.
          </p>
          <div className="founder-details-footer-centered">
            <div className="founder-credentials">
              <span className="founder-name">Zubair Ahmad</span>
              <span className="founder-title">Founder & Creative Director</span>
            </div>
            <a 
              href="https://www.linkedin.com/in/hellozubair/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="founder-linkedin-btn"
            >
              <Linkedin size={14} /> Connect
            </a>
          </div>
        </div>
      </section>

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
