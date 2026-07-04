/**
 * @file DropshippingPage.jsx
 * @description Premium Saree & Suit Dropshipping Partner Page.
 * Outlines the mechanics of the free dropshipping program, instructions on adding profit margins,
 * explains key features (WhatsApp sharing, catalog download, white-label website tools),
 * and provides SEO-rich copy for saree & suit dropshipping rankings.
 * 
 * @module views/DropshippingPage
 */

import { useState } from 'react';
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
import '../styles/dropshipping.css';

export function DropshippingPage({ navigate, openAuth }) {
  const [openFaq, setOpenFaq] = useState(null);

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
        <div className="dropshipping-hero-content">
          <span className="dropshipping-kicker">100% Free Program</span>
          <h1 className="dropshipping-hero-title">
            Start Your Saree & Suit <span>Dropshipping Business for Free</span>
          </h1>
          <p className="dropshipping-hero-description">
            Start selling Banarasi sarees and suits online with no inventory. Get wholesale access, white-label catalogs, and direct sourcing support from Varanasi’s weaving ecosystem.
          </p>
          <div className="dropshipping-hero-actions">
            <button 
              type="button" 
              className="dropshipping-primary-btn" 
              onClick={handleStartCatalog}
            >
              Start Dropshipping Now <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Critical Alert Banner for Profit Margin */}
      <section className="dropshipping-profit-alert">
        <div className="alert-box">
          <div className="alert-icon-wrapper">
            <Info size={24} />
          </div>
          <div className="alert-content">
            <h3>Important Profit Margin Rule</h3>
            <p>
              Please note that Weave 365 takes the price listed on our website in full. We do not pay a commission on our listed price. <strong>Resellers must add their own profit markup</strong> before sharing a product with their buyers. The markup you add is entirely your profit to keep.
            </p>
          </div>
        </div>
      </section>

      {/* Core Benefits */}
      <section className="dropshipping-benefits">
        <div className="dropshipping-section-header">
          <h2>Why Saree & Suit Dropshipping with Weave 365?</h2>
          <p>We provide a reliable backbone for your e-commerce brand with authentic Varanasi manufacturing.</p>
        </div>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="icon-box"><Coins size={24} /></div>
            <h3>Completely Free Setup</h3>
            <p>Start your fashion dropshipping store with zero investment. No monthly fees, sign-up deposits, or bulk warehousing risks.</p>
          </div>
          <div className="benefit-card">
            <div className="icon-box"><Truck size={24} /></div>
            <h3>Blind White-Label Delivery</h3>
            <p>We pack and ship the products directly to your customer. Your business name is printed as the sender. No invoices or Weave 365 brand names are visible.</p>
          </div>
          <div className="benefit-card">
            <div className="icon-box"><HeartHandshake size={24} /></div>
            <h3>Direct Varanasi Factory Pricing</h3>
            <p>Get authentic pure silk Banarasi sarees, organza handlooms, Georgette fabrics, and designer suits direct from the loom, bypassing all middlemen.</p>
          </div>
          <div className="benefit-card">
            <div className="icon-box"><ShieldCheck size={24} /></div>
            <h3>Strict Quality Control</h3>
            <p>Every single product undergoes physical inspection by our experts in Varanasi before packaging, eliminating returns and complaints.</p>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="dropshipping-features-section">
        <div className="dropshipping-section-header">
          <h2>Premium Dropshipping Tools</h2>
          <p>We provide state-of-the-art catalog distribution and storefront tools to help you scale.</p>
        </div>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon-wrapper">
                <feature.icon size={28} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Step by Step Guide */}
      <section className="dropshipping-steps">
        <div className="dropshipping-section-header">
          <h2>How to Start Dropshipping in 5 Steps</h2>
          <p>Follow our simple dropshipping pipeline to start booking orders today.</p>
        </div>
        <div className="steps-timeline">
          {steps.map((step) => (
            <div key={step.num} className="dropshipping-step-item">
              <div className="dropshipping-step-badge">
                <step.icon size={20} />
              </div>
              <div className="dropshipping-step-content">
                <span className="dropshipping-step-number">Step {step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEO Copy Section */}
      <section className="dropshipping-seo-copy">
        <div className="seo-copy-content">
          <h2>India’s Leading Saree Dropshipping & Suit Dropshipping Platform</h2>
          <p>
            The Indian ethnic wear market is experiencing an unprecedented global surge. With Weave 365, starting a <strong>saree dropshipping</strong> or <strong>suit dropshipping</strong> business has never been easier. We eliminate the biggest friction points of traditional retail—sourcing genuine handlooms, carrying expensive inventory, quality checking delicate silks, and packing.
          </p>
          <p>
            By utilizing our <strong>free saree dropshipping program</strong>, you gain immediate access to a live, curated catalog of hundreds of premium Banarasi sarees and suits. Our blind-shipping guarantee ensures that your brand equity is protected. Leverage our advanced white-label tools, connect your custom domain, share on WhatsApp with a tap, and begin scaling your fashion dropshipping store today.
          </p>
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
        <div className="cta-box">
          <h2>Ready to Launch Your Saree Dropshipping Brand?</h2>
          <p>Register today, access our live catalog, set your profit margins, and start selling globally with Varanasi's premium handloom manufacturer.</p>
          <button 
            type="button" 
            className="dropshipping-primary-btn inverse" 
            onClick={handleStartCatalog}
          >
            Access Saree & Suit Catalogue <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
