/**
 * @file ResellerFeaturesPage.jsx
 * @description Premium Saree & Suit Reseller Features Landing Page.
 * Showcases all reseller features (WhatsApp sharing, catalog download, custom pricing,
 * white-label websites, customer inquiry dashboard) with interactive tool demos,
 * persona mappings, comparison tables, earnings estimates, and strategic internal links.
 * 
 * @module views/ResellerFeaturesPage
 */

import { useState } from 'react';
import { 
  ArrowRight, 
  Share2, 
  Download, 
  Sliders, 
  Globe, 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Percent, 
  Truck, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown, 
  Layers, 
  FileText,
  HeartHandshake
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb.jsx';
import '../styles/resellerFeatures.css';

export function ResellerFeaturesPage({ user, navigate, openAuth }) {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [markupPercent, setMarkupPercent] = useState(25);
  const [openFaq, setOpenFaq] = useState(null);

  // Dynamic calculations for custom markup demo
  const basePrice = 2000;
  const markupAmount = Math.round((basePrice * markupPercent) / 100);
  const finalPrice = basePrice + markupAmount;

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleStartSharing = () => {
    if (user) {
      navigate('catalogue');
    } else if (navigate) {
      navigate('signup', null, null, { type: 'reseller' });
    } else if (openAuth) {
      openAuth();
    }
  };

  const faqs = [
    {
      q: 'How does the Weave 365 reseller platform differ from standard dropshipping?',
      a: 'While dropshipping refers specifically to the fulfillment method (shipping directly to your customer), our reseller platform provides the complete digital toolkit for social and web commerce. This includes instant WhatsApp sharing cards, bulk imagery downloads for social media posting, custom markup calculators, a built-in customer lead CRM, and the ability to launch a white-label website under your own domain name.'
    },
    {
      q: 'Do you charge any monthly fees to use the reseller tools?',
      a: 'Access to our catalogue, core WhatsApp sharing tools, custom pricing markups, bulk downloads, and order tracking is 100% free with no monthly subscription costs. The White-Label Website tool (which allows you to link a custom domain and auto-sync our live catalog) is available as an optional premium add-on.'
    },
    {
      q: 'Can I resell sarees and suits on platforms like Instagram and Facebook?',
      a: 'Yes, absolutely. Most of our successful partners resell sarees online by sharing curated images on Instagram Stories/Reels or running private Facebook Groups. Our Catalog Download feature lets you export high-resolution product photography and complete fabric specifications in one click to populate your social feeds.'
    },
    {
      q: 'How is packaging handled? Will my customers know about Weave 365?',
      a: 'All orders are shipped under strict blind-fulfillment conditions. The package sent to your customer lists your business name as the sender, and contains no Weave 365 logos, invoices, or retail pricing leaflets. Your customer remains entirely yours.'
    },
    {
      q: 'What is the earnings potential, and how do I receive payments?',
      a: 'Your earnings are entirely up to your markup rules. We charge you the trade price listed on our portal. When you share a design or host a storefront, you set your own selling price. When your customer pays you, you place the order on our site, pay us the trade price, and keep the difference as instant profit. No payment delays or commission waiting periods.'
    }
  ];

  return (
    <div className="reseller-features-container">
      {/* 1. Hero Section */}
      <section className="rf-hero">
        <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Reseller Features' }]} navigate={navigate} contained={true} />
        <div className="rf-hero-inner">
          <div className="rf-hero-content">
            <span className="rf-hero-kicker">Multi-Tier B2B Reseller Platform</span>
            <h1 className="rf-hero-title">
              The Professional Toolkit to <span>Resell Sarees Online</span>
            </h1>
            <p className="rf-hero-desc">
              Power your social commerce boutique. Weave 365 provides Varanasi direct factory sourcing, instant social cataloging, custom pricing rules, and blind shipping &mdash; all from a single reseller ecosystem.
            </p>
            <div className="rf-hero-actions">
              <button 
                type="button" 
                className="rf-btn-primary" 
                onClick={handleStartSharing}
              >
                <span>Start Reselling Now</span>
                <ArrowRight size={16} />
              </button>
              <button 
                type="button" 
                className="rf-btn-secondary" 
                onClick={() => navigate('about')}
              >
                Learn About Our Quality
              </button>
            </div>
            <div className="rf-hero-trust-row">
              <div className="rf-trust-item">
                <ShieldCheck size={18} className="rf-trust-icon" />
                <span>Risk: <strong>Zero Inventory</strong></span>
              </div>
              <div className="rf-trust-item">
                <Globe size={18} className="rf-trust-icon" />
                <span>Pricing: <strong>Varanasi Factory Rates</strong></span>
              </div>
              <div className="rf-trust-item">
                <Truck size={18} className="rf-trust-icon" />
                <span>Fulfillment: <strong>Global Express</strong></span>
              </div>
            </div>
          </div>

          <div className="rf-hero-visual">
            <div className="rf-visual-workspace">
              {/* Instagram Post Mockup */}
              <div className="mock-ig-post">
                <div className="mock-ig-header">
                  <div className="mock-ig-avatar" />
                  <span className="mock-ig-username">your.boutique</span>
                </div>
                <div className="mock-ig-image" style={{ backgroundImage: 'url(https://assets.weave365.com/assets/banner/affiliate-hero.jpg)' }} />
                <div className="mock-ig-info">
                  <div className="mock-ig-actions">
                    <span className="mock-ig-action">♥</span>
                    <span className="mock-ig-action">💬</span>
                    <span className="mock-ig-action">✈</span>
                  </div>
                  <div className="mock-ig-caption">
                    <strong>your.boutique</strong> Organza Banarasi Saree, direct from the Varanasi looms. 🌸 Retail Price: ₹2,800 (+40% Markup).
                  </div>
                </div>
              </div>

              {/* WhatsApp Chat Bubble Mockup */}
              <div className="mock-wa-bubble">
                <div className="mock-wa-chat-header">
                  <div className="mock-wa-avatar" />
                  <span className="mock-wa-chat-name">Customer Group</span>
                </div>
                <div className="mock-wa-chat-body">
                  <div className="mock-wa-balloon">
                    <div className="mock-wa-media" style={{ backgroundImage: 'url(https://assets.weave365.com/assets/banner/dropshipping-hero.jpg)' }} />
                    <div className="mock-wa-caption">
                      <strong>Handwoven Katan Silk</strong>
                      <p>Pure mulberry silk weave with gold zari work.</p>
                      <div className="mock-wa-price">₹2,500 (+25% Markup)</div>
                    </div>
                    <div className="mock-wa-meta">10:45 AM ✓✓</div>
                  </div>
                </div>
              </div>

              {/* White Label Web storefront viewport */}
              <div className="mock-wl-browser">
                <div className="mock-wl-browser-header">
                  <div className="mock-wl-browser-dots">
                    <span className="mock-wl-dot" />
                    <span className="mock-wl-dot" />
                    <span className="mock-wl-dot" />
                  </div>
                  <div className="mock-wl-browser-address">https://www.yourbrand.com</div>
                </div>
                <div className="mock-wl-browser-body">
                  <div className="mock-wl-store-hero" style={{ backgroundImage: 'url(https://assets.weave365.com/assets/banner/weaver-onboard-hero.jpeg)' }}>
                    <div className="mock-wl-store-hero-overlay">
                      <span>EXCLUSIVE SILK CATALOGUE</span>
                    </div>
                  </div>
                  <div className="mock-wl-store-grid">
                    <div className="mock-wl-store-item">
                      <div className="mock-wl-store-img" style={{ backgroundImage: 'url(https://assets.weave365.com/assets/banner/dropshipping-hero.jpg)' }} />
                      <div className="mock-wl-store-details">
                        <span className="mock-wl-store-title">Katan Silk Saree</span>
                        <span className="mock-wl-store-price">₹3,000</span>
                      </div>
                    </div>
                    <div className="mock-wl-store-item">
                      <div className="mock-wl-store-img" style={{ backgroundImage: 'url(https://assets.weave365.com/assets/banner/affiliate-hero.jpg)' }} />
                      <div className="mock-wl-store-details">
                        <span className="mock-wl-store-title">Organza Saree</span>
                        <span className="mock-wl-store-price">₹3,200</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Unified Brand Reselling Intro & SEO Pillar */}
      <section className="rf-intro">
        <div className="rf-section-intro-inner">
          <div className="rf-intro-heading">
            <h2>The Loom-to-Social Bridge</h2>
          </div>
          <div className="rf-intro-content">
            <p>
              Reselling sarees online is one of India's fastest-growing digital boutique models. However, standard reselling apps offer cheap mass-manufactured fabrics and generic catalogs, forcing you to compete purely on price.
            </p>
            <p>
              Weave 365 changes the equation by giving you direct factory access to authentic handwoven Banarasi sarees, premium suits, and fabrics directly from Varanasi. We combine this heritage artisan network with modern software tools that let you customize, download, control margins, and automate order management under your own brand identity.
            </p>
            <div className="rf-intro-links">
              <a href="/dropshipping" className="rf-inline-link" onClick={(e) => { e.preventDefault(); navigate('dropshipping'); }}>
                Dropshipping Program Details <ArrowRight size={12} />
              </a>
              <a href="/white-label" className="rf-inline-link" onClick={(e) => { e.preventDefault(); navigate('white-label'); }}>
                White Label Branding <ArrowRight size={12} />
              </a>
              <a href="/sourcing-partners" className="rf-inline-link" onClick={(e) => { e.preventDefault(); navigate('sourcing-partners'); }}>
                Sourcing Partnerships <ArrowRight size={12} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Non-Identical Personas Section */}
      <section className="rf-personas">
        <div className="rf-section-header">
          <h2>Tailored for Every Selling Style</h2>
          <p>Whether you share catalogs on WhatsApp groups or run a multi-national boutique, our tools adapt to your business format.</p>
        </div>

        <div className="rf-personas-layout">
          {/* Persona 1: WhatsApp Group & Social Sellers */}
          <div className="rf-persona-row">
            <div className="rf-persona-card-visual">
              <div className="rf-persona-workflow-box">
                <div className="rf-wf-step">
                  <span className="rf-wf-num">1</span>
                  <div className="rf-wf-text">
                    <strong>Choose Designs</strong>
                    <p>Select Banarasi sarees from Weave 365</p>
                  </div>
                </div>
                <div className="rf-wf-step">
                  <span className="rf-wf-num">2</span>
                  <div className="rf-wf-text">
                    <strong>Set Selling Price</strong>
                    <p>Markup gets embedded in your share links</p>
                  </div>
                </div>
                <div className="rf-wf-step">
                  <span className="rf-wf-num">3</span>
                  <div className="rf-wf-text">
                    <strong>WhatsApp Broadcast</strong>
                    <p>Forward beautiful product cards to buyers</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rf-persona-card-content">
              <span className="rf-persona-eyebrow">WhatsApp & Social Groups</span>
              <h3 className="rf-persona-title">Home-Based Social Sellers</h3>
              <p className="rf-persona-text">
                Perfect for entrepreneurs running WhatsApp broadcast lists, Facebook groups, or local network circles. Instantly share live, updated collections without downloading huge photo files or manually copy-pasting descriptions. Your customers check out or inquire, and the leads land directly in your reseller center.
              </p>
              <button type="button" className="rf-btn-secondary" onClick={handleStartSharing}>
                Get Free Share Links
              </button>
            </div>
          </div>

          {/* Persona 2: Instagram Creators & Boutique Owners */}
          <div className="rf-persona-row reverse">
            <div className="rf-persona-card-content">
              <span className="rf-persona-eyebrow">Instagram & Digital Boutiques</span>
              <h3 className="rf-persona-title">Instagram Handloom Creators</h3>
              <p className="rf-persona-text">
                For fashion creators and online curators who market through Instagram Reels, styling videos, and Pinterest boards. Use our Catalog Download feature to get professional studio-grade imagery and weave specifications. Post custom styling advice, collect premium orders, and let our Varanasi hub manage delivery.
              </p>
              <button type="button" className="rf-btn-secondary" onClick={() => navigate('catalogue')}>
                Explore Catalogue Slabs
              </button>
            </div>
            <div className="rf-persona-card-visual">
              <div className="rf-persona-workflow-box">
                <div className="rf-wf-step">
                  <span className="rf-wf-num">1</span>
                  <div className="rf-wf-text">
                    <strong>Bulk Media Export</strong>
                    <p>Download original studio photos & styling clips</p>
                  </div>
                </div>
                <div className="rf-wf-step">
                  <span className="rf-wf-num">2</span>
                  <div className="rf-wf-text">
                    <strong>Post & Style</strong>
                    <p>Publish reel and link your white-label bio storefront</p>
                  </div>
                </div>
                <div className="rf-wf-step">
                  <span className="rf-wf-num">3</span>
                  <div className="rf-wf-text">
                    <strong>Direct Checkout</strong>
                    <p>Order processed under your name, shipped globally</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Demo Panel */}
      <section className="rf-features-demo-section">
        <div className="rf-features-demo-inner">
          <div className="rf-section-header">
            <h2>Explore Our Reselling Features</h2>
            <p>Select a feature tab below to interact with our platform tools and preview how they simplify your business.</p>
          </div>

          <div className="rf-demo-panel">
            {/* Left Tabs Navigation */}
            <div className="rf-demo-tabs">
              <button 
                type="button" 
                className={`rf-demo-tab-btn ${activeTab === 'whatsapp' ? 'active' : ''}`}
                onClick={() => setActiveTab('whatsapp')}
              >
                <Share2 className="rf-demo-tab-icon" size={20} />
                <div className="rf-demo-tab-meta">
                  <span className="rf-demo-tab-title">WhatsApp Catalog Share</span>
                  <span className="rf-demo-tab-sub">One-tap customer sharing</span>
                </div>
              </button>

              <button 
                type="button" 
                className={`rf-demo-tab-btn ${activeTab === 'download' ? 'active' : ''}`}
                onClick={() => setActiveTab('download')}
              >
                <Download className="rf-demo-tab-icon" size={20} />
                <div className="rf-demo-tab-meta">
                  <span className="rf-demo-tab-title">Catalog Media Export</span>
                  <span className="rf-demo-tab-sub">Export original high-res assets</span>
                </div>
              </button>

              <button 
                type="button" 
                className={`rf-demo-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
                onClick={() => setActiveTab('pricing')}
              >
                <Sliders className="rf-demo-tab-icon" size={20} />
                <div className="rf-demo-tab-meta">
                  <span className="rf-demo-tab-title">Custom Pricing Markups</span>
                  <span className="rf-demo-tab-sub">Set and lock profit rules</span>
                </div>
              </button>

              <button 
                type="button" 
                className={`rf-demo-tab-btn ${activeTab === 'storefront' ? 'active' : ''}`}
                onClick={() => setActiveTab('storefront')}
              >
                <Globe className="rf-demo-tab-icon" size={20} />
                <div className="rf-demo-tab-meta">
                  <span className="rf-demo-tab-title">White Label Storefront</span>
                  <span className="rf-demo-tab-sub">Branded custom domain shop</span>
                </div>
              </button>

              <button 
                type="button" 
                className={`rf-demo-tab-btn ${activeTab === 'crm' ? 'active' : ''}`}
                onClick={() => setActiveTab('crm')}
              >
                <LayoutDashboard className="rf-demo-tab-icon" size={20} />
                <div className="rf-demo-tab-meta">
                  <span className="rf-demo-tab-title">Inquiry CRM Dashboard</span>
                  <span className="rf-demo-tab-sub">Collect and track active leads</span>
                </div>
              </button>
            </div>

            {/* Right Display Area */}
            <div className="rf-demo-content-display">
              {activeTab === 'whatsapp' && (
                <>
                  <div className="rf-demo-text-side">
                    <span className="rf-demo-badge">WhatsApp Share</span>
                    <h3>Instant Branded Share Cards</h3>
                    <p>
                      No more screenshots cluttering your photo gallery. Open any design in the catalogue, tap "Share", and Weave 365 generates a clean, professional product card to send directly to your buyers. 
                    </p>
                    <p>
                      The link contains your customized markup price, automatically hiding Weave 365 branding.
                    </p>
                    <button type="button" className="rf-btn-primary" onClick={handleStartSharing}>
                      Try Catalogue Sharing
                    </button>
                  </div>
                  <div className="rf-demo-visual-side">
                    <div className="demo-wa-window">
                      <div className="demo-wa-header">Saree Reseller Chat</div>
                      <div className="demo-wa-body">
                        <div className="demo-wa-msg">
                          <div className="demo-wa-product">
                            <div className="demo-wa-product-img" style={{ backgroundImage: 'url(https://assets.weave365.com/assets/banner/dropshipping-hero.jpg)' }} />
                            <div className="demo-wa-product-desc">
                              <div className="demo-wa-product-title">Varanasi Katan Silk Saree</div>
                              <p style={{ margin: '2px 0 0', color: '#666', fontSize: 'var(--small-size)' }}>Pure mulberry silk weave with gold zari work.</p>
                              <div className="demo-wa-product-price">₹2,800</div>
                            </div>
                          </div>
                          <div className="demo-wa-msg-meta">10:45 AM ✓✓</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'download' && (
                <>
                  <div className="rf-demo-text-side">
                    <span className="rf-demo-badge">Media Export</span>
                    <h3>Studio Photos & Specifications</h3>
                    <p>
                      Build your social media feed with premium visual content. Our bulk export tool allows you to select multiple saree or suit designs and download high-resolution catalog photos and detailed product descriptions.
                    </p>
                    <p>
                      Perfect for feed catalog posts on Instagram, Pinterest Pins, and Facebook business albums.
                    </p>
                    <button type="button" className="rf-btn-primary" onClick={() => navigate('catalogue')}>
                      Download Assets
                    </button>
                  </div>
                  <div className="rf-demo-visual-side">
                    <div className="demo-download-window">
                      <div className="demo-dl-grid">
                        <div className="demo-dl-box" style={{ backgroundImage: 'url(https://assets.weave365.com/assets/banner/dropshipping-hero.jpg)' }}><div className="demo-dl-checkbox">✓</div></div>
                        <div className="demo-dl-box" style={{ backgroundImage: 'url(https://assets.weave365.com/assets/banner/affiliate-hero.jpg)' }}><div className="demo-dl-checkbox">✓</div></div>
                        <div className="demo-dl-box" style={{ backgroundImage: 'url(https://assets.weave365.com/assets/banner/weaver-onboard-hero.jpeg)' }}><div className="demo-dl-checkbox">✓</div></div>
                      </div>
                      <button type="button" className="demo-dl-btn">
                        <Download size={14} /> Download Selected (3)
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'pricing' && (
                <>
                  <div className="rf-demo-text-side">
                    <span className="rf-demo-badge">Markup Control</span>
                    <h3>Custom Markup Slider</h3>
                    <p>
                      You are in complete control of your profits. Set standard markup percentages globally, or customize pricing product-by-product. 
                    </p>
                    <p>
                      Slide the markup tool on the right to see how the customer-facing retail price is calculated while protecting your factory rate.
                    </p>
                  </div>
                  <div className="rf-demo-visual-side">
                    <div className="demo-pricing-window">
                      <div className="demo-pricing-title">Markup Profit Estimator</div>
                      <div className="demo-pr-row">
                        <span>Weave 365 Trade Rate</span>
                        <span>₹{basePrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="demo-pr-row">
                        <span>Your Set Markup %</span>
                        <strong>{markupPercent}%</strong>
                      </div>
                      <div className="demo-pr-slider-container">
                        <input 
                          type="range" 
                          min="10" 
                          max="80" 
                          value={markupPercent} 
                          onChange={(e) => setMarkupPercent(Number(e.target.value))}
                          className="demo-pr-slider"
                        />
                        <div className="demo-pr-slider-labels">
                          <span>10%</span>
                          <span>80%</span>
                        </div>
                      </div>
                      <div className="demo-pr-row">
                        <span>Your Estimated Profit</span>
                        <span style={{ color: '#25d366', fontWeight: 600 }}>+ ₹{markupAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="demo-pr-row total">
                        <span>Customer Retail Price</span>
                        <span>₹{finalPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'storefront' && (
                <>
                  <div className="rf-demo-text-side">
                    <span className="rf-demo-badge">Premium Add-on</span>
                    <h3>White-Label Custom Storefront</h3>
                    <p>
                      Launch a fully independent ethnic wear storefront without writing code. Link your custom domain (e.g. www.yourbrand.com), upload your store logo, and customize color schemes.
                    </p>
                    <p>
                      Our system populates your store with our live catalog, showing your marked-up retail prices.
                    </p>
                    <button type="button" className="rf-btn-secondary" onClick={() => navigate('white-label')}>
                      Explore White Label Setup
                    </button>
                  </div>
                  <div className="rf-demo-visual-side">
                    <div className="demo-wl-window">
                      <div className="demo-wl-header">
                        <div className="demo-wl-dots">
                          <div className="demo-wl-dot" />
                          <div className="demo-wl-dot" />
                          <div className="demo-wl-dot" />
                        </div>
                        <div className="demo-wl-address">https://www.myboutique.com</div>
                      </div>
                      <div className="demo-wl-body">
                        <div className="demo-wl-nav">
                          <span className="demo-wl-logo">MY BOUTIQUE</span>
                          <div className="demo-wl-links"><div className="demo-wl-link" /><div className="demo-wl-link" /></div>
                        </div>
                        <div className="demo-wl-products">
                          <div className="demo-wl-prod">
                            <div className="demo-wl-prod-img" style={{ backgroundImage: 'url(https://assets.weave365.com/assets/banner/dropshipping-hero.jpg)' }} />
                            <div className="demo-wl-prod-price">₹3,200</div>
                          </div>
                          <div className="demo-wl-prod">
                            <div className="demo-wl-prod-img" style={{ backgroundImage: 'url(https://assets.weave365.com/assets/banner/affiliate-hero.jpg)' }} />
                            <div className="demo-wl-prod-price">₹3,600</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'crm' && (
                <>
                  <div className="rf-demo-text-side">
                    <span className="rf-demo-badge">Inquiry Center</span>
                    <h3>Customer Lead CRM Dashboard</h3>
                    <p>
                      Keep track of customer interest in one place. When customers browse your shared catalog links and ask questions, their inquiries flow directly into your private business dashboard. 
                    </p>
                    <p>
                      Respond to inquiries, update statuses, and convert conversations into wholesale checkouts seamlessly.
                    </p>
                  </div>
                  <div className="rf-demo-visual-side">
                    <div className="demo-crm-window">
                      <div className="demo-crm-header">
                        <span>Active Inquiries</span>
                        <span className="demo-crm-badge-active">2 Pending</span>
                      </div>
                      <div className="demo-crm-list">
                        <div className="demo-crm-item">
                          <div className="demo-crm-row1">
                            <span>Preeti Sharma</span>
                            <span>Katan Silk</span>
                          </div>
                          <div className="demo-crm-row2">
                            <span>"Is COD available?"</span>
                            <span className="demo-crm-status">New Inquiry</span>
                          </div>
                        </div>
                        <div className="demo-crm-item">
                          <div className="demo-crm-row1">
                            <span>Rajesh Patel</span>
                            <span>Banarasi Suit</span>
                          </div>
                          <div className="demo-crm-row2">
                            <span>"Need 5 sets for wedding"</span>
                            <span className="demo-crm-status">Quoted</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Competitor Comparison Table */}
      <section className="rf-comparison">
        <div className="rf-comparison-inner">
          <div className="rf-section-header">
            <h2>Why Choose Weave 365?</h2>
            <p>See how our premium reselling platform compares to generic mass-market social commerce apps.</p>
          </div>

          <div className="rf-table-wrapper">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Weave 365 Platform</th>
                  <th>Generic Reseller Apps</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Catalog Authenticity</strong></td>
                  <td>100% Varanasi direct, verified sarees & premium suits</td>
                  <td>Mass-manufactured synthetic fabrics with no origin checks</td>
                </tr>
                <tr>
                  <td><strong>Branding Control</strong></td>
                  <td>Complete white-labeling, optional custom domain storefront</td>
                  <td>No custom websites; generic product packaging and cards</td>
                </tr>
                <tr>
                  <td><strong>Pricing Autonomy</strong></td>
                  <td>Set your own markup percentage. You collect payments directly</td>
                  <td>Fixed sales commissions set by the platform</td>
                </tr>
                <tr>
                  <td><strong>Media Quality</strong></td>
                  <td>High-res studio photography + detailed weave specifications</td>
                  <td>Low-quality user-uploaded images, inaccurate details</td>
                </tr>
                <tr>
                  <td><strong>Delivery Method</strong></td>
                  <td>Blind fulfillment under your business name globally</td>
                  <td>Basic domestic shipping with generic provider tags</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. Realistic Earnings Framework */}
      <section className="rf-earnings">
        <div className="rf-earnings-inner">
          <div className="rf-earnings-grid">
            <div className="rf-earnings-desc">
              <h3>Earnings Potential Framework</h3>
              <p>
                We believe in transparent, realistic projections instead of overnight get-rich-quick claims. Because you set your own markup prices, your monthly earnings depend entirely on the customer base you build and the designs you curate.
              </p>
              <p>
                Below is a structured calculation based on average order sizes and a standard ₹600 profit markup per premium handloom saree or designer suit.
              </p>
              <a href="/affiliate-program" className="rf-inline-link" onClick={(e) => { e.preventDefault(); navigate('affiliate-program'); }}>
                Prefer a simple commission model? See Affiliate Program <ArrowRight size={16} />
              </a>
            </div>
            <div className="rf-earnings-table-box">
              <div className="rf-earning-row header">
                <span>Reseller Tier / Activity</span>
                <span>Est. Profit / Month</span>
              </div>
              <div className="rf-earning-row">
                <span>Part-Time (10 sales/month × ₹600 markup)</span>
                <span>₹6,000 / mo</span>
              </div>
              <div className="rf-earning-row highlighted">
                <span>Active Curator (50 sales/month × ₹600 markup)</span>
                <span>₹30,000 / mo</span>
              </div>
              <div className="rf-earning-row">
                <span>Full-Scale Boutique (200 sales/month × ₹650 markup)</span>
                <span>₹1,30,000 / mo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Getting Started Pathway */}
      <section className="rf-pathway">
        <div className="rf-pathway-inner">
          <div className="rf-section-header">
            <h2>Select Your Starting Path</h2>
            <p>Ready to build your ethnic wear business? Choose the path that matches your current sales format.</p>
          </div>

          <div className="rf-path-selector">
            <div className="rf-path-card">
              <Share2 className="rf-path-icon" size={32} />
              <h3>WhatsApp & Social Sharing</h3>
              <p>Start immediately without a website. Browse our Varanasi direct catalog, configure your profit markup, and generate sharing cards to send to WhatsApp, Facebook, or Instagram.</p>
              <button type="button" className="rf-btn-primary" onClick={handleStartSharing}>
                Start Sharing Catalogs
              </button>
            </div>

            <div className="rf-path-card">
              <Globe className="rf-path-icon" size={32} />
              <h3>White-Label Storefront</h3>
              <p>Establish a premium digital brand. Connect your custom domain, upload your logo, set your pricing rules, and launch a fully syncable online catalog powered by Weave 365.</p>
              <button type="button" className="rf-btn-secondary" onClick={() => navigate('white-label')}>
                Setup Custom Website
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Trust Signals Strip */}
      <section className="rf-trust-strip">
        <div className="rf-trust-strip-inner">
          <div className="rf-strip-item">
            <HeartHandshake className="rf-strip-icon" size={24} />
            <div className="rf-strip-meta">
              <h4>Direct Varanasi Looms</h4>
              <p>Supporting certified weavers and heritage handloom artisans.</p>
            </div>
          </div>
          <div className="rf-strip-item">
            <ShieldCheck className="rf-strip-icon" size={24} />
            <div className="rf-strip-meta">
              <h4>Strict Pre-Dispatch QC</h4>
              <p>Every saree physically checked before it leaves Varanasi hub.</p>
            </div>
          </div>
          <div className="rf-strip-item">
            <Truck className="rf-strip-icon" size={24} />
            <div className="rf-strip-meta">
              <h4>Worldwide Shipping</h4>
              <p>Express courier logistics spanning India, US, UK, UAE, and Canada.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQs Section */}
      <section className="rf-faq">
        <div className="rf-faq-inner">
          <div className="rf-section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Clear, direct answers about catalog distribution, customer ownership, and order logistics.</p>
          </div>

          <div className="rf-faq-list">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className={`rf-faq-item ${isOpen ? 'active' : ''}`}>
                  <button 
                    type="button" 
                    className="rf-faq-trigger" 
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <h3>{faq.q}</h3>
                    <ChevronDown size={18} className="rf-faq-icon" />
                  </button>
                  <div 
                    className="rf-faq-content"
                    style={{ maxHeight: isOpen ? '250px' : '0px' }}
                  >
                    <div className="rf-faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
