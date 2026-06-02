import React, { useEffect, useState } from 'react';
import { 
  ArrowRight, 
  ChevronDown, 
  CheckCircle, 
  Home as HomeIcon,
  Sparkles,
  ShieldCheck,
  Globe,
  Award,
  ChevronRight
} from 'lucide-react';
import { assetSrc } from '../utils/assetSrc.js';

import heroImage from '../../assets/offerings_hero_bg.png';
import weaverImage from '../../assets/offerings_weaver.png';

import '../styles/ourOfferings.css';

export function OurOfferings({ navigate, openAuth }) {
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const heroBg = assetSrc(heroImage);

  const faqs = [
    {
      question: "How does the White Label program operate?",
      answer: "Our White Label service allows you to launch your own boutique using your custom domain. We sync our Varanasi warehouse inventory directly to your store, letting you define your own retail margins. When a customer orders, we dispatch it in unbranded, high-end packaging directly to their door. Weave365 remains completely invisible."
    },
    {
      question: "What are the start-up costs for resellers?",
      answer: "Joining the Weave365 network is completely free of charge. There are no upfront fees, registration costs, or minimum inventory purchases required to list and sell our collection."
    },
    {
      question: "How does direct weaver sourcing benefit local artisans?",
      answer: "By removing middle-agents and brokers, we enable Varanasi's master weavers to set their own fair rates. Payments are settled in full directly into their accounts immediately upon quality check, providing stable incomes for over 200+ local handloom artisans."
    },
    {
      question: "Do you offer international shipping?",
      answer: "Yes. We ship worldwide via DHL and FedEx Express. Resellers can serve customers across the US, UK, Canada, Europe, and the Middle East, and we handle all customs documentation and unbranded express delivery."
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaqIndex(activeFaqIndex === index ? null : index);
  };

  // SEO: Update Page Title & Description
  useEffect(() => {
    document.title = "Our Offerings | B2B Features & White Label Storefront | Weave365";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.content = "Discover Weave365 B2B offerings: authentic Varanasi handloom sourcing, unbranded global dropshipping, and custom white-label storefronts for premium boutiques.";
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'description';
      newMeta.content = "Discover Weave365 B2B offerings: authentic Varanasi handloom sourcing, unbranded global dropshipping, and custom white-label storefronts for premium boutiques.";
      document.head.appendChild(newMeta);
    }
  }, []);

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

  return (
    <div className="offerings-page-container minimal-luxury">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} 
      />

      {/* 1. Hero Section (Editorial Minimal) */}
      <section className="offerings-hero-section">
        {/* Background Image with elegant light overlay */}
        <div className="hero-bg-wrapper-luxury">
          <img src={heroBg} alt="" className="hero-bg-img-luxury" />
          <div className="hero-bg-overlay-luxury"></div>
        </div>

        <div className="offerings-hero-content">
          <div className="offerings-breadcrumb-bar">
            <div className="breadcrumb-content">
              <button onClick={() => navigate('home')} className="breadcrumb-link">
                <HomeIcon size={13} /> HOME
              </button>
              <ChevronRight size={10} className="breadcrumb-separator" />
              <span className="breadcrumb-current">OUR OFFERINGS</span>
            </div>
          </div>

          <div className="editorial-hero-text">
            <span className="hero-kicker-luxury">
              <Sparkles size={12} /> The Weave365 Ecosystem
            </span>
            <h1 className="hero-title-luxury">
              A Refined Approach to <br />
              <span className="gold-serif-text">Saree Wholesale</span>
            </h1>
            <div className="hero-divider-luxury"></div>
            <p className="hero-desc-luxury">
              Loom-direct authenticity. Worldwide unbranded dropshipping. Zero inventory risk. 
              We provide the complete B2B infrastructure so you can focus entirely on scaling your luxury boutique.
            </p>
            
            <div className="hero-action-luxury">
              <button className="minimal-ink-btn" onClick={openAuth}>
                Join the Reseller Network <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Pillars (Airy 3-Column Grid) */}
      <section className="pillars-section-luxury">
        <div className="offerings-container">
          <div className="pillars-grid-luxury">
            <div className="pillar-item-luxury">
              <div className="pillar-icon-wrapper">
                <Award size={22} strokeWidth={1.2} />
              </div>
              <h3 className="pillar-title-luxury">Direct Loom Sourcing</h3>
              <p className="pillar-desc-luxury">
                Bypass traditional brokers and purchase directly from Varanasi's master weavers. 
                Every saree is checked and carries absolute Silk Mark authenticity at true weaver-set pricing.
              </p>
            </div>

            <div className="pillar-item-luxury">
              <div className="pillar-icon-wrapper">
                <Globe size={22} strokeWidth={1.2} />
              </div>
              <h3 className="pillar-title-luxury">B2B Infrastructure</h3>
              <p className="pillar-desc-luxury">
                Showcase thousands of high-resolution saree designs without stock-holding overhead. 
                Our Varanasi hub manages logistics, packing, and express worldwide transport.
              </p>
            </div>

            <div className="pillar-item-luxury">
              <div className="pillar-icon-wrapper">
                <ShieldCheck size={22} strokeWidth={1.2} />
              </div>
              <h3 className="pillar-title-luxury">White-Label Program</h3>
              <p className="pillar-desc-luxury">
                Deploy your own independent storefront under your custom domain. 
                We sync our catalogs and ship in unbranded luxury boxes, keeping our platform completely anonymous.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. White-Label Showcase (Spacious 2-Column Editorial) */}
      <section className="wl-showcase-section-luxury">
        <div className="offerings-container">
          <div className="wl-editorial-layout">
            <div className="wl-text-column">
              <span className="section-kicker-luxury">Exclusive Service</span>
              <h2 className="section-title-luxury">Your Independent Saree Brand</h2>
              <div className="title-underline-luxury"></div>
              <p className="section-desc-luxury">
                Build a bespoke digital storefront under your own domain name, completely free from Weave365 branding. 
                We provide the backend supply chain while you command full authority over your collection and pricing.
              </p>
              
              <ul className="wl-editorial-list">
                <li>
                  <span className="list-number-luxury">01</span>
                  <div className="list-text-luxury">
                    <h4>Automated Catalog Integration</h4>
                    <p>Sync thousands of handwoven silk, organza, and katan saree designs directly to your store front in real time.</p>
                  </div>
                </li>
                <li>
                  <span className="list-number-luxury">02</span>
                  <div className="list-text-luxury">
                    <h4>Tailored Retail Margins</h4>
                    <p>You have full autonomy over your price listings. Select markup percentages that match your boutique's market tier.</p>
                  </div>
                </li>
                <li>
                  <span className="list-number-luxury">03</span>
                  <div className="list-text-luxury">
                    <h4>Bespoke Anonymous Delivery</h4>
                    <p>Orders are dispatched directly from our looms to your clients. All packaging is completely unbranded to ensure customer loyalty stays with you.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="wl-visual-column">
              <div className="unbranded-packaging-card">
                <div className="box-inner-border">
                  <span className="box-brand-placeholder">AURA WEAVES</span>
                  <div className="box-divider"></div>
                  <span className="box-location-placeholder">VARANASI</span>
                  <div className="box-seal-luxury">
                    <span className="seal-text-luxury">HANDLOOM SILK</span>
                  </div>
                </div>
                <div className="box-label-caption">Simulated Unbranded Luxury Box Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Weaver Network & Social Impact (Artisan Storytelling) */}
      <section className="weaver-impact-section-luxury">
        <div className="offerings-container">
          <div className="weaver-editorial-layout">
            <div className="weaver-visual-column">
              <div className="artisan-portrait-frame">
                <div className="frame-corner top-left-g"></div>
                <div className="frame-corner top-right-g"></div>
                <div className="frame-corner bottom-left-g"></div>
                <div className="frame-corner bottom-right-g"></div>
                <img 
                  src={assetSrc(weaverImage)} 
                  alt="Varanasi Master Weaver working on traditional handloom" 
                  className="artisan-image-luxury" 
                />
              </div>
            </div>

            <div className="weaver-text-column">
              <span className="section-kicker-luxury">Social Responsibility</span>
              <h2 className="section-title-luxury text-dark">Empowering Varanasi's Artisans</h2>
              <div className="title-underline-luxury"></div>
              <p className="section-desc-luxury">
                We believe premium craft deserves fair compensation. By connecting local Varanasi weavers directly 
                to retail owners across India and globally, we eliminate the exploitative tiers of middlemen.
              </p>

              <div className="weaver-stats-row">
                <div className="weaver-stat-box">
                  <span className="stat-value-luxury">200+</span>
                  <span className="stat-label-luxury">Weavers Onboarded</span>
                </div>
                <div className="weaver-stat-box">
                  <span className="stat-value-luxury">100%</span>
                  <span className="stat-label-luxury">Direct Payouts</span>
                </div>
                <div className="weaver-stat-box">
                  <span className="stat-value-luxury">0%</span>
                  <span className="stat-label-luxury">Broker Dilution</span>
                </div>
              </div>

              <div className="impact-quote-box">
                <p>
                  "Partnering with Weave365 ensures my family’s looms stay active throughout the year. 
                  Direct payouts remove the stress of unpaid credits, allowing us to preserve our heritage."
                </p>
                <strong>— Master Weaver Santosh Kumar, Varanasi</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ Accordion (Clean Minimalist) */}
      <section className="faq-section-luxury">
        <div className="offerings-container">
          <div className="faq-header-luxury">
            <span className="section-kicker-luxury">Customer Support</span>
            <h2 className="section-title-luxury">Frequently Asked Questions</h2>
            <div className="title-underline-luxury"></div>
          </div>

          <div className="faq-accordion-luxury">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item-luxury ${activeFaqIndex === index ? 'active' : ''}`}
              >
                <button 
                  type="button" 
                  className="faq-question-btn-luxury"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={activeFaqIndex === index ? 'true' : 'false'}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon-indicator-luxury">
                    <ChevronDown size={16} strokeWidth={1.5} />
                  </span>
                </button>
                <div className="faq-answer-container-luxury">
                  <div className="faq-answer-content-luxury">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
