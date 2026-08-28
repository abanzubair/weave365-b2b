import React from 'react';
import { ChevronDown } from 'lucide-react';
import { LegalSidebar } from '../components/LegalSidebar.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';

export function DisclaimerPage({ navigate }) {
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
      q: "Why do authentic handloom sarees have slight weaving irregularities?",
      a: "Authentic Banarasi sarees are crafted by master weavers using traditional manual looms. Natural variations in weave density, motif alignment, slubs, and zari finishes are authentic signatures of handcrafted heritage, not manufacturing defects."
    },
    {
      q: "How should I store and maintain a pure silk or zari Banarasi saree?",
      a: "Store the saree in a breathable cotton bag away from direct sunlight, dampness, and moisture. Avoid sealed plastic bags and refold the saree periodically to prevent sharp permanent crease lines on pure silk and zari threads."
    },
    {
      q: "Can I request samples before placing a large wholesale or private-label order?",
      a: "Yes. For wholesale buyers, boutiques, and private-label partners, sample ordering is available for eligible collections to evaluate fabric touch, weight, sheen, and drape before placing bulk orders."
    }
  ];

  return (
    <div className="legal-page-container disclaimer-page" data-page-id="disclaimer">
      <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Disclaimer & Care Guide' }]} navigate={navigate} />

      <div className="legal-layout">
        {/* Reusable Sidebar */}
        <LegalSidebar activeTab="disclaimer" navigate={navigate} />

        {/* Content Card */}
        <article className="legal-content-card animate-fade-in">
          <div className="legal-brand-kicker">Weave 365 Guidelines</div>
          <h1 className="legal-h1">Product Disclaimer, Care &amp; Usage Guidelines</h1>
          <span className="legal-updated-date">Last Updated: 25 August 2026</span>

          <div className="legal-text-content">
            <p className="lead">
              This Product Disclaimer, Care &amp; Usage Guidelines applies to D2C customers, B2B buyers, resellers, dropshippers and Private-Label customers purchasing or sourcing products from Weave 365.
            </p>
            <p>
              Weave 365 makes reasonable efforts to provide accurate product photographs, videos, descriptions and specifications on weave365.com, catalogues and approved sales channels.
            </p>
            <p>
              The actual product may have minor differences from its online representation. Such differences may result from photography, lighting, screen settings, fabric characteristics, dyeing, weaving, printing, finishing or other production processes.
            </p>
            <p>
              For bulk, wholesale, reseller or Private-Label purchases, customers may request samples where available before placing a larger order.
            </p>
            <p>
              This document should be read together with the applicable product listing, order terms and Weave 365 policies.
            </p>

            <h2>1. Product Representation</h2>
            <p>
              Product photographs, videos and descriptions are provided for product identification and reference. We make reasonable efforts to present products accurately, but an online image cannot reproduce the exact physical colour, texture, weight, softness, sheen or drape of a fabric.
            </p>
            <p>
              Product specifications stated in the product listing or agreed quotation should be relied upon where a specific specification is provided.
            </p>

            <h2>2. Colour Variation</h2>
            <p>
              Actual product colour may appear slightly different from the colour shown on a mobile phone, computer, tablet or other device. Differences may result from:
            </p>
            <ul>
              <li>Photography and studio lighting.</li>
              <li>Natural or surrounding lighting.</li>
              <li>Screen brightness and calibration.</li>
              <li>Device display technology.</li>
              <li>Photography and editing conditions.</li>
              <li>Dyeing or finishing processes.</li>
            </ul>
            <p>
              Where a product is naturally dyed or otherwise subject to normal colour variation, minor shade differences may occur. A minor difference caused only by screen or photography conditions is not, by itself, evidence that the wrong product was supplied.
            </p>

            <h2>3. Handloom and Handcrafted Products</h2>
            <p>
              Some Weave 365 products may be handwoven, handcrafted or produced using a combination of traditional and modern processes. Where applicable, minor variations may occur in:
            </p>
            <ul>
              <li>Motif or pattern placement.</li>
              <li>Floral or paisley details.</li>
              <li>Border and pallu.</li>
              <li>Zari or decorative work.</li>
              <li>Weave density.</li>
              <li>Texture.</li>
              <li>Colour placement.</li>
              <li>Finishing details.</li>
            </ul>
            <p>
              The extent of variation will depend on the product and manufacturing process. A normal variation should not automatically be treated as a product defect. A material defect or incorrect product is assessed separately under the applicable product claim process.
            </p>

            <h2>4. Saree Edge Markings</h2>
            <p>
              Traditional weaving and finishing processes may result in small marks, yarn ends or other production-related details along the saree edge. The location and visibility may vary by product.
            </p>
            <p>
              Where such a feature is inherent to the production process, it may not affect normal use of the saree. Customers should consider the nature of the product and the intended stitching or finishing process before making alterations.
            </p>

            <h2>5. Fabric Characteristics</h2>
            <p>
              The physical characteristics of a fabric may differ slightly from its appearance in photographs or videos. Depending on the product, differences may occur in:
            </p>
            <ul>
              <li>Texture.</li>
              <li>Softness.</li>
              <li>Weight.</li>
              <li>Sheen.</li>
              <li>Drape.</li>
              <li>Surface appearance.</li>
              <li>Finish.</li>
            </ul>
            <p>
              These characteristics can also vary between fibres, blends, weaves, finishes and production batches. The product description and applicable specifications should be used as the primary reference for the stated material and features.
            </p>

            <h2>6. Tissue and Crush Tissue Sarees</h2>
            <p>
              Tissue and crush tissue products may require additional care depending on their fibre, weave and finishing.
            </p>
            <p>
              <strong>Delicate Structure:</strong> Fine or lightweight fabrics may be more sensitive to pulling, snagging, abrasion and rough handling. Minor thread movement or irregularities may occur depending on the construction of the product.
            </p>
            <p>
              <strong>Crush Texture:</strong> For crush tissue products, the intentionally crushed or textured appearance is part of the design. The fabric may not remain completely smooth after wearing, folding or storage.
            </p>
            <p>
              <strong>Colour:</strong> The actual colour may vary slightly from online photographs because of lighting, photography and screen settings.
            </p>
            <p>
              <strong>Care:</strong> Follow the care instructions supplied with the product. Where the product label or specific care instruction recommends professional cleaning, that instruction should take priority over general washing guidance. Avoid rough handling and excessive friction.
            </p>

            <h2>7. Digital Print Products</h2>
            <p>
              Digital printed products may show minor differences in print placement, colour intensity, registration or pattern alignment. The extent of variation depends on the design and production process.
            </p>
            <p>
              Such differences are not automatically defects where they remain within the reasonable characteristics of the product.
            </p>

            <h2>8. Natural-Fibre Products</h2>
            <p>
              Cotton, silk and other natural-fibre products may have natural variations in texture, weave, surface appearance and feel. Natural fibres may also respond differently to moisture, heat, washing, sunlight and storage.
            </p>
            <p>Care should therefore follow the product-specific instructions.</p>

            <h2>9. Synthetic and Blended Fabrics</h2>
            <p>
              Synthetic and blended fabrics may have different characteristics from natural-fibre fabrics. Depending on the product, differences may occur in sheen, softness, drape, weight and texture.
            </p>
            <p>
              These characteristics should be assessed according to the product specification rather than by online photographs alone.
            </p>

            <h2>10. Washing and Care</h2>
            <p>
              Care requirements vary by product. The product label, care instruction or specific product information should be followed wherever provided. As a general precaution:
            </p>
            <ul>
              <li><strong>Washing:</strong> Do not wash a product unless the applicable care instruction permits washing.</li>
              <li><strong>Cleaning:</strong> Use professional cleaning where the product instructions recommend it, particularly for delicate, embellished, zari, tissue, silk or specially finished products.</li>
              <li><strong>Detergents:</strong> Avoid harsh detergents, bleach and other chemicals unless specifically permitted for the product.</li>
              <li><strong>Drying:</strong> Avoid prolonged or intense direct sunlight where it may affect colour or fabric.</li>
              <li><strong>Ironing:</strong> Use the temperature and method appropriate for the particular fibre and fabric. Excessive heat can damage certain textiles and embellishments.</li>
              <li><strong>Water and Moisture:</strong> Do not leave a saree damp for extended periods. Ensure it is properly dried before long-term storage.</li>
            </ul>
            <p>General care guidance does not replace product-specific instructions.</p>

            <h2>11. Storing a Banarasi Saree</h2>
            <p>For longer-term storage:</p>
            <ul>
              <li>Keep the saree clean and completely dry before storing.</li>
              <li>Use a clean, breathable cotton or fabric covering where appropriate.</li>
              <li>Avoid storing delicate textiles in sealed plastic for extended periods where moisture may become trapped.</li>
              <li>Keep the saree away from excessive heat, moisture and direct sunlight.</li>
              <li>Refold the saree periodically to reduce prolonged pressure on the same fold lines.</li>
              <li>Take additional care with zari, tissue and other delicate materials.</li>
            </ul>
            <p>Storage requirements may vary depending on the fabric and embellishment.</p>

            <h2>12. Zari and Decorative Work</h2>
            <p>
              Zari, metallic yarn, embroidery, embellishments and decorative elements may require additional care. Avoid unnecessary friction, pulling, rough handling and contact with harsh chemicals.
            </p>
            <p>
              Perfume, cosmetics, perspiration, moisture and cleaning chemicals may affect certain fabrics or decorative materials. Follow the product-specific care instructions wherever available.
            </p>

            <h2>13. Alteration, Stitching and Fall-Pico</h2>
            <p>
              Customers may choose to alter, stitch or finish a saree after delivery. Any alteration, stitching, fall-pico work, customisation or third-party treatment should be carried out carefully and by a suitable professional.
            </p>
            <p>
              Once a product has been altered or treated after delivery, assessment of its original condition may become more difficult.
            </p>

            <h2>14. Usage Guidelines</h2>
            <p>Products should be handled according to their material and construction. Avoid:</p>
            <ul>
              <li>Pulling or stretching delicate fabric.</li>
              <li>Contact with sharp objects.</li>
              <li>Excessive friction.</li>
              <li>Exposure to harsh chemicals.</li>
              <li>Improper washing.</li>
              <li>Excessive heat.</li>
              <li>Long-term damp storage.</li>
            </ul>
            <p>Products intended for occasional or special use should be stored and handled accordingly.</p>

            <h2>15. What May Be a Normal Product Characteristic</h2>
            <p>
              Depending on the specific product, the following may occur as part of the material or production process:
            </p>
            <ul>
              <li>Minor colour variation.</li>
              <li>Minor weave irregularity.</li>
              <li>Small pattern or motif placement differences.</li>
              <li>Natural texture variation.</li>
              <li>Minor finishing variation.</li>
              <li>Hand-dye variation.</li>
              <li>Fabric-specific characteristics.</li>
              <li>Minor print-placement variation.</li>
              <li>Normal characteristics of tissue or crush tissue.</li>
              <li>Production-related details along the saree edge.</li>
            </ul>
            <p>
              Whether a particular variation is normal depends on the product, specifications and circumstances. This section does not mean that every defect or deviation is acceptable.
            </p>

            <h2>16. Product-Specific Specifications</h2>
            <p>
              Where a product listing, quotation, sample approval or other written specification states a particular material, size, design, colour, construction or other feature, that information will be considered when assessing the product supplied.
            </p>
            <p>
              For Private-Label, bulk and custom orders, the approved specification or sample may form the principal reference for production.
            </p>

            <h2>17. Sample Orders</h2>
            <p>
              Customers purchasing for wholesale, resale, Private Label or other business purposes are encouraged to request a sample where a sample is available and commercially appropriate.
            </p>
            <p>
              A sample can help evaluate colour, fabric, texture, finish and overall suitability before a larger purchase. A sample is not a guarantee that every future production piece will be identical where the product is subject to natural or production-related variation.
            </p>

            <h2>18. Our Product Information Commitment</h2>
            <p>
              Weave 365 makes reasonable efforts to provide clear and accurate product information. Where a material or characteristic is important to the purchase decision, customers should review the product specifications and request clarification or a sample where appropriate before placing a larger order.
            </p>
            <p>
              The purpose of these guidelines is to explain genuine product characteristics and proper care. They are not intended to exclude any remedy available under the applicable order terms or law.
            </p>

            <div className="legal-highlight-box" style={{ marginTop: '32px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: 'var(--ink)' }}>Contact Us</h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                For questions about product specifications, fabric characteristics, care instructions or product suitability, please contact Weave 365 through the official contact details published on weave365.com.
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                Last Updated: 25 August 2026
              </p>
            </div>
          </div>

          {/* FAQ section */}
          <section className="legal-faq-section">
            <h2 className="legal-faq-section-title">Disclaimer &amp; Care FAQs</h2>
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
