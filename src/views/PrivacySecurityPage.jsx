import React from 'react';
import { ChevronRight, ShieldCheck, ChevronDown } from 'lucide-react';
import { LegalSidebar } from '../components/LegalSidebar.jsx';

export function PrivacySecurityPage({ navigate }) {
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
      q: "Is my business GSTIN and tax billing information secure?",
      a: "Yes. All business identity profiles, including GSTIN documents and tax credit data, are stored in encrypted databases. We utilize these details strictly for generating compliant tax invoices and do not share them with external parties."
    },
    {
      q: "Does Weave 365 store my credit card or bank credentials?",
      a: "No. Weave 365 does not store any financial passwords, credit card numbers, or net banking credentials. All payments are processed through PCI-DSS compliant secure commercial payment gateways (such as Razorpay, Stripe, or PayPal) utilizing 256-bit SSL encryption."
    },
    {
      q: "How can I opt out of WhatsApp catalog and marketing broadcast updates?",
      a: "While order confirmations and tracking information must be sent via WhatsApp/SMS, you can opt out of catalog and marketing broadcasts. Simply reply with 'STOP' to any broadcast message or adjust your preferences in your wholesale Account Dashboard."
    }
  ];

  return (
    <div className="legal-page-container privacy-security-page" data-page-id="privacy-security">
      {/* breadcrumbs */}
      <div className="legal-breadcrumbs">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('home'); }}>Home</a>
        <ChevronRight size={12} className="breadcrumb-divider" />
        <span className="active">Privacy & Security</span>
      </div>

      <div className="legal-layout">
        {/* reusable sidebar */}
        <LegalSidebar activeTab="privacy-security" navigate={navigate} />

        {/* content card */}
        <article className="legal-content-card animate-fade-in">
          <div className="legal-brand-kicker">Weave 365 Security</div>
          <h1 className="legal-h1">Portal Privacy & Data Security Policy</h1>

          <div className="legal-text-content">
            <p className="lead">
              At Weave 365, we are deeply committed to protecting the proprietary business records, transaction histories, and contact details of our retail partners, boutique owners, and reseller networks. We maintain robust server-side security to safeguard your commercial operations.
            </p>

            <h2>1. Collection of Business Data</h2>
            <p>
              To offer comprehensive sourcing services, manage wholesale carts and orders, and verify trade credentials, we collect:
            </p>
            <ul>
              <li><strong>Corporate Identity:</strong> Business Name, Boutique registration certificates, and owner details.</li>
              <li><strong>Tax Documentation:</strong> Good and Services Tax Identification Number (GSTIN) for tax invoices.</li>
              <li><strong>Contact Information:</strong> Active WhatsApp phone numbers, email addresses, and physical delivery coordinates.</li>
              <li><strong>Reseller Tools:</strong> Shared catalog details, custom pricing adjustments, and branding preferences.</li>
            </ul>

            <div className="legal-highlight-box">
              <p>
                <strong>Security Guarantee:</strong> We enforce strict access controls. Only authorized logistics managers and invoicing supervisors can view business delivery coordinates and trade files.
              </p>
            </div>

            <h2>2. Processing and Utilization of Information</h2>
            <p>
              Your business intelligence data is utilized to streamline wholesale operations:
            </p>
            <p>
              We compile and analyze catalog interaction data to enhance production volumes for trending weaves (e.g. organza vs katan). Consignment details are shared with our logistics partners (BlueDart, FedEx, etc.) to complete deliveries. We use email/WhatsApp channels to send shipment tracking numbers, catalog updates, and price lists.
            </p>

            <h2>3. Secure Online Transactions & Gateway Encryption</h2>
            <p>
              All online payments executed on the Weave 365 platform are protected by industry-standard encryption protocols:
            </p>
            <p>
              Checkout pages use secure sockets layer (SSL) certificates to establish secure links. Financial transactions are routed directly via secure, audited payment gateways with multi-factor authentication (OTP verification). We never store or inspect bank account details, raw card numbers, or digital wallets.
            </p>

            <h2>4. Cookie Policies & Regional Compliance</h2>
            <p>
              Weave 365 utilizes cookies and local browser storage to keep you logged in to your account, preserve products in your cart drawer, and remember your preferred currency settings (INR, USD, etc.).
            </p>
            <p>
              Our privacy framework complies with the <strong>Information Technology Act, 2000 (India)</strong>, regional cybersecurity protocols, and international data protection standards.
            </p>
          </div>

          {/* FAQ section */}
          <section className="legal-faq-section">
            <h2 className="legal-faq-section-title">Data Privacy & Security FAQs</h2>
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
