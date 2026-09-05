import { AppLink } from './AppLink.jsx';
import '../styles/overlapHero.css';

const HERO_IMAGE_URL = 'https://assets.weave365.com/assets/banner/heroFreeWebsite.webp';

export function OverlapHero({ navigate }) {
  const heroImage = HERO_IMAGE_URL;

  const highlights = [
    'Flexible MOQ',
    'Dropshipping Available',
    'Free Shipping Across India',
    'Worldwide Shipping',
  ];

  return (
    <section className="overlap-hero" aria-label="Source Banarasi Sarees & Suits from Varanasi">
      <div className="overlap-hero-container">

        {/* Left: Editorial Content Panel */}
        <div className="overlap-hero-content-layer">
          <div className="overlap-hero-content-left">
            <h1 className="overlap-hero-tagline" data-editable-key="hero_title">
              <span className="hero-title-line line-1">Source Banarasi Sarees &amp; Suits from Varanasi</span>{' '}
              <span className="hero-title-line line-2">for Your Store, Boutique or Online Business</span>
            </h1>

            <p className="overlap-hero-description" data-editable-key="hero_subtitle">
              Wholesale sourcing for retailers, boutiques, resellers and social sellers. Buy in bulk, source single pieces, or fulfil customer orders through dropshipping.
            </p>

            <div className="overlap-hero-highlights" aria-label="Key wholesale benefits">
              {highlights.map((hl, i) => (
                <span key={hl} className="highlight-item">
                  <span className="highlight-text">{hl}</span>
                  {i < highlights.length - 1 && <span className="highlight-pipe" aria-hidden="true">|</span>}
                </span>
              ))}
            </div>

            <div className="overlap-hero-actions">
              <AppLink
                to="catalogue"
                href="/catalogue"
                className="overlap-hero-btn primary-btn"
                navigate={navigate}
              >
                <span>Shop Wholesale</span>
                <span className="btn-arrow" aria-hidden="true">&rarr;</span>
              </AppLink>
              <AppLink
                to="resell-sarees-online"
                href="/reseller-banarasi-sarees/"
                className="overlap-hero-btn secondary-btn"
                navigate={navigate}
              >
                <span>Start Reselling</span>
                <span className="btn-arrow" aria-hidden="true">&rarr;</span>
              </AppLink>
            </div>
          </div>
        </div>

        {/* Right: Media Showcase Layer */}
        <div className="overlap-hero-media-layer">
          <div className="overlap-hero-card">
            <picture className="overlap-hero-picture">
              <img
                src={heroImage}
                alt="Source Banarasi sarees and suits from Varanasi"
                className="overlap-hero-img"
                draggable="false"
                fetchPriority="high"
                decoding="async"
                width={1451}
                height={1084}
              />
            </picture>
          </div>
        </div>

      </div>
    </section>
  );
}

