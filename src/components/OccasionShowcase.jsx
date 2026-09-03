import { ArrowRight, Image as ImageIcon, Check } from './icons.jsx';
import { AppLink } from './AppLink.jsx';
import '../styles/occasionShowcase.css';

export function OccasionShowcase({ imageUrl, navigate }) {
  const benefits = [
    'Single-Piece Shopping',
    'Curated Banarasi Collections',
    'For Weddings & Celebrations',
    'Made for Gifting',
    'Easy Online Ordering',
    'Free Shipping in India',
    'International Shipping Available',
  ];

  return (
    <section id="occasion-showcase" className="occasion-showcase-section" aria-labelledby="occasion-showcase-heading">
      <div className="occasion-showcase-layout">
        
        {/* Left Column: Visual Showcase Frame */}
        <div className="occasion-showcase-visual-side">
          <div className="occasion-gallery-container">
            <div className="occasion-image-wrapper">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="Discover handcrafted Banarasi sarees and suits for weddings, celebrations and gifting" 
                  className="occasion-image" 
                  loading="lazy"
                  decoding="async"
                  width={700}
                  height={525}
                />
              ) : (
                <div className="occasion-image-placeholder">
                  <ImageIcon size={44} strokeWidth={1.2} className="placeholder-icon" />
                  <span className="placeholder-title">Visual Showcase</span>
                  <span className="placeholder-subtext">Handcrafted Banarasi Moments</span>
                </div>
              )}
            </div>
            <span className="occasion-caption">Fig. 03 // Handcrafted Banarasi Sarees & Occasion Wear</span>
          </div>
        </div>

        {/* Right Column: Editorial Occasion Content */}
        <div className="occasion-showcase-content-side">
          <div className="occasion-content-wrapper">
            
            <span className="occasion-eyebrow">Banarasi for Every Occasion</span>

            <h2 id="occasion-showcase-heading" className="occasion-showcase-title">
              Discover Banarasi,<br />
              Made for Your Moments.
            </h2>
            
            <p className="occasion-showcase-lead">
              Shop Banarasi sarees and suits for weddings, festivals, gifting and everyday occasions. Explore collections by fabric, weave, colour, design and price, with single-piece ordering and delivery across India.
            </p>

            {/* Benefits Checklist Grid */}
            <div className="occasion-benefits-grid">
              {benefits.map((item) => (
                <div key={item} className="benefit-item">
                  <span className="benefit-check-badge">
                    <Check size={11} strokeWidth={2.6} />
                  </span>
                  <span className="benefit-text">{item}</span>
                </div>
              ))}
            </div>

            {/* Feature Sub-block */}
            <div className="occasion-feature-subblock">
              <h3 className="subblock-heading">Product Details Before Purchase</h3>
              <p className="subblock-desc">Know the fabric, work, weave, design, and care before you buy.</p>
            </div>

            {/* Action Links */}
            <div className="occasion-showcase-actions">
              <AppLink 
                to="sarees" 
                href="/banarasi-sarees/"
                className="occasion-cta-link primary-cta" 
                navigate={navigate}
                aria-label="Shop Banarasi sarees online"
                style={{ textDecoration: 'none' }}
              >
                <span className="link-label">Shop Banarasi Sarees</span>
                <ArrowRight size={18} className="link-arrow" />
              </AppLink>

              <AppLink 
                to="sarees" 
                href="/banarasi-sarees/occasion/"
                className="occasion-cta-link secondary-cta" 
                navigate={navigate}
                aria-label="Shop sarees by occasion"
                style={{ textDecoration: 'none' }}
              >
                <span className="link-label">Shop by Occasion</span>
                <ArrowRight size={18} className="link-arrow" />
              </AppLink>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
