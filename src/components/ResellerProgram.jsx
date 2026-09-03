import { ArrowRight, Check } from './icons.jsx';
import { AppLink } from './AppLink.jsx';
import '../styles/resellerProgram.css';

export function ResellerProgram({ imageUrl, navigate }) {
  const fallbackImage = "https://assets.weave365.com/assets/banner/brand-collab.jpg";

  const benefits = [
    '₹0 to Start',
    'No Inventory Required',
    'Your Own Margin',
    'Your Own Branding',
    'White-Label Fulfilment',
    'Free Shipping in India',
    'Dropshipping Available',
    'International Shipping Available',
  ];

  return (
    <section id="reseller-program" className="reseller-program-section" aria-labelledby="reseller-program-heading">
      <div className="reseller-program-layout">
        
        {/* Left Column: Editorial Content */}
        <div className="reseller-program-content-side">
          <div className="reseller-content-wrapper">
            
            <h2 id="reseller-program-heading" className="reseller-program-title">
              Start Selling Banarasi Sarees<br />
              and Suits Without Inventory
            </h2>
            
            <p className="reseller-program-lead">
              Find products from Varanasi, add your own margin, create white-label catalogues with your own branding, sell on WhatsApp, Instagram, Facebook or list on your own website, and let Weave 365 handle fulfilment.
            </p>

            {/* Benefits Grid */}
            <div className="reseller-benefits-grid">
              {benefits.map((item) => (
                <div key={item} className="benefit-item">
                  <span className="benefit-check-badge">
                    <Check size={11} strokeWidth={2.6} />
                  </span>
                  <span className="benefit-text">{item}</span>
                </div>
              ))}
            </div>

            {/* Action Links */}
            <div className="reseller-program-actions">
              <AppLink 
                to="signup" 
                href="/signup"
                className="reseller-cta-link primary-cta" 
                navigate={navigate}
                aria-label="Get started free with reseller program"
                style={{ textDecoration: 'none' }}
              >
                <span className="link-label">Get started free</span>
                <ArrowRight size={18} className="link-arrow" />
              </AppLink>

              <AppLink 
                to="catalogue" 
                href="/catalogue"
                className="reseller-cta-link secondary-cta" 
                navigate={navigate}
                aria-label="Explore wholesale catalog"
                style={{ textDecoration: 'none' }}
              >
                <span className="link-label">What Should I Sell Today</span>
                <ArrowRight size={18} className="link-arrow" />
              </AppLink>
            </div>

          </div>
        </div>

        {/* Right Column: Visual Showcase Frame */}
        <div className="reseller-program-visual-side">
          <div className="reseller-gallery-container">
            <div className="reseller-image-wrapper">
              <img 
                src={imageUrl || fallbackImage} 
                alt="Start selling Banarasi sarees and suits without inventory with Weave 365" 
                className="reseller-image" 
                loading="lazy"
                decoding="async"
                width={700}
                height={525}
              />
            </div>
            <span className="reseller-caption">Fig. 02 // Zero-Inventory Reseller & Dropshipping Program</span>
          </div>
        </div>

      </div>
    </section>
  );
}
