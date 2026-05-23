import { CheckCircle2, ChevronRight, Share2, Package, TrendingUp, ShieldCheck } from 'lucide-react';
import { storeConfig } from '../config.js';

export function ResellerGrowth({ imageUrl, navigate }) {
  return (
    <section className="reseller-editorial-section" aria-labelledby="reseller-editorial-heading">
      <div className="editorial-container">
        <div className="editorial-layout">
          <div className="editorial-main-content">
            <span className="editorial-kicker">Wholesale & Reseller Partnerships</span>
            <h2 id="reseller-editorial-heading" className="editorial-title">
              Crafting <span>Success</span><br />
              Beyond the <span>Weave</span>.
            </h2>
            
            <p className="editorial-lead">
              A partnership built on heritage, quality, and mutual growth. We provide the finest Banarasi collections, you deliver them to your market.
            </p>

            <div className="editorial-benefits-list">
              <div className="benefit-item">
                <span className="benefit-num">01</span>
                <div>
                  <h3>Curated Collections</h3>
                  <p>Banarasi sarees, suits, fabrics, etc. that resonate with global trends.</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-num">02</span>
                <div>
                  <h3>Seamless Logistics</h3>
                  <p>End-to-end support for shipping and quality assurance, India & Global.</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-num">03</span>
                <div>
                  <h3>Growth Toolkit</h3>
                  <p>Your own white-label storefront & priority access to new arrivals.</p>
                </div>
              </div>
            </div>

            <button 
              className="growth-cta" 
              onClick={() => {
                navigate('reseller-growth');
              }}
            >
              <div className="growth-content">
                <span className="growth-label">Grow with us</span>
                <span className="growth-subtext">Start your wholesale journey today</span>
              </div>
              <div className="growth-action">
                <ChevronRight size={28} className="arrow-icon" />
              </div>
            </button>
          </div>

          <div className="editorial-visual-stack">
            <div className="reseller-image-wrapper">
              <img src={imageUrl} alt="Premium Catalog" className="editorial-image" />
              <div className="editorial-glass-card">
                <ShieldCheck size={24} className="gold-icon" />
                <strong>98% Retention</strong>
                <span>Our B2B partners grow with us year after year.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="editorial-process-flow">
          <div className="process-header">
            <h3>The Path to Growth</h3>
          </div>
          <div className="process-items">
            <div className="process-item">
              <div className="process-icon"><Package size={24} /></div>
              <span>Select Catalogue</span>
            </div>
            <div className="process-arrow"><ChevronRight size={24} /></div>
            <div className="process-item">
              <div className="process-icon"><Share2 size={24} /></div>
              <span>Connect on WhatsApp</span>
            </div>
            <div className="process-arrow"><ChevronRight size={24} /></div>
            <div className="process-item">
              <div className="process-icon"><TrendingUp size={24} /></div>
              <span>Scale Your Business</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
