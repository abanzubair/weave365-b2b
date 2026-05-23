/**
 * @file ResellerGrowthPage.jsx
 * @description Educational program and marketing view introducing the certified B2B Reseller Program.
 * Outlines the 6-step registration, certification, margin configuration, and social sharing roadmap.
 * Displays premium feature benefit grids, zero-inventory risk explanations, and registration calls-to-action
 * designed to onboard new home resellers and boutique owners.
 * 
 * @module views/ResellerGrowthPage
 * @param {Object} props
 * @param {Function} props.openAuth - Trigger callback to display the B2B registration/authentication modal
 */

import { ArrowRight, BadgeCheck, Share2, PackagePlus, Users, Store, Zap, ShieldCheck } from 'lucide-react';
import { assetSrc } from '../utils/assetSrc.js';
import resellerImage from '../../assets/reseller_premium_catalog_display.webp';

export function ResellerGrowthPage({ openAuth }) {
  return (
    <div className="reseller-page-container">
      {/* A. Hero Section */}
      <section className="reseller-hero-section">
        <div className="reseller-hero-content">
          <span className="hero-kicker">Weave 365 Wholesale & Reseller Program</span>
          <h1 className="hero-title">Grow Your Business as a Certified Partner</h1>
          <p className="hero-description">
            Set your own selling price, share premium Banarasi sarees, suits, fabrics, etc. with your network, and build your own customer base with zero inventory risk or custom bulk options.
          </p>
          <div className="hero-actions">
            <button className="gold-button" onClick={openAuth}>
              Register as Partner <ArrowRight size={18} />
            </button>
            <a href="#how-it-works" className="secondary-button">
              Learn How It Works
            </a>
          </div>
        </div>
      </section>

      {/* B. Important Notice Section */}
      <section className="reseller-notice-section">
        <div className="notice-card">
          <ShieldCheck size={28} className="notice-icon" />
          <div className="notice-text">
            <strong>Important Notice for Partners</strong>
            <p>
              To become a certified partner and unlock custom wholesale pricing, you must first register as a partner. This feature will be enabled only after registration and approval by our team.
            </p>
          </div>
          <button className="notice-cta-button" onClick={openAuth}>
            Register Now
          </button>
        </div>
      </section>

      {/* C. Step-by-step Instructions */}
      <section id="how-it-works" className="reseller-steps-section">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Your journey to a successful wholesale or reseller business in 6 simple steps</p>
        </div>
        
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon"><BadgeCheck size={24} /></div>
            <h3>Register</h3>
            <p>Sign up and register as a partner on our platform.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon"><ShieldCheck size={24} /></div>
            <h3>Get Certified</h3>
            <p>Our team will review and approve your wholesale or reseller account.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon"><Store size={24} /></div>
            <h3>Browse Catalog</h3>
            <p>Explore our Banarasi Sarees, suits, fabrics, etc. collections.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-icon"><PackagePlus size={24} /></div>
            <h3>Add Margin</h3>
            <p>Set your own custom selling price and margin.</p>
          </div>
          <div className="step-card">
            <div className="step-number">5</div>
            <div className="step-icon"><Share2 size={24} /></div>
            <h3>Share Easily</h3>
            <p>Share directly on WhatsApp, Instagram, and Facebook.</p>
          </div>
          <div className="step-card">
            <div className="step-number">6</div>
            <div className="step-icon"><Zap size={24} /></div>
            <h3>Grow Fast</h3>
            <p>Receive orders from your customers and build trust.</p>
          </div>
        </div>
      </section>

      {/* D. Feature Benefits Section */}
      <section className="reseller-benefits-section">
        <div className="benefits-container">
          <div className="benefits-image-wrapper">
            <img 
              src={assetSrc(resellerImage)}
              alt="Reseller Business" 
              className="benefits-image"
              width={900}
              height={600}
              loading="lazy"
              decoding="async"
            />
            <div className="benefits-glass-card">
              <Users size={24} className="gold-icon" />
              <strong>Empower Your Network</strong>
              <span>Turn your network into a thriving saree business.</span>
            </div>
          </div>
          <div className="benefits-content">
            <h2>Why Partner With Us?</h2>
            <ul className="benefits-list">
              <li>
                <BadgeCheck className="benefit-list-icon" />
                <div>
                  <strong>Zero Inventory Risk</strong>
                  <span>Sell without managing any stock or warehouse.</span>
                </div>
              </li>
              <li>
                <BadgeCheck className="benefit-list-icon" />
                <div>
                  <strong>Control Your Margins</strong>
                  <span>You choose your margin and set your own prices.</span>
                </div>
              </li>
              <li>
                <BadgeCheck className="benefit-list-icon" />
                <div>
                  <strong>Seamless Sharing</strong>
                  <span>Share products beautifully on social platforms.</span>
                </div>
              </li>
              <li>
                <BadgeCheck className="benefit-list-icon" />
                <div>
                  <strong>Start Immediately</strong>
                  <span>Begin selling directly to your existing network.</span>
                </div>
              </li>
              <li>
                <BadgeCheck className="benefit-list-icon" />
                <div>
                  <strong>Build Trust</strong>
                  <span>Deliver premium quality as a certified B2B partner.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* E. Social Sharing Explanation */}
      <section className="reseller-social-section">
        <div className="social-content">
          <h2>Share Anywhere, Anytime</h2>
          <p>
            Our platform is built for modern B2B partners. Sourcing premium Banarasi handlooms has never been easier. Share product collections instantly with your customers across:
          </p>
          <div className="social-tags">
            <span className="social-tag">WhatsApp</span>
            <span className="social-tag">Instagram</span>
            <span className="social-tag">Facebook</span>
            <span className="social-tag">Telegram</span>
          </div>
        </div>
      </section>

      {/* F. Final CTA Section */}
      <section className="reseller-final-cta">
        <h2>Ready to build your business?</h2>
        <p>Join our network of successful B2B partners today.</p>
        <button className="gold-button large" onClick={openAuth}>
          Register as Partner
        </button>
      </section>
    </div>
  );
}
