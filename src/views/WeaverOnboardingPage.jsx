/**
 * @file WeaverOnboardingPage.jsx
 * @description Educational program and marketing view introducing the Weaver Partnership and Onboarding Program.
 * Outlines the 6-step registration, certification, professional cataloging, and order fulfillment process.
 * Displays premium features, logistics/warehouse explanations, and partner application calls-to-action
 * designed to onboard master weavers, manufacturers, and heritage artisans in Varanasi.
 * 
 * @module views/WeaverOnboardingPage
 * @param {Object} props
 * @param {Function} props.openAuth - Trigger callback to display the registration modal / portal
 */

import { ArrowRight, Globe, Shield, Handshake, ShieldCheck, AlertTriangle } from 'lucide-react';
import { assetSrc } from '../utils/assetSrc.js';
const artisanImage = 'https://assets.weave365.com/assets/banner/weaver-onboard-hero.jpeg';
import warehouseImage from '../../assets/banarasi_loom_detail.webp';

export function WeaverOnboardingPage({ openAuth }) {
  return (
    <div className="weaver-page-container">
      {/* A. Hero Section */}
      <section className="weaver-hero-section">
        <div className="weaver-hero-split">
          <div className="hero-left">
            <span className="hero-category-label">Wholesale & Weaver Onboarding</span>
            <h1 className="hero-title">Empower Your Craft: Onboard as a Certified Weaver Partner</h1>
            <p className="hero-description">
              Showcase your Banarasi sarees, suits, and fabrics directly to global boutiques and retail networks. Partner with Weave 365 to expand your reach with zero listing risk.
            </p>
            <div className="hero-actions">
              <button type="button" className="gold-button" onClick={openAuth}>
                Register as Weaver <ArrowRight size={18} />
              </button>
            </div>
            <div className="hero-trust-indicators">
              <div className="indicator-item">
                <Globe size={16} strokeWidth={2} className="indicator-icon" />
                <span>Global Boutique Reach</span>
              </div>
              <div className="indicator-item">
                <Shield size={16} strokeWidth={2} className="indicator-icon" />
                <span>Zero Listing Risk</span>
              </div>
              <div className="indicator-item">
                <Handshake size={16} strokeWidth={2} className="indicator-icon" />
                <span>Fair Trade Pricing</span>
              </div>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-image-single">
              <img 
                src={assetSrc(artisanImage)}
                alt="Artisan weaving Varanasi silk" 
                className="hero-main-image"
                width={600}
                height={600}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="weaver-notice-section">
        <div className="notice-card">
          <div className="notice-header">
            <AlertTriangle size={20} className="notice-icon" />
            <strong>Important Notice for Varanasi Weavers</strong>
          </div>
          <p className="notice-desc">
            To start listing your handloom products on our B2B catalog, you must first register through our verification portal. Our vendor relations team will review your workshop and artisan credentials.
          </p>
          <button type="button" className="notice-cta-button" onClick={openAuth}>
            Register Now
          </button>
        </div>
      </section>

      {/* C. Step-by-step Instructions */}
      <section id="how-it-works" className="weaver-steps-section">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Your journey to a successful wholesale partnership with Weave 365, in 6 simple steps.</p>
        </div>
        
        <div className="steps-grid">
          <div className="step-item clickable-step" onClick={openAuth}>
            <span className="step-num">01</span>
            <h3>Artisan Registration <ArrowRight size={16} className="step-inline-arrow" /></h3>
            <p>Go to our registration page and fill out the onboarding form to get verified.</p>
          </div>
          <div className="step-item">
            <span className="step-num">02</span>
            <h3>WhatsApp Verification</h3>
            <p>Verification is conducted on the product images you share with our team on WhatsApp once your registration form is approved.</p>
          </div>
          <div className="step-item">
            <span className="step-num">03</span>
            <h3>Professional Curation</h3>
            <p>We catalog your premium collections on our storefront at no cost to you using the product images you share.</p>
          </div>
          <div className="step-item">
            <span className="step-num">04</span>
            <h3>Live Placement</h3>
            <p>Your collections are listed directly on our B2B wholesale storefront.</p>
          </div>
          <div className="step-item">
            <span className="step-num">05</span>
            <h3>Direct Boutique Orders</h3>
            <p>Receive bulk or single-piece orders directly from verified boutique owners.</p>
          </div>
          <div className="step-item">
            <span className="step-num">06</span>
            <h3>Secure Payouts</h3>
            <p>Get timely direct payouts for every shipped order with transparent margins.</p>
          </div>
        </div>
      </section>

      {/* D. Feature Benefits Section */}
      <section className="weaver-benefits-section">
        <div className="benefits-container">
          <div className="benefits-header">
            <h2>Why Partner With Us?</h2>
            <div className="benefits-line"></div>
          </div>
          
          <div className="benefits-asymmetric-grid">
            {/* Column 1: Tall Visual Frame */}
            <div className="benefits-visual-col">
              <div className="visual-image-card">
                <img 
                  src={assetSrc(warehouseImage)}
                  alt="Varanasi B2B Warehouse Logistics" 
                  className="visual-card-img"
                  width={600}
                  height={400}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
            
            {/* Column 2: Operational Pillars */}
            <div className="benefits-info-col">
              <div className="info-block">
                <span className="info-idx">01</span>
                <h3>Direct Global Sourcing</h3>
                <p>Sell directly to verified boutique owners worldwide. We bypass intermediate brokers and local agents, returning maximum profit margins to your workshop.</p>
              </div>
              <div className="info-block">
                <span className="info-idx">02</span>
                <h3>Zero Listing Risk</h3>
                <p>We build and host your B2B digital catalog at zero setup cost or hidden listing charges. We showcase your collections directly to buyers based on your set factory rates.</p>
              </div>
            </div>

            {/* Column 3: Payouts & Testimonial */}
            <div className="benefits-social-col">
              <div className="info-block">
                <span className="info-idx">03</span>
                <h3>Secure Bank Payouts</h3>
                <p>Receive secure, direct bank transfers as soon as shipment delivery is verified. We ensure fair-trade margins and transparent payout terms for every order.</p>
              </div>
              
              <div className="benefits-quote-card">
                <span className="quote-mark">“</span>
                <p className="quote-text">
                  Direct B2B boutique orders have allowed our workshop to scale production and keep our heritage looms running year-round without local broker fees.
                </p>
                <span className="quote-author">— Master Weaver, Varanasi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* E. Social Sharing Explanation */}
      <section className="weaver-social-section">
        <div className="social-content">
          <h2>Expand Your Marketplace</h2>
          <p>
            We coordinate logistics, cataloging, and digital distribution so you can focus on the loom. We distribute your products to our global buyer networks across:
          </p>
          <div className="social-tags">
            <span className="social-tag">Wholesale Storefront</span>
            <span className="social-tag">Reseller Portals</span>
            <span className="social-tag">WhatsApp Catalogs</span>
            <span className="social-tag">Boutique Networks</span>
          </div>
        </div>
      </section>

      {/* F. Final CTA Section */}
      <section className="weaver-final-cta">
        <h2>Ready to showcase your craft?</h2>
        <p>Join our network of verified weavers and heritage artisans today.</p>
        <button type="button" className="gold-button large" onClick={openAuth}>
          Register as Weaver
        </button>
      </section>
    </div>
  );
}
