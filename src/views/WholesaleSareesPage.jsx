/**
 * @file WholesaleSareesPage.jsx
 * @description Dedicated High-Intent B2B Landing Page for Wholesale Banarasi Sarees.
 * Targets wholesale buyers, boutiques, exporters, and captive manufacturing clients.
 * Integrates B2B Starter Trial Pack, Varanasi Weaving Clusters Spotlight,
 * Captive Manufacturing Workflows, Live Product Grid, and Sticky WhatsApp CTA.
 * 
 * @module views/WholesaleSareesPage
 */

import { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Building2, 
  Globe, 
  ShieldCheck, 
  ShoppingBag, 
  Truck, 
  ChevronDown,
  Layers,
  Award,
  Factory,
  Tag,
  Palette,
  MapPin
} from '../components/icons.jsx';
import { WhatsappIcon } from '../components/WhatsappIcon.jsx';
import { AppLink } from '../components/AppLink.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { storeConfig } from '../config.js';
import '../styles/wholesaleSarees.css';

export function WholesaleSareesPage({ navigate }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const whatsappPhone = String(storeConfig.whatsapp || storeConfig.phone || '9919101369').replace(/\D/g, '');
  const fullPhone = whatsappPhone.length === 10 ? `91${whatsappPhone}` : whatsappPhone;
  
  const trialPackWaLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent(
    'Hi Weave 365, I have a question regarding wholesale Banarasi sarees and the Starter Trial Pack.'
  )}`;

  const trialPackAssurances = [
    {
      icon: ShieldCheck,
      title: 'Fabric & Zari Transparency',
      desc: 'Check fabric composition, zari type and weave details before placing your wholesale Banarasi saree order.'
    },
    {
      icon: Layers,
      title: 'Mix & Match – No Full Sets',
      desc: 'Choose any 4–5 sarees for your trial pack. Mix and match styles across Katan, Organza, Georgette, Soft Silk and Tissue.'
    },
    {
      icon: Truck,
      title: 'Dispatch from Varanasi',
      desc: 'We carefully pack your sarees and ship them to your address. Courier tracking details are shared once your order is dispatched.'
    }
  ];

  const processSteps = [
    {
      num: '01',
      icon: ShoppingBag,
      title: 'Explore Live Catalogue or Send Tech-Packs',
      desc: 'Browse our real-time catalogue of handloom, semi-handloom & powerloom Banarasi sarees, or submit custom designs and CAD graph cards for bespoke captive weaving.'
    },
    {
      num: '02',
      icon: Factory,
      title: 'Order-Based Loom Allocation',
      desc: 'Dedicated looms in Varanasi weaving clusters are booked exclusively for your order, eliminating middle man and warehouse costs.'
    },
    {
      num: '03',
      icon: Layers,
      title: 'Direct-from-Loom Wholesale Rates',
      desc: 'No middlemen and zero trader commissions. You get authentic loom-level pricing with healthy retail margins of 40% to 60%.'
    },
    {
      num: '04',
      icon: ShieldCheck,
      title: '4-Point Artisan Quality Check',
      desc: 'Every saree is carefully checked for weaving defects, zari float trimming, fabric quality and overall finishing before final packing.'
    },
    {
      num: '05',
      icon: Tag,
      title: 'Private Label & Custom Branding',
      desc: 'We attach your boutique labels, custom hangtags, branded packaging, and wash-care inserts prior to dispatch, protecting your customer loyalty.'
    },
    {
      num: '06',
      icon: Truck,
      title: 'Global Doorstep Dispatch',
      desc: 'Orders are packed in weather-sealed export cartons and shipped via express couriers (DHL, Blue Dart, Aramex and India Post), with tracking provided after dispatch.'
    }
  ];

  const targetBuyers = [
    {
      icon: Building2,
      title: 'Wholesalers & Distributors',
      desc: 'Procure high-volume commercial consignments directly from Varanasi clusters at true loom-gate rates, avoiding intermediate Chowk trader markups.',
      perk: 'Tiered Bulk Slabs & Dedicated Looms'
    },
    {
      icon: ShoppingBag,
      title: 'Retail Showrooms & Stores',
      desc: 'Refresh your festive and bridal collections with katan silk, mashru silk, chiffon, georgette, kora organza, and tissue sarees with guaranteed batch consistency.',
      perk: 'Direct Quality & Provenance'
    },
    {
      icon: Globe,
      title: 'Overseas Importers & NRI Boutiques',
      desc: 'Import authentic Banarasi sarees to the USA, UK, UAE, Canada, Australia, Singapore and Malaysia with standard HS 5007 classification and express air cargo.',
      perk: 'Doorstep Global Delivery'
    },
    {
      icon: Award,
      title: 'Bridal & Designer Boutiques',
      desc: 'Curate exclusive handloom and semi-handloom masterpieces for luxury brides. Order micro-batches without locking capital in rigid multi-piece sets.',
      perk: 'Flexible Mix & Match MOQ'
    },
    {
      icon: Palette,
      title: 'Fashion Designers & Couturiers',
      desc: 'We weave bespoke Banarasi saree collections on captive looms across Varanasi, and produce custom weaves and exclusive designs on demand.',
      perk: 'Bespoke Captive Weaving'
    },
    {
      icon: Sparkles,
      title: 'Online Brands & Social Resellers',
      desc: 'Scale your ethnic wear e-commerce brand with white-label catalogues, high-resolution product images, and zero-inventory dropshipping with on-demand fulfilment.',
      perk: 'Digital Asset Support & Fast Dispatch'
    }
  ];

  const weavingClusters = [
    {
      name: 'Chowk & Madanpura',
      craft: 'The historic cradle of Banaras textile heritage, home to generational master weavers specializing in pure Katan silk, intricate Kadhwa brocades, and heavy bridal Jangla jaals with zero loose threads on the reverse.',
      specialty: 'Pure Katan Silk & Kadhwa Handlooms'
    },
    {
      name: 'Bajardiha & Lallapura',
      craft: 'Varanasi’s bustling artisan quarters renowned for precision jacquard weaving, sheer Kora Organza sarees, delicate Meenakari resham inlays, and pastel festive drapes crafted for modern boutiques.',
      specialty: 'Kora Organza, Meenakari & Jacquard'
    },
    {
      name: 'Bunkar Colony & Pilikothi',
      craft: 'Dedicated weaver settlements and yarn-to-loom clusters famous for fluid Khaddi Georgette, pure metallic tissue, and lustrous satin silk sarees featuring rich zari cutwork bootis and designer borders.',
      specialty: 'Khaddi Georgette, Tissue & Satin'
    },
    {
      name: 'Lohta & Ramnagar',
      craft: 'The premier high-volume production belt of Varanasi, optimized for large-scale wedding gifting sarees, cost-effective dupion blends, and fast-turnaround commercial inventory for wholesale distributors.',
      specialty: 'High-Volume Gifting & Silk Blends'
    }
  ];

  const faqs = [
    {
      q: 'What is the B2B Starter Trial Pack (Buy Any 4–5 Sarees at Wholesale Rates)?',
      a: 'The B2B Starter Trial Pack allows boutiques, retailers, and online resellers to test authentic Varanasi Banarasi sarees before committing to large bulk volumes. Business buyers can select any 4 to 5 sarees across our catalog—mixing fabrics like Katan silk, Kora Organza, Khaddi Georgette, and Tissue—at true wholesale prices. Under our Trial Pack Cost Adjustment Guarantee, when you place subsequent bulk orders, 10% of each bulk order value is credited back until 100% of your trial pack cost is fully adjusted.'
    },
    {
      q: 'Do you enforce mandatory multi-piece design sets, or can buyers mix and match?',
      a: 'No, Weave 365 does not enforce rigid color or design sets. Unlike traditional Chowk wholesale traders who force buyers to purchase 10 to 20 identical sarees of one design, we allow complete curation flexibility. You can handpick individual sarees across different fabrics, weaves, colors, and price points to match your specific customer demand.'
    },
    {
      q: 'How does Weave 365 verify fabric quality and authentic weaving without middlemen?',
      a: 'Every saree undergoes a rigorous 4-point artisan quality audit before packing—inspecting warp-weft alignment, zari float trimming, weave uniformity, and fabric finish. We provide 100% material transparency by detailing yarn composition (pure silk, semi-silk, organza, tissue) on tech specs, and provide high-definition inspection videos and weave swatches so buyers can order with complete peace of mind.'
    },
    {
      q: 'Can overseas boutiques and international retailers import wholesale Banarasi sarees directly from Varanasi?',
      a: 'Yes, Weave 365 exports authentic Banarasi sarees directly from Varanasi to boutiques and distributors across the USA, UK, UAE, Canada, Australia, Singapore, and Malaysia. We manage complete export documentation, standard HS Code 5007 classifications, commercial invoices, and doorstep air express courier delivery via DHL, Blue Dart, Aramex, and India Post with full shipment tracking.'
    },
    {
      q: 'Can fashion designers and private labels order custom Banarasi weaves and bespoke designs?',
      a: 'Yes. We partner with fashion designers, couture labels, and private brands for custom captive weaving. You can provide your tech-packs, bespoke motifs, Pantone references, or CAD graph cards. Our Varanasi master weavers will produce strike-off sample swatches for approval before running the production batch, complete with custom boutique labels, hangtags, and branded packaging.'
    },
    {
      q: 'How does order-based captive manufacturing work for wholesale Banarasi sarees at Weave 365?',
      a: 'Weave 365 operates an on-demand captive manufacturing model connecting buyers directly to Varanasi weaving clusters. Instead of holding speculative warehouse dead-stock, dedicated looms in clusters like Madanpura, Bajardiha, Pilikothi, and Lohta are allocated exclusively to your order. This eliminates distributor markups, guarantees freshly woven sarees, enables custom colorways, and passes authentic loom-level wholesale pricing directly to you.'
    }
  ];

  const breadcrumbItems = [
    { name: 'Home', url: '/', route: 'home' },
    { name: 'Wholesale Sarees' }
  ];

  const scrollToTrialPack = () => {
    const el = document.getElementById('b2b-trial-pack');
    if (!el) return;
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 80;
    const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = Math.max(0, elementPosition - headerHeight - 24);

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  };

  return (
    <article className="ws-page-container">
      {/* 1. HERO SECTION */}
      <section className="ws-hero">
        <Breadcrumb items={breadcrumbItems} navigate={navigate} />

        <div className="ws-hero-inner">
          <div className="ws-hero-content">
            <h1 className="ws-hero-title">
              Wholesale Banarasi Saree
              <span className="ws-title-accent">Manufacturer, Exporter &amp; Supplier.</span>
            </h1>

            <p className="ws-hero-description">
              We source authentic Banarasi sarees directly from master artisans and weaving clusters in Varanasi. Our order-based manufacturing model keeps the supply chain direct, allowing us to offer genuine Banarasi sarees at competitive loom-level wholesale prices, without middlemen or distributor markups. We cater to bulk requirements of boutiques, retailers, wholesalers, exporters and fashion designers across India and worldwide.
            </p>

            <div className="ws-hero-actions">
              <AppLink 
                to="catalogue" 
                href="/catalogue"
                navigate={navigate}
                className="ws-btn-primary"
              >
                <span>Browse Wholesale Catalog</span>
                <ArrowRight size={17} />
              </AppLink>

              <button 
                type="button" 
                className="ws-btn-secondary"
                onClick={scrollToTrialPack}
              >
                <span>Order Starter Trial Pack</span>
              </button>
            </div>

            {/* Metrics Trust Strip */}
            <div className="ws-metrics-strip">
              <div className="ws-metric-item">
                <span className="ws-metric-stat">4–5 Pcs</span>
                <span className="ws-metric-label">Starter Trial Pack</span>
              </div>
              <div className="ws-metric-divider" />
              <div className="ws-metric-item">
                <span className="ws-metric-stat">50+</span>
                <span className="ws-metric-label">Master Weavers</span>
              </div>
              <div className="ws-metric-divider" />
              <div className="ws-metric-item">
                <span className="ws-metric-stat">100%</span>
                <span className="ws-metric-label">Authentic Banarasi Sarees</span>
              </div>
              <div className="ws-metric-divider" />
              <div className="ws-metric-item">
                <span className="ws-metric-stat">10+</span>
                <span className="ws-metric-label">Export Countries</span>
              </div>
            </div>
          </div>

          <div className="ws-hero-visual">
            <div className="ws-hero-photo-card">
              <img 
                src="/wholesale-banarasi-saree-hero.webp?v=loom-v1" 
                alt="Traditional handloom in Varanasi weaving cluster crafting authentic Banarasi saree"
                loading="eager"
                width={800}
                height={600}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="ws-section-divider" />

      {/* 2. B2B STARTER TRIAL PACK SECTION (The Core Trust Driver) */}
      <section id="b2b-trial-pack" className="ws-trial-pack-section">
        <div className="ws-trial-pack-inner">
          <h2 className="ws-trial-title">
            B2B Starter Trial Pack: Buy Any 4–5 Sarees at True Wholesale Rates
          </h2>

          <p className="ws-trial-subtitle">
            Not sure about the fabric quality, zari work or weaving finish? Start with our 4–5 piece Banarasi Saree Trial Pack, sourced directly from weaving clusters in Varanasi. Check the fabric, zari details and craftsmanship first-hand before committing to a larger wholesale order. Ideal for boutiques, retailers, wholesalers and exporters who want to assess authentic Varanasi Banarasi sarees before buying in bulk.
          </p>

          <div className="ws-trial-guarantee-box">
            <div className="ws-trial-guarantee-icon">
              <Award size={22} />
            </div>
            <div className="ws-trial-guarantee-content">
              <h3 className="ws-trial-guarantee-heading">Trial Pack Cost Adjustment Guarantee</h3>
              <p className="ws-trial-guarantee-text">
                Place a bulk order after your trial pack, and we will credit 10% of each subsequent bulk order value towards your original trial pack cost, until the full trial pack amount is adjusted.
              </p>
            </div>
          </div>

          <div className="ws-trial-features-grid">
            {trialPackAssurances.map((feat, idx) => {
              const FeatIcon = feat.icon;
              return (
                <div className="ws-trial-feature-item" key={idx}>
                  <div className="ws-trial-feature-icon">
                    <FeatIcon size={20} />
                  </div>
                  <div className="ws-trial-feature-text">
                    <h3 className="ws-trial-feature-title">{feat.title}</h3>
                    <p className="ws-trial-feature-desc">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ws-trial-actions">
            <AppLink 
              to="catalogue" 
              href="/catalogue"
              navigate={navigate}
              className="ws-btn-trial-catalog"
            >
              <span>Select Sarees from Catalog</span>
              <ArrowRight size={17} />
            </AppLink>

            <a 
              href={trialPackWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ws-btn-trial-wa"
            >
              <WhatsappIcon size={19} className="ws-wa-icon" />
              <span>Questions? WhatsApp us</span>
            </a>
          </div>
        </div>
      </section>

      <div className="ws-section-divider" />

      {/* 3. CAPTIVE MANUFACTURING & PROCESS STEPS */}
      <section className="ws-process-section">
        <div className="ws-section-header">
          <h2 className="ws-section-title">Order-Based Captive Manufacturing Architecture</h2>
          <p className="ws-section-desc">
            How Weave 365 Delivers Banarasi Weaves Directly from Weaving Clusters and Master Weavers Without Holding Excess Inventory.
          </p>
        </div>

        <div className="ws-process-grid">
          {processSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div className="ws-process-card" key={idx}>
                <div className="ws-process-top">
                  <div className="ws-process-icon-box">
                    <Icon size={20} />
                  </div>
                  <span className="ws-process-num">{step.num}</span>
                </div>
                <h3 className="ws-process-card-title">{step.title}</h3>
                <p className="ws-process-card-desc">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="ws-section-divider" />

      {/* 4. TARGET BUYER PROFILES (WHO WE SERVE) */}
      <section className="ws-buyers-section">
        <div className="ws-section-header">
          <h2 className="ws-section-title">Built for Wholesalers, Retailers, Boutiques &amp; Global Exporters</h2>
          <p className="ws-section-desc">
            Direct-from-loom procurement connecting wholesale buyers, boutique owners, and global exporters directly to Varanasi weaving clusters, with true wholesale pricing, flexible MOQs, and worldwide doorstep delivery.
          </p>
        </div>

        <div className="ws-buyers-grid">
          {targetBuyers.map((buyer, idx) => {
            const Icon = buyer.icon;
            return (
              <div className="ws-buyer-card" key={idx}>
                <div className="ws-buyer-icon-wrap">
                  <Icon size={19} />
                </div>
                <h3 className="ws-buyer-title">{buyer.title}</h3>
                <p className="ws-buyer-desc">{buyer.desc}</p>
                <span className="ws-buyer-perk">{buyer.perk}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="ws-section-divider" />

      {/* 5. VARANASI WEAVING CLUSTERS (GEO SPOTLIGHT) */}
      <section className="ws-clusters-section">
        <div className="ws-section-header">
          <h2 className="ws-section-title">Varanasi's Historic Weaving Hubs &amp; Master Weaver Clusters</h2>
          <p className="ws-section-desc">
            Every saree at Weave 365 is sourced directly from generational weaving communities across Varanasi, including Madanpura, Bajardiha, Lallapura, Bunkar Colony, Pilikothi, Ramnagar, Lohta and Kotwan. By working directly at the loom level, we bring you authentic Banarasi craftsmanship, transparent fabric details, and direct weaver wholesale rates without intermediary markups.
          </p>
        </div>

        <div className="ws-clusters-grid">
          {weavingClusters.map((cluster, idx) => (
            <div className="ws-cluster-card" key={idx}>
              <div className="ws-cluster-icon-box">
                <MapPin size={18} />
              </div>
              <h3 className="ws-cluster-name">{cluster.name}</h3>
              <p className="ws-cluster-craft">{cluster.craft}</p>
              {cluster.specialty && (
                <span className="ws-cluster-specialty">{cluster.specialty}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="ws-section-divider" />

      {/* 6. WHOLESALE CATALOG SHOWCASE & INTERNAL LINK */}
      <section className="ws-catalog-gateway-section">
        <div className="ws-catalog-gateway-inner">
          <div className="ws-section-header" style={{ marginBottom: '1.5rem' }}>
            <h2 className="ws-section-title">Explore Wholesale Banarasi Sarees Direct from Varanasi Looms</h2>
            <p className="ws-section-desc">
              Browse our real-time wholesale catalogue sourced directly from master weavers across Varanasi. Filter verified collections by fabric, including pure Katan silk, Kora Organza, Khaddi Georgette, Tissue, and Mashru brocades, and curate your 4–5 piece Starter Trial Pack or commercial bulk order with complete fabric transparency and loom-gate pricing.
            </p>
          </div>

          <div className="ws-gateway-perks-row">
            <div className="ws-gateway-perk-pill">
              <CheckCircle size={16} />
              <span>Authentic Varanasi Weave Assurance</span>
            </div>
            <div className="ws-gateway-perk-pill">
              <CheckCircle size={16} />
              <span>Flexible Mix &amp; Match (No Sets)</span>
            </div>
            <div className="ws-gateway-perk-pill">
              <CheckCircle size={16} />
              <span>Direct Loom-Gate Pricing</span>
            </div>
            <div className="ws-gateway-perk-pill">
              <CheckCircle size={16} />
              <span>Worldwide Express Shipping</span>
            </div>
          </div>

          <div className="ws-gateway-action-wrap">
            <AppLink
              to="catalogue"
              href="/catalogue"
              navigate={navigate}
              className="ws-btn-primary ws-btn-large"
            >
              <span>Open Full Wholesale Catalog</span>
              <ArrowRight size={16} />
            </AppLink>
          </div>
        </div>
      </section>

      <div className="ws-section-divider" />

      {/* 7. IN-DEPTH FAQ ACCORDION (AEO & SEO Grounding) */}
      <section className="ws-faq-section">
        <div className="ws-section-header">
          <h2 className="ws-section-title">Frequently Asked B2B Sourcing Questions</h2>
          <p className="ws-section-desc">
            Direct answers for wholesalers, retailers, boutiques, and global exporters on captive manufacturing, trial packs, <br />quality verification, and international logistics.
          </p>
        </div>

        <div className="ws-faq-list">
          {faqs.map((faq, idx) => (
            <div className={`ws-faq-item ${openFaq === idx ? 'active' : ''}`} key={idx}>
              <button 
                type="button" 
                className="ws-faq-trigger"
                onClick={() => toggleFaq(idx)}
                aria-expanded={openFaq === idx}
              >
                <span className="ws-faq-question">{faq.q}</span>
                <ChevronDown size={18} className="ws-faq-chevron" />
              </button>
              {openFaq === idx && (
                <div className="ws-faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="ws-section-divider ws-bottom-divider" />
    </article>
  );
}
