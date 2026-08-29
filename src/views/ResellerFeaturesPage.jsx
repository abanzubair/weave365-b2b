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
      q: "Is registration free?",
      a: "Yes. Registration is free for the standard reseller and dropshipping programme. There is no registration fee, setup fee or monthly subscription fee."
    },
    {
      q: "Do I need to maintain stock or buy inventory upfront?",
      a: "No. You do not need to maintain inventory for eligible dropshipping products. You first receive the order from your customer and then place the corresponding order with Weave 365."
    },
    {
      q: "Can I place a single-piece order?",
      a: "Yes. Eligible reseller and dropshipping orders can be placed for a single piece. Regular wholesale and bulk orders may have separate minimum order quantities or commercial terms."
    },
    {
      q: "Do I pay Weave 365 before dispatch?",
      a: "Yes. The applicable Weave 365 payment must be received before the reseller or dropshipping order is processed and dispatched, unless different payment terms have been approved in writing."
    },
    {
      q: "How do I make a profit?",
      a: "You purchase the product from Weave 365 at the applicable reseller price and decide your own customer selling price, subject to applicable law and any specific commercial arrangement. Your gross margin is the difference between the price charged to your customer and the amount payable to Weave 365, before your other business costs. Weave 365 does not guarantee any particular sales, income or profit."
    },
    {
      q: "Can I sell products under my own brand?",
      a: "Yes. Eligible products can be sold under your own brand name through the white-label reseller programme. Weave 365 may provide approved white-label catalogues, product images and product information for this purpose. Your use of Weave 365 products under your own brand does not transfer ownership of Weave 365's intellectual property to you."
    },
    {
      q: "Can products be shipped without Weave 365 branding?",
      a: "Yes, for eligible white-label dropshipping orders. The external customer-facing shipment may be arranged without Weave 365 branding and may be processed under the reseller's brand, subject to the applicable fulfilment arrangement. White-label fulfilment is available only where the product and shipping arrangement support it."
    },
    {
      q: "Can I issue the customer-facing invoice under my own brand?",
      a: "Yes, where you are selling the product to your customer as the reseller. You are responsible for issuing the customer-facing invoice or other required sales document in your own business name and for meeting your applicable GST, tax, invoicing and record-keeping requirements. Weave 365's invoice to the reseller is separate from the reseller's invoice or sales document to its customer."
    },
    {
      q: "Do you provide a GST invoice?",
      a: "Weave 365 will issue the applicable invoice for the transaction with the reseller, subject to the information required for invoicing. The reseller is responsible for issuing its own customer-facing invoice and complying with its own applicable GST and tax requirements. The reseller should provide correct business and GST details to Weave 365 where required."
    },
    {
      q: "Where can I sell Weave 365 products?",
      a: "You can sell eligible products through channels such as WhatsApp, Instagram, Facebook and your own website or online store. You may use approved Weave 365 product images, product information and white-label catalogues for legitimate sales of Weave 365 products. You are responsible for your own pricing, advertising, customer communication and sales activity."
    },
    {
      q: "Will my customer see Weave 365 branding or wholesale prices?",
      a: "For eligible white-label dropshipping orders, the customer-facing shipment is intended to be presented without Weave 365 branding and without displaying the reseller's wholesale purchase price. The exact packaging and documentation may depend on the applicable fulfilment arrangement. You must not make false claims about the product's origin, manufacturing, certification or brand ownership."
    },
    {
      q: "What are the shipping charges for India and international orders?",
      a: "Eligible reseller and dropshipping orders may qualify for free shipping within India, as stated at the time of order. International shipping charges depend on factors such as destination, parcel weight, dimensions, courier service and applicable rates. International customs duties, import taxes and destination-specific charges are generally separate from the product price and shipping charge and may be payable by the customer or reseller, as applicable."
    },
    {
      q: "Is COD available?",
      a: "No. COD is not available for standard reseller and dropshipping orders unless Weave 365 specifically agrees otherwise. The reseller must make the applicable payment to Weave 365 before the order is processed and dispatched."
    },
    {
      q: "What happens if my customer cancels an order?",
      a: "You may request cancellation before Weave 365 has processed or dispatched the order, subject to the applicable order status. Once the order has entered processing, packing or dispatch, cancellation may no longer be possible. The applicable cancellation and refund rules are set out in the Returns, Cancellation & Refunds Policy."
    },
    {
      q: "What is the return policy for reseller orders?",
      a: "For reseller and dropshipping orders, returns are generally not accepted for change of mind, customer preference, slow-moving stock or normal product variations. A return or other remedy may be considered where the customer receives an incorrect product or where there is a verified qualifying product defect, subject to the applicable claim process."
    },
    {
      q: "When is an exchange allowed?",
      a: "An exchange or replacement may be considered for an incorrect product supplied by Weave 365 or a verified qualifying product defect. Normal product characteristics, change of mind and customer preference do not normally qualify for exchange on reseller orders."
    },
    {
      q: "Do I need to record an unboxing video?",
      a: "For certain incorrect-product, damage or product-defect claims, Weave 365 may require a continuous, unedited unboxing video. Where required, the video should start with the sealed parcel and show the opening and inspection of the product. You should report the issue promptly and provide the evidence requested for verification."
    },
    {
      q: "What does Weave 365 cover?",
      a: "Weave 365 handles the product sourcing, applicable quality checking, packing and fulfilment services included in the order. Where a product supplied by Weave 365 is incorrect or has a verified qualifying defect, the matter may be reviewed under the applicable claim process. Weave 365 does not take responsibility for the reseller's independent customer promises, pricing, advertising or other business decisions."
    },
    {
      q: "Who communicates with the customer?",
      a: "The reseller normally communicates directly with its customer. For dropshipping, Weave 365 handles the fulfilment activities agreed for the order, while the reseller manages the customer relationship. The reseller should keep its customer informed about order and delivery matters."
    },
    {
      q: "Who handles NDR?",
      a: "The reseller is responsible for coordinating with its customer when an NDR is raised. Weave 365 may provide the shipment or NDR information received from the shipping partner. The reseller is responsible for obtaining any required confirmation or information from its customer for re-delivery."
    },
    {
      q: "Who pays RTO charges?",
      a: "For reseller and dropshipping orders, RTO charges caused by customer-side or reseller-side issues are generally payable by the reseller. Examples include customer refusal, an incorrect or incomplete address, or customer unavailability. Where the issue is caused by a fulfilment error attributable to Weave 365, the matter will be reviewed under the applicable process."
    },
    {
      q: "Who pays the return or RTO shipping cost?",
      a: "Where a return or RTO results from a customer-side or reseller-side issue, the applicable return, RTO or additional shipping cost may be charged to the reseller. Where the issue is caused by an incorrect product supplied by Weave 365 or another qualifying fulfilment issue attributable to Weave 365, the applicable cost will be handled under the relevant claim process."
    },
    {
      q: "Who is responsible for customer-related issues?",
      a: "The reseller is responsible for: Customer communication, Customer selling price, Product selection and customer advice, Correct customer and delivery information, Customer-side cancellations and refusals, NDR coordination, Customer-side delivery issues, Claims and communication with the customer. Weave 365 is responsible for the fulfilment activities included in the reseller's order."
    },
    {
      q: "Are there any registration or monthly charges?",
      a: "No. There is no registration fee or monthly subscription fee for the standard reseller and dropshipping programme. Any separately purchased service, custom arrangement or optional service will be governed by its applicable commercial terms."
    },
    {
      q: "Can I use Weave 365 product images and catalogues?",
      a: "Yes, where the materials are provided or authorised for reseller use. You may use approved product images, descriptions and catalogues to market eligible Weave 365 products. You must not use the materials for unrelated products, misleading claims or unauthorised purposes."
    },
    {
      q: "Does Weave 365 guarantee my sales or profit?",
      a: "No. Weave 365 provides products and eligible reseller or fulfilment services. It does not guarantee sales volume, customer demand, revenue, gross margin or profit."
    },
    {
      q: "Who is responsible for GST and taxes on my customer sale?",
      a: "You are responsible for your own tax and GST obligations arising from your sale to your customer. This includes determining whether you need to register, issue an invoice, charge GST, maintain records or meet other applicable requirements. Weave 365's tax and invoicing obligations apply to its transaction with you and do not replace your own legal obligations as a reseller."
    }
  ];

  return (
    <div className="reseller-features-container">
      {/* 1. Hero Section */}
      <section className="rf-hero">
        <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Reseller Features' }]} navigate={navigate} />
        <div className="rf-hero-inner">
          <div className="rf-hero-content">
            <h1 className="rf-hero-title">
              The Modern Toolkit to
              <span className="rf-title-accent">Resell Banarasi Sarees Online.</span>
            </h1>
            
            <p className="rf-hero-desc">
              Source authentic Varanasi weaves at direct artisan wholesale rates. Share unbranded HD catalogs across WhatsApp & Instagram, set your own profit margins, and deliver orders blindly to your clients.
            </p>
            
            {/* Distilled 3-Pillar Reseller Workflow */}
            <div className="rf-distilled-strip">
              <div className="rf-distilled-col">
                <span className="rf-distilled-num">01</span>
                <h3 className="rf-distilled-title">Share Catalogs</h3>
                <p className="rf-distilled-text">Watermark-free HD media for social&nbsp;channels.</p>
              </div>

              <div className="rf-distilled-col">
                <span className="rf-distilled-num">02</span>
                <h3 className="rf-distilled-title">Add Your Margin</h3>
                <p className="rf-distilled-text">Set your own retail price & keep 100% of&nbsp;profit.</p>
              </div>

              <div className="rf-distilled-col">
                <span className="rf-distilled-num">03</span>
                <h3 className="rf-distilled-title">Blind Dispatch</h3>
                <p className="rf-distilled-text">Packed & shipped under your boutique&nbsp;name.</p>
              </div>
            </div>

            {/* Action Suite */}
            <div className="rf-action-suite">
              <div className="rf-buttons-row">
                <button 
                  type="button" 
                  className="rf-btn-primary" 
                  onClick={handleStartSharing}
                >
                  <span>Start Reselling Now</span>
                  <ArrowRight size={15} className="rf-btn-arrow" />
                </button>
                <button 
                  type="button" 
                  className="rf-btn-secondary" 
                  onClick={() => navigate('catalogue')}
                >
                  Explore Ready Stock
                </button>
              </div>
              <div className="rf-assurance-note">
                <ShieldCheck size={16} className="rf-assurance-icon" />
                <span>Single-Piece Orders Supported • Zero Inventory Required • Pan-India Free Delivery</span>
              </div>
            </div>
          </div>

          <div className="rf-hero-visual">
            <div className="rf-photo-frame">
              <img
                src="https://assets.weave365.com/assets/banner/affiliate-hero.jpg"
                alt="Resell Banarasi Sarees Online"
                className="rf-hero-photo"
                loading="eager"
              />
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

      {/* 7. Getting Started Pathway (Distilled Architecture) */}
      <section className="rf-pathway">
        <div className="rf-pathway-inner">
          <div className="rf-section-header">
            <h2>Select Your Starting Path</h2>
            <p>Ready to build your ethnic wear business? Choose the path that matches your current sales format.</p>
          </div>

          <div className="rf-distilled-pathway">
            <div className="rf-path-option">
              <div className="rf-path-meta">
                <span className="rf-path-index">01</span>
                <span className="rf-path-pill">INSTANT START</span>
              </div>
              <h3 className="rf-path-title">WhatsApp &amp; Social&nbsp;Sharing</h3>
              <p className="rf-path-desc">
                Start immediately without a website. Browse our Varanasi direct catalog, configure your profit markup, and generate sharing cards to send to WhatsApp, Facebook, or&nbsp;Instagram.
              </p>
              <button type="button" className="rf-btn-primary" onClick={handleStartSharing}>
                <span>Start Sharing Catalogs</span>
                <ArrowRight size={15} className="rf-btn-arrow" />
              </button>
            </div>

            <div className="rf-path-divider" />

            <div className="rf-path-option">
              <div className="rf-path-meta">
                <span className="rf-path-index">02</span>
                <span className="rf-path-pill">BRAND BUILDER</span>
              </div>
              <h3 className="rf-path-title">White-Label Storefront</h3>
              <p className="rf-path-desc">
                Establish a premium digital brand. Connect your custom domain, upload your logo, set your pricing rules, and launch a fully syncable online catalog powered by&nbsp;Weave&nbsp;365.
              </p>
              <button type="button" className="rf-btn-secondary" onClick={() => navigate('account?tab=reseller')}>
                <span>Setup Custom Website</span>
                <ArrowRight size={15} className="rf-btn-arrow" />
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
                    style={{ maxHeight: isOpen ? '600px' : '0px' }}
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
