import { AppLink } from './AppLink.jsx';
import { getOptimizedImageUrl, getImageSrcSet, getOriginalImageUrl } from '../utils/imageOptimizer.js';

const OVERLAP_HERO_CSS = `
:root {
  --hero-bg: #ffffff;
  --hero-ink: #16130F;
  --hero-accent: var(--gold, #B78646);
  --hero-desc: #4D4740;
  --hero-bar-bg: #16130F;
  --hero-gold: #B78646;
}

.overlap-hero {
  position: relative;
  width: 100%;
  background-color: var(--hero-bg, #ffffff);
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.overlap-hero-container {
  position: relative;
  width: 100%;
  flex: 1;
  --hero-padding-x: clamp(20px, 4.5vw, 64px);
  --hero-padding-y: clamp(2.5rem, 4.5vw, 4.5rem);
  max-width: calc(1600px + (var(--hero-padding-x) * 2));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--hero-padding-y) var(--hero-padding-x);
  box-sizing: border-box;
  gap: clamp(2rem, 3.5vw, 3.5rem);
}

.overlap-hero-content-layer {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  order: 2;
}

.overlap-hero-content-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 620px;
  width: 100%;
}

.overlap-hero-tagline {
  font-family: var(--font-heading, 'Cormorant Garamond', Georgia, serif) !important;
  font-size: clamp(2.4rem, 4.2vw, 3.8rem) !important;
  font-weight: 600 !important;
  color: var(--hero-ink, #16130F) !important;
  line-height: 1.12 !important;
  letter-spacing: -0.015em !important;
  margin: 0 0 clamp(1rem, 1.6vw, 1.4rem) 0 !important;
  text-wrap: balance !important;
}

.overlap-hero-tagline .hero-line {
  display: block;
}

.overlap-hero-tagline .hero-accent-word,
.overlap-hero-tagline .hero-accent-italic {
  font-family: var(--font-heading, 'Cormorant Garamond', Georgia, serif) !important;
  font-style: normal !important;
  font-weight: 600 !important;
  color: var(--hero-accent, var(--gold, #B78646)) !important;
}

.overlap-hero-description {
  font-family: var(--font-body, 'Manrope', system-ui, sans-serif);
  font-size: clamp(0.95rem, 1.1vw, 1.08rem);
  font-weight: 400;
  color: var(--hero-desc, #4D4740);
  line-height: 1.65;
  margin: 0 0 clamp(1.5rem, 2.5vw, 2.2rem) 0;
  max-width: 500px;
  text-wrap: pretty;
}

.overlap-hero-actions {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: clamp(10px, 1.5vw, 16px);
  width: 100%;
  justify-content: center;
  align-items: center;
}

.overlap-hero-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  min-height: 48px;
  padding: 0 28px;
  border-radius: 999px;
  font-family: var(--font-body, 'Manrope', system-ui, sans-serif);
  font-size: clamp(0.85rem, 0.95vw, 0.94rem);
  font-weight: 500;
  letter-spacing: 0.01em;
  text-decoration: none;
  white-space: nowrap;
  box-sizing: border-box;
  touch-action: manipulation;
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.overlap-hero-btn .btn-arrow {
  display: inline-block;
  font-size: 1.15em;
  line-height: 1;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.overlap-hero-btn:hover .btn-arrow {
  transform: translateX(4px);
}

.overlap-hero-btn.primary-btn {
  background: var(--hero-ink, #16130F);
  border: 1.5px solid var(--hero-ink, #16130F);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(22, 19, 15, 0.12);
}

.overlap-hero-btn.primary-btn:hover {
  background: #2b2520;
  border-color: #2b2520;
  color: #ffffff;
  box-shadow: 0 8px 22px rgba(22, 19, 15, 0.22);
  transform: translateY(-2px);
}

.overlap-hero-btn.secondary-btn {
  background: transparent;
  border: 1.5px solid var(--hero-ink, #16130F);
  color: var(--hero-ink, #16130F);
}

.overlap-hero-btn.secondary-btn:hover {
  background: rgba(22, 19, 15, 0.05);
  color: var(--hero-ink, #16130F);
  transform: translateY(-2px);
}

.overlap-hero-btn:active {
  transform: scale(0.98);
}

.overlap-hero-btn:focus-visible {
  outline: 2px solid var(--gold, #b78646);
  outline-offset: 3px;
}

.overlap-hero-media-layer {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  order: 1;
}

.overlap-hero-card {
  width: 100%;
  max-width: 620px;
  background-color: #ffffff;
  border-radius: clamp(22px, 3.5vw, 32px);
  overflow: hidden;
  box-shadow: 0 22px 52px -12px rgba(45, 30, 20, 0.13);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (hover: hover) {
  .overlap-hero-card:hover {
    transform: translateY(-3px) scale(1.008);
    box-shadow: 0 28px 60px -12px rgba(45, 30, 20, 0.18);
  }
}

.overlap-hero-picture {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  position: relative;
}

.overlap-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 25%;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (hover: hover) {
  .overlap-hero-card:hover .overlap-hero-img {
    transform: scale(1.025);
  }
}

/* ── Full-Width Dark Features Bar ── */
.overlap-hero-features-bar {
  width: 100%;
  background-color: var(--hero-bar-bg, #16130F);
  box-sizing: border-box;
  overflow: hidden;
}

.overlap-hero-features-desktop {
  max-width: calc(1600px + (clamp(20px, 4.5vw, 64px) * 2));
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px clamp(20px, 4.5vw, 64px);
  width: 100%;
  box-sizing: border-box;
}

.overlap-hero-features-mobile-marquee {
  display: none;
  width: 100%;
  overflow: hidden;
  position: relative;
  padding: 14px 0;
  box-sizing: border-box;
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
  mask-image: linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
}

.overlap-hero-features-track {
  display: flex;
  width: max-content;
  gap: 36px;
  animation: heroFeaturesMarquee 22s linear infinite;
  will-change: transform;
}

@keyframes heroFeaturesMarquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@media (hover: hover) {
  .overlap-hero-features-bar:hover .overlap-hero-features-track {
    animation-play-state: paused;
  }
}

.overlap-hero-feature-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #FAF8F5;
  font-family: var(--font-body, 'Manrope', system-ui, sans-serif);
  font-size: clamp(0.96rem, 1.1vw, 1.12rem);
  font-weight: 600;
  letter-spacing: 0.012em;
  white-space: nowrap;
}

.overlap-hero-feature-item .feature-check {
  color: var(--gold, #B78646);
  flex-shrink: 0;
}

@media (min-width: 900px) {
  .overlap-hero {
    min-height: clamp(660px, 84vh, 800px);
  }

  .overlap-hero-features-desktop {
    display: flex;
  }

  .overlap-hero-features-mobile-marquee {
    display: none;
  }

  .overlap-hero-container {
    display: grid;
    grid-template-columns: 1fr 1.15fr;
    align-items: center;
    gap: clamp(2.5rem, 4vw, 4rem);
    padding-top: clamp(3.2rem, 5vw, 5rem);
    padding-bottom: clamp(3.2rem, 5vw, 5rem);
  }

  .overlap-hero-content-layer {
    order: 1;
    justify-content: flex-start;
  }

  .overlap-hero-content-left {
    align-items: flex-start;
    text-align: left;
    max-width: 640px;
  }

  .overlap-hero-tagline {
    font-size: clamp(2.6rem, 3.6vw, 3.9rem) !important;
    font-weight: 600 !important;
    line-height: 1.12 !important;
    letter-spacing: -0.015em !important;
    margin-bottom: 1.35rem !important;
  }

  .overlap-hero-description {
    font-size: clamp(1rem, 1.1vw, 1.14rem);
    line-height: 1.65;
    margin-bottom: 2.2rem;
    max-width: 560px;
  }

  .overlap-hero-actions {
    justify-content: flex-start;
    gap: 16px;
  }

  .overlap-hero-btn {
    height: 52px;
    min-height: 52px;
    padding: 0 32px;
    font-size: 0.95rem;
  }

  .overlap-hero-media-layer {
    order: 2;
    justify-content: center;
    width: 100%;
  }

  .overlap-hero-card {
    max-width: 820px;
    border-radius: 32px;
  }

  .overlap-hero-picture {
    aspect-ratio: 4 / 3;
  }
}

@media (max-width: 899px) {
  .overlap-hero-features-desktop {
    display: none;
  }

  .overlap-hero-features-mobile-marquee {
    display: flex;
  }
}

@media (min-width: 600px) and (max-width: 899px) {
  .overlap-hero-container {
    gap: 2rem;
    padding-top: 2rem;
    padding-bottom: 2.25rem;
  }

  .overlap-hero-tagline {
    font-size: clamp(2.5rem, 5vw, 3.2rem) !important;
    font-weight: 600 !important;
    line-height: 1.12 !important;
    letter-spacing: -0.015em !important;
    margin-bottom: 1rem !important;
  }

  .overlap-hero-description {
    font-size: 1rem;
    line-height: 1.6;
    max-width: 480px;
  }

  .overlap-hero-actions {
    flex-direction: row;
    width: auto;
    justify-content: center;
    gap: 12px;
  }

  .overlap-hero-btn {
    width: auto;
    padding: 0 24px;
  }
}

@media (max-width: 599px) {
  .overlap-hero-container {
    gap: 1.5rem;
    padding-top: 1.25rem;
    padding-bottom: 1.75rem;
    padding-left: clamp(14px, 4vw, 20px);
    padding-right: clamp(14px, 4vw, 20px);
  }

  .overlap-hero-tagline {
    font-size: clamp(2.1rem, 7.8vw, 2.65rem) !important;
    font-weight: 600 !important;
    line-height: 1.12 !important;
    letter-spacing: -0.015em !important;
    margin-bottom: 0.85rem !important;
    width: 100% !important;
  }

  .overlap-hero-description {
    font-size: 0.94rem;
    line-height: 1.55;
    color: #4D4740;
    margin-bottom: 1.35rem;
    max-width: 400px;
  }

  .overlap-hero-actions {
    flex-direction: column;
    width: 100%;
    max-width: 340px;
    margin: 0 auto;
    gap: 10px;
  }

  .overlap-hero-btn {
    width: 100%;
    height: 46px;
    min-height: 46px;
    padding: 0 20px;
    font-size: 0.88rem;
  }

  .overlap-hero-card {
    width: 100%;
    max-width: 520px;
    border-radius: 22px;
    box-shadow: 0 12px 32px -6px rgba(45, 30, 20, 0.12);
  }

  .overlap-hero-picture {
    aspect-ratio: 4 / 3;
  }

  .overlap-hero-feature-item {
    font-size: 0.9rem;
    font-weight: 600;
    gap: 8px;
  }
}

.dark-mode .overlap-hero {
  --hero-bg: #141312;
  --hero-ink: #ffffff;
  --hero-accent: var(--gold-soft, #c69e6a);
  --hero-desc: rgba(255, 255, 255, 0.78);
  --hero-bar-bg: #0d0c0a;
}

.dark-mode .overlap-hero-btn.primary-btn {
  background: #ffffff;
  border-color: #ffffff;
  color: #141312;
}

.dark-mode .overlap-hero-btn.primary-btn:hover {
  background: #ede8df;
  border-color: #ede8df;
  color: #141312;
}

.dark-mode .overlap-hero-btn.secondary-btn {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.4);
  color: #ffffff;
}

.dark-mode .overlap-hero-btn.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: #ffffff;
}

.dark-mode .overlap-hero-card {
  background-color: #1c1b19;
  box-shadow: 0 22px 52px -12px rgba(0, 0, 0, 0.55);
}

@media (hover: hover) {
  .dark-mode .overlap-hero-card:hover {
    box-shadow: 0 30px 64px -12px rgba(0, 0, 0, 0.7);
  }
}
`;

const HERO_IMAGE_URL = '/assets/banner/heroFreeWebsite.webp';
const HERO_IMAGE_600_URL = '/assets/banner/heroFreeWebsite-600.webp';
const HERO_IMAGE_400_URL = '/assets/banner/heroFreeWebsite-400.webp';
const CDN_HERO_URL = 'https://assets.weave365.com/assets/banner/heroFreeWebsite.webp';

export function OverlapHero({ navigate }) {
  const highlights = [
    'Flexible MOQ',
    'Dropshipping Available',
    'Free Shipping Across India',
    'Worldwide Shipping',
  ];

  return (
    <section className="overlap-hero" aria-label="Source Banarasi Sarees & Suits for Your Business">
      <style dangerouslySetInnerHTML={{ __html: OVERLAP_HERO_CSS }} />
      <div className="overlap-hero-container">

        {/* Left: Editorial Content Panel */}
        <div className="overlap-hero-content-layer">
          <div className="overlap-hero-content-left">
            <h1 className="overlap-hero-tagline">
              <span className="hero-line">Source <span className="hero-accent-word">Banarasi</span></span>
              <span className="hero-line">Sarees &amp; Suits</span>
              <span className="hero-line">for Your Business</span>
            </h1>

            <p className="overlap-hero-description">
              Wholesale sourcing from Banaras for retailers, boutiques and online sellers, with flexible MOQ, single-piece sourcing and fulfilment support.
            </p>

            <div className="overlap-hero-actions">
              <AppLink
                to="catalogue"
                href="/catalogue"
                className="overlap-hero-btn primary-btn"
                navigate={navigate}
                onClick={() => {
                  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
                    window.gtag('event', 'homepage_wholesale_click', {
                      event_category: 'engagement',
                      event_label: 'Shop Wholesale',
                    });
                  }
                }}
              >
                <span>Shop Wholesale</span>
                <span className="btn-arrow" aria-hidden="true">&rarr;</span>
              </AppLink>
              <AppLink
                to="resell-sarees-online"
                href="/resell-sarees-online"
                className="overlap-hero-btn secondary-btn"
                navigate={navigate}
                onClick={() => {
                  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
                    window.gtag('event', 'homepage_reseller_click', {
                      event_category: 'engagement',
                      event_label: 'Sell Without Inventory',
                    });
                  }
                }}
              >
                <span>Sell Without Inventory</span>
                <span className="btn-arrow" aria-hidden="true">&rarr;</span>
              </AppLink>
            </div>
          </div>
        </div>

        {/* Right: Media Showcase Layer */}
        <div className="overlap-hero-media-layer">
          <div className="overlap-hero-card">
            <picture className="overlap-hero-picture">
              <source
                media="(min-width: 900px)"
                type="image/webp"
                srcSet="/assets/banner/heroFreeWebsite.webp"
              />
              <source
                media="(min-width: 641px)"
                type="image/avif"
                srcSet="/assets/banner/heroFreeWebsite-600.avif"
              />
              <source
                media="(min-width: 641px)"
                type="image/webp"
                srcSet="/assets/banner/heroFreeWebsite-600.webp"
              />
              <img
                src="/assets/banner/heroFreeWebsite-600.webp"
                alt="Source Banarasi sarees and suits from Varanasi"
                className="overlap-hero-img"
                draggable="false"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width={800}
                height={598}
              />
            </picture>
          </div>
        </div>

      </div>

      {/* Bottom Features Strip */}
      <div className="overlap-hero-features-bar">
        {/* Desktop View (>= 900px) */}
        <div className="overlap-hero-features-desktop">
          {highlights.map((hl) => (
            <div key={hl} className="overlap-hero-feature-item">
              <svg
                className="feature-check"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="feature-text">{hl}</span>
            </div>
          ))}
        </div>

        {/* Mobile / Tablet View (< 900px): Continuous Smooth Marquee Ticker */}
        <div className="overlap-hero-features-mobile-marquee" aria-hidden="true">
          <div className="overlap-hero-features-track">
            {[...highlights, ...highlights].map((hl, i) => (
              <div key={`${hl}-${i}`} className="overlap-hero-feature-item">
                <svg
                  className="feature-check"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="feature-text">{hl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
