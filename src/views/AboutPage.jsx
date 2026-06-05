/**
 * AboutPage View
 * Purpose: Renders Weave 365's brand heritage narrative, direct weaver mission,
 * zero-defect quality protocol check, worldwide shipping logistics, and trust signals (GST/registration parameters).
 * Supports search indexing using embedded crawlable FAQ & Organization schemas.
 */
import React, { useState } from 'react';
import { 
  Award, 
  Compass, 
  ShieldCheck, 
  Truck, 
  Users, 
  ChevronDown, 
  Check, 
  MessageCircle, 
  FileText, 
  Sparkles,
  Heart,
  Globe,
  Layers,
  MapPin,
  Linkedin
} from 'lucide-react';
import { storeConfig } from '../config.js';
import artisanImage from '../../assets/artisan_at_loom_premium.webp';
import resellerDisplayImage from '../../assets/reseller_premium_catalog_display.webp';
import { assetSrc } from '../utils/assetSrc.js';
import { WhatsappIcon } from '../storefrontShared.jsx';

export function AboutPage({ navigate }) {
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  const artisanSectionImage = assetSrc(artisanImage);
  const resellerSectionImage = assetSrc(resellerDisplayImage);
  // TODO: Add Cloudflare R2 link here when ready (e.g. "https://pub-xxx.r2.dev/founder_portrait.png")
  const founderPortraitImage = "";

  const faqs = [
    {
      question: "What is the Minimum Order Quantity (MOQ) for wholesale purchase?",
      answer: "Our B2B model is designed for absolute flexibility. For retail boutiques, online resellers, and new business test orders, we offer an exceptionally low MOQ of just 5 sarees across our entire catalog (you can mix-and-match categories). For custom bespoke weaving or white-label volume manufacturing, the MOQ starts at 15 pieces per design."
    },
    {
      question: "How does Weave 365 verify the authenticity of pure silk and zari sarees?",
      answer: "Every saree under our premium label is accompanied by a Silk Mark Authority of India certification option, guaranteeing 100% natural Mulberry silk yarn. Furthermore, our zari work undergoes rigid chemical and density analysis (micro-melt testing) to assure authentic silver-plated copper or gold plating, eliminating low-grade metallic threads."
    },
    {
      question: "Do you support white-label branding and custom packaging for boutique owners?",
      answer: "Yes, we are the backend supply force for some of the largest ethnic boutiques globally. Under our premium White Label Brand Program, we can coordinate direct white-labeling with your custom brand tags and labels. All goods are dispatched in secure, unmarked weatherproof packaging, keeping Weave 365 completely anonymous so you can add your custom luxury packaging at your store."
    },
    {
      question: "What are your shipping timelines, transit cargo charges, and insurance coverages?",
      answer: "We offer completely free shipping on all bulk and wholesale orders across India, typically delivered within 3-5 business days. For international retailers (USA, UK, UAE, Australia, Canada, etc.), we ship via premium air freight (DHL/FedEx) in double-walled moisture-proof corrugated cartons. International shipping charges are computed by weight, and all premium shipments are 100% insured against loss, moisture damage, or transit complications."
    },
    {
      question: "Can boutique owners order custom colorways or exclusive weave patterns?",
      answer: "Absolutely. Leveraging our master weaver network of 200+ artisans in Varanasi, we can engineer custom textile specifications. Simply share your high-resolution reference pattern, structural layout, or physical fabric sample. Our design master drafts the punch-cards (naksha) and manufactures a structural swatch within 14 business days for your final approval."
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaqIndex(activeFaqIndex === index ? null : index);
  };

  const whatsappLink = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(
    'Hi Weave 365 B2B Desk, I would like to learn more about wholesale sourcing, pricing groups, and boutique reseller onboarding.'
  )}`;

  // JSON-LD structured data for Google Search crawling
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Weave 365",
    "description": "Premium B2B Banarasi saree wholesaler and manufacturer directly partnering with Varanasi master weavers.",
    "telephone": storeConfig.phone,
    "email": storeConfig.email,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Varanasi",
      "addressRegion": "Uttar Pradesh",
      "addressCountry": "India"
    },
    "url": "https://www.weave365.in/about",
    "priceRange": "$$$$",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "512"
    },
    "review": [
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Aisha Rahman"
        },
        "reviewBody": "Sourcing directly from Varanasi master weavers has completely transformed our boutique's profit margins. Highly authentic.",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5"
        }
      },
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Devika Sen"
        },
        "reviewBody": "Ultimate backend supplier for international B2B saree wholesale. The weatherproof transit packaging is impeccable.",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5"
        }
      }
    ]
  };

  React.useEffect(() => {
    document.documentElement.classList.add('header-over-dark');
    return () => {
      document.documentElement.classList.remove('header-over-dark');
    };
  }, []);

  return (
    <div className="about-page-container">
      {/* Dynamic JSON-LD Structured SEO Schema */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} 
      />

      {/* 1. HERO SECTION WITH LUXURY BREADCRUMBS */}
      <section className="about-hero-section">
        {/* Elegant Breadcrumb Navigation (SEO Requirement) */}
        <div className="about-hero-breadcrumbs">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('home'); }}>Home</a>
          <span>&gt;</span>
          <span className="active">About Us</span>
        </div>

        <div className="about-hero-badge">Direct Varanasi Weavers Partner</div>
        <h1>
          Wholesale Banarasi Sarees 
          <span>Direct from the Looms of Varanasi</span>
        </h1>
        <p className="about-hero-description">
          Weave 365 is India’s premier premium B2B Banarasi saree wholesaler. By connecting 200+ local master artisans directly to worldwide retail boutiques and <a href="/wholesale-partner-program" onClick={(e) => { e.preventDefault(); navigate('wholesale-partner-program'); }} className="seo-inline-link">resellers</a>, we deliver authentic luxury with scalable logistics, zero middle-party markups, and structural quality verification.
        </p>
        <div>
          <a 
            href="/wholesale-catalogue" 
            onClick={(e) => { e.preventDefault(); navigate('wholesale-catalogue'); }}
            className="about-hero-cta"
          >
            Explore B2B Collections <Award size={16} />
          </a>
        </div>
      </section>

      {/* 2. THE STORY & HERITAGE SECTION */}
      <section className="about-story-section">
        <div className="about-story-grid">
          <div className="about-story-left">
            <span className="about-kicker">Our Heritage</span>
            <h2>Preserving Varanasi's Hand-Loom Legacy</h2>
            <p className="about-story-text">
              For generations, the city of Varanasi (Banaras) has held a sacred place in global textile history. The magical coordination of silk threads, metallic zari, and handwoven card-grids produces sarees that are not merely garments, but pieces of living art. 
            </p>
            <p className="about-story-text">
              However, modern industrial imitation and convoluted agent chains began to dilute this heritage. Weave 365 was founded to challenge this decline. By setting up direct collection centers and fair-compensation frameworks in heartlands like Lallapura and Madanpura, we bypass intermediary channels. 
            </p>
            <p className="about-story-text">
              Every curve of our gold zari, every thread of our pure <a href="/organza-banarasi-sarees" onClick={(e) => { e.preventDefault(); navigate('organza-banarasi-sarees'); }} className="seo-inline-link">organza</a>, <a href="/katan-silk-sarees" onClick={(e) => { e.preventDefault(); navigate('katan-silk-sarees'); }} className="seo-inline-link">katan silk</a>, and designer tissue is handpicked, guaranteeing that your customers experience the true majestic grandeur that defined ancient Indian royalty. Compare these fabrics in our expert <a href="/blog/difference-katan-silk-and-organza-saree" onClick={(e) => { e.preventDefault(); navigate('blog', 'difference-katan-silk-and-organza-saree'); }} className="seo-inline-link">fabric guide</a>.
            </p>
            <div className="about-story-quote">
              "Weave 365 isn't just a supplier. We are structural gatekeepers of premium Banarasi craftsmanship, engineered with high-performing wholesale systems for the modern boutique."
            </div>
          </div>
          
          <div className="about-story-right">
            <div className="about-image-wrapper">
              <img 
                src={resellerSectionImage} 
                alt="Premium Banarasi Saree Collections Display" 
                className="about-story-image"
                width={600}
                height={400}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="about-heritage-floating-badge">
              <span>2026</span>
              <p>Modernizing Saree Wholesale Worldwide</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2b. B2B SCALE & STATISTICS COUNTERS */}
      <section className="about-stats-strip-section">
        <div className="about-stats-strip-grid">
          <div className="about-stat-strip-card">
            <h3>150k+</h3>
            <p>Pure Silk Sarees Handwoven & Shipped</p>
          </div>
          <div className="about-stat-strip-card">
            <h3>15+</h3>
            <p>Countries Served Worldwide</p>
          </div>
          <div className="about-stat-strip-card">
            <h3>99.8%</h3>
            <p>B2B Zero-Defect Quality Rating</p>
          </div>
          <div className="about-stat-strip-card">
            <h3>200+</h3>
            <p>Varanasi Master Looms Partnered</p>
          </div>
        </div>
      </section>

      {/* 2c. ABOUT FOUNDER SECTION */}
      <section className="about-founder-section">
        <div className="about-founder-container">
          <div className="about-founder-grid">
            <div className="about-founder-right">
              <span className="about-kicker">Visionary Leadership</span>
              <h2>Preserving the Handloom Soul, Empowering Global Commerce</h2>
              <p className="about-founder-lead">
                "Weave 365 was born in the narrow lanes of Varanasi, where the rhythmic clacking of handlooms has echoed for centuries. Our mission is to honor this legacy while equipping modern retail entrepreneurs with a highly-scalable, transparent supply chain."
              </p>
              <div className="about-founder-story">
                <p>
                  As a third-generation business / textile visionary, our founder, <strong>Zubair Ahmad</strong>, witnessed the struggles of Varanasi's local weavers first-hand. While local weavers created incomparable masterpieces, outdated agent structures left them disconnected from global demand and poorly compensated.
                </p>
                <p>
                  Determined to redefine the Banarasi trade, Zubair founded Weave 365. By merging authentic handloom curation with a robust direct-to-retailer B2B model, he eliminated middle-party inefficiencies and established strict, laboratory-tested quality checks.
                </p>
                <p>
                  Today, under Zubair's guidance, Weave 365 serves as the reliable supply backbone for over 500+ boutiques globally, proving that traditional craftsmanship and modern digital systems can thrive together.
                </p>
                <p>
                  Building a Couture House from Banaras Loom, Translating Banarasi Textile into Couture Fashion.
                </p>
              </div>

              <div className="about-founder-signature-block">
                <div className="about-founder-info">
                  <span className="about-founder-name">Zubair Ahmad</span>
                  <span className="about-founder-title">Founder & Creative Director, Weave 365</span>
                  <a 
                    href="https://www.linkedin.com/in/hellozubair/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="about-founder-linkedin-link"
                  >
                    {founderPortraitImage ? (
                      <div className="about-founder-avatar-wrapper">
                        <img 
                          src={founderPortraitImage} 
                          alt="Zubair Ahmad LinkedIn Profile" 
                          className="about-founder-avatar"
                        />
                        <div className="about-founder-linkedin-badge">
                          <Linkedin size={10} />
                        </div>
                      </div>
                    ) : (
                      <div className="about-founder-linkedin-icon-only">
                        <Linkedin size={18} />
                      </div>
                    )}
                    <span className="about-founder-linkedin-text">Connect on LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OUR MISSION & RESELLER FOCUS */}
      <section className="about-mission-section">
        <div className="about-mission-container">
          <div className="about-center-header">
            <span className="about-kicker">Empowering B2B Partners</span>
            <h2>Direct Wholesale Sourcing Built for Retail Success</h2>
            <p>
              We run a model dedicated strictly to supporting professional buyers. Whether you are scaling an established multi-designer boutique or launching a high-growth home reselling channel, we provide the tools to double your margins.
            </p>
          </div>

          <div className="about-mission-grid">
            <div className="about-mission-card">
              <div className="about-card-icon-wrapper">
                <Compass size={26} />
              </div>
              <h3>Curated Exclusivity</h3>
              <p>
                Avoid the cluttered, over-saturated wholesale markets. We curate select, high-end designs in Katan Silk, Organza, Georgette, and Meenakari. Stand out in your city with designs that scream luxury.
              </p>
            </div>

            <div className="about-mission-card">
              <div className="about-card-icon-wrapper">
                <Sparkles size={26} />
              </div>
              <h3>Reseller Growth Toolkit</h3>
              <p>
                Get access to white-labeled collections, high-definition catalog photography, real-time CSV pricing sheets, and direct shipping support to elevate your boutique branding without capital locks.
              </p>
            </div>

            <div className="about-mission-card">
              <div className="about-card-icon-wrapper">
                <Award size={26} />
              </div>
              <h3>Direct-to-Weaver Rates</h3>
              <p>
                Enjoy transparent wholesale pricing without a hierarchy of agents, brokers, or warehouse markups. Our direct ties ensure you pay weaver rates while accessing flawless B2B service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE ARTISAN NETWORK DISPLAY */}
      <section className="about-artisan-section">
        <div className="about-artisan-container">
          <div className="about-artisan-banner">
            <div className="about-artisan-banner-left">
              <h2>Supporting a Vibrant Network of 200+ Master Weavers</h2>
              <p>
                At the heart of Weave 365 are the highly-skilled hands that spin, dye, and weave. Every purchase directly drives ethical wages, sustainable raw material sourcing, and healthcare support back to local weavers in the Varanasi cluster. We secure their craft for subsequent generations while guaranteeing reliable production capacities for your boutique's peak seasons.
              </p>
              <div className="about-artisan-stats">
                <div className="about-artisan-stat-item">
                  <strong>200+</strong>
                  <span>Master Looms</span>
                </div>
                <div className="about-artisan-stat-item">
                  <strong>100%</strong>
                  <span>Ethical Fair Trade</span>
                </div>
              </div>
            </div>
            <div className="about-artisan-banner-right">
              <img 
                src={artisanSectionImage} 
                alt="Master Artisan weaving a premium gold zari Banarasi silk saree" 
                className="about-artisan-banner-image"
                width={600}
                height={400}
                loading="lazy"
                decoding="async"
              />
              <div className="about-artisan-banner-overlay"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. THE WEAVE 365 QUALITY VERIFICATION PROCESS */}
      <section className="about-quality-section">
        <div className="about-quality-container">
          <div className="about-center-header">
            <span className="about-kicker">Zero-Defect Standards</span>
            <h2>Our Rigorous 5-Step Quality Protocol</h2>
            <p>
              Hand-loom textiles are celebrated for their character, but wholesale orders must never settle for functional defects. We run a meticulous multi-tier check before any box receives final seal approval.
            </p>
          </div>

          <div className="about-quality-grid">
            <div className="about-quality-step">
              <div className="about-step-number">01</div>
              <h3>Yarn Analysis</h3>
              <p>Verification of raw silk density and structural zari composition to eliminate synthetic fibers.</p>
            </div>

            <div className="about-quality-step">
              <div className="about-step-number">02</div>
              <h3>Loom Inspection</h3>
              <p>In-progress assessment of weave consistency and warp alignment directly on the handlooms.</p>
            </div>

            <div className="about-quality-step">
              <div className="about-step-number">03</div>
              <h3>Color & Finish Check</h3>
              <p>Strict matching against digital swatches under natural light parameters to prevent hue shifts.</p>
            </div>

            <div className="about-quality-step">
              <div className="about-step-number">04</div>
              <h3>Zari Burnish Pass</h3>
              <p>Manual tactile scanning to verify smooth gold edges, ensuring complete absence of rough thread ends.</p>
            </div>

            <div className="about-quality-step">
              <div className="about-step-number">05</div>
              <h3>Secure Transit Wrap</h3>
              <p>Wrapping inside water-resistant protective film and secure courier wraps to ensure absolute safety during transport.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SHIPPING & DISPATCH STANDARDS */}
      <section className="about-shipping-section">
        <div className="about-shipping-container">
          <div className="about-shipping-left">
            <h2>Worldwide Air Cargo & Secure Weatherproof Protection</h2>
            <p>
              Premium textiles require specialized handling to prevent humidity oxidation on delicate silver and gold zari work during transit. We have engineered custom bulk logistics to guarantee pristine arrivals, domestic or international.
            </p>
          </div>
          
          <div className="about-shipping-right">
            <div className="about-shipping-feature">
              <Globe size={28} className="about-shipping-feature-icon" />
              <h3>Worldwide Air Freight</h3>
              <p>Direct partnership with DHL and FedEx for reliable air transit to USA, UK, Canada, and EU in 5-7 business days.</p>
            </div>

            <div className="about-shipping-feature">
              <Layers size={28} className="about-shipping-feature-icon" />
              <h3>Weatherproof Protection</h3>
              <p>Every saree is cocooned in dust-free protective tissue and sealed inside water-resistant, tear-proof transit wraps.</p>
            </div>

            <div className="about-shipping-feature">
              <ShieldCheck size={28} className="about-shipping-feature-icon" />
              <h3>100% Insured Value</h3>
              <p>Complete transit cargo insurance covering every wholesale consignment against loss or damage.</p>
            </div>

            <div className="about-shipping-feature">
              <Truck size={28} className="about-shipping-feature-icon" />
              <h3>Zero Domestic Freight</h3>
              <p>Completely free courier delivery across India for boutiques and wholesale resellers with tracking updates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6b. B2B OPERATIONS & DISPATCH */}
      <section className="about-operations-section">
        <div className="about-operations-container">
          <div className="about-center-header">
            <span className="about-kicker">Direct & Transparent Operations</span>
            <h2>Loom-Direct Sourcing & Secure Weatherproof Dispatch</h2>
            <p>
              We believe in keeping things simple, authentic, and highly profitable for your business. By operating entirely online, we deliver real wholesale rates directly from the weavers' looms while ensuring safe, weatherproof transit for every parcel.
            </p>
          </div>

          <div className="about-operations-grid">
            <div className="about-operations-card">
              <div className="about-ops-icon-wrapper">
                <div className="about-ops-icon-circle">
                  <Compass size={32} className="about-ops-icon" />
                </div>
              </div>
              <div className="about-ops-content">
                <h3>Loom-Direct Quality Inspection</h3>
                <p>
                  We coordinate directly with local weavers across Varanasi. Instead of maintaining expensive retail showrooms or bulk warehouses, we inspect every saree at the loom source for flawless weaving and authentic yarn. Operating online allows us to cut massive overhead costs, passing 100% of the margins and savings directly to your boutique.
                </p>
              </div>
            </div>

            <div className="about-operations-card">
              <div className="about-ops-icon-wrapper">
                <div className="about-ops-icon-circle">
                  <ShieldCheck size={32} className="about-ops-icon" />
                </div>
              </div>
              <div className="about-ops-content">
                <h3>Secure Weatherproof Transit</h3>
                <p>
                  Premium handloom silk and real metallic zari must be fully protected from moisture, dust, and transit friction. Every saree is wrapped in clean, dust-free protective tissue and sealed inside high-strength, weatherproof polymer courier wraps. This guarantees your products arrive completely dry and pristine, while keeping shipping weights minimal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TRUST SIGNALS & B2B DIRECTORY */}
      <section className="about-trust-section">
        <div className="about-trust-container">
          <div className="about-trust-grid">
            <div className="about-trust-info">
              <span className="about-kicker">Absolute Credibility</span>
              <h2>A Transparent B2B Banarasi Saree Supplier Partner</h2>
              <p>
                We believe premium aesthetics must be supported by corporate transparency. Below are our business registration parameters, warehouse locations, and direct communications pathways.
              </p>
              
              <div className="about-whatsapp-cta-card">
                <div className="about-whatsapp-header">
                  <div className="about-whatsapp-avatar-group">
                    <div className="about-whatsapp-avatar">
                      <WhatsappIcon size={20} style={{ color: 'var(--gold)' }} />
                    </div>
                  </div>
                  <div className="about-whatsapp-meta">
                    <h4>B2B Whatsapp Concierge</h4>
                    <span>Active Now (10 AM - 6 PM IST)</span>
                  </div>
                </div>
                <p className="about-whatsapp-text">
                  Directly connect with our Varanasi wholesale department. Get custom catalogs, catalog pricing keys, fabric video reviews, and real-time shipping quotes.
                </p>
                <a 
                  href={whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="about-whatsapp-btn"
                >
                  <WhatsappIcon size={18} /> Chat with Wholesale Team
                </a>
              </div>
            </div>

            <div className="about-trust-cards">
              <div className="about-trust-card">
                <FileText size={26} className="about-trust-card-icon" />
                <h3>GST Verification</h3>
                <p>Fully compliant corporate vendor. Standard GST invoices provided for buyers tax input credit.</p>
                {/* <p style={{ marginTop: '10px' }}><code>GSTIN: 09AABHW8236A1Z0</code></p> */}
              </div>

              <div className="about-trust-card">
                <Globe size={26} className="about-trust-card-icon" />
                <h3>Varanasi Roots</h3>
                <p>Our primary weaving collection house is located in the heart of Varanasi, enabling daily quality check operations.</p>
                <p className="about-trust-card-location">
                  <MapPin size={14} color="var(--gold)" />Varanasi, UP, IN
                </p>
              </div>

              <div className="about-trust-card">
                <ShieldCheck size={26} className="about-trust-card-icon" />
                <h3>Silk Mark Standard</h3>
                <p>Active support for silk handloom preservation. Real-silk certificates issued directly under the Silk Mark scheme.</p>
              </div>

              <div className="about-trust-card">
                <Heart size={26} className="about-trust-card-icon" />
                <h3>25+ Years Weave Roots</h3>
                <p>Supported by the artisian / weaver network with over two decades of handloom trading, weaving, and global exports.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7b. BOUTIQUE & RESELLER SUCCESS STORIES */}
      <section className="about-testimonials-section">
        <div className="about-testimonials-container">
          <div className="about-center-header">
            <span className="about-kicker">Partner Success Stories</span>
            <h2>Trusted by Over 500+ Boutiques & Resellers</h2>
            <p>
              Discover how partnering directly with our Varanasi master weavers has empowered retail stores and online boutique owners globally.
            </p>
          </div>

          <div className="about-testimonials-grid">
            <div className="about-testimonial-card">
              <div className="about-stars">★★★★★</div>
              <p className="about-test-quote">
                "Sourcing directly from Varanasi master weavers has completely transformed our boutique's profit margins. Weave 365's extremely low MOQ of 5 sarees allowed us to test their premium Katan Silk and Organza. Our clients are mesmerized by the authenticity and standard quality certifications."
              </p>
              <div className="about-test-buyer">
                <strong>Aisha Rahman</strong>
                <span>Founder, Zari Boutique (Delhi, India)</span>
              </div>
            </div>

            <div className="about-testimonial-card">
              <div className="about-stars">★★★★★</div>
              <p className="about-test-quote">
                "Weave 365 is the ultimate backend supplier for international B2B saree wholesale. The weatherproof transit packaging is impeccable, and the DHL air cargo arrives in Houston in exactly 5 days. Our premium boutique collection has a 100% customer return rate."
              </p>
              <div className="about-test-buyer">
                <strong>Devika Sen</strong>
                <span>Director, Sanskriti Ethnic Wear (Houston, USA)</span>
              </div>
            </div>

            <div className="about-testimonial-card">
              <div className="about-stars">★★★★★</div>
              <p className="about-test-quote">
                "As a rising reseller, the High-Definition catalogs and white-labeled fulfillment support allowed me to launch and scale my home boutique business with zero capital locked in holding stock. Real weaver rates with corporate professionalism."
              </p>
              <div className="about-test-buyer">
                <strong>Kavitha Rao</strong>
                <span>Creator, Heritage Sarees (Bangalore, India)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE FAQ ACCORDIONS */}
      <section className="about-faq-section">
        <div className="about-faq-container">
          <div className="about-center-header about-faq-section-header">
            <span className="about-kicker">Retailer FAQ</span>
            <h2>Frequently Asked B2B Questions</h2>
            <p>
              Answers to our most popular boutique, reseller, and bulk shipping inquiries. Expand to learn more.
            </p>
          </div>

          <div className="about-faq-list">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`about-faq-item ${activeFaqIndex === index ? 'active' : ''}`}
              >
                <button 
                  type="button" 
                  className="about-faq-question"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={activeFaqIndex === index ? 'true' : 'false'}
                >
                  <h3>{faq.question}</h3>
                  <ChevronDown size={20} className="about-faq-icon" />
                </button>
                <div className="about-faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
