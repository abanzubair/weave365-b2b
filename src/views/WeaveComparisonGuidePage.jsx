import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, ArrowRight } from '../components/icons.jsx';
import { seoLandingPages } from '../data/seoLandingPages.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import '../styles/weaveComparisonGuide.css';

export function WeaveComparisonGuidePage({ navigate }) {
  const pageData = seoLandingPages['handloom-vs-powerloom-guide'] || seoLandingPages['handloom-vs-semi-handloom-vs-powerloom-guide'] || {};
  const [openFaq, setOpenFaq] = useState(null);

  // Synchronize dynamic head titles on client route switches
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const originalTitle = document.title;
    document.title = pageData.metaTitle || "Handloom vs Semi Handloom vs Powerloom Guide | Weave 365";
    
    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (metaDesc) {
      metaDesc.setAttribute('content', pageData.metaDescription || '');
    }
    
    return () => {
      document.title = originalTitle;
      if (metaDesc && originalDesc) {
        metaDesc.setAttribute('content', originalDesc);
      }
    };
  }, [pageData]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const introParagraphs = pageData.introText ? pageData.introText.split('\n\n') : [];

  return (
    <article className="weave-guide-container">
      {/* Dynamic SEO JSON-LD FAQ Schema */}
      {pageData.faqs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": pageData.faqs.map((faq) => ({
                "@type": "Question",
                "name": faq.q,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.a
                }
              }))
            })
          }}
        />
      )}

      <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Weave Guide' }]} navigate={navigate} />

      {/* Magazine Hero */}
      <header className="weave-guide-hero">
        <span className="kicker">{pageData.introTitle || "Weave Comparison"}</span>
        <h1>{pageData.h1 || "Handloom vs Semi Handloom vs Powerloom, What is the Real Difference"}</h1>
        <div className="divider"></div>
        <p className="tagline">Know your Banarasi Saree before you buy</p>
      </header>

      <main className="weave-guide-layout">
        {/* Intro Narrative */}
        <section className="weave-guide-intro" aria-label="Introduction">
          {introParagraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </section>

        {/* Alternating Split Rows Section */}
        {pageData.comparisonSections && (
          <section className="weave-comparison-rows-container" aria-label="Weave comparison details">
            {pageData.comparisonSections.map((sec, idx) => (
              <article className="weave-comparison-row" key={idx}>
                <div className="weave-comparison-image-column">
                  <div className="weave-comparison-image-wrap">
                    <img src={sec.image} alt={sec.title} loading="lazy" />
                    {sec.badge && <span className="weave-comparison-badge">{sec.badge}</span>}
                  </div>
                </div>
                <div className="weave-comparison-text-column">
                  <h2>{sec.title}</h2>
                  <p>{sec.content}</p>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* Features Comparison Matrix */}
        <section className="weave-matrix-section" aria-label="Feature Comparison Matrix">
          <h2>Weaving Technology & Quality Matrix</h2>
          <div className="weave-matrix-wrapper">
            <table className="weave-matrix-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Handloom Weaving</th>
                  <th>Semi-Handloom Weaving</th>
                  <th>Powerloom Weaving</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Loom Type</td>
                  <td>Pit loom / Frame loom (Manual)</td>
                  <td>Modified machine loom with manual help</td>
                  <td>Electric powerloom (Fully mechanized)</td>
                </tr>
                <tr>
                  <td>Weaving Mechanism</td>
                  <td>Operated by hand & foot pedals (No electricity)</td>
                  <td>Hand-guided jacquard with machine helper</td>
                  <td>Automated shuttle and pattern card rollers</td>
                </tr>
                <tr>
                  <td>Crafting Time</td>
                  <td>Several days to weeks per saree</td>
                  <td>1 to 3 days per saree</td>
                  <td>A few hours per saree</td>
                </tr>
                <tr>
                  <td>Texture & Finish</td>
                  <td>Soft, organic with unique minor slub variations</td>
                  <td>Even weave, matching handwoven drapes</td>
                  <td>Extremely uniform, stiff, machine-perfect</td>
                </tr>
                <tr>
                  <td>Border & Reverse Side</td>
                  <td>Soft raw thread floats and neat tied knots</td>
                  <td>Clean reverse side with clipped threads</td>
                  <td>Strictly even, machine-locked selvage borders</td>
                </tr>
                <tr>
                  <td>Pricing Grade</td>
                  <td>Premium / Luxury Heritage</td>
                  <td>Medium / Budget Friendly</td>
                  <td>Affordable / Mass Market</td>
                </tr>
                <tr>
                  <td>Ideal Sourcing Focus</td>
                  <td>High-end bridal boutiques, heirloom buyers</td>
                  <td>Affordable boutique retailers, resellers</td>
                  <td>Daily wear showrooms, high volume resellers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Sourcing Sorter / Checklist Steps */}
        {pageData.buyerGuideSections && (
          <section className="weave-steps-section" aria-label="Quality Checks">
            <h2>{pageData.buyerGuideTitle || "How We Check Handloom, Semi Handloom and Powerloom Saree"}</h2>
            <span className="section-subtitle">Varanasi's direct-weaver B2B sourcing checks for boutiques worldwide</span>
            <div className="weave-steps-grid">
              {pageData.buyerGuideSections.map((step, idx) => (
                <div className="weave-step-card" key={idx}>
                  <div className="step-num">0{idx + 1}</div>
                  <h3>{step.title.replace(/^\d+\.\s*/, '')}</h3>
                  <p>{step.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {pageData.faqs && (
          <section className="weave-faq-section" aria-label="Frequently Asked Questions">
            <h2>Frequently Asked Questions</h2>
            <div className="weave-faq-list">
              {pageData.faqs.map((faq, idx) => (
                <div className={`weave-faq-item ${openFaq === idx ? 'active' : ''}`} key={idx}>
                  <button
                    type="button"
                    className="weave-faq-trigger"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={openFaq === idx}
                  >
                    <h3>{faq.q}</h3>
                    <ChevronDown size={18} className="weave-faq-icon" />
                  </button>
                  <div className="weave-faq-content">
                    <div className="weave-faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA Panel */}
        <section className="weave-cta-panel">
          <h2>Source Varanasi Weaves with Absolute Transparency</h2>
          <p>
            Join over 2,000+ verified boutiques, exporters, and resellers sourcing directly from Varanasi weavers with transparent pricing grades.
          </p>
          <div className="weave-cta-buttons">
            <a
              href="/catalogue"
              className="editorial-btn editorial-btn-primary"
              onClick={(e) => { e.preventDefault(); navigate('catalogue'); }}
            >
              <span>Browse Saree Catalog</span>
              <ArrowRight size={16} />
            </a>
            <a
              href="/bulk-inquiry"
              className="editorial-btn editorial-btn-secondary"
              onClick={(e) => { e.preventDefault(); navigate('bulk-inquiry'); }}
            >
              <span>Submit Custom Inquiry</span>
            </a>
          </div>
        </section>
      </main>
    </article>
  );
}
