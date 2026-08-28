import React from 'react';
import { ChevronDown } from 'lucide-react';
import { LegalSidebar } from '../components/LegalSidebar.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';

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
      q: "Does Weave 365 sell my personal or business data?",
      a: "No. Weave 365 does not sell personal or business information for money. Information is shared only with trusted logistics, payment, and operational service providers necessary to fulfill your orders."
    },
    {
      q: "How is reseller end-customer data protected during dropshipping?",
      a: "Delivery information provided for dropshipping orders is used strictly for order fulfillment, logistics routing, and customer support. It is not used for unauthorized direct marketing."
    },
    {
      q: "Are online payments and credit card credentials securely handled?",
      a: "Yes. Payment credentials are processed directly through PCI-compliant secure payment service providers with encryption. Weave 365 does not store full payment card credentials."
    }
  ];

  return (
    <div className="legal-page-container privacy-security-page" data-page-id="privacy-security">
      <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Privacy & Security' }]} navigate={navigate} />

      <div className="legal-layout">
        {/* Reusable Sidebar */}
        <LegalSidebar activeTab="privacy-security" navigate={navigate} />

        {/* Content Card */}
        <article className="legal-content-card animate-fade-in">
          <div className="legal-brand-kicker">Weave 365 Governance</div>
          <h1 className="legal-h1">Privacy &amp; Security Policy</h1>
          <span className="legal-updated-date">Last Updated: 25 August 2026</span>

          <div className="legal-text-content">
            <p className="lead">
              Weave 365 respects the privacy of individuals and businesses that use our website and services.
            </p>
            <p>
              This Privacy &amp; Security Policy explains what information we may collect, why we use it, how we may share it, how we protect it and how you can contact us about your information.
            </p>
            <p>
              This policy applies to D2C customers, B2B buyers, resellers, dropshippers, Private-Label customers and other persons who interact with Weave 365 through our website or official communication channels.
            </p>
            <p>
              This policy should be read together with the Weave 365 Terms &amp; Conditions and other applicable policies published on weave365.com.
            </p>

            <h2>1. Information We May Collect</h2>
            <p>
              Depending on how you use Weave 365, we may collect information such as:
            </p>
            <ul>
              <li>Name.</li>
              <li>Business or organisation name.</li>
              <li>Mobile number.</li>
              <li>Email address.</li>
              <li>Billing and delivery address.</li>
              <li>Business and tax information where required.</li>
              <li>Account and login information.</li>
              <li>Order and transaction information.</li>
              <li>Product and service enquiries.</li>
              <li>Reseller or Private-Label requirements.</li>
              <li>Communication history with Weave 365.</li>
              <li>Information required for shipping, payment, verification or customer support.</li>
            </ul>
            <p>
              We may also receive information relating to a recipient where a customer or reseller provides that information to us for fulfilment or delivery. You should provide only information that is necessary and accurate for the relevant purpose.
            </p>

            <h2>2. Information Collected Through the Website</h2>
            <p>
              When you use our website, we may collect technical and usage information such as:
            </p>
            <ul>
              <li>IP address.</li>
              <li>Browser type.</li>
              <li>Device information.</li>
              <li>Operating system.</li>
              <li>Pages visited.</li>
              <li>Website activity.</li>
              <li>Approximate location derived from technical information.</li>
              <li>Referral or source information.</li>
              <li>Cookies and similar technical data.</li>
            </ul>
            <p>
              The exact information collected may depend on how the website and its services are configured.
            </p>

            <h2>3. How We Use Information</h2>
            <p>We may use information to:</p>
            <ul>
              <li>Create and manage accounts.</li>
              <li>Process and fulfil orders.</li>
              <li>Arrange delivery and logistics.</li>
              <li>Process payments.</li>
              <li>Provide quotations and business services.</li>
              <li>Provide reseller, dropshipping and Private-Label services.</li>
              <li>Respond to enquiries.</li>
              <li>Provide customer and business support.</li>
              <li>Send order and service-related communications.</li>
              <li>Prevent fraud, misuse and unauthorised activity.</li>
              <li>Maintain and secure our website and systems.</li>
              <li>Improve our products, services and website.</li>
              <li>Maintain business, accounting and transaction records.</li>
              <li>Meet legal, regulatory and contractual requirements.</li>
              <li>Exercise or defend legal rights where necessary.</li>
            </ul>
            <p>
              We will use personal data only for purposes permitted under applicable law.
            </p>

            <h2>4. Business and Reseller Information</h2>
            <p>
              For B2B, reseller, dropshipping and Private-Label customers, we may collect additional information reasonably required for business transactions. This may include business name, business contact details, tax information, billing details, shipping information, product requirements and commercial communications.
            </p>
            <p>
              Business information may contain personal data relating to an individual. Where it does, applicable privacy requirements will apply to that personal data.
            </p>

            <h2>5. Information of a Reseller's Customer</h2>
            <p>
              For eligible dropshipping orders, a reseller may provide Weave 365 with the name, phone number, address and other delivery information of its customer.
            </p>
            <p>
              The reseller is responsible for providing information lawfully and for ensuring that it is authorised to provide the information to Weave 365 for fulfilment and delivery. Weave 365 may use such information for the relevant order, delivery, support and related operational purposes.
            </p>

            <h2>6. WhatsApp, Email, Phone and Social Media</h2>
            <p>
              If you contact Weave 365 through WhatsApp, email, phone, Instagram, Facebook or another communication channel, we may retain and use information contained in that communication to respond to you and manage the relevant request.
            </p>
            <p>
              Third-party communication platforms have their own terms and privacy practices. Their handling of information is also subject to their respective policies.
            </p>

            <h2>7. Cookies and Similar Technologies</h2>
            <p>We may use cookies and similar technologies to:</p>
            <ul>
              <li>Operate essential website functions.</li>
              <li>Maintain sessions and preferences.</li>
              <li>Understand website usage.</li>
              <li>Improve website performance.</li>
              <li>Detect security issues.</li>
              <li>Measure and improve services.</li>
            </ul>
            <p>
              Some third-party tools used on the website may also place or read cookies or similar technologies according to their own policies. Where required by law, applicable choices or notices will be provided.
            </p>

            <h2>8. Sharing of Information</h2>
            <p>
              We do not sell personal information for money. We may share information where reasonably required to operate the business or provide the requested service. This may include sharing information with:
            </p>
            <ul>
              <li>Payment service providers.</li>
              <li>Banks and financial service providers.</li>
              <li>Courier and logistics partners.</li>
              <li>Hosting and technology providers.</li>
              <li>Website and software service providers.</li>
              <li>Communication service providers.</li>
              <li>Customer support providers.</li>
              <li>Professional advisers.</li>
              <li>Government authorities or law-enforcement agencies where legally required.</li>
            </ul>
            <p>
              Service providers may process information only for the purposes for which they are engaged or as otherwise permitted by law and their contractual arrangements with us.
            </p>

            <h2>9. Legal and Compliance Disclosures</h2>
            <p>
              We may disclose information where required or permitted by applicable law, including in response to:
            </p>
            <ul>
              <li>A valid legal process.</li>
              <li>A government or regulatory requirement.</li>
              <li>A court or authority order.</li>
              <li>Fraud or security investigations.</li>
              <li>Protection of rights, property or safety.</li>
              <li>Enforcement of contractual or legal rights.</li>
            </ul>

            <h2>10. Payment Information</h2>
            <p>
              Payments may be processed through third-party payment service providers. Depending on the payment method, payment credentials may be handled directly by the payment provider rather than stored by Weave 365.
            </p>
            <p>
              We do not intend to store full card credentials unless necessary, lawfully permitted and appropriately protected. Payment providers may have separate terms and privacy policies.
            </p>

            <h2>11. Data Security</h2>
            <p>
              Weave 365 uses reasonable technical and organisational measures to protect information against unauthorised access, misuse, loss, alteration or disclosure. Security measures may include access controls, authentication controls, system monitoring, data protection measures and restricted access to information.
            </p>
            <p>
              No online service, website or method of electronic transmission can be guaranteed to be completely secure. We therefore cannot promise absolute security.
            </p>

            <h2>12. Account Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. Do not share your password, verification code or other security credentials with another person.
            </p>
            <p>
              Notify Weave 365 through an official contact channel if you suspect unauthorised access to your account. Weave 365 will not normally ask you to disclose your account password through an unsolicited communication.
            </p>

            <h2>13. Communication and Fraud Prevention</h2>
            <p>
              We may use information to verify transactions, detect suspicious activity, prevent fraud and protect customers and the business. We may take additional verification steps before processing certain orders, refunds, account changes or other requests.
            </p>
            <p>
              This may include requesting information reasonably required to confirm identity, ownership or transaction details.
            </p>

            <h2>14. Data Retention</h2>
            <p>
              We retain information only for as long as reasonably necessary for the purposes for which it was collected, including business operations, customer support, accounting, tax, legal, contractual, dispute-resolution and security requirements.
            </p>
            <p>
              Retention periods may differ depending on the type of information and the applicable legal or business requirement. When information is no longer required, it may be deleted, anonymised or otherwise disposed of in accordance with applicable requirements.
            </p>

            <h2>15. Your Privacy Rights and Choices</h2>
            <p>
              Subject to applicable law and reasonable identity verification, you may contact us regarding personal information we hold about you. Depending on the applicable law, you may have rights relating to access, correction, updating, withdrawal of consent, grievance redressal, deletion or other matters.
            </p>
            <p>
              Some requests may be limited where we are required or permitted to retain information by law or for legitimate business purposes. Where consent is the legal basis for processing and the applicable law provides a right to withdraw it, withdrawal will not affect processing already carried out lawfully before withdrawal.
            </p>

            <h2>16. Children</h2>
            <p>
              Our services are primarily intended for adults and business users. Where applicable law imposes requirements relating to children's personal data, Weave 365 will follow those requirements.
            </p>

            <h2>17. Third-Party Websites and Services</h2>
            <p>
              Our website may contain links, integrations or references to third-party websites and services. These third parties may include payment providers, courier services, social media platforms, technology providers and other service providers.
            </p>
            <p>
              Their privacy practices are governed by their own policies. Weave 365 is not responsible for the privacy practices of independent third-party websites or services.
            </p>

            <h2>18. International Data Processing</h2>
            <p>
              Some service providers used by Weave 365 may process information outside India. Where personal data is transferred or accessed outside India, Weave 365 will handle such processing subject to applicable law and the relevant contractual or technical safeguards.
            </p>

            <h2>19. Security Incidents</h2>
            <p>
              If Weave 365 becomes aware of a personal-data or security incident requiring action, we may investigate, contain and address the incident. Where notification is required under applicable law, we will provide the required notice through an appropriate channel.
            </p>

            <h2>20. Applicable Data-Protection Law</h2>
            <p>
              Weave 365 will handle personal data in accordance with applicable Indian data-protection and privacy requirements. Where applicable, this includes the Digital Personal Data Protection Act, 2023 and the rules and notifications brought into force under it. The Act and the Digital Personal Data Protection Rules, 2025 have phased commencement provisions, so the specific obligations applicable at a particular time will depend on the provisions then in force.
            </p>
            <p>
              Where another law applies to a particular transaction, Weave 365 will also comply with the applicable requirements.
            </p>

            <h2>21. Policy Updates</h2>
            <p>
              Weave 365 may update this Privacy &amp; Security Policy when our services, technology, business practices or legal requirements change. The latest version will be published on weave365.com with the revised date. Where required, material changes will be communicated through an appropriate channel.
            </p>

            <div className="legal-highlight-box" style={{ marginTop: '32px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: 'var(--ink)' }}>Contact Us</h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                For questions, requests or concerns relating to privacy, personal data or security, please contact Weave 365 through the official contact details published on weave365.com.
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                Last Updated: 25 August 2026
              </p>
            </div>
          </div>

          {/* FAQ section */}
          <section className="legal-faq-section">
            <h2 className="legal-faq-section-title">Privacy &amp; Data Protection FAQs</h2>
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
