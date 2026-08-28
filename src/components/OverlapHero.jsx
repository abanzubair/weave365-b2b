import { AppLink } from './AppLink.jsx';
import { assetSrc } from '../utils/assetSrc.js';

// Assets
import mobHeroImage from '../../assets/mobH.webp';
import deskHeroImage from '../../assets/deskH.webp';
import '../styles/overlapHero.css';

export function OverlapHero({ navigate }) {
  const desktopImage = assetSrc(deskHeroImage);
  const mobileImage = assetSrc(mobHeroImage);
  const tagline = 'Banarasi Sarees and Suits for Wholesale, Resellers, Private Labels and Retail';
  const description = 'Source Banarasi sarees & suits for wholesale, reselling, social media selling, boutique retail, private labels and personal use. Sell through WhatsApp, Instagram, Facebook and other online channels. Explore sarees by fabric, weave, design, price and buying quantity.';
  const highlights = [
    'Flexible MOQ',
    'Dropshipping Available',
    'Free Shipping Across India',
    'Worldwide Shipping',
  ];

  return (
    <section className="overlap-hero" aria-label="Banarasi Sarees and Suits Wholesale & Resellers">
      <div className="overlap-hero-container">

        {/* Responsive Background Image Layer */}
        <div className="overlap-hero-bg-layer">
          <div className="overlap-hero-card">
            <picture className="overlap-hero-picture">
              <source media="(min-width: 768px)" srcSet={desktopImage} />
              <img
                src={mobileImage}
                alt="Banarasi Sarees and Suits Wholesale & Resellers"
                className="overlap-hero-img"
                draggable="false"
                fetchPriority="high"
                decoding="async"
                width={768}
                height={960}
              />
            </picture>
          </div>
        </div>

        {/* Foreground Content Layer */}
        <div className="overlap-hero-content-layer">
          <div className="overlap-hero-content-right">
            <h1 className="overlap-hero-tagline" data-editable-key="hero_title">
              {tagline}
            </h1>

            <div className="overlap-hero-divider"></div>

            <p className="overlap-hero-description" data-editable-key="hero_subtitle">
              {description}
            </p>

            <div className="overlap-hero-highlights">
              {highlights.map((hl, i) => (
                <span key={hl} className="highlight-item">
                  {hl}
                  {i < highlights.length - 1 && <span className="divider-dot">·</span>}
                </span>
              ))}
            </div>

            <div className="overlap-hero-actions">
              <AppLink
                to="wholesale-banarasi-sarees"
                href="/wholesale-banarasi-sarees/"
                className="overlap-hero-btn primary-btn"
                navigate={navigate}
              >
                <span>Get Wholesale Pricing</span>
                <span className="btn-arrow">&rarr;</span>
              </AppLink>
              <AppLink
                to="reseller-banarasi-sarees"
                href="/reseller-banarasi-sarees/"
                className="overlap-hero-btn secondary-btn"
                navigate={navigate}
              >
                <span>Start Reselling</span>
                <span className="btn-arrow">&rarr;</span>
              </AppLink>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
