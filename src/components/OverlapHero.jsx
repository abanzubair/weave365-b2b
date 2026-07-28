import { AppLink } from './AppLink.jsx';
import { assetSrc } from '../utils/assetSrc.js';

// Assets
import mobHeroImage from '../../assets/mobH.webp';
import deskHeroImage from '../../assets/deskH.webp';

export function OverlapHero({ navigate }) {
  const desktopImage = assetSrc(deskHeroImage);
  const mobileImage = assetSrc(mobHeroImage);
  const tagline = <>Authentic design &<br />inspiration for Banarasi Sarees</>;
  const description = 'Sourced directly from Varanasi’s leading weaving hubs. A curated selection of premium Banarasi sarees, suits, and commercial-grade textiles designed for modern boutiques.';
  const highlights = ['Banarasi Sarees ', 'Suits & Dupattas ', 'Varanasi Sourcing'];

  return (
    <section className="overlap-hero" aria-label="Home Saree Collection Banner">
      <div className="overlap-hero-container">

        {/* Responsive Background Image Layer */}
        <div className="overlap-hero-bg-layer">
          <div className="overlap-hero-card">
            <picture className="overlap-hero-picture">
              <source media="(min-width: 768px)" srcSet={desktopImage} />
              <img
                src={mobileImage}
                alt="Explore Collection"
                className="overlap-hero-img"
                draggable="false"
              />
            </picture>
          </div>
        </div>

        {/* Foreground Content Layer */}
        <div className="overlap-hero-content-layer">
          <div className="overlap-hero-content-right">
            <p className="overlap-hero-tagline" data-editable-key="hero_title">
              {tagline}
            </p>

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
                to="catalogue"
                className="overlap-hero-btn"
                navigate={navigate}
              >
                Explore Collection &rarr;
              </AppLink>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
