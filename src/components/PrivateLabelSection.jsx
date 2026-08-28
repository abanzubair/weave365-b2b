import { ArrowRight, Image as ImageIcon, Check } from 'lucide-react';
import { AppLink } from './AppLink.jsx';
import '../styles/privateLabelSection.css';

export function PrivateLabelSection({ imageUrl, navigate }) {
  const benefits = [
    'Custom Woven Collections',
    'Your Own Branding',
    'Custom Fabric & Design',
    'For Luxury & Bridal Labels',
    'Custom Production',
    'Custom Packaging',
  ];

  const trustPoints = [
    'Custom Weaving',
    'Private Label Branding',
    'Custom Designs',
    'Custom Production',
  ];

  return (
    <section id="private-label" className="private-label-section" aria-labelledby="private-label-heading">
      <div className="private-label-layout">

        {/* Left Column: Editorial Private Label Content */}
        <div className="private-label-content-side">
          <div className="private-label-content-wrapper">

            <span className="private-label-eyebrow">Your Label. Your Collection.</span>

            <h2 id="private-label-heading" className="private-label-title">
              Create Premium Banarasi Collections,<br />
              Made for Your Brand.
            </h2>

            <p className="private-label-lead">
              Create premium Banarasi sarees and suits for your own label, boutique, bridal collection, luxury brand or pop-up store. Choose fabrics, weaves, colours, motifs and designs based on your requirements. Develop custom-woven collections with your own branding and packaging.
            </p>

            {/* Benefits Checklist Grid (2x3) */}
            <div className="private-label-benefits-grid">
              {benefits.map((item) => (
                <div key={item} className="benefit-item">
                  <span className="benefit-check-badge">
                    <Check size={11} strokeWidth={2.6} />
                  </span>
                  <span className="benefit-text">{item}</span>
                </div>
              ))}
            </div>

            {/* Action Links */}
            <div className="private-label-actions">
              <AppLink
                to="white-label"
                href="/private-label"
                className="private-label-cta-link primary-cta"
                navigate={navigate}
                aria-label="Start your private label Banarasi collection"
                style={{ textDecoration: 'none' }}
              >
                <span className="link-label">Start Your Private Label</span>
                <ArrowRight size={18} className="link-arrow" />
              </AppLink>

              <AppLink
                to="custom-woven"
                href="/custom-woven"
                className="private-label-cta-link secondary-cta"
                navigate={navigate}
                aria-label="Create custom woven Banarasi sarees"
                style={{ textDecoration: 'none' }}
              >
                <span className="link-label">Create Custom Woven</span>
                <ArrowRight size={18} className="link-arrow" />
              </AppLink>
            </div>

            {/* Trust Row */}
            <div className="private-label-trust-row" aria-label="Key Service Highlights">
              {trustPoints.map((item, idx) => (
                <span key={item} className="trust-row-item">
                  {item}
                  {idx < trustPoints.length - 1 && <span className="trust-row-divider" aria-hidden="true">|</span>}
                </span>
              ))}
            </div>

          </div>
        </div>

        {/* Right Column: Visual Showcase Frame */}
        <div className="private-label-visual-side">
          <div className="private-label-gallery-container">
            <div className="private-label-image-wrapper">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Custom woven Banarasi collections and private label manufacturing"
                  className="private-label-image"
                  loading="lazy"
                  decoding="async"
                  width={700}
                  height={525}
                />
              ) : (
                <div className="private-label-image-placeholder">
                  <ImageIcon size={44} strokeWidth={1.2} className="placeholder-icon" />
                  <span className="placeholder-title">Visual Showcase</span>
                  <span className="placeholder-subtext">Private Label & Custom Weaving Atelier</span>
                </div>
              )}
            </div>
            <span className="private-label-caption">Fig. 04 // Private Label & Custom Weaving Atelier</span>
          </div>
        </div>

      </div>
    </section>
  );
}
