import { useState, useMemo } from 'react';
import { Sparkles, PackageCheck, Send, ArrowRight, ShieldCheck, HelpCircle, ChevronDown, Check } from './icons.jsx';
import { storeConfig } from '../config.js';
import { WhatsappIcon } from './WhatsappIcon.jsx';
import '../styles/emptyCategorySourcing.css';

// Dynamic persona configurations for empty categories to optimize SEO and search intent
const categoryPersonas = {
  lehenga: {
    h2: 'Varanasi Weaving Clusters: Custom Lehenga Production',
    narrative: 'Our weaving clusters in Varanasi custom-craft Banarasi Lehengas. From heavy bridal wear to light festive sets, we support custom color matches, panel sizes (Kalis), and custom border work. Available for individual bridal orders as well as retail boutique sourcing.',
    badge: 'Bridal & Boutique Custom Weaves',
    fabricBaseOptions: ['Pure Katan Silk', 'Tissue Silk Blend', 'Banarasi Organza', 'Pure Silk Georgette'],
    workOptions: ['Kadwa Gold & Silver Zari', 'Antique Metallic Zari', 'Resham Threadwork', 'Meenakari Border Work'],
    faqs: [
      {
        q: 'Can I order a single piece for personal or bridal wear?',
        a: 'Yes, absolutely! We welcome individual bridal and personal wear orders. You can order a single semi-stitched lehenga set customized to your specifications.'
      },
      {
        q: 'What options are available for custom lehengas?',
        a: 'You can choose your base fabric (Katan silk, organza, georgette), select the zari or threadwork style (real gold/silver, tested zari, antique), and request custom color matching.'
      },
      {
        q: 'How long does custom weaving and delivery take?',
        a: 'Depending on design complexity, custom weaving takes 3 to 6 weeks. Finishing, quality inspection, and worldwide transit take an additional 5 to 7 days.'
      },
      {
        q: 'Do you offer discount pricing for retail stores or boutiques?',
        a: 'Yes! Boutique owners and resellers can place custom production orders for 5 or more sets to unlock wholesale tier pricing.'
      }
    ]
  },
  fabric: {
    h2: 'Varanasi Silk Fabrics: Made-To-Order Yardage',
    narrative: 'Source authentic Varanasi fabrics by the meter. We dye and weave custom brocades, Tanchoi, satin, organza, georgette and many more fabrics. Perfect for fashion designers, couture houses, and retail textile boutiques.',
    badge: 'Loom-Direct Yardage & Custom Dyeing',
    fabricBaseOptions: ['Pure Katan Silk (72/90 gms)', 'Satin Brocade', 'Tanchoi Silk', 'Sheer Silk Organza', 'Chinnon Georgette'],
    workOptions: ['All-over Brocade (Jal)', 'Butidar Motif Weave', 'Tanchoi Self-Weave', 'Geometrical Borders'],
    faqs: [
      {
        q: 'What is the minimum order length for custom fabric runs?',
        a: 'For custom colors or weaving patterns, our minimum run is 15 meters per design. For active running colors, we can accommodate orders starting from 5 meters.'
      },
      {
        q: 'Do you sell fabrics for individual designer projects?',
        a: 'Yes! We support D2C/B2C designers and retail customers. You can request custom yardage for personal outfits or boutique test creations.'
      },
      {
        q: 'Are the fabrics pure silk or blended options?',
        a: 'We offer both options: 100% pure silk certified by Silk Mark, and premium high-quality blended fabrics to meet different client budget requirements.'
      },
      {
        q: 'Can I request custom dyeing for specific Pantone codes?',
        a: 'Yes! You can provide a digital Pantone code or ship a physical fabric swatch. Our master dyers in Varanasi will dye the yarn to match your shade.'
      }
    ]
  },
  dupatta: {
    h2: 'Varanasi Dupattas: Tailored Statement Accents',
    narrative: 'Order exquisite Varanasi silk and georgette dupattas. These masterfully finished pieces feature heritage borders and motifs (Jangla, Shikargah, Ashavali) to elevate any suit, lehenga, or fusion outfit. Available for retail buyers and boutique volume sourcing.',
    badge: 'Tailored Dupattas & Color-Matches',
    fabricBaseOptions: ['Pure Katan Silk', 'Pure Chiffon/Georgette', 'Sheer Banarasi Organza', 'Tanchoi Silk Accents'],
    workOptions: ['Jangla Floral Jaal', 'Shikargah (Hunting Scenes)', 'Kadhwa Gold Border', 'Delicate Ektara Weave'],
    faqs: [
      {
        q: 'Can I purchase a single dupatta for retail/personal use?',
        a: 'Yes, our Varanasi dupattas are popular single-piece purchases! You can order individual pieces in custom colors to complete your personal outfits.'
      },
      {
        q: 'How do I request a custom color match for my suit/lehenga?',
        a: 'Simply share a photo or physical swatch of your dress base, and we will dye the yarns and weave a matching dupatta border and body.'
      },
      {
        q: 'What are the standard dimensions of your dupattas?',
        a: 'Our standard dupattas are 2.5 meters in length and 36 to 44 inches in width. Custom widths can be woven on order request.'
      },
      {
        q: 'Is wholesale batch pricing available for boutique owners?',
        a: 'Yes, boutique owners looking to match suits or build an inventory can place a custom order for 10 or more pieces to qualify for wholesale rates.'
      }
    ]
  },
  default: {
    h2: 'Varanasi Custom Sourcing & Loom Clusters',
    narrative: 'We connect retail buyers, boutiques, and designers directly to active weaving clusters in Varanasi. Custom-order specific colors, designs, and dimensions in sarees, suits, fabrics, and bridal wear.',
    badge: 'Varanasi Loom Customization Active',
    fabricBaseOptions: ['Pure Katan Silk', 'Banarasi Organza', 'Silk Georgette', 'Fine Art Silk blends'],
    workOptions: ['Gold & Silver Zari', 'Imitation Metallic Zari', 'Resham Threadwork', 'Zari Brocade'],
    faqs: [
      {
        q: 'How do I place a custom order request?',
        a: 'Simply fill out our custom order desk form, select your desired fabric and work parameters, and submit it. Our concierge team will connect with you on WhatsApp with direct loom options.'
      },
      {
        q: 'What is the return policy for custom weaver orders?',
        a: 'Since custom orders are woven or dyed specifically to your request, we do not accept returns unless there is a structural weaving defect.'
      },
      {
        q: 'Do you deliver internationally?',
        a: 'Yes! We ship worldwide via DHL and FedEx. International delivery typically takes 5 to 9 days after the product is woven and finished.'
      }
    ]
  }
};

export default function EmptyCategorySourcing({ categoryName = 'Banarasi', navigate }) {
  const normalizedKey = categoryName.toLowerCase().trim();
  
  // Resolve key to lehenga/fabric/dupatta or fallback
  const categoryKey = useMemo(() => {
    if (normalizedKey.includes('fabric')) return 'fabric';
    if (normalizedKey.includes('lehenga') || normalizedKey.includes('lhenga')) return 'lehenga';
    if (normalizedKey.includes('dupatta')) return 'dupatta';
    return 'default';
  }, [normalizedKey]);

  const persona = categoryPersonas[categoryKey];

  // Custom Sourcing Form State
  const [qtyPreset, setQtyPreset] = useState('Single Piece (Personal / Bridal)');
  const [customQty, setCustomQty] = useState('');
  const [fabricBase, setFabricBase] = useState(persona.fabricBaseOptions[0]);
  const [workType, setWorkType] = useState(persona.workOptions[0]);
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Accordion FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleQtyPresetClick = (preset) => {
    setQtyPreset(preset);
    if (preset !== 'Custom Quantity') {
      setCustomQty('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contact) return;

    const finalQty = qtyPreset === 'Custom Quantity' ? customQty : qtyPreset;

    const whatsappLines = [
      `Hello ${storeConfig.name}, I want to make a Custom Loom / Sourcing Inquiry.`,
      '',
      `Category: ${categoryName}`,
      `Quantity: ${finalQty}`,
      `Fabric Base: ${fabricBase}`,
      `Work / Zari Type: ${workType}`,
      `Contact Info: ${contact}`,
      notes ? `Requirements: ${notes}` : '',
      '',
      `Requested from empty category concierge on Weave365.`
    ].filter(Boolean);

    const whatsappUrl = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(whatsappLines.join('\n'))}`;
    
    setSubmitted(true);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const alternatives = [
    {
      title: 'Banarasi Sarees',
      tagline: 'Authentic silk handloom & powerloom masterpieces',
      slug: 'sarees'
    },
    {
      title: 'Banarasi Suits',
      tagline: 'Premium unstitched fabric sets & salwar materials',
      slug: 'suits'
    },
    {
      title: 'Under 999 Store',
      tagline: 'Affordable luxury Banarasi weaves for daily/festive wear',
      slug: 'under-999'
    },
    {
      title: 'New Arrivals',
      tagline: 'Browse our latest designs fresh from Varanasi looms',
      slug: 'new-arrivals'
    }
  ];

  return (
    <div className="empty-category-sourcing">
      {/* 1. Prestige Status & Curation Section */}
      <div className="concierge-narrative-section">
        <div className="concierge-badge">
          <Sparkles size={16} />
          <span>{persona.badge}</span>
        </div>
        
        <h2>{persona.h2}</h2>
        <p className="narrative-p">
          {persona.narrative}
        </p>

        <div className="narrative-trust-row">
          <div className="trust-indicator">
            <ShieldCheck size={18} />
            <span>Vetted Artisan Clusters</span>
          </div>
          <div className="trust-indicator">
            <PackageCheck size={18} />
            <span>Worldwide Insured Shipping</span>
          </div>
        </div>
      </div>

      {/* 2. Split Content Layout */}
      <div className="empty-category-split-layout">
        
        {/* Left Column: Craft Journey & FAQs */}
        <div className="split-info-col">
          <div className="craft-process-card">
            <h4>Loom Production Stages</h4>
            <p className="section-subtitle-p">How your custom design comes to life from Varanasi weavers:</p>
            
            <div className="sourcing-process-timeline">
              <div className="sourcing-timeline-step">
                <div className="sourcing-timeline-step-number">1</div>
                <div className="sourcing-timeline-step-content">
                  <h5>Design Mapping</h5>
                  <p>Patterns are graphed onto punch-cards for handloom Jacquard or setup for precision powerlooms depending on design complexity.</p>
                </div>
              </div>
              <div className="sourcing-timeline-step">
                <div className="sourcing-timeline-step-number">2</div>
                <div className="sourcing-timeline-step-content">
                  <h5>Yarn Preparation & Dyeing</h5>
                  <p>Yarns are custom dyed to match your precise Pantone shade or bridal color scheme before warping the loom.</p>
                </div>
              </div>
              <div className="sourcing-timeline-step">
                <div className="sourcing-timeline-step-number">3</div>
                <div className="sourcing-timeline-step-content">
                  <h5>Weaving & Finishing</h5>
                  <p>Master artisans weave the pattern. The fabric is cut, steam-pressed, and checked for absolute quality before dispatch.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive B2C/B2B FAQ Accordion */}
          <div className="sourcing-faqs-section">
            <h4>Frequently Asked Questions</h4>
            <div className="faq-accordion-group">
              {persona.faqs.map((faq, index) => (
                <div key={index} className={`faq-accordion-item ${openFaq === index ? 'open' : ''}`}>
                  <button type="button" className="faq-accordion-header" onClick={() => toggleFaq(index)}>
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className="faq-arrow-icon" />
                  </button>
                  <div className="faq-accordion-body">
                    <p>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Order/Sourcing Desk Form */}
        <div className="split-form-col">
          <div className="concierge-sourcing-form-card">
            <div className="form-card-header">
              <div className="form-icon-circle">
                <HelpCircle size={20} />
              </div>
              <div>
                <h3>Custom Order Desk</h3>
                <p>Request specific colors, fabric counts, and designs direct from the Varanasi looms.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="concierge-interactive-form">
              {/* Quantity Preset Chips */}
              <div className="form-field-group">
                <span className="field-group-title">Select Quantity Type</span>
                <div className="quantity-preset-grid">
                  {[
                    'Single Piece (Personal / Bridal)',
                    '5-10 Pcs (Boutique Starter)',
                    '10-25 Pcs (Wholesale Batch)',
                    'Custom Quantity'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`qty-preset-chip ${qtyPreset === preset ? 'active' : ''}`}
                      onClick={() => handleQtyPresetClick(preset)}
                    >
                      {qtyPreset === preset && <Check size={12} className="check-icon" />}
                      <span>{preset.split(' (')[0]}</span>
                    </button>
                  ))}
                </div>

                {qtyPreset === 'Custom Quantity' && (
                  <div className="custom-qty-wrapper animate-fade-in">
                    <input
                      type="text"
                      value={customQty}
                      onChange={(e) => setCustomQty(e.target.value)}
                      placeholder="Enter quantity (e.g. 80 meters, 3 sets)"
                      required
                      className="sourcing-text-input"
                    />
                  </div>
                )}
              </div>

              {/* Fabric Base Dropdown */}
              <div className="form-field-group">
                <label className="form-field-label" htmlFor="fabric-base-select">
                  Preferred Fabric Base
                </label>
                <div className="select-wrapper">
                  <select
                    id="fabric-base-select"
                    value={fabricBase}
                    onChange={(e) => setFabricBase(e.target.value)}
                    className="sourcing-select"
                  >
                    {persona.fabricBaseOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="select-arrow" />
                </div>
              </div>

              {/* Work Type Dropdown */}
              <div className="form-field-group">
                <label className="form-field-label" htmlFor="work-type-select">
                  Weave / Zari / Work Type
                </label>
                <div className="select-wrapper">
                  <select
                    id="work-type-select"
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="sourcing-select"
                  >
                    {persona.workOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="select-arrow" />
                </div>
              </div>

              {/* Contact Info (WhatsApp/Email) */}
              <div className="form-field-group">
                <label className="form-field-label" htmlFor="contact-input">
                  Your WhatsApp or Email *
                </label>
                <input
                  id="contact-input"
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. +91 98765 43210, name@example.com"
                  required
                  className="sourcing-text-input"
                />
              </div>

              {/* Custom instructions / color matching details */}
              <div className="form-field-group">
                <label className="form-field-label" htmlFor="notes-textarea">
                  Preferred Colors or Custom Notes (Optional)
                </label>
                <textarea
                  id="notes-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe specific colors, patterns, border requirements, or custom weaving instructions..."
                  rows={3}
                  className="sourcing-textarea"
                />
              </div>

              <div className="form-submit-row">
                <button type="submit" className="sourcing-submit-btn">
                  <WhatsappIcon size={16} />
                  <span>Submit Custom Order Request</span>
                  <Send size={14} className="send-arrow" />
                </button>
                {submitted && (
                  <p className="sourcing-success-msg">
                    Opening WhatsApp to submit your request...
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* 3. Alternative Active Collections (SEO Internal Links Grid) */}
      <div className="sourcing-alternatives-section">
        <h3>Browse Active Collections</h3>
        <p className="alternatives-desc">Explore live products and designs ready for immediate dispatch:</p>
        
        <div className="alternatives-grid">
          {alternatives.map((alt) => (
            <button type="button"
              key={alt.slug}
              onClick={() => navigate(alt.slug)}
              className="alternative-card"
            >
              <span className="alt-category">Active Catalogue</span>
              <h4>{alt.title}</h4>
              <p>{alt.tagline}</p>
              <div className="alt-action-row">
                <span>Explore Now</span>
                <ArrowRight size={14} className="arrow" />
              </div>
            </button>
          ))}
        </div>

        <div className="view-full-catalog-row">
          <button type="button" onClick={() => navigate('catalogue', null, null, { category: 'All', fabric: 'All', weave: 'All', search: '' })} className="full-catalog-link">
            <span>View Full Catalogue</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
