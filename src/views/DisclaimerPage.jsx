import React from 'react';
import { ChevronRight, ShieldAlert, ChevronDown } from 'lucide-react';
import { LegalSidebar } from '../components/LegalSidebar.jsx';

export function DisclaimerPage({ navigate }) {
  const [openFaq, setOpenFaq] = React.useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  React.useEffect(() => {
    // Scroll to top when view mounts
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  const faqs = [
    {
      q: "Why do actual sarees sometimes vary from the photographs?",
      a: "All Weave 365 sarees are photographed in high-fidelity studio lighting conditions using professional-grade cameras. Furthermore, individual computer screens, mobile devices, and screen settings possess unique color rendering profiles. While we strive to show products as accurately as possible, slight color variations are expected."
    },
    {
      q: "What defines a weaving anomaly versus a product defect?",
      a: "Our pure silk, katan, and organza Banarasi sarees are hand-loomed and crafted by authentic Varanasi artisans. Small variations in weaving density, minor slubs in the thread, or tiny thread ends are natural signatures of the manual weaving process. These are considered hallmarks of authenticity and luxury heritage, not defects."
    },
    {
      q: "Can I get samples before placing a bulk wholesale order?",
      a: "Yes. For boutique owners and verified resellers, we provide sample sourcing options at retail rates which can be adjusted upon your subsequent bulk cargo orders. Please connect with our WhatsApp support or submit a bulk inquiry form."
    }
  ];

  return (
    <div className="legal-page-container">
      {/* breadcrumbs */}
      <div className="legal-breadcrumbs">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('home'); }}>Home</a>
        <ChevronRight size={12} className="breadcrumb-divider" />
        <span className="active">Disclaimer</span>
      </div>

      <div className="legal-layout">
        {/* reusable sidebar */}
        <LegalSidebar activeTab="disclaimer" navigate={navigate} />

        {/* content card */}
        <article className="legal-content-card animate-fade-in">
          <div className="legal-brand-kicker">Weave 365 Policies</div>
          <h1 className="legal-h1">Saree Sourcing & Product Disclaimer</h1>
          <span className="legal-legal-updated-date">Last Updated: May 2026</span>

          <div className="legal-text-content">
            <p className="lead">
              Weave 365 operates as a premier Banarasi saree wholesale and manufacturing network based in Varanasi, India. By accessing our wholesale catalogs, registering a reseller profile, or executing payments, you explicitly agree to the product characteristics and liability terms defined herein.
            </p>

            <h2>1. Handwoven Integrity and Textural Variations</h2>
            <p>
              The hallmark of a pure Banarasi saree is its hand-loomed complexity. Our collections—including <strong>Katan Silk, Organza, Georgette, Meenakari, and Tanchoi</strong>—are handcrafted by traditional artisans. Because of the manual weaving process:
            </p>
            <ul>
              <li><strong>Texture & Weave:</strong> Minor inconsistencies in the zari borders, subtle thread fluctuations, and handloom slubs are natural characteristics of authentic weaving. These elements are not classified as manufacturing defects.</li>
              <li><strong>Zari Lustre:</strong> We use certified metallic and pure silver/gold zari. The appearance of zari luster may vary under different ambient lighting and environments (warm versus white light).</li>
            </ul>

            <div className="legal-highlight-box">
              <p>
                <strong>Reseller Tip:</strong> We recommend boutique owners educate their final retail buyers on the organic beauty of handloom textiles to enhance the premium storytelling and heritage of each purchase.
              </p>
            </div>

            <h2>2. Visual Representation and Color Calibration</h2>
            <p>
              We prioritize visual excellence in our product catalogs. However, digital photography and varying screen calibrations mean we cannot guarantee an exact match of the hues on your display:
            </p>
            <p>
              Model images are provided solely for drape, scale, and stylistic reference. The actual flat product catalog shots represent the truest color profile of the saree. We advise wholesalers to review flat-lay pictures carefully.
            </p>

            <h2>3. Commercial Transactions & Limit of Liability</h2>
            <p>
              Weave 365 handles commercial transactions. Purchase orders are placed with the understanding that boutique owners and retailers operate as independent merchants.
            </p>
            <p>
              In no event shall Weave 365 or its manufacturing affiliates be liable for any indirect, incidental, or consequential business losses (including loss of retail sales, boutique profits, or marketing expenditure) arising from delay in supply, transit delays, or handloom artisan constraints.
            </p>

            <h2>4. Price Adjustments and Catalog Variations</h2>
            <p>
              Due to fluctuations in the spot price of pure silk yarn, metallic zari, and regional labor tariffs, all wholesale price lists are subject to change without prior notice. Confirmed and paid orders are locked at the transaction rate.
            </p>
          </div>

          {/* FAQ section */}
          <section className="legal-faq-section">
            <h2 className="legal-faq-section-title">Disclaimer FAQs</h2>
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
