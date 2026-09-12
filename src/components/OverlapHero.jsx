import { AppLink } from './AppLink.jsx';
import { getOptimizedImageUrl, getImageSrcSet, getOriginalImageUrl } from '../utils/imageOptimizer.js';
const OVERLAP_HERO_CSS = `:root{--hero-bg:#faf8f5;--hero-ink:#171513;--hero-desc:#473f38;--hero-gold-dust:rgba(183,134,70,0.14);--hero-gold-dust-hover:rgba(183,134,70,0.26);--hero-gold-border:rgba(183,134,70,0.55);--hero-gold-border-hover:rgba(183,134,70,0.85);--hero-gold-text:#634315;--hero-secondary-bg:rgba(183,134,70,0.04);--hero-secondary-border:rgba(183,134,70,0.38);--hero-secondary-text:#5a4128;}.overlap-hero{position:relative;width:100%;background-color:var(--hero-bg);overflow:hidden;box-sizing:border-box;}.overlap-hero-container{position:relative;width:100%;--hero-padding-x:clamp(20px,4vw,64px);--hero-padding-y:clamp(2rem,3.5vw,3.5rem);max-width:calc(1600px+(var(--hero-padding-x) * 2));margin:0 auto;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:var(--hero-padding-y) var(--hero-padding-x);box-sizing:border-box;gap:clamp(1.5rem,3vw,2.5rem);}.overlap-hero-content-layer{position:relative;width:100%;display:flex;justify-content:center;align-items:center;box-sizing:border-box;order:2;}.overlap-hero-content-left{display:flex;flex-direction:column;align-items:center;text-align:center;max-width:720px;width:100%;}.overlap-hero-tagline{font-family:var(--font-heading,'Cormorant Garamond',Georgia,serif);font-size:clamp(1.5rem,4vw,2.1rem);font-weight:600;color:var(--hero-ink);line-height:1.2;letter-spacing:-0.015em;margin:0 0 clamp(0.75rem,1.5vw,1.2rem) 0;text-wrap:balance;}.overlap-hero-tagline .hero-title-line{display:inline;}.overlap-hero-description{font-family:var(--font-body,'Manrope',sans-serif);font-size:clamp(0.92rem,2.2vw,1.06rem);font-weight:400;color:var(--hero-desc);line-height:1.6;margin:0 0 clamp(1rem,2vw,1.4rem) 0;max-width:620px;text-wrap:pretty;}.overlap-hero-highlights{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:clamp(6px,1.5vw,10px);margin:0 0 clamp(1.25rem,2.5vw,2rem) 0;font-family:var(--font-body,'Manrope',sans-serif);font-size:clamp(0.78rem,1.8vw,0.88rem);font-weight:500;color:#5c4a38;}.overlap-hero-highlights .highlight-item{display:inline-flex;align-items:center;gap:clamp(6px,1.5vw,10px);}.overlap-hero-highlights .highlight-pipe{color:var(--hero-gold-border);font-weight:300;opacity:0.85;}.overlap-hero-actions{display:flex;flex-direction:row;flex-wrap:nowrap;gap:clamp(8px,2vw,12px);width:100%;max-width:440px;justify-content:center;align-items:center;}.overlap-hero-btn{display:inline-flex;align-items:center;justify-content:center;flex:1 1 0;min-width:0;gap:clamp(4px,1.5vw,8px);height:48px;min-height:48px;padding:0 clamp(8px,2.5vw,20px);border-radius:6px;font-family:var(--font-body,'Manrope',sans-serif);font-size:clamp(0.78rem,2.2vw,0.92rem);font-weight:600;letter-spacing:0.01em;text-decoration:none;white-space:nowrap;box-sizing:border-box;touch-action:manipulation;transition:all 0.24s cubic-bezier(0.16,1,0.3,1);}.overlap-hero-btn .btn-arrow{display:inline-block;font-size:1.15em;line-height:1;flex-shrink:0;transition:transform 0.2s ease;}.overlap-hero-btn:hover .btn-arrow{transform:translateX(4px);}.overlap-hero-btn.primary-btn{background:var(--hero-gold-dust);border:1.5px solid var(--hero-gold-border);color:var(--hero-gold-text);box-shadow:0 2px 10px rgba(183,134,70,0.12);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}.overlap-hero-btn.primary-btn:hover{background:var(--hero-gold-dust-hover);border-color:var(--hero-gold-border-hover);color:#4a300d;box-shadow:0 6px 20px rgba(183,134,70,0.22);transform:translateY(-2px);}.overlap-hero-btn.secondary-btn{background:var(--hero-secondary-bg);border:1.5px solid var(--hero-secondary-border);color:var(--hero-secondary-text);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}.overlap-hero-btn.secondary-btn:hover{background:var(--hero-gold-dust);border-color:var(--hero-gold-border);color:var(--hero-gold-text);box-shadow:0 4px 14px rgba(183,134,70,0.12);transform:translateY(-2px);}.overlap-hero-btn:active{transform:scale(0.98);}.overlap-hero-btn:focus-visible{outline:2px solid var(--gold,#b78646);outline-offset:3px;}.overlap-hero-media-layer{position:relative;width:100%;display:flex;justify-content:center;align-items:center;box-sizing:border-box;order:1;}.overlap-hero-card{width:100%;max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px -10px rgba(60,40,20,0.12),0 0 0 1px rgba(183,134,70,0.14);transition:transform 0.3s cubic-bezier(0.16,1,0.3,1),box-shadow 0.3s cubic-bezier(0.16,1,0.3,1);}.overlap-hero-card:hover{transform:translateY(-2px);box-shadow:0 22px 50px -10px rgba(60,40,20,0.16),0 0 0 1px rgba(183,134,70,0.22);}.overlap-hero-picture{display:block;width:100%;aspect-ratio:4 / 3;overflow:hidden;position:relative;}.overlap-hero-img{width:100%;height:100%;object-fit:cover;object-position:center 25%;display:block;user-select:none;-webkit-user-drag:none;}@media (min-width:768px){.overlap-hero{display:flex;align-items:center;padding-top:1rem;padding-bottom:1.5rem;}.overlap-hero-container{flex-direction:row;justify-content:space-between;align-items:center;padding-top:clamp(2rem,3.5vw,3.5rem);padding-bottom:clamp(2rem,3.5vw,3.5rem);gap:clamp(1.75rem,3.2vw,3.5rem);}.overlap-hero-content-layer{flex:1.15 1 56%;justify-content:flex-start;order:1;}.overlap-hero-content-left{align-items:flex-start;text-align:left;max-width:760px;}.overlap-hero-tagline{font-size:clamp(1.5rem,1.85vw,2.25rem);line-height:1.2;letter-spacing:-0.015em;margin-bottom:1.15rem;}.overlap-hero-tagline .hero-title-line{display:block;white-space:normal;}.overlap-hero-description{font-size:clamp(0.95rem,1.05vw,1.08rem);line-height:1.6;margin-bottom:1.25rem;max-width:620px;}.overlap-hero-highlights{justify-content:flex-start;font-size:clamp(0.78rem,0.82vw,0.88rem);margin-bottom:1.75rem;gap:10px;}.overlap-hero-actions{justify-content:flex-start;max-width:none;gap:14px;}.overlap-hero-btn{flex:0 0 auto;height:48px;min-height:48px;padding:0 28px;font-size:0.9rem;gap:8px;}.overlap-hero-media-layer{flex:0.85 1 44%;justify-content:flex-end;order:2;}.overlap-hero-card{max-width:600px;border-radius:16px;}.overlap-hero-picture{aspect-ratio:4 / 3;}}@media (min-width:1440px){.overlap-hero-container{--hero-padding-x:clamp(32px,4.5vw,64px);}.overlap-hero-tagline{font-size:clamp(1.85rem,2vw,2.35rem);}.overlap-hero-card{max-width:640px;}}.dark-mode .overlap-hero{--hero-bg:#141312;--hero-ink:#ffffff;--hero-desc:rgba(255,255,255,0.78);--hero-gold-dust:rgba(197,160,89,0.18);--hero-gold-dust-hover:rgba(197,160,89,0.3);--hero-gold-border:rgba(197,160,89,0.65);--hero-gold-border-hover:rgba(197,160,89,0.95);--hero-gold-text:#ebd5ad;--hero-secondary-bg:rgba(255,255,255,0.05);--hero-secondary-border:rgba(197,160,89,0.4);--hero-secondary-text:rgba(255,255,255,0.88);}.dark-mode .overlap-hero-card{background-color:#1c1b19;box-shadow:0 16px 40px -10px rgba(0,0,0,0.5),0 0 0 1px rgba(197,160,89,0.25);}`;

const HERO_IMAGE_URL = '/assets/banner/heroFreeWebsite.webp';
const HERO_IMAGE_600_URL = '/assets/banner/heroFreeWebsite-600.webp';
const HERO_IMAGE_400_URL = '/assets/banner/heroFreeWebsite-400.webp';
const CDN_HERO_URL = 'https://assets.weave365.com/assets/banner/heroFreeWebsite.webp';

export function OverlapHero({ navigate }) {
  const heroImage = HERO_IMAGE_600_URL;

  const highlights = [
    'Flexible MOQ',
    'Dropshipping Available',
    'Free Shipping Across India',
    'Worldwide Shipping',
  ];

  return (
    <section className="overlap-hero" aria-label="Source Banarasi Sarees & Suits from Varanasi">
      <style dangerouslySetInnerHTML={{ __html: OVERLAP_HERO_CSS }} />
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
              <source
                media="(max-width: 640px)"
                srcSet={HERO_IMAGE_400_URL}
                type="image/webp"
              />
              <img
                src={HERO_IMAGE_600_URL}
                alt="Source Banarasi sarees and suits from Varanasi"
                className="overlap-hero-img"
                draggable="false"
                fetchPriority="high"
                decoding="sync"
                width={600}
                height={450}
                onError={(e) => {
                  const fallback = getOptimizedImageUrl(CDN_HERO_URL, 'listing');
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
              />
            </picture>
          </div>
        </div>

      </div>
    </section>
  );
}

