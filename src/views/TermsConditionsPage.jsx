import React from 'react';
import { ChevronRight, FileText, ChevronDown } from 'lucide-react';
import { LegalSidebar } from '../components/LegalSidebar.jsx';

export function TermsConditionsPage({ navigate }) {
  const [openFaq, setOpenFaq] = React.useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  const faqs = [
    {
      q: "Can standard retail buyers buy individual sarees at these prices?",
      a: "No. Weave 365 is strictly a wholesale platform. Individual buyers seeking single items for personal use are not eligible for our wholesale trade prices. All checkout baskets must fulfill our minimum order quantity threshold."
    },
    {
      q: "Am I allowed to use Weave 365 catalog photos for my online boutique?",
      a: "Yes. Registered, active buyers and verified resellers are granted a non-exclusive, revocable license to utilize our high-resolution product imagery and descriptions to market the sarees to their end consumers. Scraping or copying these assets for non-reselling purposes is strictly prohibited."
    },
    {
      q: "What happens if there is a trade dispute between my company and Weave 365?",
      a: "We prioritize direct merchant negotiation to resolve any trade differences. However, if a resolution is not achieved, all legal contentions, disputes, or arbitrations shall be governed exclusively by Indian trade laws and fall under the sole jurisdiction of courts in Varanasi, Uttar Pradesh, India."
    }
  ];

  return (
    <div className="legal-page-container terms-conditions-page" data-page-id="terms-conditions">
      {/* breadcrumbs */}
      <div className="legal-breadcrumbs">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('home'); }}>Home</a>
        <ChevronRight size={12} className="breadcrumb-divider" />
        <span className="active">Terms & Conditions</span>
      </div>

      <div className="legal-layout">
        {/* reusable sidebar */}
        <LegalSidebar activeTab="terms-conditions" navigate={navigate} />

        {/* content card */}
        <article className="legal-content-card animate-fade-in">
          <div className="legal-brand-kicker">Weave 365 Regulations</div>
          <h1 className="legal-h1">Portal Terms, MOQ & Conditions of Use</h1>

          <div className="legal-text-content">
            <p className="lead">
              Welcome to the partner portal of Weave 365. Access to our catalog, wholesale price lists, reseller resources, and checkout systems is governed by the trade terms detailed below. By registering a buyer profile, you agree to comply with these terms.
            </p>

            <h2>1. Trade-Only Portal Qualification</h2>
            <p>
              Weave 365 operates as a dedicated wholesale supplier network. By creating an account and placing orders, you represent and warrant that:
            </p>
            <ul>
              <li>You are a legitimate merchant, boutique owner, online reseller, commercial exporter, or home-business operator.</li>
              <li>You possess necessary local tax registration numbers (such as GSTIN in India) or valid trade certificates in your respective country.</li>
              <li>All purchases are executed with commercial intent for resale, retail exhibition, or business inventory sourcing.</li>
            </ul>

            <div className="legal-highlight-box">
              <p>
                <strong>Minimum Order Quantity (MOQ):</strong> To safeguard wholesale pricing integrity, Weave 365 enforces a strict MOQ of at least <strong>3 sarees</strong> (across any catalog mix) per checkout order. Single-item retail orders are automatically blocked at checkout.
              </p>
            </div>

            <h2>2. Payment Settlement & Pricing Integrity</h2>
            <p>
              We operate under transparent, direct wholesale terms:
            </p>
            <p>
              All wholesale transactions are secured in full advance of dispatch. We support UPI, credit cards, bank wire transfers, and PayPal (for international exports). We do not support credit cycles or post-delivery billing accounts. Price rates quoted exclude Indian GST (currently 5% on sarees) and logistics charges, which are calculated clearly at checkout.
            </p>

            <h2>3. Limited Intellectual Property License</h2>
            <p>
              The digital catalog designs, high-fidelity studio photos, weaver stories, and branding marks presented on this website are the exclusive property of Weave 365.
            </p>
            <p>
              Approved wholesale buyers are granted a limited, non-assignable license to distribute catalog media for retail sales. Re-branding our premium sarees under another label without formal approval is strictly prohibited.
            </p>

            <h2>4. Jurisdiction and Dispute Resolution</h2>
            <p>
              These Terms & Conditions and all commercial trade transactions are governed by and construed in accordance with the laws of the Republic of India.
            </p>
            <p>
              Any legal proceeding, lawsuit, or arbitration arising from an order placed on Weave 365 must be initiated exclusively within the courts of <strong>Varanasi, Uttar Pradesh, India</strong>, where our artisan production network is legally based.
            </p>
          </div>

          {/* FAQ section */}
          <section className="legal-faq-section">
            <h2 className="legal-faq-section-title">Terms of Use FAQs</h2>
            <div className="legal-faq-container">
              {faqs.map((faq, index) => (
                <details 
                  key={index}
                  className="legal-faq-item" 
                  open={openFaq === index}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFaq(index);
                  }}
                >
                  <summary className="legal-faq-summary">
                    {faq.q}
                    <ChevronDown size={16} />
                  </summary>
                  <div className="legal-faq-content">
                    <p>{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

        </article>
      </div>
    </div>
  );
}
