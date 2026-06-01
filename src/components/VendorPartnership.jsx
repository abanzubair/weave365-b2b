/**
 * VendorPartnership Component
 * Purpose: Renders editorial sections detailing supply onboarding and weaver partner program values.
 * Guides Varanasi craft weavers and manufacturers on how to catalog and list their products on the platform.
 */
import { ChevronRight, Factory, Handshake, BarChart3, Camera, Truck, IndianRupee } from 'lucide-react';
import { AppLink } from './AppLink.jsx';
import { storeConfig } from '../config.js';

export function VendorPartnership({ imageUrl, navigate, onCta }) {
  return (
    <section className="vendor-editorial-section" aria-labelledby="vendor-editorial-heading">
      <div className="vendor-container">
        <div className="vendor-layout">
          {/* Visual side — left (reversed from reseller) */}
          <div className="vendor-visual-stack">
            <div className="vendor-image-wrapper">
              <img src={imageUrl} alt="Weaver Craft Partnership — Banarasi loom artisan onboarding" className="vendor-editorial-image" />
              <div className="vendor-glass-card">
                <Factory size={24} className="vendor-accent-icon" />
                <strong>200+ Verified Weavers</strong>
                <span>Top manufacturers & loom owners trust our platform.</span>
              </div>
            </div>
          </div>

          {/* Content side — right */}
          <div className="vendor-main-content">
            <span className="vendor-kicker">Weaver Onboarding</span>
            <h1 id="vendor-editorial-heading" className="vendor-title">
              Your <span>Craft</span>.<br />
              Our <span>Platform</span>.<br />
              Global <span>Scale</span>.
            </h1>

            <p className="vendor-lead">
              We connect Banarasi master weavers and ethnic wear manufacturers directly with a global B2B wholesale buyer network. Zero upfront fees. Zero hassle. Maximum market reach.
            </p>

            <div className="vendor-benefits-list">
              <div className="vendor-benefit-item">
                <span className="vendor-benefit-num">01</span>
                <div>
                  <h2>Instant Global Access</h2>
                  <p>Connect with verified wholesale buyers from day one.</p>
                </div>
              </div>
              <div className="vendor-benefit-item">
                <span className="vendor-benefit-num">02</span>
                <div>
                  <h2>Risk-Free Onboarding</h2>
                  <p>No registration or upfront fees. We only win when you win.</p>
                </div>
              </div>
              <div className="vendor-benefit-item">
                <span className="vendor-benefit-num">03</span>
                <div>
                  <h2>Complete Catalog Management</h2>
                  <p>Just upload your product photos, we handle listing, SEO, and marketing for you.</p>
                </div>
              </div>
            </div>

            <AppLink
              to="weaver-registration"
              className="vendor-cta"
              style={{ textDecoration: 'none' }}
            >
              <div className="vendor-cta-content">
                <span className="vendor-cta-label">Apply as a Weaver</span>
                <span className="vendor-cta-subtext">Start selling to our global wholesale network</span>
              </div>
              <div className="vendor-cta-action">
                <ChevronRight size={28} className="vendor-arrow-icon" />
              </div>
            </AppLink>
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
