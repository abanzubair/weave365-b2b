import React from 'react';
import { ChevronRight, Truck, ChevronDown } from 'lucide-react';
import { LegalSidebar } from '../components/LegalSidebar.jsx';

export function ShippingDeliveryPage({ navigate }) {
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
      q: "Do you ship bulk orders internationally?",
      a: "Yes. Weave 365 exports premium sarees to boutiques and retailers globally, including the USA, Canada, UK, UAE, Australia, and Singapore. International orders are dispatched via reliable air courier partners (DHL, FedEx, UPS) or freight forwarders."
    },
    {
      q: "Who is responsible for international customs duties and taxes?",
      a: "For all international exports, import custom duties, localized taxes, and clearance fees are the sole responsibility of the buyer/importer. These fees vary by country and are billed directly by the courier company at the time of delivery."
    },
    {
      q: "Can I track my consignment in real time?",
      a: "Yes. Once your order passes our five-step quality control check and is handed over to the courier partner, a tracking link and a digital copy of the invoice will be shared with you immediately via email and your registered WhatsApp number."
    }
  ];

  return (
    <div className="legal-page-container shipping-delivery-page" data-page-id="shipping-delivery">
      {/* breadcrumbs */}
      <div className="legal-breadcrumbs">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('home'); }}>Home</a>
        <ChevronRight size={12} className="breadcrumb-divider" />
        <span className="active">Shipping & Delivery</span>
      </div>

      <div className="legal-layout">
        {/* reusable sidebar */}
        <LegalSidebar activeTab="shipping-delivery" navigate={navigate} />

        {/* content card */}
        <article className="legal-content-card animate-fade-in">
          <div className="legal-brand-kicker">Weave 365 Logistics</div>
          <h1 className="legal-h1">Saree Shipping & Delivery Policy</h1>

          <div className="legal-text-content">
            <p className="lead">
              At Weave 365, we recognize that timely, safe, and highly reliable transit is essential for retail store inventories, boutique showcases, and global export operations. We partner with India\'s elite logistics suppliers to guarantee safe arrival of your premium Banarasi sarees.
            </p>

            <h2>1. Dispatch Hub & Origin of Goods</h2>
            <p>
              To guarantee absolute authenticity and zero markup costs, all shipments originate directly from our central manufacturing warehouse in <strong>Varanasi, Uttar Pradesh, India</strong>. 
            </p>
            <p>
              Orders are double-checked, ironed, folded in premium water-resistant packaging, and dispatched directly from the weavers\' origin to your business location.
            </p>

            <h2>2. Shipping Tariffs and Order Value</h2>
            <p>
              We provide competitive logistics structures designed to lower overhead costs for boutique owners and commercial resellers:
            </p>
            <ul>
              <li><strong>Domestic Shipments (India):</strong> Free standard ground shipping on orders exceeding a value of ₹15,000. Orders below this threshold incur nominal calculated weight-based tariffs at checkout.</li>
              <li><strong>Express Courier:</strong> Expedited air delivery options are available upon request for urgent wedding seasons or festive inventory restocks.</li>
              <li><strong>International Consignments:</strong> Calculated dynamically at checkout based on package weight (gross volume) and destination coordinates.</li>
            </ul>

            <div className="legal-highlight-box">
              <p>
                <strong>Packaging Standard:</strong> Every wholesale bundle is securely encased in heavy-gauge, water-resistant, moisture-proof commercial poly-wrapping and packed in strong corrugated cartons to withstand rough transit conditions.
              </p>
            </div>

            <h2>3. Delivery Windows & Timelines</h2>
            <p>
              Delivery times depend on custom orders, handweaving schedules, and shipping options:
            </p>
            <ol>
              <li><strong>In-Stock Items:</strong> Dispatched from Varanasi within 24–48 hours of payment receipt. Delivery takes <strong>5 to 7 business days</strong> domestically and <strong>10 to 15 business days</strong> globally.</li>
              <li><strong>Custom Weaving / Out-of-Stock:</strong> For bulk boutique orders requiring customized designs or bulk yarn dyeing, weaving timetables typically span 4 to 8 weeks. Accurate estimates will be detailed in your custom commercial invoice.</li>
            </ol>

            <h2>4. Bulk Cargo & Freight Forwarding</h2>
            <p>
              For extreme bulk commercial volumes (weights exceeding 100 kilograms), Weave 365 supports customized commercial shipping:
            </p>
            <p>
              We handle direct container cargo (LCL/FCL) coordinate with major ports, export custom documentation, and assist your designated shipping agents to streamline custom compliance at domestic ports.
            </p>
          </div>

          {/* FAQ section */}
          <section className="legal-faq-section">
            <h2 className="legal-faq-section-title">Shipping & Logistics FAQs</h2>
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
