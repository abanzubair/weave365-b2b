/**
 * @file DropshippingPage.jsx
 * @description Premium Saree & Suit Dropshipping Partner Page.
 * Outlines the mechanics of the free dropshipping program, instructions on adding profit margins,
 * explains key features (WhatsApp sharing, catalog download, white-label website tools),
 * and provides SEO-rich copy for saree & suit dropshipping rankings.
 * 
 * @module views/DropshippingPage
 */

import { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  Share2, 
  Download, 
  Globe, 
  Coins, 
  ShieldCheck, 
  CheckCircle, 
  HelpCircle, 
  ChevronDown, 
  ShoppingBag,
  Info,
  Truck,
  HeartHandshake
} from 'lucide-react';
import { assetSrc } from '../utils/assetSrc.js';
import packagingImage from '../../assets/saree_luxury_packaging.webp';
import '../styles/dropshipping.css';

export function DropshippingPage({ navigate, openAuth }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const activeTab = document.querySelector('.walkthrough-tab-btn.active');
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeStep]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const steps = [
    {
      num: '1',
      icon: ShoppingBag,
      title: 'Select Saree & Suit Designs',
      desc: 'Browse our extensive catalog of authentic handwoven Banarasi sarees, premium suits, and fabrics directly from Varanasi. Pick the designs you wish to sell.'
    },
    {
      num: '2',
      icon: Coins,
      title: 'Add Your Profit Margin',
      desc: 'Important: Weave 365 takes the price listed on our website in full. Before sharing, add your desired profit markup. The markup you add is entirely your profit.'
    },
    {
      num: '3',
      icon: Share2,
      title: 'Share via WhatsApp & Download Media',
      desc: 'Use our native WhatsApp Catalogue Sharing feature to instantly send products to customers. Or use the Catalogue Download feature to download high-resolution photos and descriptions in bulk for your social media channels.'
    },
    {
      num: '4',
      icon: Globe,
      title: 'Deploy a White-Label Website',
      desc: 'Leverage our White Label Website Feature to launch a fully customized website under your own brand name and domain. Display our live catalogue with your custom price markups automatically applied.'
    },
    {
      num: '5',
      icon: CheckCircle,
      title: 'Collect Orders & We Dropship',
      desc: 'Collect retail payment from your buyer, place the order on Weave 365 using your customer’s delivery address. We charge you only the price listed on our website and ship the product directly to your customer.'
    }
  ];

  const features = [
    {
      icon: Share2,
      title: 'WhatsApp Catalogue Sharing',
      desc: 'Share live, updated saree and suit catalogs with your WhatsApp contacts, status updates, or broadcasts. Instantly build customer interest with curated designer cards.'
    },
    {
      icon: Download,
      title: 'Catalogue Download Feature',
      desc: 'Download high-quality professional imagery, styling videos, and specifications for all Banarasi designs. Export them in bulk format to easily feed your Shopify store or Instagram page.'
    },
    {
      icon: Globe,
      title: 'White Label Website Tool',
      desc: 'Create your own branded storefront loaded with Weave 365 products. Customize your logo, color palette, custom domain name, and configure your percentage profit rules in real-time.'
    }
  ];

  const faqs = [
    {
      q: 'How does the Weave 365 Saree & Suit Dropshipping program work?',
      a: 'Resellers can browse our live catalog of Banarasi sarees and suits. You share the designs with your buyers using our tools. You collect the payment from your customer (with your own profit margin added), and place the order on our website with their delivery details. We ship the items directly to them under your name.'
    },
    {
      q: 'Is the dropshipping program really free?',
      a: 'Yes, our dropshipping program is 100% free. There are no registration costs, setup charges, monthly subscription fees, or minimum sales targets. Anyone can start dropshipping sarees and suits immediately.'
    },
    {
      q: 'How do I earn profit with saree & suit dropshipping?',
      a: 'Weave 365 only charges you the price listed on our website. Before you present or share a product to your prospective buyer, you must add your profit margin. For example, if a Banarasi suit is listed on our site at ₹1,500 and you sell it for ₹2,500, you pay us ₹1,500 and keep the remaining ₹1,000 as your pure profit.'
    },
    {
      q: 'Will my customers know the products are shipped by Weave 365?',
      a: 'Absolutely not. We do completely blind, white-labeled fulfillment. The package sent to your customer will not contain any Weave 365 branding, invoice, or retail pricing details. The sender details on the label will list your business name, ensuring your customers remain loyal to your brand.'
    },
    {
      q: 'Can I dropship internationally?',
      a: 'Yes! We ship Banarasi handlooms globally. You can target customers in the US, UK, Canada, Australia, and UAE. International shipping rates are calculated dynamically at checkout.'
    },
    {
      q: 'How do I use the White-Label Website feature?',
      a: 'Once registered, you can activate your reseller website from the reseller dashboard. You get a personalized subdomain or can link a custom domain. Our system automatically populates it with our live saree and suit catalog, showing prices with your custom markup percentages added.'
    }
  ];

  const handleStartCatalog = () => {
    navigate('catalogue');
  };

  return (
    <div className="dropshipping-page-container">
      {/* Hero Section */}
      <section className="dropshipping-hero">
        <div className="dropshipping-hero-inner">
          <div className="dropshipping-hero-content">
            <span className="dropshipping-kicker">Free to Start · No Inventory Required</span>
            <h1 className="dropshipping-hero-title">
              Start Your Saree & Suit <span>Dropshipping Business</span>
            </h1>
            <p className="dropshipping-hero-description">
              Sell authentic Banarasi handlooms with zero inventory risk. Get wholesale access, white-label catalogs, and direct sourcing from Varanasi's weaving ecosystem.
            </p>
            <div className="dropshipping-hero-actions">
              <button 
                type="button" 
                className="dropshipping-primary-btn" 
                onClick={handleStartCatalog}
              >
                Browse Catalogue <ArrowRight size={16} />
              </button>
            </div>
            <div className="dropshipping-hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">₹0</span>
                <span className="hero-stat-label">Investment</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value">150+</span>
                <span className="hero-stat-label">Live Products</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value">Global</span>
                <span className="hero-stat-label">Shipping</span>
              </div>
            </div>
          </div>
          <div className="dropshipping-hero-visual">
            <img 
              src="https://assets.weave365.com/assets/banner/dropshipping-hero.jpg"
              alt="Premium Banarasi saree catalog display for resellers" 
              className="dropshipping-hero-img"
            />
          </div>
        </div>
      </section>

      {/* Critical Alert Banner for Profit Margin */}
      <section className="dropshipping-profit-alert">
        <div className="alert-box">
          <div className="alert-header">
            <span className="alert-badge">Pricing Rule</span>
            <h3 className="alert-title">Important Profit Margin Structure</h3>
          </div>
          <div className="alert-grid">
            <div className="alert-text-side">
              <p>
                Weave 365 charges resellers only the wholesale price listed on our platform. <strong>We do not pay a sales commission on our listed price.</strong> You must add your desired profit markup to our price before sharing a product with your customers. The markup you add is entirely your profit to keep.
              </p>
            </div>
            <div className="alert-formula-side">
              <div className="formula-step">
                <span className="formula-label">Weave 365 Price</span>
                <span className="formula-value">₹1,500</span>
              </div>
              <span className="formula-operator">+</span>
              <div className="formula-step highlighted">
                <span className="formula-label">Your Markup</span>
                <span className="formula-value">₹1,000</span>
              </div>
              <span className="formula-operator">=</span>
              <div className="formula-step total">
                <span className="formula-label">Your Retail Price</span>
                <span className="formula-value">₹2,500</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Benefits */}
      <section className="dropshipping-benefits">
        <div className="dropshipping-section-header">
          <h2>Why Saree &amp; Suit Dropshipping with Weave 365?</h2>
          <p>We provide a reliable, premium backbone for your e-commerce brand with authentic Varanasi loom-direct manufacturing.</p>
        </div>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon-box"><Coins size={20} /></div>
            <div className="benefit-text">
              <h3>Completely Free Setup</h3>
              <p>Start your fashion dropshipping store with zero investment. No monthly fees, sign-up deposits, or bulk warehousing risks.</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon-box"><Truck size={20} /></div>
            <div className="benefit-text">
              <h3>Blind White-Label Delivery</h3>
              <p>We pack and ship the products directly to your customer. Your business name is printed as the sender. No invoices or Weave 365 brand names are visible.</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon-box"><HeartHandshake size={20} /></div>
            <div className="benefit-text">
              <h3>Direct Varanasi Factory Pricing</h3>
              <p>Get authentic pure silk Banarasi sarees, organza handlooms, Georgette fabrics, and designer suits direct from the loom, bypassing all middlemen.</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon-box"><ShieldCheck size={20} /></div>
            <div className="benefit-text">
              <h3>Strict Quality Control</h3>
              <p>Every single product undergoes physical inspection by our experts in Varanasi before packaging, eliminating returns and complaints.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="dropshipping-features-section">
        <div className="dropshipping-section-header">
          <h2>Premium Dropshipping Tools</h2>
          <p>We provide state-of-the-art catalog distribution and storefront tools to help you scale.</p>
        </div>
        <div className="features-container">
          {/* Main Showcase Feature: White Label Tool */}
          <div className="showcase-tool-card">
            <div className="showcase-tool-info">
              <div className="showcase-icon-wrapper">
                <Globe size={24} />
              </div>
              <h3>White Label Website Tool</h3>
              <p>
                Create your own branded storefront loaded with Weave 365 products. Customize your logo, color palette, link your custom domain, and configure profit markup rules in real-time.
              </p>
              <span className="showcase-note">
                Note: This is an optional paid add-on. WhatsApp sharing and downloads are 100% free.
              </span>
              <ul className="showcase-features-list">
                <li>Custom domains (e.g. yourbrand.com)</li>
                <li>Automatic catalog sync &amp; price calculation</li>
                <li>Secure customer ordering under your name</li>
              </ul>
            </div>
            <div className="showcase-tool-preview">
              <div className="preview-window">
                <div className="preview-window-header">
                  <div className="preview-dot" />
                  <div className="preview-dot" />
                  <div className="preview-dot" />
                  <div className="preview-address-bar">yourbrand.com/store</div>
                </div>
                <div className="preview-window-body">
                  <div className="preview-mock-nav">
                    <span className="mock-logo">YOUR BRAND</span>
                    <div className="mock-links"><span /><span /><span /></div>
                  </div>
                  <div className="preview-mock-hero">
                    <div className="mock-title-line" />
                    <div className="mock-title-line short" />
                  </div>
                  <div className="preview-mock-grid">
                    <div className="mock-item"><div className="mock-img" /><div className="mock-text" /><div className="mock-price">₹2,500</div></div>
                    <div className="mock-item"><div className="mock-img" /><div className="mock-text" /><div className="mock-price">₹3,200</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Tools Grid */}
          <div className="secondary-tools-grid">
            <div className="secondary-tool-card">
              <div className="secondary-icon-wrapper">
                <Share2 size={22} />
              </div>
              <h3>WhatsApp Catalogue Sharing</h3>
              <p>
                Share live, updated saree and suit catalogs with your WhatsApp contacts, status updates, or broadcasts. Instantly build customer interest with curated designer cards.
              </p>
            </div>
            <div className="secondary-tool-card">
              <div className="secondary-icon-wrapper">
                <Download size={22} />
              </div>
              <h3>Catalogue Download Feature</h3>
              <p>
                Download high-quality professional imagery, styling videos, and specifications for all Banarasi designs. Export them in bulk format to easily feed your Shopify store or Instagram page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Step by Step Guide */}
      <section className="dropshipping-steps">
        <div className="dropshipping-section-header">
          <h2>Start Dropshipping in 5 Steps</h2>
          <p>Explore the interactive walkthrough below to see how our fulfillment pipeline works.</p>
        </div>

        <div className="walkthrough-panel">
          {/* Navigation Tabs */}
          <div className="walkthrough-tabs">
            {steps.map((step, idx) => (
              <button
                key={step.num}
                type="button"
                className={`walkthrough-tab-btn ${activeStep === idx ? 'active' : ''}`}
                onClick={() => setActiveStep(idx)}
              >
                <span className="tab-number">0{step.num}</span>
                <span className="tab-title">{step.title.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Active Content Display */}
          <div className="walkthrough-display">
            {/* Left: Text & Action */}
            <div className="walkthrough-text">
              <span className="walkthrough-step-label">Step {activeStep + 1} of 5</span>
              <h3>{steps[activeStep].title}</h3>
              <p>{steps[activeStep].desc}</p>
              
              <div className="walkthrough-actions">
                {activeStep > 0 && (
                  <button 
                    type="button" 
                    className="walkthrough-nav-btn prev"
                    onClick={() => setActiveStep(activeStep - 1)}
                  >
                    Previous
                  </button>
                )}
                {activeStep < 4 ? (
                  <button 
                    type="button" 
                    className="walkthrough-nav-btn next"
                    onClick={() => setActiveStep(activeStep + 1)}
                  >
                    Next Step
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="walkthrough-nav-btn start"
                    onClick={handleStartCatalog}
                  >
                    Browse Catalogue
                  </button>
                )}
              </div>
            </div>

            {/* Right: Visual Mockup */}
            <div className="walkthrough-visual">
              {activeStep === 0 && (
                <div className="mock-catalog-list">
                  <div className="mock-search-bar">Search Varanasi handlooms...</div>
                  <div className="mock-catalog-grid">
                    <div className="mock-catalog-card active">
                      <div className="mock-card-image" />
                      <div className="mock-card-title">Katan Silk Saree</div>
                      <div className="mock-card-select-indicator">✓ Selected</div>
                    </div>
                    <div className="mock-catalog-card">
                      <div className="mock-card-image" />
                      <div className="mock-card-title">Organza Saree</div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeStep === 1 && (
                <div className="mock-calculator">
                  <div className="calc-header">Margin Calculator</div>
                  <div className="calc-field">
                    <span>Our Wholesale Price</span>
                    <strong>₹1,500</strong>
                  </div>
                  <div className="calc-field plus">
                    <span>Your Added Markup</span>
                    <span className="calc-badge-input">+ ₹1,000</span>
                  </div>
                  <div className="calc-field total">
                    <span>Your Selling Price</span>
                    <strong>₹2,500</strong>
                  </div>
                  <div className="calc-profit">Your Net Profit: ₹1,000</div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="mock-whatsapp">
                  <div className="chat-header">WhatsApp Sharing</div>
                  <div className="chat-body">
                    <div className="chat-message sent">
                      <div className="chat-card">
                        <div className="chat-card-img" />
                        <div className="chat-card-details">
                          <strong>Premium Banarasi Collection</strong>
                          <p>Handwoven mulberry silk with real zari border.</p>
                          <span className="chat-card-price">Price: ₹2,500</span>
                        </div>
                      </div>
                      <span className="chat-time">10:42 AM</span>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="mock-domain-setup">
                  <div className="domain-header">White-Label Storefront</div>
                  <div className="domain-body">
                    <div className="domain-input-group">
                      <label>Link Custom Domain</label>
                      <div className="domain-input-wrapper">
                        <span>https://</span>
                        <input type="text" readOnly value="www.yourbrand.com" />
                      </div>
                    </div>
                    <div className="domain-status">
                      <span className="status-dot green" /> Connected &amp; Live
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="mock-delivery-tag">
                  <div className="delivery-header">Blind Dropshipping Label</div>
                  <div className="delivery-card">
                    <div className="delivery-section">
                      <span className="label-title">FROM (SENDER)</span>
                      <strong>YOUR BRAND NAME</strong>
                      <span>Varanasi Hub Facility</span>
                    </div>
                    <div className="delivery-divider-line" />
                    <div className="delivery-section">
                      <span className="label-title">TO (CUSTOMER)</span>
                      <strong>Anjali Sharma</strong>
                      <span>MG Road, Bengaluru, 560001</span>
                    </div>
                    <div className="delivery-badge-blind">NO INVOICES · BLIND SHIPMENT</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SEO Copy Section */}
      <section className="dropshipping-seo-copy">
        <div className="seo-copy-inner">
          <div className="seo-copy-header">
            <h2>India’s Leading Saree &amp; Suit Dropshipping Platform</h2>
            <div className="seo-editorial-quote">
              "Weave 365 bridges the gap between Varanasi's heritage master weavers and modern digital boutiques worldwide."
            </div>
          </div>
          <div className="seo-copy-text">
            <p>
              The Indian ethnic wear market is experiencing an unprecedented global surge. With Weave 365, starting a <strong>saree dropshipping</strong> or <strong>suit dropshipping</strong> business has never been easier. We eliminate the biggest friction points of traditional retail—sourcing genuine handlooms, carrying expensive inventory, quality checking delicate silks, and packing.
            </p>
            <p>
              By utilizing our <strong>free saree dropshipping program</strong>, you gain immediate access to a live, curated catalog of hundreds of premium Banarasi sarees and suits. Our blind-shipping guarantee ensures that your brand equity is protected. Leverage our advanced white-label tools, connect your custom domain, share on WhatsApp with a tap, and begin scaling your fashion dropshipping store today.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="dropshipping-faqs">
        <div className="dropshipping-section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Got questions about saree & suit dropshipping? Find quick answers below.</p>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index} 
                className={`faq-item ${isOpen ? 'active' : ''}`}
              >
                <button 
                  type="button" 
                  className="faq-question" 
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className="faq-chevron" />
                </button>
                <div 
                  className="faq-answer"
                  style={{ maxHeight: isOpen ? '300px' : '0' }}
                >
                  <div className="faq-answer-inner">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="dropshipping-cta">
        <div className="cta-inner">
          <HeartHandshake className="cta-icon" size={32} />
          <h2>Ready to Launch Your Saree Dropshipping Brand?</h2>
          <p>Register today, access our live catalog, set your profit margins, and start selling globally with Varanasi's premium manufacturer.</p>
          <button 
            type="button" 
            className="dropshipping-cta-btn" 
            onClick={handleStartCatalog}
          >
            Access Saree &amp; Suit Catalogue <ArrowRight size={16} />
          </button>
          <div className="cta-trust-signals">
            <span>No Upfront Cost</span>
            <span className="dot-separator">•</span>
            <span>Instant Setup</span>
            <span className="dot-separator">•</span>
            <span>Dedicated Support</span>
          </div>
        </div>
      </section>
    </div>
  );
}
