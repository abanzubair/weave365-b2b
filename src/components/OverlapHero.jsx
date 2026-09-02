import { AppLink } from './AppLink.jsx';
import { ArrowRight, Check } from 'lucide-react';
import '../styles/overlapHero.css';

export function OverlapHero({ navigate }) {
  return (
    <section className="overlap-hero" aria-label="Turn Your Reselling Business Into a Brand — Weave 365">
      <div className="overlap-hero-container">
        
        {/* Left Column: Hero Editorial Content */}
        <div className="overlap-hero-content-col">
          
          <h1 className="overlap-hero-title">
            <span className="hero-title-main">Turn Your Reselling Business Into a Brand</span>
            <div className="hero-title-sub-group">
              <span className="hero-title-sub">Sell 50 Sarees or Suits in 30 Days.</span>
              <span className="hero-title-sub">Get Your Own Website — FREE.</span>
            </div>
          </h1>

          <div className="overlap-hero-desc">
            <p className="hero-desc-channels">Sell on <strong>WhatsApp, Instagram &amp; Facebook.</strong></p>
            <p className="hero-desc-tagline">Build your own brand, grow your customers, and start selling online.</p>
          </div>

          {/* Key Value Checklist / Trust Strip */}
          <div className="overlap-hero-features-strip" role="list">
            <div className="overlap-feature-item" role="listitem">
              <span className="overlap-feature-badge" aria-hidden="true">
                <Check size={12} strokeWidth={3} />
              </span>
              <span className="overlap-feature-text">White Label Dropshipping Available</span>
            </div>
            <div className="overlap-feature-divider" />
            <div className="overlap-feature-item" role="listitem">
              <span className="overlap-feature-badge" aria-hidden="true">
                <Check size={12} strokeWidth={3} />
              </span>
              <span className="overlap-feature-text">Free Shipping Across India</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="overlap-hero-actions">
            <AppLink
              to="resell-sarees-online"
              href="/resell-sarees-online"
              className="overlap-hero-cta-link primary-link"
              navigate={navigate}
              aria-label="Start Reselling"
            >
              <span className="link-label">Start Reselling</span>
              <ArrowRight size={18} className="link-arrow" />
            </AppLink>

            <AppLink
              to="dropshipping"
              href="/dropshipping"
              className="overlap-hero-cta-link primary-link"
              navigate={navigate}
              aria-label="Dropshipping"
            >
              <span className="link-label">Dropshipping</span>
              <ArrowRight size={18} className="link-arrow" />
            </AppLink>
          </div>
        </div>

        {/* Right Column: Clean Editorial Visual Frame */}
        <div className="overlap-hero-visual-col">
          <div className="overlap-hero-visual-frame">
            <img
              src="https://assets.weave365.com/assets/banner/heroFreeWebsite.webp"
              alt="Turn Your Reselling Business Into a Brand — Weave 365"
              className="visual-hero-img"
              fetchPriority="high"
              decoding="async"
              width={960}
              height={720}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
