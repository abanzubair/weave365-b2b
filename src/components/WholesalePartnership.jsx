import { ArrowRight } from 'lucide-react';
import { AppLink } from './AppLink.jsx';
import '../styles/wholesalePartnership.css';

export function WholesalePartnership({ imageUrl, navigate }) {
  const fallbackImage = "https://assets.weave365.com/assets/banner/weaver-partner.jpg";

  return (
    <section id="wholesale-partnership" className="wholesale-partnership-section" aria-labelledby="wholesale-partnership-heading">
      <div className="wholesale-partnership-layout">
        
        {/* Left Column: Visual Showcase Frame */}
        <div className="wholesale-partnership-visual-side">
          <div className="partnership-gallery-container">
            <div className="partnership-image-wrapper">
              <img 
                src={imageUrl || fallbackImage} 
                alt="Banarasi sarees and suits wholesale sourcing in Varanasi" 
                className="partnership-image" 
                loading="lazy"
                decoding="async"
                width={700}
                height={525}
              />
            </div>
            <span className="partnership-caption">Fig. 01 // Wholesale Sourcing & Manufacturing, Varanasi</span>
          </div>
        </div>

        {/* Right Column: Editorial Partnership Content */}
        <div className="wholesale-partnership-content-side">
          <div className="partnership-content-wrapper">
            
            <h2 id="wholesale-partnership-heading" className="partnership-title">
              Growing Together<br />
              Through Banarasi Weaves.
            </h2>
            
            <p className="partnership-lead">
              A wholesale sourcing partnership for businesses buying Banarasi sarees and suits in volume. Choose from curated collections for retail, resale, boutiques, exports and private labels, with flexible MOQ and worldwide shipping.
            </p>

            {/* Feature Blocks */}
            <div className="partnership-features-list">
              <div className="partnership-feature-item">
                <h3 className="feature-heading">Flexible MOQ</h3>
                <p className="feature-desc">Order according to your business needs, from smaller business quantities to larger bulk requirements.</p>
              </div>
              <div className="partnership-feature-item">
                <h3 className="feature-heading">Business-Ready Sourcing</h3>
                <p className="feature-desc">Access Banarasi collections across fabrics, weaves, designs and price ranges for resale and retail businesses.</p>
              </div>
            </div>

            {/* Editorial Link CTA */}
            <AppLink 
              to="wholesale-banarasi-sarees" 
              href="/wholesale-banarasi-sarees/"
              className="partnership-cta-link" 
              navigate={navigate}
              aria-label="Explore wholesale Banarasi sarees"
              style={{ textDecoration: 'none' }}
            >
              <span className="link-label">Explore Wholesale</span>
              <ArrowRight size={18} className="link-arrow" />
            </AppLink>

          </div>
        </div>

      </div>
    </section>
  );
}
