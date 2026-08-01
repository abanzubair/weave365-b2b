import React from 'react';
import { ChevronRight, RotateCcw, ChevronDown } from 'lucide-react';
import { LegalSidebar } from '../components/LegalSidebar.jsx';

export function ReturnsCancellationPage({ navigate }) {
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
      q: "Why is a continuous parcel unboxing video mandatory?",
      a: "As a wholesaler supplying products at near-manufacturing prices, our margins do not account for post-delivery consumer handling damage. A continuous, unedited unboxing video (starting with the sealed courier packet, displaying the shipping label, and showing the direct unpacking and unfolding of the product) provides ironclad proof of transit damage and helps us file claims with transport partners."
    },
    {
      q: "Can I return products that are not selling well in my store?",
      a: "No. Weave 365 operates strictly as a wholesale manufacturing network, not a consignment store. We do not support returns, exchanges, or buybacks for unsold stocks or slow-moving reseller collections."
    },
    {
      q: "How long does the refund reflection take after approval?",
      a: "Once a damage claim is verified and the damaged items are returned to our Varanasi center, refunds are processed within 3 to 5 business days. You can choose to receive direct store credit for your subsequent orders or a bank wire transfer to your business account."
    }
  ];

  return (
    <div className="legal-page-container">
      {/* breadcrumbs */}
      <div className="legal-breadcrumbs">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('home'); }}>Home</a>
        <ChevronRight size={12} className="breadcrumb-divider" />
        <span className="active">Returns & Cancellation</span>
      </div>

      <div className="legal-layout">
        {/* reusable sidebar */}
        <LegalSidebar activeTab="returns-cancellation" navigate={navigate} />

        {/* content card */}
        <article className="legal-content-card animate-fade-in">
          <div className="legal-brand-kicker">Weave 365 Policies</div>
          <h1 className="legal-h1">Wholesale Returns & Cancellation Policy</h1>

          <div className="legal-text-content">
            <p className="lead">
              Weave 365 processes commercial wholesale transactions exclusively. Because we supply premium, authentic Banarasi sarees directly from artisans at strict bulk pricing structures, our return and cancellation terms differ from standard retail platforms.
            </p>

            <h2>1. Zero Return Policy (Excluding Manufacturing Damage)</h2>
            <p>
              We stand behind the premium, five-step verified quality of our collections. However, all sales are considered final:
            </p>
            <ul>
              <li><strong>No Change of Mind Returns:</strong> We do not accept returns or catalog exchanges if you dislike a color hue, texture, drape, or if the item is slow-moving in your retail store.</li>
              <li><strong>Exclusion of Handloom Marks:</strong> As explained in our <a href="/disclaimer" onClick={(e) => { e.preventDefault(); navigate('disclaimer'); }}>Product Disclaimer</a>, minor weaving variations, thread slubs, and zari inconsistencies are natural signatures of hand-loomed silk and are not considered manufacturing defects.</li>
            </ul>

            <div className="legal-highlight-box">
              <p>
                <strong>MANDATORY CLAIM REQUIREMENT:</strong> You must record a continuous, unedited high-definition parcel unboxing video within 48 hours of cargo delivery to report any transit damages or missing item quantities.
              </p>
            </div>

            <h2>2. Processing Damage & Defect Claims</h2>
            <p>
              If a product possesses severe structural manufacturing defects (such as a major fabric tear, missing pallu weaving, or severe chemical staining):
            </p>
            <ol>
              <li>Email our logistics support team at <strong>weave365@gmail.com</strong> or message your assigned wholesale account manager on WhatsApp within 48 hours of receipt.</li>
              <li>Attach the continuous unboxing video along with close-up high-resolution photographs of the defect.</li>
              <li>Upon verification, our Varanasi center will issue a pre-paid reverse pickup label. The item must be returned in its original folds, accompanied by tags and premium packaging.</li>
              <li>Once received and inspected at our center, we will dispatch a replacement product or issue a credit note/refund.</li>
            </ol>

            <h2>3. Cancellation Guidelines</h2>
            <p>
              Cancellation options depend on order classification and dispatch timeline status:
            </p>
            <p>
              <strong>Ready-to-Ship Catalogs:</strong> Paid wholesale orders may be cancelled prior to warehouse packaging and hand-over to shipping agents. A 3% transaction gateway processing fee will be deducted from the refund. Once the package is shipped from our Varanasi warehouse, cancellations cannot be processed.
            </p>
            <p>
              <strong>Custom Weaving Orders:</strong> Custom bridal orders, tailored colors, and bulk bespoke weaving orders cannot be cancelled once yarn dyeing or handloom setup has commenced.
            </p>
          </div>

          {/* FAQ section */}
          <section className="legal-faq-section">
            <h2 className="legal-faq-section-title">Returns & Claims FAQs</h2>
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
