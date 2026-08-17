import { ArrowRight } from 'lucide-react';
import { AppLink } from './AppLink.jsx';
import '../styles/resellerGrowth.css';

export function ResellerGrowth({ imageUrl, navigate }) {
  return (
    <section id="reseller-growth" className="brand-collab-section reseller-editorial-section" aria-labelledby="reseller-editorial-heading">
      <div className="brand-collab-layout">
        
        {/* Left Side: Luxury Typographic Details */}
        <div className="brand-collab-content-side reseller-content-side">
          <div className="content-wrapper">
            
            <h2 id="reseller-editorial-heading" className="brand-title">
              Crafting <span className="brand-highlight">Partnership</span><br />
              Direct from the <span className="brand-highlight">Loom</span>.
            </h2>
            
            <p className="brand-lead" data-editable-key="weaver_program_subtitle">
              A partnership built on authentic heritage, quality, and mutual growth. Register as a certified weaver partner to showcase your collections directly to global boutique networks.
            </p>

            {/* 2-Column Detail Grid */}
            <div className="brand-detail-grid">
              <div className="detail-block">
                <h3 className="detail-title">Factory-Direct Rates</h3>
                <p className="detail-text">Receive payouts based on your set factory rates. We manage storefront markups, catalog listings, and buyer logistics.</p>
              </div>
              <div className="detail-block">
                <h3 className="detail-title">Zero Listing Risk</h3>
                <p className="detail-text">We catalog your premium collections at no cost using the product images you share with us.</p>
              </div>
            </div>

            {/* Minimalist Underline Text Link CTA */}
            <AppLink 
              to="weaver-onboarding" 
              className="brand-editorial-link" 
              navigate={navigate}
              aria-label="Onboard as a weaver"
              style={{ textDecoration: 'none' }}
            >
              <span className="link-label">Grow with Us</span>
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
