import { ChevronRight, Sparkles, ShieldCheck, Heart } from 'lucide-react';
import { AppLink } from './AppLink.jsx';

export function BrandCollaboration({ imageUrl, weaverImageUrl, navigate }) {
  return (
    <section id="brand-collab" className="brand-collab-section" aria-labelledby="brand-collab-heading">
      <div className="brand-collab-container">
        
        {/* Centered Editorial Header */}
        <div className="brand-collab-header">
          <span className="brand-kicker">Curated Marketplace Collaboration</span>
          <h2 id="brand-collab-heading" className="brand-title">
            Your <span>Label</span>, Featured on <span>Weave 365</span>.
          </h2>
          <div className="brand-header-line"></div>
        </div>

        {/* Asymmetric Split Layout */}
        <div className="brand-collab-layout">
          
          {/* Left Column: Overlapping Dual-Image Collage */}
          <div className="brand-collab-visual-stack">
            <div className="collage-container">
              
              {/* Layer 1: Main Fashion Photo */}
              <div className="main-image-wrapper">
                <img src={imageUrl} alt="Luxury Brand Showcase" className="collage-main-image" />
              </div>
              
              {/* Layer 2: Overlapping Weaver Detail Photo */}
              <div className="detail-image-wrapper">
                <img src={weaverImageUrl} alt="Artisan Weaving Heritage" className="collage-detail-image" />
              </div>
              
              {/* Layer 3: Overlapping Floating Glass Badge */}
              <div className="collage-glass-badge">
                <Sparkles size={20} className="gold-text-accent animate-pulse-slow" />
                <div>
                  <strong>Co-Branded Trust</strong>
                  <span>"In Collab with Weave 365"</span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Editorial Pillars & CTA */}
          <div className="brand-collab-main-content">
            <p className="brand-lead">
              Sell your independent collections under your own brand name directly on Weave 365. Reach our vetted wholesale buyer network with the added credibility of our official heritage quality certification tag.
            </p>

            <div className="brand-pillars-list">
              
              <div className="brand-collab-strip" style={{ display: 'none' }}></div> {/* keep visual identical */}
              <div className="brand-pillar-item">
                <span className="pillar-num">01</span>
                <div className="pillar-info">
                  <h3>Curated Brand Space</h3>
                  <p>List and market your premium collections under your own brand name. Retain 100% pricing control, brand identity, and customer relationships.</p>
                </div>
              </div>

              <div className="brand-pillar-item">
                <span className="pillar-num">02</span>
                <div className="pillar-info">
                  <h3>Co-Branded Heritage Seal</h3>
                  <p>Gain instant buyer trust. Every product listed features an official "In Collaboration with Weave 365" tag, certifying authentic handloom quality.</p>
                </div>
              </div>

              <div className="brand-pillar-item">
                <span className="pillar-num">03</span>
                <div className="pillar-info">
                  <h3>Immediate B2B Distribution</h3>
                  <p>Place your label in front of our verified network of 500+ active retail chains, premium boutiques, and global buyers from day one.</p>
                </div>
              </div>

            </div>

            {/* Premium Editorial CTA */}
            <AppLink 
              to="our-offerings" 
              className="brand-editorial-cta" 
              navigate={navigate}
              aria-label="Apply for brand showcase"
              style={{ textDecoration: 'none' }}
            >
              <div className="brand-cta-content" style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                <span className="cta-label" style={{ fontSize: '20px', fontWeight: '600' }}>Apply for Brand Showcase</span>
                <span className="cta-subtext" style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: '500' }}>List your label on our curated B2B marketplace</span>
              </div>
              <div className="cta-arrow-circle" style={{ marginLeft: '16px' }}>
                <ChevronRight size={20} />
              </div>
            </AppLink>

          </div>

        </div>

        {/* Credentials Trust Strip */}
        <div className="brand-collab-strip">
          <div className="strip-item">
            <ShieldCheck size={18} className="olive-text-accent" />
            <span>100% Brand Autonomy</span>
          </div>
          <div className="strip-separator"></div>
          <div className="strip-item">
            <Sparkles size={18} className="olive-text-accent" />
            <span>Official Heritage Tagging</span>
          </div>
          <div className="strip-separator"></div>
          <div className="strip-item">
            <Heart size={18} className="olive-text-accent" />
            <span>Zero Setup Listing Fees</span>
          </div>
        </div>

      </div>
    </section>
  );
}
