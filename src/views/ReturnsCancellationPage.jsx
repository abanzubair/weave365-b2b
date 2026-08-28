import React from 'react';
import { ChevronDown } from 'lucide-react';
import { LegalSidebar } from '../components/LegalSidebar.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';

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
      q: "Why is an unboxing video requested for damage or defect claims?",
      a: "For transit damage, missing pieces, or defect claims, a continuous unboxing video helps provide clear proof of the parcel condition at the time of delivery to expedite courier claims and product replacements."
    },
    {
      q: "Can B2B or reseller buyers return unsold inventory?",
      a: "No. For B2B, wholesale, and reseller orders, returns are not accepted for slow-moving inventory, change of mind, or reseller inability to resell."
    },
    {
      q: "How are refunds processed once approved?",
      a: "Approved refunds are processed to the original payment method or another agreed method once the physical return is inspected and verified, subject to bank processing timelines."
    }
  ];

  return (
    <div className="legal-page-container returns-cancellation-page" data-page-id="returns-cancellation">
      <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Returns & Cancellation' }]} navigate={navigate} />

      <div className="legal-layout">
        {/* Reusable Sidebar */}
        <LegalSidebar activeTab="returns-cancellation" navigate={navigate} />

        {/* Content Card */}
        <article className="legal-content-card animate-fade-in">
          <div className="legal-brand-kicker">Weave 365 Policies</div>
          <h1 className="legal-h1">Returns, Cancellation &amp; Refunds Policy</h1>
          <span className="legal-updated-date">Last Updated: 25 August 2026</span>

          <div className="legal-text-content">
            <p className="lead">
              This Returns, Cancellation &amp; Refunds Policy explains when an order may be cancelled, returned, exchanged or refunded when purchased from Weave 365.
            </p>
            <p>
              It applies to D2C customers, B2B buyers, resellers, dropshippers and Private-Label customers, subject to the terms applicable to the relevant order.
            </p>
            <p>
              This policy should be read together with the Weave 365 Terms &amp; Conditions and other applicable policies published on weave365.com.
            </p>
            <p>
              Where applicable law gives a customer a right that cannot be excluded, that legal right will prevail over any conflicting provision of this policy.
            </p>

            <h2>1. Cancellation Before Processing</h2>
            <p>
              A cancellation request may be made before Weave 365 has started processing the order. Cancellation is subject to order status and operational feasibility.
            </p>
            <p>
              Once an order has entered processing, packing, production or dispatch, cancellation may no longer be available. For custom, personalised, private-label or made-to-order products, cancellation may be restricted once production or procurement has started.
            </p>

            <h2>2. Cancellation After Dispatch</h2>
            <p>
              Once an order has been dispatched, it cannot normally be cancelled through the normal cancellation process. Where a customer no longer wishes to receive a dispatched order, the shipment may be treated according to the applicable return, refusal or delivery process.
            </p>
            <p>
              Any charges arising from a customer-requested return, refusal or other non-qualifying event will be handled according to the applicable order terms and law. For reseller and dropshipping orders, the reseller remains responsible for managing its own customer's request.
            </p>

            <h2>3. D2C Returns</h2>
            <p>
              For D2C purchases, returns, replacements and refunds will be available only in accordance with the return terms displayed for the product and any rights available under applicable law.
            </p>
            <p>
              Certain products may have specific return conditions because of their nature, customisation, hygiene considerations or production method. Where a product is eligible for return, the customer must follow the stated return procedure and return timeline.
            </p>

            <h2>4. B2B, Wholesale and Reseller Returns</h2>
            <p>
              B2B, wholesale, reseller and dropshipping purchases are commercial purchases and may have different return conditions from D2C purchases. Unless otherwise agreed in writing, a return will generally not be accepted solely because:
            </p>
            <ul>
              <li>The buyer changed its mind.</li>
              <li>The buyer's customer changed their mind.</li>
              <li>The product is slow-moving.</li>
              <li>The reseller could not sell the product.</li>
              <li>The buyer prefers a different colour or texture.</li>
              <li>The product has normal handloom or handmade variations.</li>
            </ul>
            <p>
              A return may be considered where the product supplied by Weave 365 is incorrect or has a verified qualifying defect.
            </p>

            <h2>5. Private-Label and Custom Orders</h2>
            <p>
              Private-label, customised and made-to-order products may not be eligible for cancellation or return once sourcing, production, branding, packaging or other agreed work has started. The applicable quotation, purchase order or private-label agreement will specify the relevant cancellation and acceptance conditions.
            </p>
            <p>
              Where a private-label product has been produced according to the approved specifications, a change in business requirement or inability to sell the finished goods does not normally create a return right. This does not affect any mandatory legal remedy that applies to the transaction.
            </p>

            <h2>6. Incorrect Product</h2>
            <p>
              Where Weave 365 sends an incorrect product, the customer or buyer should report the issue promptly through the prescribed claim process. After verification, Weave 365 may offer an appropriate remedy, which may include replacement, exchange, return or refund, depending on the order and circumstances.
            </p>
            <p>
              For reseller orders, the reseller must provide the required information and evidence.
            </p>

            <h2>7. Manufacturing Defects</h2>
            <p>
              A product with a qualifying manufacturing defect may be eligible for replacement, exchange, return or refund after verification. A manufacturing defect does not include normal handloom variation, normal product characteristics, customer-caused damage or damage caused after delivery.
            </p>
            <p>
              The remedy will depend on the nature of the issue, product availability and applicable legal and commercial requirements.
            </p>

            <h2>8. Reporting an Issue</h2>
            <p>
              Customers and buyers should report incorrect products, visible damage or suspected defects as soon as reasonably possible after delivery. For business, reseller and dropshipping orders, Weave 365 may specify a shorter operational reporting period for efficient verification.
            </p>
            <p>
              Any such reporting period is intended to help with investigation and evidence collection. It does not remove a legal right that cannot lawfully be excluded.
            </p>

            <h2>9. Evidence and Unboxing Video</h2>
            <p>
              Weave 365 may request photographs, videos, parcel images, shipping labels, order details or other evidence to verify a return or product claim. For certain incorrect-product, transit-damage or defect claims, a continuous unboxing video may be required. Where an unboxing video is requested, it should show:
            </p>
            <ul>
              <li>The sealed parcel before opening.</li>
              <li>The shipping label.</li>
              <li>The opening of the parcel.</li>
              <li>The product and contents received.</li>
            </ul>
            <p>
              Failure to provide requested evidence may make verification difficult and may affect the outcome of a claim.
            </p>

            <h2>10. Product Condition for Approved Returns</h2>
            <p>
              Where a return is approved, the product should be returned in the condition specified by Weave 365. Unless otherwise required by law, a return may be refused or adjusted where the product has been:
            </p>
            <ul>
              <li>Used beyond reasonable inspection.</li>
              <li>Washed.</li>
              <li>Stained.</li>
              <li>Altered.</li>
              <li>Stitched or customised.</li>
              <li>Damaged after delivery.</li>
              <li>Missing applicable packaging, tags or accessories where those are required for the return.</li>
            </ul>
            <p>The applicable product-specific return instructions will apply.</p>

            <h2>11. Handloom and Handmade Variations</h2>
            <p>
              Banarasi sarees and other handloom or handmade products may contain natural variations in colour, weaving, texture, motifs, finishing and appearance. Such variations are not automatically manufacturing defects.
            </p>
            <p>
              Minor differences between photographs and the delivered product may also occur because of lighting, photography, screen settings and the nature of the product. A return or exchange based only on such normal variation will generally not be accepted for business, wholesale or reseller orders.
            </p>
            <p>
              For D2C orders, any applicable consumer remedy will remain subject to the product listing, return terms and applicable law.
            </p>

            <h2>12. Exchange and Replacement</h2>
            <p>
              Where an exchange or replacement is approved, Weave 365 may provide the same product or, where appropriate, another agreed resolution. Replacement or exchange depends on product availability and the circumstances of the claim.
            </p>
            <p>
              For business and reseller orders, exchange is generally limited to verified incorrect products or qualifying defects unless otherwise agreed in writing.
            </p>

            <h2>13. Non-Qualifying Reasons for Business Returns</h2>
            <p>
              For B2B, wholesale, reseller and dropshipping orders, the following generally do not qualify for return or exchange:
            </p>
            <ul>
              <li>Change of mind.</li>
              <li>Customer preference.</li>
              <li>Reseller preference.</li>
              <li>Slow-moving stock.</li>
              <li>Inability to resell the product.</li>
              <li>Preference for another colour or texture.</li>
              <li>Normal handloom or handmade variation.</li>
              <li>Incorrect customer information supplied by the buyer.</li>
              <li>Customer refusal of a correctly supplied shipment.</li>
              <li>Damage caused after delivery.</li>
            </ul>
            <p>This list is subject to the applicable order terms and mandatory law.</p>

            <h2>14. Reseller and Dropshipping Orders</h2>
            <p>
              For dropshipping orders, the reseller is responsible for handling communication with its customer. Where a reseller's customer requests a return for a reason that is not covered by the applicable Weave 365 return terms, the reseller is responsible for managing that customer request.
            </p>
            <p>
              Weave 365 is not responsible for a reseller's independent return promise, refund promise or commercial commitment to its customer unless Weave 365 has expressly agreed to it.
            </p>

            <h2>15. RTO and Customer Refusal</h2>
            <p>
              A dispatched shipment may be returned to origin where delivery cannot be completed. RTO caused by customer-side or reseller-side circumstances will be handled under the Shipping &amp; Delivery Policy and applicable order terms. This section does not create a separate return right.
            </p>

            <h2>16. Refunds</h2>
            <p>
              Where a refund is approved, the amount will depend on the applicable transaction, approved remedy and payment received. Refunds may be processed after:
            </p>
            <ul>
              <li>The returned product is received, where a physical return is required.</li>
              <li>The product and claim are verified.</li>
              <li>Any applicable deduction permitted under the order terms or law is determined.</li>
            </ul>
            <p>
              Refunds will normally be made using the original payment method or another permitted method where necessary. The time taken for the refund to appear in the customer's account may depend on the payment gateway, bank or other payment provider.
            </p>

            <h2>17. Refunds for Shipping and Other Charges</h2>
            <p>
              Where a refund is approved, the treatment of shipping, customs, handling, payment or other charges will depend on the reason for the refund, the applicable order terms and applicable law.
            </p>
            <p>
              International customs duties, import taxes and destination charges may be non-refundable where already paid to authorities or third parties.
            </p>

            <h2>18. International Returns</h2>
            <p>
              International returns may involve additional courier, customs and clearance requirements. The customer or buyer may be responsible for return shipping, customs or destination charges where the return is not caused by an error attributable to Weave 365 and where such charges are legally recoverable.
            </p>
            <p>
              International return and refund arrangements will be assessed according to the order terms, shipping conditions and applicable law.
            </p>

            <h2>19. Claim Review</h2>
            <p>
              All claims may be subject to verification. Weave 365 may request additional evidence before approving a return, exchange, replacement or refund. Approval of one claim does not create an automatic right for another order where the facts are different.
            </p>

            <h2>20. Fraudulent or Abusive Claims</h2>
            <p>
              Weave 365 may investigate claims where there are reasonable grounds to suspect fraud, repeated misuse, false information, product substitution, deliberate damage or other abuse of the return process. Where permitted by law, Weave 365 may decline a claim that is found to be fraudulent or abusive.
            </p>

            <h2>21. Policy Updates</h2>
            <p>
              Weave 365 may update this Returns, Cancellation &amp; Refunds Policy from time to time. The latest version published on weave365.com will apply to new orders from its effective date.
            </p>
            <p>
              An already accepted order will generally remain subject to the policy applicable to that order, except where a change is required by law or agreed with the customer.
            </p>

            <div className="legal-highlight-box" style={{ marginTop: '32px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: 'var(--ink)' }}>Contact Us</h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                For cancellation, return, exchange or refund questions, please contact Weave 365 through the official contact details published on weave365.com.
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                Last Updated: 25 August 2026
              </p>
            </div>
          </div>

          {/* FAQ section */}
          <section className="legal-faq-section">
            <h2 className="legal-faq-section-title">Returns &amp; Cancellation FAQs</h2>
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
