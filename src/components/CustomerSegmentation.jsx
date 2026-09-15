'use client';

import '../styles/customerSegmentation.css';
import { AppLink } from './AppLink.jsx';
import { 
  Building2, 
  Store, 
  Globe, 
  Share2, 
  Sparkles, 
  ShoppingBag, 
  ArrowRight 
} from './icons.jsx';

const SEGMENTS = [
  {
    id: 'wholesale_bulk',
    title: 'Wholesale & Bulk',
    tag: 'Primary B2B',
    description: 'Direct volume sourcing from master weavers with tiered wholesale pricing, custom lot preparation, and flexible MOQs.',
    ctaText: 'Inquire Bulk Sourcing',
    route: 'bulk-inquiry',
    href: '/bulk-inquiry',
    icon: Building2,
    highlight: true,
  },
  {
    id: 'retail_boutique',
    title: 'Boutique & Retail Store',
    description: 'Curate high-margin Banarasi sarees and suits for your boutique with low MOQ, weaver-direct quality inspection, and repeat restock support.',
    ctaText: 'Browse Boutique Catalog',
    route: 'catalogue',
    href: '/catalogue',
    icon: Store,
    highlight: false,
  },
  {
    id: 'own_website',
    title: 'Website & Dropshipping',
    description: 'Seamless dropshipping and fulfilment for online stores with automated inventory sync, unbranded packaging, and worldwide dispatch.',
    ctaText: 'Get Fulfilment Support',
    route: 'dropshipping',
    href: '/dropshipping',
    icon: Globe,
    highlight: false,
  },
  {
    id: 'whatsapp_instagram',
    title: 'WhatsApp & Social Sellers',
    description: 'Sell Banarasi products with zero inventory. Share unbranded digital catalogues on WhatsApp & Instagram, add your margin, and we fulfil single orders.',
    ctaText: 'Start Reselling',
    route: 'resell-sarees-online',
    href: '/resell-sarees-online',
    icon: Share2,
    highlight: false,
  },
  {
    id: 'private_label',
    title: 'Custom Loom & Private Label',
    description: 'Dedicated loom development for fashion labels and designers, including bespoke jacquard motifs, exclusive colorways, and brand tagging.',
    ctaText: 'Explore Custom Loom',
    route: 'custom-woven',
    href: '/custom-woven',
    icon: Sparkles,
    highlight: false,
  },
  {
    id: 'end_customer',
    title: 'Personal Shopping & Gifting',
    description: 'Authentic handloom and heritage Banarasi sarees and suits direct from Varanasi weavers for weddings, celebrations, and personal collections.',
    ctaText: 'Shop Collection',
    route: 'catalogue',
    href: '/catalogue',
    icon: ShoppingBag,
    highlight: false,
  },
];

export function CustomerSegmentation({ navigate }) {
  const trackSegmentClick = (segment) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'homepage_segment_selection', {
        segment_id: segment.id,
        event_label: segment.title,
      });
    }
  };

  return (
    <section 
      id="customer-segmentation" 
      className="customer-segmentation-section" 
      aria-labelledby="customer-segmentation-heading"
    >
      <div className="customer-segmentation-container">
        
        {/* Editorial Header */}
        <div className="customer-segmentation-header">
          <h2 id="customer-segmentation-heading" className="segmentation-heading">
            How Do You Buy From Us?
          </h2>
          <p className="segmentation-subtitle">
            Select your business model for tailored pricing, minimum order quantities, and dedicated fulfilment support.
          </p>
        </div>

        {/* 6 Distilled Segment Cards */}
        <div className="customer-segmentation-grid">
          {SEGMENTS.map((segment) => {
            const IconComponent = segment.icon;
            return (
              <article 
                key={segment.id} 
                className={`segment-card ${segment.highlight ? 'highlighted-segment' : ''}`}
              >
                <AppLink
                  to={segment.route}
                  href={segment.href}
                  className="segment-card-link"
                  navigate={navigate}
                  onClick={() => trackSegmentClick(segment)}
                  aria-label={`${segment.title} - ${segment.ctaText}`}
                >
                  <div className="segment-card-header">
                    <div className="segment-icon" aria-hidden="true">
                      <IconComponent size={24} strokeWidth={1.5} />
                    </div>
                    {segment.tag && (
                      <span className="segment-tag">{segment.tag}</span>
                    )}
                  </div>

                  <h3 className="segment-card-title">{segment.title}</h3>
                  <p className="segment-card-description">{segment.description}</p>

                  <div className="segment-card-action">
                    <span className="segment-action-text">{segment.ctaText}</span>
                    <ArrowRight size={16} className="segment-action-arrow" aria-hidden="true" />
                  </div>
                </AppLink>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
