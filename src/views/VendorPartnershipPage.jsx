/**
 * @file VendorPartnershipPage.jsx
 * @description The main vendor partnership program landing view. Embeds the editorial VendorPartnership
 * component, showcases partner satisfaction/reach metrics, and displays listable product categories. Coordinates
 * direct-apply routing to the manual partner registration portal and provides direct WhatsApp communication
 * channels for Varanasi master weavers and suppliers.
 * 
 * @module views/VendorPartnershipPage
 */

import { ClipboardCheck, Factory, Heart, MessageCircle, Package, Users } from 'lucide-react';
import { storeConfig } from '../config.js';
import artisanImage from '../../assets/artisan_at_loom_premium.webp';
import { assetSrc } from '../utils/assetSrc.js';
import { VendorPartnership } from '../components/VendorPartnership.jsx';
import { AppLink } from '../components/AppLink.jsx';

const registrationPath = '/weaver-registration';

const openRegistrationPage = () => {
  window.location.href = registrationPath;
};

export function VendorPartnershipPage() {
  const whatsappLink = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(
    'Hi, I am interested in listing my products on Weave 365. I would like to discuss the vendor partnership program.'
  )}`;
  const vendorSectionImage = assetSrc(artisanImage);

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

      {/* Temporarily turned off
      <section className="vendor-stats-section">
        <div className="vendor-stats-grid">
          <div className="vendor-stat">
            <div className="vendor-stat-icon-wrapper">
              <Factory size={24} className="vendor-stat-icon" />
            </div>
            <strong className="vendor-stat-count">200+</strong>
            <span className="vendor-stat-label">Vendor Partners</span>
          </div>

          <div className="vendor-stat">
            <div className="vendor-stat-icon-wrapper">
              <Package size={24} className="vendor-stat-icon" />
            </div>
            <strong className="vendor-stat-count">1,000+</strong>
            <span className="vendor-stat-label">Products Listed</span>
          </div>

          <div className="vendor-stat">
            <div className="vendor-stat-icon-wrapper">
              <Users size={24} className="vendor-stat-icon" />
            </div>
            <strong className="vendor-stat-count">500+</strong>
            <span className="vendor-stat-label">Active Buyers</span>
          </div>

          <div className="vendor-stat">
            <div className="vendor-stat-icon-wrapper">
              <Heart size={24} className="vendor-stat-icon" />
            </div>
            <strong className="vendor-stat-count">98%</strong>
            <span className="vendor-stat-label">Partner Satisfaction</span>
          </div>
        </div>
      </section>
      */}

      <section className="vendor-final-cta">
        <h2>Ready to Showcase Your Craft?</h2>
        <p>Join our growing network of artisans and manufacturers. Zero risk, maximum reach.</p>
        <div className="vendor-final-actions">
          <AppLink 
            to="weaver-registration" 
            className="vendor-btn-whatsapp-large"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
          >
            <ClipboardCheck size={20} />
            Apply as Trusted Partner
          </AppLink>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="vendor-btn-whatsapp-large vendor-btn-outline-large">
            <svg viewBox="0 0 448 512" width="20" height="20" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 56.6 15.3 17-2.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
            </svg>
            WhatsApp Us Now
          </a>
        </div>
      </section>
    </div>
  );
}
