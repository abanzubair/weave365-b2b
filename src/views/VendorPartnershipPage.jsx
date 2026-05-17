import { ClipboardCheck, Factory, Heart, MessageCircle, Package, Users } from 'lucide-react';
import { storeConfig } from '../config.js';
import artisanImage from '../../assets/artisan_at_loom_premium.png';
import { assetSrc } from '../utils/assetSrc.js';
import { VendorPartnership } from '../components/VendorPartnership.jsx';

const registrationPath = '/Trusted-Partner-Registration';

export function VendorPartnershipPage() {
  const whatsappLink = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(
    'Hi, I am interested in listing my products on Weave 365. I would like to discuss the vendor partnership program.'
  )}`;
  const vendorSectionImage = assetSrc(artisanImage);

  const openRegistrationPage = () => {
    window.location.href = registrationPath;
  };

  return (
    <div className="vendor-page-container" style={{ paddingBottom: '60px' }}>
      <VendorPartnership
        imageUrl={vendorSectionImage}
        navigate={() => {}}
        onCta={openRegistrationPage}
      />

      <section className="vendor-categories-section">
        <div className="vendor-section-header">
          <h2>What We Accept</h2>
          <p>We are always looking for high-quality products across these categories</p>
        </div>
        <div className="vendor-category-tags">
          {['Sarees', 'Suits', 'Dupattas', 'Lehengas', 'Fabrics', 'Accessories'].map((cat) => (
            <span key={cat} className="vendor-category-tag">{cat}</span>
          ))}
        </div>
        <p className="vendor-categories-note">
          Have a product category not listed above? Reach out - we&apos;re always expanding.
        </p>
      </section>

      <section className="vendor-stats-section">
        <div className="vendor-stats-grid">
          <div className="vendor-stat">
            <Factory size={28} className="vendor-stat-icon" />
            <strong>200+</strong>
            <span>Vendor Partners</span>
          </div>
          <div className="vendor-stat">
            <Package size={28} className="vendor-stat-icon" />
            <strong>1,000+</strong>
            <span>Products Listed</span>
          </div>
          <div className="vendor-stat">
            <Users size={28} className="vendor-stat-icon" />
            <strong>500+</strong>
            <span>Active Buyers</span>
          </div>
          <div className="vendor-stat">
            <Heart size={28} className="vendor-stat-icon" />
            <strong>98%</strong>
            <span>Partner Satisfaction</span>
          </div>
        </div>
      </section>

      <section className="vendor-final-cta">
        <h2>Ready to Showcase Your Craft?</h2>
        <p>Join our growing network of artisans and manufacturers. Zero risk, maximum reach.</p>
        <div className="vendor-final-actions">
          <button type="button" className="vendor-btn-whatsapp-large" onClick={openRegistrationPage}>
            <ClipboardCheck size={20} />
            Apply as Trusted Partner
          </button>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="vendor-btn-whatsapp-large vendor-btn-outline-large">
            <MessageCircle size={20} />
            WhatsApp Us Now
          </a>
        </div>
      </section>
    </div>
  );
}
