import React from 'react';
import { ChevronDown } from '../components/icons.jsx';
import { LegalSidebar } from '../components/LegalSidebar.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';

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
      q: "Do you ship orders internationally?",
      a: "Yes. Weave 365 ships to eligible countries and destinations worldwide via international air express courier partners and commercial freight services."
    },
    {
      q: "Who is responsible for international customs duties and import taxes?",
      a: "Unless expressly included in the quotation, customs duties, import taxes, local clearance fees, and brokerage charges are payable by the customer or importer in the destination country."
    },
    {
      q: "How does tracking work for dropshipping orders?",
      a: "Once the order is dispatched, tracking details provided by the logistics provider will be available. For dropshipping orders, the reseller is responsible for sharing appropriate tracking updates with their end customer."
    }
  ];

  return (
    <div className="legal-page-container shipping-delivery-page" data-page-id="shipping-delivery">
      <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Shipping & Delivery' }]} navigate={navigate} />

      <div className="legal-layout">
        {/* Reusable Sidebar */}
        <LegalSidebar activeTab="shipping-delivery" navigate={navigate} />

        {/* Content Card */}
        <article className="legal-content-card animate-fade-in">
          <div className="legal-brand-kicker">Weave 365 Logistics</div>
          <h1 className="legal-h1">Shipping &amp; Delivery Policy</h1>
          <span className="legal-updated-date">Last Updated: 25 August 2026</span>

          <div className="legal-text-content">
            <p className="lead">
              This Shipping &amp; Delivery Policy explains how Weave 365 processes and delivers orders placed through weave365.com.
            </p>
            <p>
              It applies to D2C customers, B2B buyers, resellers, dropshippers and private-label customers, subject to the shipping terms applicable to the relevant order.
            </p>
            <p>
              The Terms &amp; Conditions and any order-specific commercial terms continue to apply. This policy should be read together with those documents.
            </p>

            <h2>1. Order Processing</h2>
            <p>
              Orders are processed after the required order information and payment have been received and the order has been accepted for processing. Processing time may vary based on:
            </p>
            <ul>
              <li>Product availability.</li>
              <li>Order quantity.</li>
              <li>Wholesale or bulk requirements.</li>
              <li>Custom or private-label requirements.</li>
              <li>Packaging requirements.</li>
              <li>Payment verification.</li>
              <li>Other operational requirements.</li>
            </ul>
            <p>Processing time and shipping time are separate.</p>

            <h2>2. Shipping Within India</h2>
            <p>
              Weave 365 ships to eligible locations across India. Shipping charges depend on the order type, product, destination, shipment weight and applicable commercial terms.
            </p>
            <p>
              Free shipping may be available for eligible reseller or other orders where specifically stated at the time of purchase or quotation. The shipping address must be complete and accurate before the order is confirmed.
            </p>

            <h2>3. International Shipping</h2>
            <p>
              International shipping is available to eligible countries and destinations. Availability depends on:
            </p>
            <ul>
              <li>Product eligibility.</li>
              <li>Courier service.</li>
              <li>Destination restrictions.</li>
              <li>Customs requirements.</li>
              <li>Applicable export and import conditions.</li>
              <li>Operational feasibility.</li>
            </ul>
            <p>
              Weave 365 may decline a shipment where delivery is not reasonably possible or where applicable restrictions prevent shipment.
            </p>

            <h2>4. Shipping Charges</h2>
            <p>
              Shipping charges will be displayed or communicated before the order is confirmed, wherever applicable. For international shipments, charges may depend on parcel weight, dimensions, destination, courier service and applicable rates.
            </p>
            <p>
              For larger or combined shipments, the shipping cost per unit may be lower depending on the applicable courier rate structure. Any special shipping arrangement agreed in a quotation or commercial agreement will apply to that order.
            </p>

            <h2>5. Customs, Duties and Import Charges</h2>
            <p>
              International shipments may be subject to customs duties, import taxes, local taxes, customs clearance charges, brokerage charges, storage charges or other destination-specific charges.
            </p>
            <p>
              Unless expressly included in the quotation, these charges are not included in the product price or standard shipping charge. Such charges are normally payable by the importer, customer or reseller, as applicable. The recipient is responsible for complying with applicable import requirements in the destination country.
            </p>

            <h2>6. Delivery Time</h2>
            <p>
              Delivery time depends on the product, destination, shipping method, courier service and operational conditions. Any delivery timeline shown or communicated by Weave 365 is an estimate unless a guaranteed delivery commitment is expressly agreed in writing.
            </p>
            <p>
              International delivery may require additional time because of customs clearance and local delivery procedures. Delivery estimates may also be affected by public holidays, festivals, weather, transport disruption, courier delays and other external circumstances.
            </p>

            <h2>7. Dispatch</h2>
            <p>
              An order is dispatched after the applicable processing requirements have been completed. The dispatch date is not the same as the delivery date.
            </p>
            <p>
              Where an order contains multiple products, Weave 365 may dispatch all products together or in separate shipments depending on availability, packaging and logistics requirements.
            </p>

            <h2>8. Tracking</h2>
            <p>
              Where tracking is available, tracking details will be provided after dispatch. Tracking information is supplied by the applicable shipping or logistics provider.
            </p>
            <p>
              Tracking updates may not appear immediately after dispatch and may take time to reflect movement in the courier system. For dropshipping orders, the reseller is responsible for sharing appropriate tracking information with its customer where required.
            </p>

            <h2>9. Delivery Address</h2>
            <p>
              The customer or business placing the order is responsible for providing a complete and correct delivery address. The address should normally include:
            </p>
            <ul>
              <li>Recipient name.</li>
              <li>Mobile number.</li>
              <li>House, building or unit details.</li>
              <li>Street, locality or area.</li>
              <li>City.</li>
              <li>State or region.</li>
              <li>PIN or postal code.</li>
              <li>Country for international shipments.</li>
            </ul>
            <p>
              Changes requested after dispatch may not be possible. Where a change is possible, additional courier or handling charges may apply.
            </p>

            <h2>10. Delivery Attempts and Customer Availability</h2>
            <p>
              The recipient should be available to receive the shipment or make suitable arrangements with the courier. Repeated failed delivery attempts may result in the shipment being placed on hold or returned to origin.
            </p>
            <p>
              For reseller and dropshipping orders, the reseller is responsible for coordinating with its customer where customer action is required.
            </p>

            <h2>11. NDR – Non-Delivery Report</h2>
            <p>
              An NDR may be raised by the courier when a shipment cannot be delivered. Examples include an unavailable recipient, incorrect address, unsuccessful delivery attempt or inability to contact the recipient.
            </p>
            <p>Where an NDR is raised:</p>
            <ul>
              <li>Weave 365 may provide the available courier update.</li>
              <li>The customer or reseller may be required to provide or confirm delivery information.</li>
              <li>A re-delivery attempt may be arranged where available.</li>
              <li>Additional charges may apply where the issue results from customer-provided information or customer-side circumstances.</li>
              <li>For dropshipping orders, the reseller is responsible for coordinating with its customer.</li>
            </ul>

            <h2>12. RTO – Return to Origin</h2>
            <p>
              A shipment may be returned to Weave 365 when delivery cannot be completed. RTO may result from:
            </p>
            <ul>
              <li>Customer refusal.</li>
              <li>Incorrect or incomplete address.</li>
              <li>Recipient unavailability.</li>
              <li>Repeated failed delivery attempts.</li>
              <li>Failure to respond to delivery requests.</li>
              <li>Destination restrictions.</li>
              <li>Other delivery-related circumstances.</li>
            </ul>
            <p>
              For reseller and dropshipping orders, RTO costs arising from the reseller's or its customer's actions may be charged to the reseller in accordance with the applicable commercial terms. For B2B, D2C and private-label orders, any applicable RTO charges will be handled according to the order terms and applicable law.
            </p>

            <h2>13. Customer Refusal</h2>
            <p>
              Where a recipient refuses delivery after dispatch, the shipment may be returned to origin. Any applicable return shipping, RTO, handling or re-delivery charges may apply according to the relevant order terms.
            </p>

            <h2>14. Delayed Delivery</h2>
            <p>Delivery may be delayed because of:</p>
            <ul>
              <li>Courier or transport disruption.</li>
              <li>Weather.</li>
              <li>Festivals and public holidays.</li>
              <li>Strikes or local restrictions.</li>
              <li>Customs clearance.</li>
              <li>Incorrect or incomplete address information.</li>
              <li>Operational or technical issues.</li>
              <li>Events outside Weave 365's reasonable control.</li>
            </ul>
            <p>
              A delivery delay does not by itself mean that the shipment is lost or cancelled. Any cancellation, refund or other remedy will be handled under the applicable order terms, policy and law.
            </p>

            <h2>15. Lost or Damaged Shipments</h2>
            <p>
              Where a shipment is reported as lost or damaged during transit, Weave 365 may coordinate with the relevant logistics provider and investigate the shipment. The outcome may depend on courier records, shipment status, insurance or other applicable logistics arrangements.
            </p>
            <p>
              Where the issue concerns the product itself rather than transit, the applicable product claim procedure will apply. This policy does not replace the Returns, Refunds, Cancellation or Product Claim Policy.
            </p>

            <h2>16. Multiple Products and Split Shipments</h2>
            <p>
              An order containing multiple products may be delivered in one or more parcels. Split shipment may occur because of:
            </p>
            <ul>
              <li>Different product availability.</li>
              <li>Warehouse handling.</li>
              <li>Packaging requirements.</li>
              <li>Product size or weight.</li>
              <li>Separate dispatch arrangements.</li>
              <li>Courier limitations.</li>
            </ul>
            <p>Separate tracking details may be provided where applicable.</p>

            <h2>17. Product Availability Before Dispatch</h2>
            <p>
              Product availability may change before dispatch. Where an ordered product becomes unavailable, Weave 365 may contact the customer or buyer regarding the available options for that order.
            </p>
            <p>
              For bulk, wholesale and private-label orders, availability will also depend on the agreed quotation, production schedule and sourcing arrangement.
            </p>

            <h2>18. Private-Label and Custom Orders</h2>
            <p>
              Private-label and custom orders may require additional processing and production time. The applicable production and dispatch timeline will depend on the agreed specifications, sample approval, quantity, branding, packaging and other requirements.
            </p>
            <p>
              The delivery estimate for a private-label order begins only after the applicable production prerequisites have been completed.
            </p>

            <h2>19. Delivery Restrictions</h2>
            <p>
              Certain products, locations or shipment types may be subject to courier, customs, geographical or regulatory restrictions. Weave 365 may modify the shipping method, request additional information or decline shipment where necessary.
            </p>

            <h2>20. Shipping Changes After Dispatch</h2>
            <p>
              Once a shipment has been handed over to the logistics provider, Weave 365 may not be able to change the delivery address, recipient details, courier service or other shipping instructions.
            </p>
            <p>
              Any permitted change may result in additional charges. Such changes are subject to courier approval and operational feasibility.
            </p>

            <h2>21. Delivery to Reseller Customers</h2>
            <p>
              For eligible white-label dropshipping orders, Weave 365 may dispatch products directly to the reseller's customer. The reseller is responsible for providing correct recipient information and for communicating with its customer regarding delivery.
            </p>
            <p>
              Weave 365 will provide the shipping service agreed for the order.
            </p>

            <h2>22. Delivery Completion</h2>
            <p>
              Delivery is considered completed according to the delivery status or proof of delivery recorded by the applicable logistics provider, subject to any genuine delivery dispute raised through the applicable process. The recipient should inspect the parcel at delivery where practical.
            </p>

            <h2>23. Policy Updates</h2>
            <p>
              Weave 365 may update this Shipping &amp; Delivery Policy from time to time because of changes in courier services, operating procedures, shipping routes, international requirements or applicable regulations. The latest version published on weave365.com will apply to new orders from its effective date.
            </p>

            <div className="legal-highlight-box" style={{ marginTop: '32px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: 'var(--ink)' }}>Contact Us</h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                For questions regarding shipping, tracking, delivery, NDR, RTO or international shipments, please contact Weave 365 through the official contact details published on weave365.com.
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                Last Updated: 25 August 2026
              </p>
            </div>
          </div>

          {/* FAQ section */}
          <section className="legal-faq-section">
            <h2 className="legal-faq-section-title">Shipping &amp; Delivery FAQs</h2>
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
