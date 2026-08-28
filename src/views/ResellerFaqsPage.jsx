import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { LegalSidebar } from '../components/LegalSidebar.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';

export function ResellerFaqsPage({ navigate }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  const allFaqs = [
    {
      q: "Is registration free?",
      a: "Yes. Registration is free for the standard reseller and dropshipping programme. There is no registration fee, setup fee or monthly subscription fee."
    },
    {
      q: "Do I need to maintain stock or buy inventory upfront?",
      a: "No. You do not need to maintain inventory for eligible dropshipping products. You first receive the order from your customer and then place the corresponding order with Weave 365."
    },
    {
      q: "Can I place a single-piece order?",
      a: "Yes. Eligible reseller and dropshipping orders can be placed for a single piece. Regular wholesale and bulk orders may have separate minimum order quantities or commercial terms."
    },
    {
      q: "Do I pay Weave 365 before dispatch?",
      a: "Yes. The applicable Weave 365 payment must be received before the reseller or dropshipping order is processed and dispatched, unless different payment terms have been approved in writing."
    },
    {
      q: "How do I make a profit?",
      a: "You purchase the product from Weave 365 at the applicable reseller price and decide your own customer selling price, subject to applicable law and any specific commercial arrangement. Your gross margin is the difference between the price charged to your customer and the amount payable to Weave 365, before your other business costs. Weave 365 does not guarantee any particular sales, income or profit."
    },
    {
      q: "Can I sell products under my own brand?",
      a: "Yes. Eligible products can be sold under your own brand name through the white-label reseller programme. Weave 365 may provide approved white-label catalogues, product images and product information for this purpose. Your use of Weave 365 products under your own brand does not transfer ownership of Weave 365's intellectual property to you."
    },
    {
      q: "Can products be shipped without Weave 365 branding?",
      a: "Yes, for eligible white-label dropshipping orders. The external customer-facing shipment may be arranged without Weave 365 branding and may be processed under the reseller's brand, subject to the applicable fulfilment arrangement. White-label fulfilment is available only where the product and shipping arrangement support it."
    },
    {
      q: "Can I issue the customer-facing invoice under my own brand?",
      a: "Yes, where you are selling the product to your customer as the reseller. You are responsible for issuing the customer-facing invoice or other required sales document in your own business name and for meeting your applicable GST, tax, invoicing and record-keeping requirements. Weave 365's invoice to the reseller is separate from the reseller's invoice or sales document to its customer."
    },
    {
      q: "Do you provide a GST invoice?",
      a: "Weave 365 will issue the applicable invoice for the transaction with the reseller, subject to the information required for invoicing. The reseller is responsible for issuing its own customer-facing invoice and complying with its own applicable GST and tax requirements. The reseller should provide correct business and GST details to Weave 365 where required."
    },
    {
      q: "Where can I sell Weave 365 products?",
      a: "You can sell eligible products through channels such as WhatsApp, Instagram, Facebook and your own website or online store. You may use approved Weave 365 product images, product information and white-label catalogues for legitimate sales of Weave 365 products. You are responsible for your own pricing, advertising, customer communication and sales activity."
    },
    {
      q: "Will my customer see Weave 365 branding or wholesale prices?",
      a: "For eligible white-label dropshipping orders, the customer-facing shipment is intended to be presented without Weave 365 branding and without displaying the reseller's wholesale purchase price. The exact packaging and documentation may depend on the applicable fulfilment arrangement. You must not make false claims about the product's origin, manufacturing, certification or brand ownership."
    },
    {
      q: "What are the shipping charges for India and international orders?",
      a: "Eligible reseller and dropshipping orders may qualify for free shipping within India, as stated at the time of order. International shipping charges depend on factors such as destination, parcel weight, dimensions, courier service and applicable rates. International customs duties, import taxes and destination-specific charges are generally separate from the product price and shipping charge and may be payable by the customer or reseller, as applicable."
    },
    {
      q: "Is COD available?",
      a: "No. COD is not available for standard reseller and dropshipping orders unless Weave 365 specifically agrees otherwise. The reseller must make the applicable payment to Weave 365 before the order is processed and dispatched."
    },
    {
      q: "What happens if my customer cancels an order?",
      a: "You may request cancellation before Weave 365 has processed or dispatched the order, subject to the applicable order status. Once the order has entered processing, packing or dispatch, cancellation may no longer be possible. The applicable cancellation and refund rules are set out in the Returns, Cancellation & Refunds Policy."
    },
    {
      q: "What is the return policy for reseller orders?",
      a: "For reseller and dropshipping orders, returns are generally not accepted for change of mind, customer preference, slow-moving stock or normal product variations. A return or other remedy may be considered where the customer receives an incorrect product or where there is a verified qualifying product defect, subject to the applicable claim process."
    },
    {
      q: "When is an exchange allowed?",
      a: "An exchange or replacement may be considered for an incorrect product supplied by Weave 365 or a verified qualifying product defect. Normal product characteristics, change of mind and customer preference do not normally qualify for exchange on reseller orders."
    },
    {
      q: "Do I need to record an unboxing video?",
      a: "For certain incorrect-product, damage or product-defect claims, Weave 365 may require a continuous, unedited unboxing video. Where required, the video should start with the sealed parcel and show the opening and inspection of the product. You should report the issue promptly and provide the evidence requested for verification."
    },
    {
      q: "What does Weave 365 cover?",
      a: "Weave 365 handles the product sourcing, applicable quality checking, packing and fulfilment services included in the order. Where a product supplied by Weave 365 is incorrect or has a verified qualifying defect, the matter may be reviewed under the applicable claim process. Weave 365 does not take responsibility for the reseller's independent customer promises, pricing, advertising or other business decisions."
    },
    {
      q: "Who communicates with the customer?",
      a: "The reseller normally communicates directly with its customer. For dropshipping, Weave 365 handles the fulfilment activities agreed for the order, while the reseller manages the customer relationship. The reseller should keep its customer informed about order and delivery matters."
    },
    {
      q: "Who handles NDR?",
      a: "The reseller is responsible for coordinating with its customer when an NDR is raised. Weave 365 may provide the shipment or NDR information received from the shipping partner. The reseller is responsible for obtaining any required confirmation or information from its customer for re-delivery."
    },
    {
      q: "Who pays RTO charges?",
      a: "For reseller and dropshipping orders, RTO charges caused by customer-side or reseller-side issues are generally payable by the reseller. Examples include customer refusal, an incorrect or incomplete address, or customer unavailability. Where the issue is caused by a fulfilment error attributable to Weave 365, the matter will be reviewed under the applicable process."
    },
    {
      q: "Who pays the return or RTO shipping cost?",
      a: "Where a return or RTO results from a customer-side or reseller-side issue, the applicable return, RTO or additional shipping cost may be charged to the reseller. Where the issue is caused by an incorrect product supplied by Weave 365 or another qualifying fulfilment issue attributable to Weave 365, the applicable cost will be handled under the relevant claim process."
    },
    {
      q: "Who is responsible for customer-related issues?",
      a: "The reseller is responsible for: Customer communication, Customer selling price, Product selection and customer advice, Correct customer and delivery information, Customer-side cancellations and refusals, NDR coordination, Customer-side delivery issues, Claims and communication with the customer. Weave 365 is responsible for the fulfilment activities included in the reseller's order."
    },
    {
      q: "Are there any registration or monthly charges?",
      a: "No. There is no registration fee or monthly subscription fee for the standard reseller and dropshipping programme. Any separately purchased service, custom arrangement or optional service will be governed by its applicable commercial terms."
    },
    {
      q: "Can I use Weave 365 product images and catalogues?",
      a: "Yes, where the materials are provided or authorised for reseller use. You may use approved product images, descriptions and catalogues to market eligible Weave 365 products. You must not use the materials for unrelated products, misleading claims or unauthorised purposes."
    },
    {
      q: "Does Weave 365 guarantee my sales or profit?",
      a: "No. Weave 365 provides products and eligible reseller or fulfilment services. It does not guarantee sales volume, customer demand, revenue, gross margin or profit."
    },
    {
      q: "Who is responsible for GST and taxes on my customer sale?",
      a: "You are responsible for your own tax and GST obligations arising from your sale to your customer. This includes determining whether you need to register, issue an invoice, charge GST, maintain records or meet other applicable requirements. Weave 365's tax and invoicing obligations apply to its transaction with you and do not replace your own legal obligations as a reseller."
    }
  ];

  const filteredFaqs = searchQuery.trim()
    ? allFaqs.filter(
        (f) =>
          f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allFaqs;

  return (
    <div className="legal-page-container reseller-faqs-page" data-page-id="reseller-faqs">
      <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Reseller FAQs' }]} navigate={navigate} />

      <div className="legal-layout">
        {/* Reusable Information Desk Sidebar */}
        <LegalSidebar activeTab="reseller-faqs" navigate={navigate} />

        {/* Content Card */}
        <article className="legal-content-card animate-fade-in">
          <div className="legal-brand-kicker">Weave 365 Partner Knowledge</div>
          <h1 className="legal-h1">Reseller FAQs</h1>
          <span className="legal-updated-date">Last Updated: 25 August 2026</span>

          <div className="legal-text-content">
            <p className="lead">
              Welcome to the Weave 365 Reseller &amp; Dropshipping Help Desk. Find clear answers about onboarding, order placement, white-label packaging, customer pricing, NDR/RTO responsibilities, and fulfillment operations.
            </p>

            {/* Quick Search */}
            <div style={{
              margin: '24px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: '#f8f8f8',
              borderRadius: '8px',
              border: '1px solid #e5e5e5'
            }}>
              <Search size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search reseller questions (e.g., dropshipping, branding, GST, RTO)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  outline: 'none',
                  fontSize: '14px',
                  color: 'var(--ink)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: 'var(--muted)'
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* FAQ Accordion List */}
            <div className="legal-faq-container" style={{ marginTop: '20px' }}>
              {filteredFaqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <details
                    key={index}
                    className="legal-faq-item"
                    open={isOpen}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFaq(index);
                    }}
                  >
                    <summary className="legal-faq-summary">
                      <span style={{ fontWeight: '600', color: 'var(--ink)' }}>{index + 1}. {faq.q}</span>
                      <ChevronDown size={16} />
                    </summary>
                    <div className="legal-faq-content">
                      <p style={{ margin: 0, lineHeight: '1.65', color: '#333' }}>{faq.a}</p>
                    </div>
                  </details>
                );
              })}

              {filteredFaqs.length === 0 && (
                <p style={{ color: 'var(--muted)', padding: '24px 0', textAlign: 'center' }}>
                  No questions match "{searchQuery}". Please check your search term or contact our reseller support desk.
                </p>
              )}
            </div>

            <div className="legal-highlight-box" style={{ marginTop: '40px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: 'var(--ink)' }}>Need Dedicated Reseller Assistance?</h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                For custom business inquiries, white-label catalogs, bulk sourcing agreements, or WhatsApp broadcast access, reach out through the official contact desk on weave365.com.
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                Last Updated: 25 August 2026
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
