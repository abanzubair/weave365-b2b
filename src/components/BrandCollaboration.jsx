import { ArrowRight } from 'lucide-react';
import { AppLink } from './AppLink.jsx';

export function BrandCollaboration({ imageUrl, navigate }) {
  return (
    <section id="brand-collab" className="brand-collab-section" aria-labelledby="brand-collab-heading">
      <div className="brand-collab-layout">
        
        {/* Left Column: Asymmetrical Gallery Visual Frame */}
        <div className="brand-collab-visual-side">
          <div className="gallery-frame-container">
            <div className="gallery-image-wrapper">
              <img src={imageUrl} alt="Artisan draping a Banarasi silk saree in studio" className="gallery-image" />
            </div>
            <span className="gallery-caption">Fig. 02 // Studio Drape Showcase, Varanasi</span>
          </div>
        </div>

        {/* Right Column: Luxury Typographic Details */}
        <div className="brand-collab-content-side">
          <div className="content-wrapper">
            
            <h2 id="brand-collab-heading" className="brand-title">
              Your <span className="brand-highlight">Label</span>,<br />
              Featured on <span className="brand-highlight">Weave 365</span>.
            </h2>
            
            <p className="brand-lead" data-editable-key="partner_brand_showcase_sub">
              Sell your independent collections under your own brand name on our marketplace. Reach our vetted B2B network with direct pricing control and the credibility of our certified heritage quality.
            </p>

            {/* 2-Column Detail Grid */}
            <div className="brand-detail-grid">
              <div className="detail-block">
                <h3 className="detail-title">Curated Space</h3>
                <p className="detail-text">List collections under your label with 100% control and zero listing fees.</p>
              </div>
              <div className="detail-block">
                <h3 className="detail-title">Heritage Seal</h3>
                <p className="detail-text">Gain instant buyer trust with our certified handloom quality tag.</p>
              </div>
            </div>

            {/* Minimalist Underline Text Link CTA */}
            <AppLink 
              to="collaboration" 
              className="brand-editorial-link" 
              navigate={navigate}
              aria-label="Apply for brand showcase"
              style={{ textDecoration: 'none' }}
            >
              <span className="link-label">Apply for Brand Showcase</span>
              <ArrowRight size={16} className="link-arrow" />
            </AppLink>

          </div>
        </div>

      </div>
    </section>
  );
}
