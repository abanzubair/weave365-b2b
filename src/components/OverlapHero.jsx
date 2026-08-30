import { AppLink } from './AppLink.jsx';
import { ArrowRight } from 'lucide-react';
import '../styles/overlapHero.css';

export function OverlapHero({ navigate }) {
  return (
    <section className="overlap-hero" aria-label="Turn Your Reselling Into a Brand — Weave 365">
      <div className="overlap-hero-container">
        
        {/* Left Column: Hero Editorial Content */}
        <div className="overlap-hero-content-col">
          
          <h1 className="overlap-hero-title">
            <span className="hero-title-main">Turn Your Reselling Into a Brand</span>
            <span className="hero-title-sub">Sell 50 Sarees or Suits in 30 Days.</span>
            <span className="hero-title-accent">Get Your Website FREE.</span>
          </h1>

          <div className="overlap-hero-desc">
            <p className="hero-desc-channels">Sell on <strong>WhatsApp, Instagram &amp; Facebook.</strong></p>
            <p className="hero-desc-tagline">Build your brand. Grow your customers. Start selling online.</p>
          </div>

          {/* Action CTA */}
          <div className="overlap-hero-actions">
            <AppLink
              to="catalogue"
              href="/catalogue"
              className="overlap-hero-cta-link primary-link"
              navigate={navigate}
              aria-label="Start Reselling"
            >
              <span className="link-label">Start Reselling</span>
              <ArrowRight size={18} className="link-arrow" />
            </AppLink>
          </div>

        </div>

        {/* Right Column: Clean Editorial Visual Frame */}
        <div className="overlap-hero-visual-col">
          <div className="overlap-hero-visual-frame">
            <img
              src="https://assets.weave365.com/assets/banner/heroFreeWebsite.webp"
              alt="Turn Your Reselling Into a Brand — Weave 365"
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
