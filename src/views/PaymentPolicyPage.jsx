import React from 'react';
import { ChevronDown } from 'lucide-react';
import { LegalSidebar } from '../components/LegalSidebar.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';

export function PaymentPolicyPage({ navigate }) {
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
      q: "What payment methods are supported on Weave 365?",
      a: "We support UPI, debit/credit cards, net banking, direct bank transfers, and verified secure payment gateways. Payment options available depend on your order type and destination."
    },
    {
      q: "Is Cash on Delivery (COD) available for wholesale or reseller orders?",
      a: "COD is generally limited to eligible D2C retail orders and is not available for wholesale, bulk, reseller dropshipping, export, or private-label orders unless specifically approved in writing."
    },
    {
      q: "How are international export payments processed?",
      a: "International buyers can pay via supported international payment gateways, international cards, or direct commercial bank wire transfers in approved currencies."
    }
  ];

  return (
    <div className="legal-page-container payment-policy-page" data-page-id="payment-policy">
      <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Payment Policy' }]} navigate={navigate} />

      <div className="legal-layout">
        {/* Reusable Sidebar */}
        <LegalSidebar activeTab="payment-policy" navigate={navigate} />

        {/* Content Card */}
        <article className="legal-content-card animate-fade-in">
          <div className="legal-brand-kicker">Weave 365 Finance &amp; Billing</div>
          <h1 className="legal-h1">Payment Policy</h1>
          <span className="legal-updated-date">Last Updated: 25 August 2026</span>

          <div className="legal-text-content">
            <p className="lead">
              This Payment Policy explains how payments are accepted, verified and processed for orders placed through weave365.com.
            </p>
            <p>
              It applies to D2C customers, B2B buyers, resellers, dropshippers and Private-Label customers, subject to the payment terms applicable to the relevant order.
            </p>
            <p>
              This policy should be read together with the Weave 365 Terms &amp; Conditions, Returns, Cancellation &amp; Refunds Policy and other applicable policies published on weave365.com.
            </p>

            <h2>1. Payment Terms</h2>
            <p>Payment requirements may differ based on:</p>
            <ul>
              <li>Customer type.</li>
              <li>Product.</li>
              <li>Order value.</li>
              <li>Order quantity.</li>
              <li>Shipping destination.</li>
              <li>Wholesale or bulk arrangements.</li>
              <li>Private-label or custom requirements.</li>
              <li>Approved credit terms.</li>
            </ul>
            <p>
              The payment terms applicable to an order will be shown or communicated before the order is confirmed.
            </p>

            <h2>2. Advance Payment</h2>
            <p>
              Unless Weave 365 has approved credit terms or another written payment arrangement, payment may be required before an order is processed.
            </p>
            <p>
              Reseller, dropshipping, wholesale, export and Private-Label orders may require full or partial advance payment depending on the applicable commercial terms. An order will not normally move to processing until the required payment has been successfully received or otherwise approved.
            </p>

            <h2>3. Cash on Delivery</h2>
            <p>
              COD may be available only for eligible D2C orders and selected products or delivery locations. COD may not be available for reseller, dropshipping, wholesale, export or Private-Label orders unless specifically agreed.
            </p>
            <p>
              The payment options available for a particular order will be shown during the ordering process or communicated by Weave 365.
            </p>

            <h2>4. Product Price</h2>
            <p>
              The applicable product price is the price shown or quoted for the relevant customer and order at the time the order is confirmed, unless otherwise agreed in writing.
            </p>
            <p>
              Prices for future orders may change because of sourcing costs, product availability, taxes, market conditions, production costs or other business factors. Different prices may apply to D2C, reseller, wholesale, bulk, export and Private-Label transactions.
            </p>

            <h2>5. Reseller Selling Price</h2>
            <p>
              A reseller may generally decide its own customer selling price, subject to applicable law and any specific written commercial arrangement.
            </p>
            <p>
              Weave 365 does not guarantee a reseller's margin, sales volume or profitability. The reseller's own customer pricing does not change the amount payable to Weave 365.
            </p>

            <h2>6. Payment Methods</h2>
            <p>Weave 365 may offer payment methods such as:</p>
            <ul>
              <li>UPI.</li>
              <li>Credit or debit cards.</li>
              <li>Net banking.</li>
              <li>Bank transfer.</li>
              <li>Payment gateway methods.</li>
              <li>COD where specifically available.</li>
              <li>Other payment methods introduced by Weave 365.</li>
            </ul>
            <p>
              Not every payment method will be available for every order. The available method may depend on the customer, order value, destination, product and payment provider.
            </p>

            <h2>7. Payment Confirmation</h2>
            <p>
              Payment is treated as received only when the transaction has been successfully confirmed by Weave 365 or the relevant payment service provider.
            </p>
            <p>
              A payment marked as pending, failed, reversed, declined or incomplete does not by itself confirm the order. Weave 365 may wait for payment confirmation before processing or dispatching an order.
            </p>

            <h2>8. Failed, Pending or Reversed Payments</h2>
            <p>
              If a payment fails or remains pending, Weave 365 may hold the order until the payment is successfully confirmed.
            </p>
            <p>
              If money is deducted from the buyer's bank account or payment instrument but the order is not confirmed, the transaction may first need to be verified with the relevant payment provider or bank. Where a payment is later reversed or refunded by the payment provider, the order may remain unconfirmed unless payment is successfully received.
            </p>

            <h2>9. Payment Gateway and Transaction Charges</h2>
            <p>
              Certain payment methods may involve gateway charges, banking charges, transaction charges, currency conversion charges or other processing costs.
            </p>
            <p>
              Any charge that Weave 365 is required or permitted to pass on to the customer will be shown or communicated before payment where reasonably practicable. Charges imposed directly by a bank, card issuer or payment provider may be outside Weave 365's control.
            </p>

            <h2>10. Taxes</h2>
            <p>
              Applicable taxes will be charged according to the nature of the transaction and applicable law. The applicable invoice may include GST or other taxes where required.
            </p>
            <p>
              B2B customers must provide correct business and tax information where required for invoicing. For international transactions, customs duties, import taxes, local taxes and destination charges are handled separately in accordance with the applicable shipping and commercial terms.
            </p>

            <h2>11. International Payments</h2>
            <p>
              International customers may be required to pay using the currency or payment method supported for the transaction.
            </p>
            <p>
              The amount charged by the payment provider may differ from the amount ultimately reflected in the customer's home currency because of exchange-rate movements or charges imposed by the customer's bank, card issuer or payment provider. Any such third-party conversion or banking charge is normally outside Weave 365's control.
            </p>

            <h2>12. Payment Security</h2>
            <p>
              Where payments are processed through a third-party payment provider, payment information may be collected and processed directly by that provider.
            </p>
            <p>
              Weave 365 does not normally require customers to send full card details, banking passwords, UPI PINs, OTPs or similar security credentials through ordinary messages or calls. Customers should not disclose such credentials to anyone claiming to represent Weave 365. Payment-security information is also subject to the applicable Privacy &amp; Security Policy.
            </p>

            <h2>13. Payment Verification and Fraud Prevention</h2>
            <p>
              Weave 365 may review transactions for fraud, unauthorised use, unusual payment activity or other security concerns. We may request reasonable additional information to verify a transaction before processing an order, releasing goods or issuing certain refunds.
            </p>
            <p>
              Where a transaction cannot be reasonably verified, Weave 365 may place the order on hold, decline the transaction or cancel the order, subject to applicable law.
            </p>

            <h2>14. Billing and Payment Information</h2>
            <p>
              The buyer is responsible for providing accurate billing, business, tax and payment information. Incorrect information may cause payment, invoicing or order-processing delays.
            </p>
            <p>
              Where a correction is required after an invoice or transaction has been processed, Weave 365 may request appropriate supporting information.
            </p>

            <h2>15. Refunds</h2>
            <p>
              Refunds are processed only where a refund is approved under the applicable policy, order terms or applicable law. The amount and method of refund will depend on the circumstances of the transaction.
            </p>
            <p>
              Where reasonably possible, refunds will be made to the original payment method. The time required for a refund to appear may depend on the bank, card issuer, payment gateway or other financial institution. The Returns, Cancellation &amp; Refunds Policy governs the underlying eligibility for a refund.
            </p>

            <h2>16. Refunds for Product Claims</h2>
            <p>
              Where a product claim results in an approved refund, the refund will be processed after the applicable verification and claim process is completed.
            </p>
            <p>
              The amount and treatment of shipping or other charges will depend on the approved remedy, order terms and applicable law. This Payment Policy does not create a separate refund entitlement.
            </p>

            <h2>17. Duplicate or Excess Payments</h2>
            <p>
              If Weave 365 receives a duplicate payment or an amount greater than the amount due, the transaction may be verified before an adjustment or refund is made. Where a refund is approved, it will normally be processed after the duplicate or excess payment has been confirmed.
            </p>

            <h2>18. Unauthorised or Disputed Transactions</h2>
            <p>
              If you believe that a payment was made without your authorisation or that a payment was incorrectly charged, you should contact Weave 365 promptly and provide the relevant order and transaction details. We may request:
            </p>
            <ul>
              <li>Order number.</li>
              <li>Payment reference.</li>
              <li>Transaction date.</li>
              <li>Amount paid.</li>
              <li>Payment method.</li>
              <li>Supporting bank or payment-provider information.</li>
            </ul>
            <p>
              Where appropriate, Weave 365 may also direct the customer to the relevant payment provider or bank.
            </p>

            <h2>19. Chargebacks and Payment Reversals</h2>
            <p>
              A payment dispute or chargeback raised through a bank or payment provider may result in an order being placed on hold while the transaction is reviewed. Weave 365 may provide relevant transaction and order records to the payment provider or financial institution where required for the dispute process.
            </p>
            <p>
              A chargeback does not automatically establish that a refund is due.
            </p>

            <h2>20. Cash Payments and Direct Transfers</h2>
            <p>
              Where Weave 365 expressly accepts a bank transfer or other direct payment method, the buyer must use the payment instructions provided through an official Weave 365 channel.
            </p>
            <p>
              Customers should verify payment details before making a transfer. Weave 365 is not responsible for payments made to an unauthorised account because the buyer relied on altered, unofficial or fraudulent payment instructions.
            </p>

            <h2>21. Payment Terms for Private-Label Orders</h2>
            <p>
              Private-Label orders may require an advance payment, milestone payment or other payment structure stated in the quotation or commercial agreement. Production or sourcing work may begin only after the required payment milestone has been received.
            </p>
            <p>
              The agreed quotation or Private-Label commercial agreement will govern where it contains specific payment terms.
            </p>

            <h2>22. Payment Terms for B2B and Wholesale Orders</h2>
            <p>
              B2B and wholesale customers may be offered account-specific payment terms, including advance payment, milestone payment or approved credit terms. Credit is not available unless expressly approved by Weave 365 in writing.
            </p>
            <p>
              Where credit terms are approved, the customer must pay within the agreed credit period. Late payment may affect future order processing, credit availability or account status, subject to the applicable agreement.
            </p>

            <h2>23. Payment Terms for Reseller and Dropshipping Orders</h2>
            <p>
              Unless different terms have been approved in writing, reseller and dropshipping orders require the applicable Weave 365 payment to be completed before processing. The reseller remains responsible for collecting payment from its own customer.
            </p>
            <p>
              A reseller's failure to collect payment from its customer does not normally cancel the reseller's payment obligation to Weave 365 once the reseller's order has been accepted, subject to the applicable cancellation and return terms.
            </p>

            <h2>24. Policy Updates</h2>
            <p>
              Weave 365 may update this Payment Policy to reflect changes in payment methods, payment providers, business practices or applicable law. The latest version published on weave365.com will apply to new transactions from its effective date.
            </p>

            <div className="legal-highlight-box" style={{ marginTop: '32px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: 'var(--ink)' }}>Contact Us</h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                For questions regarding payments, failed transactions, duplicate payments, refunds or payment disputes, please contact Weave 365 through the official contact details published on weave365.com.
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                Last Updated: 25 August 2026
              </p>
            </div>
          </div>

          {/* FAQ section */}
          <section className="legal-faq-section">
            <h2 className="legal-faq-section-title">Payment &amp; Billing FAQs</h2>
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
