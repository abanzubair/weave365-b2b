import React, { useEffect, useState, useRef } from 'react';
import { 
  ArrowRight, 
  ChevronDown, 
  CheckCircle, 
  Sparkles,
  ShieldCheck,
  Globe,
  Award
} from 'lucide-react';
import { ContactSection } from './ContactPage.jsx';

import '../styles/ourOfferings.css';

export function OurOfferings({ navigate, openAuth }) {
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const contactRef = useRef(null);

  const faqs = [
    {
      question: "How do established brands sell on Weave365?",
      answer: "Established brands and premium boutiques can apply to become verified seller partners. Once approved, you can list your exclusive handwoven collections directly on our platform. We coordinate cataloging, payment processing, and global logistics, while you focus on curation and manufacturing."
    },
    {
      question: "Will my boutique's brand name be visible to buyers?",
      answer: "Absolutely. We believe in preserving brand identity. Every product you list on Weave365 will display your brand or boutique name prominently on the product details page, ensuring that buyers know exactly who crafted the design."
    },
    {
      question: "How does the dedicated boutique URL work?",
      answer: "Each verified brand partner gets a dedicated storefront page on our website with a clean, direct URL (e.g., weave365.com/your-boutique-name). This showroom page filters the entire Weave365 catalog to show only your brand's premium products, making it easy to share with your customer base."
    },
    {
      question: "Who handles the shipping and quality verification?",
      answer: "Weave365 takes care of the heavy lifting. All partner products are routed through our Varanasi quality-check hub, where they undergo rigorous silk mark and handloom authentication. We then pack them in premium packaging and ship them via DHL/FedEx Express worldwide."
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaqIndex(activeFaqIndex === index ? null : index);
  };

  // SEO: Update Page Title & Description
  useEffect(() => {
    document.title = "Brand Partnership & Dedicated Boutique Storefronts | Weave365";
    const metaDescription = document.querySelector('meta[name="description"]');
    const seoContent = "Partner with Weave365 to showcase and sell your premium boutique collection on our global marketplace. Get your own dedicated storefront URL and brand visibility.";
    if (metaDescription) {
      metaDescription.content = seoContent;
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'description';
      newMeta.content = seoContent;
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

      <section className="offerings-hero-section">

        <div className="offerings-hero-content">
          <div className="editorial-hero-text">
            <span className="hero-kicker-luxury">
              <Sparkles size={12} /> Sell on Weave365
            </span>
            <h1 className="hero-title-luxury">
              Showcase Your Boutique to <br />
              <span className="gold-serif-text">A Global Audience</span>
            </h1>
            <div className="hero-divider-luxury"></div>
            <p className="hero-desc-luxury">
              Put your brand front and center. Established boutiques and premium ethnic wear brands can list their collections on Weave365, complete with dedicated brand pages, custom URLs, and co-branded listings.
            </p>
            
            <div className="hero-action-luxury">
              <button 
                type="button" 
                className="minimal-ink-btn" 
                onClick={() => contactRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                Apply for Brand Partnership <ArrowRight size={16} />
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
              <h3 className="pillar-title-luxury">Preserved Brand Identity</h3>
              <p className="pillar-desc-luxury">
                Every design you sell on Weave365 carries your boutique's name alongside the listing. Build direct brand trust and customer affinity with buyers across the globe.
              </p>
            </div>

            <div className="pillar-item-luxury">
              <div className="pillar-icon-wrapper">
                <Globe size={22} strokeWidth={1.2} />
              </div>
              <h3 className="pillar-title-luxury">Dedicated Storefront URL</h3>
              <p className="pillar-desc-luxury">
                Get a personalized brand showroom with a direct URL path (e.g. weave365.com/your-boutique-name). A focused space showing exclusively your collection.
              </p>
            </div>

            <div className="pillar-item-luxury">
              <div className="pillar-icon-wrapper">
                <ShieldCheck size={22} strokeWidth={1.2} />
              </div>
              <h3 className="pillar-title-luxury">End-to-End Fulfillment</h3>
              <p className="pillar-desc-luxury">
                Focus entirely on curation and designing. Our Varanasi logistics hub manages quality checks, premium packaging, and secure door-to-door express delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Brand Showcase (Spacious 2-Column Editorial) */}
      <section className="wl-showcase-section-luxury">
        <div className="offerings-container">
          <div className="wl-editorial-layout">
            <div className="wl-text-column">
              <h2 className="section-title-luxury">A Dedicated Space for Your Brand</h2>
              <div className="title-underline-luxury"></div>
              <p className="section-desc-luxury">
                Weave365 gives premium brands and established boutiques the tools to grow their wholesale channels. Reach verified retail buyers globally under your own designer label.
              </p>
              
              <ul className="wl-editorial-list">
                <li>
                  <span className="list-number-luxury">01</span>
                  <div className="list-text-luxury">
                    <h4>Direct URL Showrooms</h4>
                    <p>Share a professional, dynamic page showing only your products (like <code>weave365.com/your-boutique-name</code>) with potential buyers and retailers.</p>
                  </div>
                </li>
                <li>
                  <span className="list-number-luxury">02</span>
                  <div className="list-text-luxury">
                    <h4>Co-Branded Product Listings</h4>
                    <p>Your brand name is prominently displayed directly on the product card, certifying your boutique as the designer of the heritage weaves.</p>
                  </div>
                </li>
                <li>
                  <span className="list-number-luxury">03</span>
                  <div className="list-text-luxury">
                    <h4>Varanasi Logistics Infrastructure</h4>
                    <p>Drop ship or bulk ship your products to our central warehouse. We verify, seal, and route orders to final clients in express courier boxes.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="wl-visual-column">
              <div className="unbranded-packaging-card">
                <div className="box-inner-border">
                  <span className="box-brand-placeholder">YOUR BOUTIQUE</span>
                  <div className="box-divider"></div>
                  <span className="box-location-placeholder">DESIGNER LABEL</span>
                  <div className="box-seal-luxury">
                    <span className="seal-text-luxury">WEAVE365 PARTNER</span>
                  </div>
                </div>
                <div className="box-label-caption">Simulated Brand Storefront (weave365.com/your-boutique-name)</div>
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
                  src="https://assets.weave365.com/assets/banner/collab-brand-hero2.jpg" 
                  alt="Premium brand designer showroom showcasing Banarasi sarees" 
                  className="artisan-image-luxury" 
                />
              </div>
            </div>

            <div className="weaver-text-column">
              <h2 className="section-title-luxury text-dark">Empowering Varanasi's Artisans & Brands</h2>
              <div className="title-underline-luxury"></div>
              <p className="section-desc-luxury">
                We believe premium craft deserves fair compensation. By connecting boutique owners, designers, and local Varanasi weavers directly to global buyers, we eliminate layers of middlemen to support heritage weaving communities.
              </p>

              <div className="weaver-stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="weaver-stat-box">
                  <span className="stat-value-luxury" style={{ fontFamily: 'var(--font-modern-heading, "Manrope", sans-serif)', fontWeight: '500' }}>0</span>
                  <span className="stat-label-luxury">Setup Fees</span>
                </div>
                <div className="weaver-stat-box">
                  <span className="stat-value-luxury" style={{ fontFamily: 'var(--font-modern-heading, "Manrope", sans-serif)', fontWeight: '500' }}>3-5</span>
                  <span className="stat-label-luxury">Days Dispatch</span>
                </div>
                <div className="weaver-stat-box">
                  <span className="stat-value-luxury" style={{ fontFamily: 'var(--font-modern-heading, "Manrope", sans-serif)', fontWeight: '500' }}>100%</span>
                  <span className="stat-label-luxury">Direct Payouts</span>
                </div>
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
      {/* 6. Contact Us Section */}
      <div ref={contactRef} className="offerings-contact-wrapper">
        <ContactSection navigate={navigate} />
      </div>
    </div>
  );
}

