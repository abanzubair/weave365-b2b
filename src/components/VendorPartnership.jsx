/**
 * VendorPartnership Component
 * Purpose: Renders editorial sections detailing supply onboarding and weaver partner program values.
 * Guides Varanasi craft weavers and manufacturers on how to catalog and list their products on the platform.
 */
import { ChevronRight, Factory, Handshake, BarChart3, Camera, Truck, IndianRupee } from 'lucide-react';
import { storeConfig } from '../config.js';

export function VendorPartnership({ imageUrl, navigate, onCta }) {
  return (
    <section className="vendor-editorial-section" aria-labelledby="vendor-editorial-heading">
      <div className="vendor-container">
        <div className="vendor-layout">
          {/* Visual side — left (reversed from reseller) */}
          <div className="vendor-visual-stack">
            <div className="vendor-image-wrapper">
              <img src={imageUrl} alt="Artisan Craft Partnership" className="vendor-editorial-image" />
              <div className="vendor-glass-card">
                <Factory size={24} className="vendor-accent-icon" />
                <strong>200+ Vendors</strong>
                <span>Artisans & manufacturers trust our platform.</span>
              </div>
            </div>
          </div>

          {/* Content side — right */}
          <div className="vendor-main-content">
            <span className="vendor-kicker">Supply Partnership</span>
            <h1 id="vendor-editorial-heading" className="vendor-title">
              Your <span>Craft</span>,<br />
              Our <span>Platform</span>.
            </h1>

            <p className="vendor-lead">
              We connect India's finest artisans and manufacturers with a thriving wholesale buyer network. Zero listing fees. Zero hassle. Maximum reach.
            </p>

            <div className="vendor-benefits-list">
              <div className="vendor-benefit-item">
                <span className="vendor-benefit-num">01</span>
                <div>
                  <h2>Instant Market Access</h2>
                  <p>Reach 500+ active wholesale buyers from day one.</p>
                </div>
              </div>
              <div className="vendor-benefit-item">
                <span className="vendor-benefit-num">02</span>
                <div>
                  <h2>Zero Cost Listing</h2>
                  <p>No upfront fees. We earn only when you earn.</p>
                </div>
              </div>
              <div className="vendor-benefit-item">
                <span className="vendor-benefit-num">03</span>
                <div>
                  <h2>Hassle-Free Listing</h2>
                  <p>Send your product photos — we list, market, and sell for you.</p>
                </div>
              </div>
            </div>

            <button
              className="vendor-cta"
              onClick={onCta || (() => navigate('vendor-partnership'))}
            >
              <div className="vendor-cta-content">
                <span className="vendor-cta-label">List Your Products</span>
                <span className="vendor-cta-subtext">Start selling to our buyer network</span>
              </div>
              <div className="vendor-cta-action">
                <ChevronRight size={28} className="vendor-arrow-icon" />
              </div>
            </button>
          </div>
        </div>

        {/* Process flow */}
        <div className="vendor-process-flow">
          <div className="vendor-process-header">
            <h2>The Path to Partnership</h2>
          </div>
          <div className="vendor-process-items">
            <div className="vendor-process-item">
              <div className="vendor-process-icon"><Handshake size={24} /></div>
              <span>Contact Us</span>
            </div>
            <div className="vendor-process-arrow"><ChevronRight size={24} /></div>
            <div className="vendor-process-item">
              <div className="vendor-process-icon"><Camera size={24} /></div>
              <span>We Catalogue</span>
            </div>
            <div className="vendor-process-arrow"><ChevronRight size={24} /></div>
            <div className="vendor-process-item">
              <div className="vendor-process-icon"><IndianRupee size={24} /></div>
              <span>You Earn</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
