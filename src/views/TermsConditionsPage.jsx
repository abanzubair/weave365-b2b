import React from 'react';
import { ChevronDown } from 'lucide-react';
import { LegalSidebar } from '../components/LegalSidebar.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';

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
      q: "Who does Weave 365 serve?",
      a: "Weave 365 supports diverse commerce models including B2B wholesale buyers, online/social resellers, D2C retail customers, and private-label brand creators."
    },
    {
      q: "Can resellers sell without holding inventory?",
      a: "Yes. Our zero-inventory reseller and dropshipping program allows eligible resellers to market our Banarasi collections and have orders fulfilled directly to their end customers with white-label packaging."
    },
    {
      q: "What is the jurisdiction for commercial dispute resolution?",
      a: "All terms and commercial transactions are governed by the laws of India, under the jurisdiction of competent courts in Varanasi, Uttar Pradesh, India."
    }
  ];

  return (
    <div className="legal-page-container terms-conditions-page" data-page-id="terms-conditions">
      <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Terms & Conditions' }]} navigate={navigate} />

      <div className="legal-layout">
        {/* Reusable Sidebar */}
        <LegalSidebar activeTab="terms-conditions" navigate={navigate} />

        {/* Content Card */}
        <article className="legal-content-card animate-fade-in">
          <div className="legal-brand-kicker">Weave 365 Legal &amp; Governance</div>
          <h1 className="legal-h1">Terms &amp; Conditions</h1>
          <span className="legal-updated-date">Last Updated: 25 August 2026</span>

          <div className="legal-text-content">
            <p className="lead">
              These Terms &amp; Conditions govern the use of the Weave 365 website, accounts, products, sourcing services, reseller services, dropshipping services and private-label services.
            </p>
            <p>
              Weave 365 may serve different types of customers, including B2B buyers, resellers, social media sellers, D2C customers and private-label businesses. Some terms apply to all users. Other terms apply only to the relevant customer type or service.
            </p>
            <p>
              By using the website, creating an account, placing an order, requesting sourcing services, joining a reseller or dropshipping programme, or purchasing private-label services, you agree to these Terms &amp; Conditions.
            </p>
            <p>
              Where a separate written quotation, purchase order, service agreement or other commercial agreement applies to a transaction, that document will govern to the extent of any conflict with these Terms &amp; Conditions.
            </p>

            <h2>1. About Weave 365</h2>
            <p>
              Weave 365 is a Banarasi sourcing and commerce business supplying sarees, suits, textiles and related products. Weave 365 may provide:
            </p>
            <ul>
              <li>Direct retail sales to consumers.</li>
              <li>Wholesale and bulk supply to businesses.</li>
              <li>Reseller and dropshipping services.</li>
              <li>White-label fulfilment.</li>
              <li>Private-label sourcing and manufacturing support.</li>
              <li>Product catalogues, product information, images and other sales materials.</li>
              <li>Domestic and international shipping for eligible orders.</li>
            </ul>
            <p>
              The exact service available to a customer depends on the order type, product, destination and commercial arrangement.
            </p>

            <h2>2. Customer Categories</h2>
            <p>For these Terms &amp; Conditions:</p>
            <ul>
              <li><strong>B2B Buyer:</strong> Means a wholesaler, importer, exporter, distributor, bulk buyer, retailer or other business purchasing products for business use or resale.</li>
              <li><strong>Reseller:</strong> Means a person or business purchasing products from Weave 365 for resale to its own customers.</li>
              <li><strong>Social Media Seller:</strong> Means a reseller selling products through WhatsApp, Instagram, Facebook or similar channels.</li>
              <li><strong>D2C Customer:</strong> Means an individual purchasing products for personal, household, gifting or similar consumer use and not primarily for resale.</li>
              <li><strong>Private-Label Customer:</strong> Means a business purchasing products, custom sourcing, packaging, branding or related services for sale under its own brand.</li>
            </ul>
            <p>
              Weave 365 may ask a customer to provide business or identity information to determine the applicable customer category.
            </p>

            <h2>3. Eligibility</h2>
            <ul>
              <li>You must provide true and complete information when creating an account or placing an order.</li>
              <li>You must have the legal capacity required to enter into the transaction.</li>
              <li>If you place an order on behalf of a business, you confirm that you have authority to act for that business.</li>
              <li>You must not use another person's account without permission.</li>
              <li>Weave 365 may request additional information where reasonably required for verification, payment, shipping, tax, compliance or fraud prevention.</li>
            </ul>

            <h2>4. Account Registration and Security</h2>
            <ul>
              <li>Certain prices, services or ordering features may require an account.</li>
              <li>You are responsible for keeping your login details confidential.</li>
              <li>You are responsible for activity carried out through your account unless you notify Weave 365 of unauthorised use within a reasonable time.</li>
              <li>Weave 365 may suspend or restrict an account in cases involving fraud, misuse, false information, security concerns, non-payment or violation of these Terms &amp; Conditions.</li>
            </ul>

            <h2>5. Products and Product Information</h2>
            <p>
              Weave 365 makes reasonable efforts to provide accurate product names, descriptions, photographs, specifications, colours, sizes, fabric information and other product details.
            </p>
            <p>
              Actual products may have minor differences from photographs or screen images. Differences may arise from lighting, photography, display settings, camera settings, screen settings and the handcrafted or handloom nature of certain products.
            </p>
            <p>
              For handloom and handmade products, minor differences in weaving, texture, motifs, colour, finishing and appearance may occur. Such natural variations are not automatically defects. Where a product listing contains a specific specification, that specification will apply to the relevant product.
            </p>

            <h2>6. Product Availability</h2>
            <p>
              Products shown on the website are subject to availability. Displaying a product does not guarantee that the product will remain available until an order is confirmed.
            </p>
            <p>
              Availability may change because of sales, production, sourcing, inventory movement, quality checks or other operational reasons. Where an ordered product becomes unavailable before dispatch, Weave 365 may offer an alternative, refund the applicable amount, or cancel the affected part of the order.
            </p>

            <h2>7. Prices</h2>
            <p>
              The price payable is the price displayed or quoted for the applicable customer type and order at the time the order is accepted, unless otherwise stated in writing. Prices may differ for:
            </p>
            <ul>
              <li>D2C retail orders.</li>
              <li>Reseller orders.</li>
              <li>Wholesale or bulk orders.</li>
              <li>Export orders.</li>
              <li>Private-label orders.</li>
              <li>Custom or special sourcing orders.</li>
            </ul>
            <p>
              Wholesale pricing, reseller pricing and private-label pricing may be available only to eligible customers. Prices may change without prior notice for future orders. Applicable taxes, shipping charges, customs charges and other charges will be shown or communicated as applicable to the order.
            </p>

            <h2>8. Reseller Pricing and Margin</h2>
            <p>
              A reseller may generally determine its own resale price, subject to applicable law and any written commercial restriction agreed for a specific programme or product.
            </p>
            <p>
              The reseller's gross margin is the difference between the amount charged by the reseller to its customer and the amount payable by the reseller to Weave 365, before considering the reseller's other costs.
            </p>
            <p>
              Weave 365 does not guarantee any sales volume, customer demand, revenue, margin or profit. Weave 365 is not responsible for losses arising from the reseller's pricing, advertising, sales strategy or business decisions.
            </p>

            <h2>9. Reseller and Dropshipping Programme</h2>
            <p>
              Eligible resellers may purchase products from Weave 365 for resale without holding the product in their own inventory. For eligible dropshipping orders, the reseller may first receive an order from its customer and then place the corresponding order with Weave 365.
            </p>
            <p>
              Where white-label dropshipping is available, Weave 365 may source, quality-check, pack and dispatch the product directly to the reseller's customer. Dropshipping is available only for eligible products, destinations and order methods.
            </p>
            <p>
              Weave 365 may refuse a dropshipping order where the product, destination, address, payment, packaging requirement or other condition is not suitable for dropshipping.
            </p>

            <h2>10. Reseller Customer Relationship</h2>
            <p>
              For a reseller order, the reseller is responsible for its own customer relationship. The reseller is responsible for:
            </p>
            <ul>
              <li>Selecting the product for its customer.</li>
              <li>Communicating product information accurately.</li>
              <li>Setting the resale price.</li>
              <li>Collecting payment from its customer.</li>
              <li>Providing the correct customer name, phone number and address.</li>
              <li>Confirming the order details before placing the order with Weave 365.</li>
              <li>Managing its customer's cancellation requests where applicable.</li>
              <li>Communicating delivery updates to its customer.</li>
              <li>Managing customer-side refusal, address issues and NDR follow-up.</li>
              <li>Complying with applicable laws governing its own sale.</li>
            </ul>
            <p>
              Weave 365 is responsible for the supply and fulfilment obligations applicable to the order placed by the reseller with Weave 365.
            </p>

            <h2>11. White-Label Orders</h2>
            <p>
              For eligible white-label orders, Weave 365 may ship the product without displaying Weave 365 branding on the external customer-facing package, subject to the agreed fulfilment process.
            </p>
            <p>
              White-label fulfilment does not automatically transfer ownership of Weave 365's intellectual property to the reseller. The reseller must not represent Weave 365's products as products manufactured, handwoven, sourced or certified by another entity when such representation is false.
            </p>
            <p>
              The reseller must not make false or unsupported claims regarding:
            </p>
            <ul>
              <li>Banarasi origin.</li>
              <li>Handloom status.</li>
              <li>Silk content.</li>
              <li>Geographical origin.</li>
              <li>Certifications.</li>
              <li>Artisan details.</li>
              <li>Manufacturing process.</li>
              <li>Product quality.</li>
              <li>Discounts.</li>
              <li>Availability.</li>
            </ul>

            <h2>12. Catalogue, Images and Marketing Material</h2>
            <p>
              Weave 365 may provide product images, videos, catalogues, descriptions, specifications and other materials for approved sales and marketing purposes. An authorised reseller may use such materials to market eligible Weave 365 products through permitted channels.
            </p>
            <p>The reseller must not:</p>
            <ul>
              <li>Sell the catalogue or product images as a separate product.</li>
              <li>Use the materials for unrelated products.</li>
              <li>Remove or alter rights notices where prohibited.</li>
              <li>Use the materials to misrepresent product origin or ownership.</li>
              <li>Transfer the materials to competitors for unrelated use.</li>
              <li>Create misleading advertisements using the materials.</li>
            </ul>
            <p>
              Weave 365 may withdraw or replace marketing materials at any time.
            </p>

            <h2>13. Private-Label Services</h2>
            <p>
              Private-label services may include product sourcing, sample development, product selection, customisation, branding, labelling, packaging, bulk procurement and related fulfilment support.
            </p>
            <p>
              Private-label work is subject to the agreed quotation, specifications, minimum order quantity, sample approval, production timeline and payment terms. A private-label order is not considered fully approved until the applicable commercial requirements are completed.
            </p>

            <h2>14. Private-Label Samples and Approvals</h2>
            <p>
              Where samples are required, the customer is responsible for reviewing the sample and providing approval within the agreed period. Once a sample, colour, fabric, design, size, packaging or other production specification is approved, production may proceed based on the approved specifications.
            </p>
            <p>
              Minor differences may occur between a sample and later production due to fabric, dyeing, weaving, finishing or manufacturing processes. Material deviations caused by Weave 365 from the approved specifications may be reviewed and corrected where applicable.
            </p>

            <h2>15. Private-Label Branding and Customer Materials</h2>
            <p>
              The private-label customer is responsible for providing correct brand names, logos, labels, artwork, packaging information and other materials supplied by the customer.
            </p>
            <p>
              The customer confirms that it has the right to use the trademarks, logos, designs, artwork, labels and other materials supplied to Weave 365. Weave 365 is not responsible for infringement caused by materials supplied by the customer. The customer is responsible for ensuring that its private-label packaging, claims and product statements comply with applicable laws.
            </p>

            <h2>16. Exclusivity</h2>
            <p>
              Private-label or sourcing arrangements do not create exclusivity unless exclusivity is expressly agreed in writing.
            </p>
            <p>
              Payment for a private-label order does not by itself give the customer exclusive ownership of a generic textile, weaving technique, manufacturing method, catalogue product or commonly available design. Any exclusive design, territory, product or sourcing arrangement must be specifically recorded in writing.
            </p>

            <h2>17. Orders</h2>
            <p>
              An order request is not automatically an accepted order. An order becomes confirmed only when the required information, payment and applicable commercial conditions have been received and Weave 365 has accepted the order for processing.
            </p>
            <p>
              Weave 365 may contact the customer to confirm product, quantity, address, tax details, payment or other information.
            </p>

            <h2>18. Payment</h2>
            <ul>
              <li>Payment must be made using the payment methods made available by Weave 365.</li>
              <li>For reseller, dropshipping, wholesale and private-label orders, advance payment may be required unless credit terms have been approved in writing.</li>
              <li>COD may be unavailable for reseller, dropshipping, wholesale, export or private-label orders.</li>
              <li>For D2C orders, COD may be available only for eligible products, destinations and order values.</li>
              <li>Payment gateway charges, transaction charges, banking charges or other applicable charges may apply where disclosed.</li>
              <li>An order may be placed on hold until payment is successfully received.</li>
            </ul>

            <h2>19. Taxes and Invoicing</h2>
            <p>
              Applicable taxes will be charged as required by law and the transaction structure. Business customers are responsible for providing correct business, billing, GST and shipping information where required.
            </p>
            <p>
              Where a customer provides incorrect tax information, the resulting tax, correction, penalty or administrative consequences may be charged or handled as permitted by law. Invoices will be issued according to the applicable transaction and legal requirements.
            </p>

            <h2>20. Order Cancellation</h2>
            <p>
              Cancellation rules may differ between B2B, reseller, dropshipping, D2C and private-label orders. For standard products, a cancellation request may be considered before processing, packing or dispatch, subject to the applicable cancellation policy.
            </p>
            <p>
              Once an order has entered packing, dispatch or production, cancellation may not be available, subject to applicable law and the relevant order terms. Custom-made, personalised, private-label or production orders may have different cancellation rules because production costs may already have been incurred.
            </p>
            <p>
              Any refund will be processed according to the applicable payment, cancellation and refund terms.
            </p>

            <h2>21. Shipping in India</h2>
            <p>
              Shipping availability and charges depend on the order type, product, destination, weight and applicable shipping arrangement. Where free shipping is expressly offered, it applies only to eligible orders.
            </p>
            <p>
              Delivery estimates are estimates only and are not guaranteed delivery dates unless expressly agreed in writing. Delivery may be affected by courier delays, weather, strikes, local restrictions, incorrect addresses, operational issues, public holidays or other events outside reasonable control.
            </p>

            <h2>22. International Shipping</h2>
            <p>
              International shipping is available only to eligible destinations and products. Shipping charges may depend on destination, parcel dimensions, parcel weight, courier rates, service level and other applicable factors.
            </p>
            <p>
              Customs duty, import tax, VAT or GST in the destination country, customs clearance charges, brokerage charges, storage charges and other local charges are payable by the customer or reseller unless expressly included in the quotation.
            </p>
            <p>
              The customer is responsible for checking whether the product can legally be imported into the destination country. Weave 365 does not guarantee that customs authorities will clear a shipment. Where a shipment is delayed, returned or detained because of destination-country requirements, the resulting charges may be payable by the customer or reseller, subject to applicable law.
            </p>

            <h2>23. Delivery Address</h2>
            <p>
              The customer or reseller must provide a complete and accurate delivery address and contact number. Weave 365 is not responsible for delivery failure caused by an incorrect, incomplete or inaccessible address provided by the customer or reseller.
            </p>
            <p>
              Any additional delivery, re-delivery, return or other logistics cost caused by an incorrect address may be charged to the customer or reseller, as applicable.
            </p>

            <h2>24. RTO – Return to Origin</h2>
            <p>
              RTO may occur when a shipment cannot be delivered and is returned by the logistics provider. For reseller and dropshipping orders, the reseller is generally responsible for RTO costs arising from its customer's actions or from incorrect information supplied by the reseller or its customer. Examples include:
            </p>
            <ul>
              <li>Refusal to accept the parcel.</li>
              <li>Incorrect or incomplete address.</li>
              <li>Unavailability of the recipient.</li>
              <li>Repeated failed delivery attempts.</li>
              <li>Customer-side cancellation after dispatch.</li>
              <li>Failure to respond to delivery or NDR requests.</li>
            </ul>
            <p>
              Where an RTO is caused by Weave 365 supplying an incorrect product or by another verified fulfilment error attributable to Weave 365, the matter will be reviewed under the applicable claim process.
            </p>

            <h2>25. NDR – Non-Delivery Report</h2>
            <p>
              For reseller and dropshipping orders, the reseller is responsible for communicating with its customer regarding NDR cases. Weave 365 may provide available courier or logistics updates.
            </p>
            <p>
              The reseller must provide timely instructions where re-delivery, address correction or other action is required. Additional delivery or re-delivery charges caused by customer-side issues may be payable by the reseller.
            </p>

            <h2>26. Returns and Refunds – D2C Customers</h2>
            <p>
              D2C returns, replacements and refunds will be governed by the published Returns and Refunds Policy applicable to the product and order. A customer may not be refused a remedy that is required under applicable law.
            </p>
            <p>
              Where Weave 365 has voluntarily provided a more limited or more generous commercial return policy, the published policy will apply subject to applicable law. For hygiene, personalised, customised or made-to-order products, special return restrictions may apply where legally permitted and disclosed before purchase.
            </p>

            <h2>27. Returns – B2B, Wholesale and Reseller Orders</h2>
            <p>
              B2B, wholesale and reseller purchases are commercial transactions and may be subject to different return and cancellation terms. Unless otherwise agreed in writing, returns will not normally be accepted for:
            </p>
            <ul>
              <li>Change of mind.</li>
              <li>Customer preference.</li>
              <li>Slow-moving inventory.</li>
              <li>Reseller inability to sell the product.</li>
              <li>A colour preference issue that is within the product's reasonable appearance range.</li>
              <li>Normal handloom or handmade variations.</li>
              <li>Minor differences arising from photography or display settings.</li>
            </ul>
            <p>
              A return, replacement or credit may be considered for a verified incorrect product or qualifying product defect, subject to the applicable claim process.
            </p>

            <h2>28. Defect and Incorrect Product Claims</h2>
            <p>
              Customers must inspect products after delivery. For faster investigation, an issue should normally be reported within 48 hours of delivery, together with the required evidence. The 48-hour reporting period is intended for prompt verification and does not remove any mandatory legal rights that cannot legally be excluded.
            </p>
            <p>Claims may require:</p>
            <ul>
              <li>Order number.</li>
              <li>Product photographs.</li>
              <li>Parcel photographs.</li>
              <li>Shipping label photographs.</li>
              <li>Clear photographs or video of the issue.</li>
              <li>Unboxing video where available.</li>
              <li>Other information reasonably required for investigation.</li>
            </ul>
            <p>
              Weave 365 may approve, reject or request further information for a claim after reviewing the evidence. A manufacturing defect must be distinguished from normal handloom variation, usage-related damage, customer handling, alteration, washing, storage or other customer-caused damage.
            </p>

            <h2>29. Unboxing Video</h2>
            <p>
              For product shortage, incorrect product, transit damage or certain defect claims, Weave 365 may request a continuous unboxing video. Where required, the video should show:
            </p>
            <ul>
              <li>The sealed parcel before opening.</li>
              <li>The shipping label.</li>
              <li>The opening of the parcel.</li>
              <li>The full contents.</li>
              <li>The product received.</li>
            </ul>
            <p>
              Failure to provide requested evidence may make verification difficult and may affect the outcome of a claim. It does not by itself remove any right that cannot legally be excluded.
            </p>

            <h2>30. Product Damage After Delivery</h2>
            <p>
              Weave 365 is not normally responsible for damage caused after delivery by washing, ironing, alteration, stitching, dyeing, staining, misuse, improper storage or other customer handling. Where damage appears to have occurred during transport, the customer should report it promptly and provide supporting evidence.
            </p>

            <h2>31. D2C Customer Use and Resale</h2>
            <p>
              A D2C customer purchasing for personal use must not represent itself as an authorised reseller, distributor or private-label partner of Weave 365 unless separately authorised. A customer who wishes to resell products through WhatsApp, Instagram, Facebook, a website or another sales channel should use the applicable reseller or business arrangement.
            </p>

            <h2>32. Reseller and Marketing Compliance</h2>
            <p>
              Each reseller is responsible for its own advertisements, product descriptions, offers, discounts and customer communications. A reseller must not make false, misleading or unsupported claims about:
            </p>
            <ul>
              <li>Product origin.</li>
              <li>Fabric or material.</li>
              <li>Handloom status.</li>
              <li>Silk content.</li>
              <li>Certifications.</li>
              <li>Artisan or weaving claims.</li>
              <li>Discounts or MRP.</li>
              <li>Product availability.</li>
              <li>Delivery times.</li>
              <li>Refund rights.</li>
              <li>Brand affiliation.</li>
            </ul>
            <p>
              The reseller must comply with applicable consumer, advertising, tax, intellectual property, data-protection and other laws applicable to its business.
            </p>

            <h2>33. Intellectual Property</h2>
            <p>
              The Weave 365 name, logo, website design, text, photographs, videos, catalogues, graphics, original product content, software and other materials are owned by or licensed to Weave 365 unless stated otherwise. Use of the website or reseller service does not transfer ownership of such intellectual property.
            </p>
            <p>
              An approved reseller may use authorised Weave 365 marketing materials only for permitted sales activities. Any broader licence must be agreed in writing.
            </p>

            <h2>34. Customer Intellectual Property</h2>
            <p>
              Where a customer provides a logo, trademark, artwork, packaging design, photograph, label design or other material for private-label production, the customer retains ownership of that material unless otherwise agreed.
            </p>
            <p>
              The customer grants Weave 365 the limited right to use such material only as reasonably required to perform the agreed services. The customer confirms that it has the rights necessary for such use.
            </p>

            <h2>35. Website and Platform Use</h2>
            <p>You must not:</p>
            <ul>
              <li>Attempt unauthorised access to the website, accounts, systems or data.</li>
              <li>Introduce malicious code or harmful software.</li>
              <li>Use the website for fraud.</li>
              <li>Scrape or copy website content at a scale not authorised by Weave 365.</li>
              <li>Interfere with website operations.</li>
              <li>Use the website for unlawful activities.</li>
              <li>Misuse another person's account or personal information.</li>
              <li>Use the platform to create false orders or fraudulent transactions.</li>
            </ul>
            <p>
              Weave 365 may restrict access where misuse or security risk is reasonably suspected.
            </p>

            <h2>36. Third-Party Services</h2>
            <p>
              Weave 365 may use third-party providers for payment processing, logistics, hosting, communications, analytics, technology, verification and other services. Third-party services may have their own terms and privacy policies.
            </p>
            <p>
              Weave 365 is not responsible for third-party failures that are outside Weave 365's reasonable control. However, this clause does not remove any responsibility imposed on Weave 365 by applicable law.
            </p>

            <h2>37. Website Availability</h2>
            <p>
              Weave 365 aims to keep the website operational but does not guarantee uninterrupted or error-free access. The website may be unavailable because of maintenance, updates, technical problems, security measures, network failures or other circumstances.
            </p>
            <p>
              Product prices, images, stock information and other website content may occasionally contain technical or human errors. Weave 365 may correct such errors where permitted by law.
            </p>

            <h2>38. Data and Privacy</h2>
            <p>
              Weave 365 may collect and use personal information required for account creation, order processing, payment, shipping, customer support, fraud prevention, compliance and other legitimate business purposes.
            </p>
            <p>
              Personal information will be handled according to the applicable Privacy Policy and applicable data-protection law. Where personal information of a reseller's customer is provided to Weave 365 for dropshipping or fulfilment, the reseller must have the necessary authority and legal basis to provide that information.
            </p>

            <h2>39. Force Majeure and Events Beyond Reasonable Control</h2>
            <p>
              Weave 365 will not be responsible for delay or failure caused by events beyond its reasonable control, including natural disasters, war, civil disturbance, government restrictions, transport disruption, major technical failures, strikes, epidemic or pandemic-related restrictions, customs restrictions, courier failures or similar external events.
            </p>
            <p>
              This clause does not exclude liabilities or rights that cannot legally be excluded.
            </p>

            <h2>40. Limitation of Liability</h2>
            <p>
              To the extent permitted by applicable law, Weave 365 will not be liable for indirect, incidental, special or consequential business losses, including loss of profit, loss of sales, loss of goodwill or loss of expected business arising from a reseller's or business customer's independent commercial activities.
            </p>
            <p>
              For consumer transactions, nothing in these Terms &amp; Conditions is intended to exclude or restrict a right, remedy or liability that cannot legally be excluded or restricted. Any liability limitation will be interpreted subject to applicable law.
            </p>

            <h2>41. Suspension or Termination</h2>
            <p>
              Weave 365 may suspend or terminate an account, reseller arrangement or service where there is:
            </p>
            <ul>
              <li>Fraud or suspected fraud.</li>
              <li>Non-payment.</li>
              <li>Misuse of the platform.</li>
              <li>False or misleading information.</li>
              <li>Abuse of staff or service providers.</li>
              <li>Violation of these Terms &amp; Conditions.</li>
              <li>Unlawful activity.</li>
              <li>Security risk.</li>
              <li>Other legitimate business or legal reason.</li>
            </ul>
            <p>
              Termination does not cancel amounts already due unless expressly agreed. Rights and obligations that by their nature should continue after termination will continue.
            </p>

            <h2>42. Policy Changes</h2>
            <p>
              Weave 365 may update these Terms &amp; Conditions and related policies from time to time. The updated version will be published on the website with the updated date.
            </p>
            <p>
              The updated terms will normally apply to future transactions after the effective date. Terms applicable to an already accepted order will not be changed retrospectively unless required by law or agreed with the customer.
            </p>

            <h2>43. Governing Law and Jurisdiction</h2>
            <p>
              These Terms &amp; Conditions are governed by the laws of India. For business-to-business disputes, the parties may be subject to the jurisdiction of competent courts at Varanasi, Uttar Pradesh, to the extent permitted by applicable law.
            </p>
            <p>
              For consumer transactions, nothing in this clause is intended to take away any jurisdiction or statutory remedy that cannot legally be excluded. Where a separate written commercial agreement contains a valid dispute-resolution or jurisdiction clause, that agreement will apply to the extent legally enforceable.
            </p>

            <h2>44. Severability</h2>
            <p>
              If any provision of these Terms &amp; Conditions is found to be invalid or unenforceable, the remaining provisions will continue to apply to the extent permitted by law. The invalid provision will be interpreted or modified only to the extent necessary to make it legally enforceable, where legally possible.
            </p>

            <h2>45. No Waiver</h2>
            <p>
              Failure by Weave 365 to enforce a provision immediately does not mean that Weave 365 has waived that provision. A waiver must be clear and specific.
            </p>

            <h2>46. Entire Agreement</h2>
            <p>
              These Terms &amp; Conditions, together with the applicable order details, quotation, service agreement, pricing terms and policies referred to in the transaction, form the agreement applicable to the relevant transaction. If there is a conflict, the following order will generally apply:
            </p>
            <ul>
              <li>A signed or expressly accepted written commercial agreement.</li>
              <li>The accepted quotation or purchase order.</li>
              <li>The applicable order-specific terms or policy.</li>
              <li>These Terms &amp; Conditions.</li>
              <li>General website information.</li>
            </ul>
            <p>
              Mandatory provisions of applicable law will prevail over any conflicting contractual provision.
            </p>

            <h2>47. Contact Us</h2>
            <p>
              For questions about orders, wholesale supply, reseller services, dropshipping, private-label services, returns or these Terms &amp; Conditions, please use the official contact details published on the Weave 365 website.
            </p>

            <div className="legal-highlight-box" style={{ marginTop: '32px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: 'var(--ink)' }}>Acceptance of Terms</h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                By using the Weave 365 website, creating an account, placing an order or using our services, you acknowledge that you have read and accepted these Terms &amp; Conditions.
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                Last Updated: 25 August 2026
              </p>
            </div>
          </div>

          {/* FAQ section */}
          <section className="legal-faq-section">
            <h2 className="legal-faq-section-title">Frequently Asked Questions</h2>
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
