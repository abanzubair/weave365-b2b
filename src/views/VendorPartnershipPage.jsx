import { ArrowRight, Handshake, Camera, ShieldCheck, BarChart3, Factory, Users, Package, Truck, IndianRupee, BadgeCheck, Heart, Globe, Headphones, MessageCircle } from 'lucide-react';
import { storeConfig } from '../config.js';
import artisanImage from '../../assets/artisan_at_loom_premium.png';
import { assetSrc } from '../utils/assetSrc.js';

export function VendorPartnershipPage() {
  const whatsappLink = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(
    'Hi, I am interested in listing my products on Weave365. I would like to discuss the vendor partnership program.'
  )}`;

  return (
    <div className="vendor-page-container">
      {/* A. Hero Section */}
      <section className="vendor-hero-section">
        <div className="vendor-hero-content">
          <span className="vendor-hero-kicker">Weave365 Supply Partnership</span>
          <h1 className="vendor-hero-title">Your Craft Deserves a Global Stage</h1>
          <p className="vendor-hero-description">
            List your products on Weave365 and reach hundreds of active wholesale buyers — with zero listing fees, complete sales management, and end-to-end support from our team.
          </p>
          <div className="vendor-hero-actions">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="vendor-hero-btn-primary">
              <MessageCircle size={18} />
              Contact on WhatsApp
            </a>
            <a href="#vendor-how-it-works" className="vendor-hero-btn-secondary">
              Learn How It Works <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* B. Trust Notice */}
      <section className="vendor-notice-section">
        <div className="vendor-notice-card">
          <ShieldCheck size={28} className="vendor-notice-icon" />
          <div className="vendor-notice-text">
            <strong>Transparency First</strong>
            <p>
              We believe in fair, transparent partnerships. Every vendor gets timely payments, a dedicated relationship manager, and complete peace of mind. No hidden costs, no surprises.
            </p>
          </div>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="vendor-notice-cta-button">
            Get Started
          </a>
        </div>
      </section>

      {/* C. How It Works — Step-by-step */}
      <section id="vendor-how-it-works" className="vendor-steps-section">
        <div className="vendor-section-header">
          <h2>How It Works</h2>
          <p>From first contact to your first sale — in 5 straightforward steps</p>
        </div>

        <div className="vendor-steps-grid">
          <div className="vendor-step-card">
            <div className="vendor-step-number">1</div>
            <div className="vendor-step-icon"><MessageCircle size={24} /></div>
            <h3>Reach Out</h3>
            <p>Contact us via WhatsApp or fill the enquiry form. Tell us about your products.</p>
          </div>
          <div className="vendor-step-card">
            <div className="vendor-step-number">2</div>
            <div className="vendor-step-icon"><Package size={24} /></div>
            <h3>Send Samples</h3>
            <p>Ship a few product samples to our team for quality review.</p>
          </div>
          <div className="vendor-step-card">
            <div className="vendor-step-number">3</div>
            <div className="vendor-step-icon"><Camera size={24} /></div>
            <h3>Send Product Photos</h3>
            <p>Share high-quality images of your products — we handle the rest.</p>
          </div>
          <div className="vendor-step-card">
            <div className="vendor-step-number">4</div>
            <div className="vendor-step-icon"><Globe size={24} /></div>
            <h3>Products Go Live</h3>
            <p>Your products appear on our platform, reaching 500+ active wholesale buyers.</p>
          </div>
          <div className="vendor-step-card">
            <div className="vendor-step-number">5</div>
            <div className="vendor-step-icon"><IndianRupee size={24} /></div>
            <h3>You Get Paid</h3>
            <p>Receive transparent, on-time payments for every order we fulfil.</p>
          </div>
        </div>
      </section>

      {/* D. Why List With Us — Benefits */}
      <section className="vendor-benefits-section">
        <div className="vendor-benefits-container">
          <div className="vendor-benefits-image-wrapper">
            <img
              src={assetSrc(artisanImage)}
              alt="Artisan at loom"
              className="vendor-benefits-image"
            />
            <div className="vendor-benefits-glass-card">
              <Heart size={24} className="vendor-accent-icon" />
              <strong>Complete Sales Support</strong>
              <span>You supply, we market and sell — hassle-free.</span>
            </div>
          </div>

          <div className="vendor-benefits-content">
            <h2>Why List With Us?</h2>
            <ul className="vendor-benefits-list-detailed">
              <li>
                <BadgeCheck className="vendor-benefit-list-icon" />
                <div>
                  <strong>Zero Listing Fees</strong>
                  <span>No upfront cost. We invest in your success first.</span>
                </div>
              </li>
              <li>
                <BadgeCheck className="vendor-benefit-list-icon" />
                <div>
                  <strong>You Supply, We Sell</strong>
                  <span>Send your product photos — we list, market, and manage all sales.</span>
                </div>
              </li>
              <li>
                <BadgeCheck className="vendor-benefit-list-icon" />
                <div>
                  <strong>500+ Active Buyers</strong>
                  <span>Instant access to a verified wholesale buyer network.</span>
                </div>
              </li>
              <li>
                <BadgeCheck className="vendor-benefit-list-icon" />
                <div>
                  <strong>Timely Payments</strong>
                  <span>Transparent settlement — no delays, no hidden deductions.</span>
                </div>
              </li>
              <li>
                <BadgeCheck className="vendor-benefit-list-icon" />
                <div>
                  <strong>Dedicated Support</strong>
                  <span>A relationship manager for every vendor partner.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* E. What We Accept — Categories */}
      <section className="vendor-categories-section">
        <div className="vendor-section-header">
          <h2>What We Accept</h2>
          <p>We are always looking for high-quality products across these categories</p>
        </div>
        <div className="vendor-category-tags">
          {['Sarees', 'Suits', 'Dupattas', 'Lehengas', 'Fabrics', 'Accessories'].map((cat) => (
            <span key={cat} className="vendor-category-tag">{cat}</span>
          ))}
        </div>
        <p className="vendor-categories-note">
          Have a product category not listed above? Reach out — we're always expanding.
        </p>
      </section>

      {/* F. Social Proof — Stats Strip */}
      <section className="vendor-stats-section">
        <div className="vendor-stats-grid">
          <div className="vendor-stat">
            <Factory size={28} className="vendor-stat-icon" />
            <strong>200+</strong>
            <span>Vendor Partners</span>
          </div>
          <div className="vendor-stat">
            <Package size={28} className="vendor-stat-icon" />
            <strong>1,000+</strong>
            <span>Products Listed</span>
          </div>
          <div className="vendor-stat">
            <Users size={28} className="vendor-stat-icon" />
            <strong>500+</strong>
            <span>Active Buyers</span>
          </div>
          <div className="vendor-stat">
            <Heart size={28} className="vendor-stat-icon" />
            <strong>98%</strong>
            <span>Partner Satisfaction</span>
          </div>
        </div>
      </section>

      {/* G. Final CTA */}
      <section className="vendor-final-cta">
        <h2>Ready to Showcase Your Craft?</h2>
        <p>Join our growing network of artisans and manufacturers. Zero risk, maximum reach.</p>
        <div className="vendor-final-actions">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="vendor-btn-whatsapp-large">
            <MessageCircle size={20} />
            WhatsApp Us Now
          </a>
        </div>
      </section>
    </div>
  );
}
