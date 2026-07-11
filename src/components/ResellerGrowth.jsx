import { ArrowRight } from 'lucide-react';
import { AppLink } from './AppLink.jsx';

export function ResellerGrowth({ imageUrl, navigate }) {
  return (
    <section id="reseller-growth" className="brand-collab-section reseller-editorial-section" aria-labelledby="reseller-editorial-heading">
      <div className="brand-collab-layout">
        
        {/* Left Side: Luxury Typographic Details */}
        <div className="brand-collab-content-side reseller-content-side">
          <div className="content-wrapper">
            
            <h2 id="reseller-editorial-heading" className="brand-title">
              Crafting <em>Success</em><br />
              Beyond the <em>Weave</em>.
            </h2>
            
            <p className="brand-lead">
              A partnership built on heritage, quality, and mutual growth. We supply the finest authentic Varanasi handloom collections, and provide the infrastructure to deliver them to your market.
            </p>

            {/* 2-Column Detail Grid */}
            <div className="brand-detail-grid">
              <div className="detail-block">
                <h3 className="detail-title">Curated Catalog</h3>
                <p className="detail-text">Premium Banarasi collections that resonate with global bridal and festive trends.</p>
              </div>
              <div className="detail-block">
                <h3 className="detail-title">Growth Toolkit</h3>
                <p className="detail-text">Dedicated white-label storefront tools and logistics support to scale your business.</p>
              </div>
            </div>

            {/* Minimalist Underline Text Link CTA */}
            <AppLink 
              to="partner-program" 
              className="brand-editorial-link" 
              navigate={navigate}
              aria-label="Join partner program"
              style={{ textDecoration: 'none' }}
            >
              <span className="link-label">Grow With Us</span>
              <ArrowRight size={16} className="link-arrow" />
            </AppLink>

          </div>
        </div>

        {/* Right Column: Asymmetrical Gallery Visual Frame */}
        <div className="brand-collab-visual-side reseller-visual-side">
          <div className="gallery-frame-container">
            <div className="gallery-image-wrapper">
              <img src={imageUrl} alt="Premium Banarasi saree catalog display showcase" className="gallery-image" />
            </div>
            <span className="gallery-caption">Fig. 01 // Premium Wholesale Catalog, Varanasi</span>
          </div>
        </div>

      </div>
    </section>
  );
}
