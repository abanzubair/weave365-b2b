import { useState } from 'react';
import { Sparkles, PackageCheck, Send, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { storeConfig } from '../config.js';
import { WhatsappIcon } from './WhatsappIcon.jsx';

export default function EmptyCategorySourcing({ categoryName = 'Banarasi', navigate }) {
  const [quantity, setQuantity] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quantity || !contact) return;

    const whatsappLines = [
      `Hello ${storeConfig.name}, I want to make a Sourcing Enquiry.`,
      '',
      `Category: ${categoryName}`,
      `Quantity Needed: ${quantity}`,
      `Contact Info: ${contact}`,
      message ? `Requirement Notes: ${message}` : '',
      '',
      `Requested from empty category concierge on Weave365.`
    ].filter(Boolean);

    const whatsappUrl = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(whatsappLines.join('\n'))}`;
    
    setSubmitted(true);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const alternatives = [
    {
      title: 'Pure Katan Silk',
      tagline: 'Classic handwoven gold & silver zari bridal masterpieces',
      slug: 'katan-silk-sarees'
    },
    {
      title: 'Organza Banarasi',
      tagline: 'Lightweight, translucent sheer luxury in pastel tones',
      slug: 'organza-banarasi-sarees'
    },
    {
      title: 'Meenakari Sarees',
      tagline: 'Vibrant, multicolored enamel-effect artisan handloom weaves',
      slug: 'meenakari-sarees'
    },
    {
      title: 'Soft Silk Collections',
      tagline: 'Supple lightweight, budget-friendly high-turnover weaves',
      slug: 'soft-silk-sarees'
    }
  ];

  return (
    <div className="empty-category-sourcing">
      {/* 1. Prestige Status & Curation Section */}
      <div className="concierge-narrative-section">
        <div className="concierge-badge">
          <Sparkles size={16} />
          <span>Loom curation active</span>
        </div>
        
        <h2>Curating the Loom: {categoryName} Sourcing</h2>
        <p className="narrative-p">
          Our master weavers in Varanasi are currently curating and hand-weaving the next exclusive B2B batch for this collection. Every design is checked to meet our strict quality standards, passing direct loom savings to boutique owners.
        </p>

        <div className="narrative-trust-row">
          <div className="trust-indicator">
            <ShieldCheck size={18} />
            <span>Vetted Weaver Curation</span>
          </div>
          <div className="trust-indicator">
            <PackageCheck size={18} />
            <span>Secure Global Export Shipping</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Bespoke Sourcing Mini-Form Section */}
      <div className="concierge-sourcing-form-section">
        <div className="form-heading-row">
          <div className="form-icon-circle">
            <HelpCircle size={22} />
          </div>
          <div className="form-title-col">
            <h3>Looking for Specific Wholesale Designs?</h3>
            <p>Tell us your custom fabric, pattern, or color requirements. Our weavers will manufacture or custom-source them directly from Varanasi.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="concierge-mini-form">
          <div className="form-grid">
            <label className="form-label">
              Quantity / Sets Needed *
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 15 pieces, 5 sets"
                required
                className="sourcing-input"
              />
            </label>

            <label className="form-label">
              WhatsApp or Email *
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g., +91 9876543210, boutique@example.com"
                required
                className="sourcing-input"
              />
            </label>

            <label className="form-label full-width">
              Fabric or Weave Details (Optional)
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mention specific colors, border styles, zari preferences, budget slab, or timeline..."
                rows={3}
                className="sourcing-textarea"
              />
            </label>
          </div>

          <div className="form-submit-row">
            <button type="submit" className="sourcing-submit-btn">
              <WhatsappIcon size={16} />
              <span>Submit Custom Sourcing Inquiry</span>
              <Send size={14} className="send-arrow" />
            </button>
            {submitted && (
              <p className="sourcing-success-msg">
                WhatsApp inquiry formatted. Connecting you directly to the weaver concierge...
              </p>
            )}
          </div>
        </form>
      </div>

      {/* 3. Alternative Active Collections (SEO Internal Links Grid) */}
      <div className="sourcing-alternatives-section">
        <h3>Explore Premium Active Sourcing Collections</h3>
        <p className="alternatives-desc">Keep your boutique inventory stocked with our ready-to-ship authentic Varanasi masterpieces:</p>
        
        <div className="alternatives-grid">
          {alternatives.map((alt) => (
            <button type="button"
              key={alt.slug}
              onClick={() => navigate(alt.slug)}
              className="alternative-card"
            >
              <span className="alt-category">Collection</span>
              <h4>{alt.title}</h4>
              <p>{alt.tagline}</p>
              <div className="alt-action-row">
                <span>Browse Catalogue</span>
                <ArrowRight size={14} className="arrow" />
              </div>
            </button>
          ))}
        </div>

        <div className="view-full-catalog-row">
          <button type="button" onClick={() => navigate('wholesale-catalogue')} className="full-catalog-link">
            <span>View Full Wholesale Catalogue</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
