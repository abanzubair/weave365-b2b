/**
 * @file CustomWovenPage.jsx
 * @description Custom Woven Banarasi Sarees Landing Page.
 * Showcases private label custom weaving, loom development, MOQ rules,
 * technical review steps, 7-step production process, pricing benchmarks,
 * materials/zari matrices, comparison tables, FAQs, and an interactive inquiry form.
 * 
 * @module views/CustomWovenPage
 */

import { useState, useId } from 'react';
import { 
  Sliders, 
  Layers, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown, 
  FileText, 
  CheckCircle2, 
  Compass, 
  Cpu, 
  ArrowRight, 
  Send, 
  Award, 
  Box, 
  PenTool, 
  Image as ImageIcon, 
  Check, 
  Info,
  DollarSign,
  Palette,
  Feather,
  RefreshCw,
  Building2,
  Package,
  MessageSquare,
  Tag,
  Crown,
  Store,
  Heart,
  Globe,
  Gift
} from 'lucide-react';
import { storeConfig } from '../config.js';
import { AppLink } from '../components/AppLink.jsx';
import '../styles/customWoven.css';

export function CustomWovenPage({ navigate }) {
  const [activeStep, setActiveStep] = useState(1);
  const [openFaq, setOpenFaq] = useState(null);

  // Inquiry form interactive state
  const [businessType, setBusinessType] = useState('Private Label Brand');
  const [weavingType, setWeavingType] = useState('Powerloom (MOQ: 50 pcs)');
  const [fabricPref, setFabricPref] = useState('Katan Silk');
  const [zariPref, setZariPref] = useState('Tested Zari');
  const [inputType, setInputType] = useState('Design Reference Image');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [projectNotes, setProjectNotes] = useState('');

  const businessTypeSelectId = useId();
  const weavingTypeSelectId = useId();
  const fabricPrefSelectId = useId();
  const zariPrefSelectId = useId();
  const inputTypeSelectId = useId();

  const [heroLoomType, setHeroLoomType] = useState('handloom');

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const whatsappMessage = `*Custom Woven Saree Inquiry - Weave 365*%0A%0A` +
      `*Name:* ${encodeURIComponent(contactName || 'Valued Client')}%0A` +
      `*Phone/WhatsApp:* ${encodeURIComponent(contactPhone || 'Not provided')}%0A` +
      `*Email:* ${encodeURIComponent(contactEmail || 'Not provided')}%0A` +
      `*Business Segment:* ${encodeURIComponent(businessType)}%0A` +
      `*Weaving Preference:* ${encodeURIComponent(weavingType)}%0A` +
      `*Fabric:* ${encodeURIComponent(fabricPref)}%0A` +
      `*Zari Grade:* ${encodeURIComponent(zariPref)}%0A` +
      `*Design Input:* ${encodeURIComponent(inputType)}%0A` +
      `*Project Notes:* ${encodeURIComponent(projectNotes || 'None')}%0A%0A` +
      `Please review my custom weaving requirement and get back to me with feasibility and initial estimates.`;

    const whatsappUrl = `https://wa.me/${storeConfig.whatsapp}?text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const designInputs = [
    { title: 'Design Reference Image', desc: 'Photos, catalog snapshots, or vintage heirloom samples', icon: <ImageIcon size={22} /> },
    { title: 'Hand Sketch', desc: 'Freehand drawings of border, pallu, or body motifs', icon: <PenTool size={22} /> },
    { title: 'Digital Artwork', desc: 'PSD, AI, EPS, or vector graphic files', icon: <Palette size={22} /> },
    { title: 'CAD File', desc: 'Jacquard CAD files, punch patterns, or graph files', icon: <Cpu size={22} /> },
    { title: 'Motif Reference', desc: 'Isolated floral, Paisley, floral jaal, or geometric motifs', icon: <Feather size={22} /> },
    { title: 'Fabric Swatch', desc: 'Physical swatch or high-resolution macro fabric photo', icon: <Layers size={22} /> },
    { title: 'Colour Inspiration', desc: 'Pantone shades, moodboards, or custom colorways', icon: <Sparkles size={22} /> },
    { title: 'Brand Concept', desc: 'Theme guidelines, storyboards, or bridal storybook', icon: <Compass size={22} /> },
  ];

  const teamAssistance = [
    { title: 'Technical Feasibility Review', desc: 'Reviewing your design for traditional Banarasi weaving compatibility.' },
    { title: 'Weave & Yarn Structuring', desc: 'Determining optimal weave structure, technique, fabric composition, and zari pairing.' },
    { title: 'Motif & Color Curation', desc: 'Suggesting suitable motifs, shade combinations, and finishing treatments for maximum aesthetic appeal.' },
    { title: 'Practical Weaving Optimization', desc: 'Identifying and refining design details to ensure smooth, defect-free production.' },
    { title: 'Design Intent Preservation', desc: 'Recommending the best weaving setup while strictly keeping your original brand vision.' },
    { title: 'Transparent Commercial Estimates', desc: 'Providing clear guidance on MOQs, sampling fees, pre-production charges, and timelines.' },
    { title: 'Full Lifecycle Guidance', desc: 'Guiding you step-by-step from loom graph preparation and sample approval to final dispatch.' },
  ];

  const steps = [
    {
      step: 1,
      name: 'Share Your Design',
      short: 'Submit Concept',
      desc: 'Send us your design reference, artwork, sketch, concept, or inspiration through our custom inquiry portal or WhatsApp.',
      details: [
        'Reference images, digital sketches, CADs, or physical swatches accepted',
        'Specify target colorways, estimated quantity, and preferred delivery timeline',
        'Initial confidentiality and brand privacy assurance'
      ]
    },
    {
      step: 2,
      name: 'Technical Design Review',
      short: 'Tech Evaluation',
      desc: 'Our Varanasi weaving experts evaluate your design for technical feasibility, motif complexity, weave structure, and warp/weft requirements.',
      details: [
        'Weave structure feasibility (Kadhwa, Phekwa, Tanchoi, Cutwork)',
        'Fabric selection (Katan, Organza, Georgette, Tissue, Satin)',
        'Zari quality selection (Tested Zari vs Certified Real Gold/Silver Zari)',
        'Border, body, and pallu balance evaluation'
      ]
    },
    {
      step: 3,
      name: 'Development Planning',
      short: 'Specs & Costing',
      desc: 'Following feasibility review, we prepare technical weaving specifications, yarn requirements, pre-production charges, sampling plan, and timeline.',
      details: [
        'Detailed yarn and zari quantity estimation',
        'Pre-production cost estimate and sampling fee quotation',
        'Minimum Order Quantity (MOQ) finalization based on loom type',
        'Milestone-based production & sampling schedule'
      ]
    },
    {
      step: 4,
      name: 'Custom Loom Development',
      short: 'Loom Setup',
      desc: 'A dedicated loom is configured specifically for your project, including jacquard graphing, card punching, warp setting, and trial weaving.',
      details: [
        'Design graph preparation (Point paper design mapping)',
        'Jacquard punching or digital electronic jacquard programming',
        'Loom setting, warp mounting, and tension calibration',
        'Trial weaving and color testing'
      ]
    },
    {
      step: 5,
      name: 'Sample Approval',
      short: 'Sample Review',
      desc: 'A physical development sample is produced on the configured loom for your review and physical quality sign-off.',
      details: [
        'Sample saree piece or swatch produced for hand-feel and motif check',
        'High-resolution video and photo documentation sent for immediate review',
        'Full-scale production commences ONLY after formal client approval'
      ]
    },
    {
      step: 6,
      name: 'Final Weaving',
      short: 'Bulk Production',
      desc: 'After sample approval, master artisans execute bulk weaving on dedicated handlooms or powerlooms according to approved specs.',
      details: [
        'Consistent batch weaving under strict quality control',
        'Periodic progress updates with weave status tracking',
        'Custom weave modifications applied seamlessly across the lot'
      ]
    },
    {
      step: 7,
      name: 'Quality Inspection & Finishing',
      short: 'Dispatch & Packing',
      desc: 'Every saree undergoes thread cutting, double-pass fabric inspection, steam finishing, polishing, folding, and custom private label packing.',
      details: [
        'Rigorous thread inspection, stain checking, and dimensional verification',
        'Traditional calendering, polishing, and steam pressing',
        'Private label tagging, blind packaging, and insured global dispatch'
      ]
    }
  ];

  const priceReferenceTable = [
    { technique: 'Pick n Pick', priceRange: '₹10,000 - ₹22,000', suitable: 'High-density multi-shuttle weaving with intricate details' },
    { technique: 'Handloom Phekwa', priceRange: '₹20,000 - ₹30,000', suitable: 'Continuous weft shuttle weaving with smooth reverse finish' },
    { technique: 'Handloom Kadhwa (Standard)', priceRange: '₹15,000 - ₹25,000', suitable: 'Individually woven motifs without floats on reverse' },
    { technique: 'Handloom Kadhwa (Fine Detail)', priceRange: '₹30,000 - ₹50,000', suitable: 'Dense floral jaals, Meenakari work, multi-colored motifs' },
    { technique: 'Handloom Kadhwa (Tested Zari)', priceRange: '₹50,000 - ₹100,000', suitable: 'Heavy bridal Banarasi sarees with tested silver/gold zari' },
    { technique: 'Handloom Kadhwa (Real Zari)', priceRange: '₹200,000 - ₹300,000', suitable: 'Heirloom museum-grade sarees with certified real silver/gold zari' },
  ];

  const suitableAudiences = [
    { title: 'Private Label Brands', desc: 'Create signature saree lines under your own brand identity without owning looms.', icon: Tag },
    { title: 'Luxury Fashion Labels', desc: 'Develop exclusive runway & couture Banarasi collections with custom motifs.', icon: Crown },
    { title: 'Fashion Designers', desc: 'Transform bespoke artwork and CADs into authentic handwoven heritage textiles.', icon: PenTool },
    { title: 'Boutique Owners', desc: 'Offer unique, non-catalog sarees to differentiate your store from retail competitors.', icon: Store },
    { title: 'Bridal Wear Collections', desc: 'Craft exclusive bridal trousseau series with custom color palettes and zari work.', icon: Heart },
    { title: 'Export Buyers & Wholesalers', desc: 'Develop high-volume custom lines tailored for international ethnic markets.', icon: Globe },
    { title: 'Corporate Gifting Projects', desc: 'Commission customized heritage sarees featuring subtle bespoke motifs for VIP gifts.', icon: Gift },
    { title: 'White Label Businesses', desc: 'Source fully unbranded, premium custom weaves ready for your private branding.', icon: ShieldCheck },
  ];

  const faqs = [
    {
      q: 'What is the minimum order quantity (MOQ) for custom woven Banarasi sarees?',
      a: 'The MOQ starts from 4 pieces per design for Handloom custom weaving, and 50 pieces per design for Powerloom custom weaving. The exact quantity depends on design complexity, weave structure, fabric selection, and zari grade.'
    },
    {
      q: 'Can I make only 10 custom Banarasi sarees?',
      a: 'Normally no for powerloom weaving, as custom loom setup and jacquard punch card programming are not commercially viable for 10 pieces. However, for Handloom custom weaving, projects starting from 4 to 10 pieces per design can be executed depending on the design.'
    },
    {
      q: 'Can I provide my own design or artwork?',
      a: 'Yes! You can share design reference images, hand sketches, digital artwork, CAD punch files, fabric swatches, motif references, or color moodboards. Our technical weaving team will review feasibility and guide you through the process.'
    },
    {
      q: 'Are sampling charges applicable for custom weaving?',
      a: 'Yes. Pre-production charges apply to cover technical design evaluation, point paper graph preparation, jacquard setup, warp mounting, trial weaving, and sample production. Pre-production fees are quoted after reviewing your design.'
    },
    {
      q: 'How long does custom Banarasi saree development take?',
      a: 'Pre-weaving development (design review, graph preparation, loom setup, and sampling) takes 30 to 45 working days. Once the sample is approved, weaving and bulk production take 20 to 90 working days depending on order quantity and weave complexity.'
    },
    {
      q: 'Do you manufacture under private label for custom orders?',
      a: 'Yes. We support complete private label manufacturing, custom brand tagging, white-label packaging, and blind dropshipping for eligible production quantities.'
    },
    {
      q: 'What is the difference between Tested Zari and Real Zari in custom sarees?',
      a: 'Tested Zari uses silver/gold electroplated metallic yarn that offers rich luster and durability at a commercial cost. Real Zari uses genuine silver core wire electroplated with pure gold, complete with purity certification for luxury heirloom collections.'
    }
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.q,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.a
      }
    }))
  };

  return (
    <div className="custom-woven-page">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ATELIER EDITORIAL HERO SECTION */}
      <section className="cw-editorial-hero">
        <div className="cw-container">
          <div className="cw-hero-editorial-grid">
            {/* LEFT COLUMN: EDITORIAL NARRATIVE & CONTENT */}
            <div className="cw-hero-editorial-main">
              <h1 className="cw-hero-masthead">
                Custom Woven Banarasi Sarees
              </h1>
              <div className="cw-hero-subhead">
                Process, Loom Development, MOQ, Timeline & Cost
              </div>

              <div className="cw-hero-body-text">
                <p>
                  If you want to create an exclusive Banarasi saree collection instead of selecting from existing designs, 
                  Weave 365 offers custom woven Banarasi saree development for private label brands, fashion labels, 
                  designers, boutiques, wholesalers, and export businesses.
                </p>
                <p>
                  Unlike ready-made wholesale collections, custom weaving begins with your design concept. 
                  Each project involves technical feasibility assessment, loom development, weave planning, yarn and zari selection, 
                  sampling, and production before full-scale weaving starts.
                </p>
              </div>

              <div className="cw-hero-action-row">
                <a href="#inquiry-form" className="cw-btn cw-btn-primary">
                  Submit Design Inquiry <ArrowRight size={18} />
                </a>
                <a href="#loom-matrix" className="cw-btn cw-btn-secondary">
                  View Loom Spec Matrix
                </a>
              </div>

              {/* SPEC SUMMARY LIST */}
              <div className="cw-hero-spec-summary">
                <span className="cw-spec-meta-item">Handloom MOQ: <strong>From 4 Pcs</strong></span>
                <span className="cw-spec-meta-dot">&bull;</span>
                <span className="cw-spec-meta-item">Powerloom MOQ: <strong>From 50 Pcs</strong></span>
                <span className="cw-spec-meta-dot">&bull;</span>
                <span className="cw-spec-meta-item">Loom Setup: <strong>30–45 Days</strong></span>
              </div>
            </div>

            {/* RIGHT COLUMN: CLEAN EDITORIAL CRAFT PHOTOGRAPHY SHOWCASE */}
            <div className="cw-hero-visual-editorial">
              <div className="cw-editorial-frame">
                <img
                  src="https://assets.weave365.com/assets/banner/collab-brand-hero2.jpg"
                  alt="Varanasi Master Silk Weaver at Handloom"
                  className="cw-editorial-main-img"
                />
              </div>
              <div className="cw-editorial-caption">
                <span className="cw-caption-dot" />
                <span>Varanasi Loom Network &bull; Kadhwa, Phekwa & Brocade Master Weavers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEDICATED LOOM SPECIFICATION & COMMERCIAL ESTIMATOR MATRIX */}
      <section className="cw-section cw-bg-light" id="loom-matrix">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>Loom Specification & Production Matrix</h2>
            <p className="cw-section-subtitle">
              Select your target production mode to review Minimum Order Quantities (MOQ), setup lead times, and weave capabilities.
            </p>
          </div>

          <div className="cw-loom-matrix-card">
            {/* FLAT UNDERLINE TAB SWITCHER */}
            <div className="cw-sheet-tabs">
              <button
                type="button"
                className={`cw-sheet-tab ${heroLoomType === 'handloom' ? 'active' : ''}`}
                onClick={() => {
                  setHeroLoomType('handloom');
                  setWeavingType('Handloom (MOQ: 4 pcs)');
                }}
              >
                HANDLOOM (ARTISAN WEAVE)
              </button>
              <button
                type="button"
                className={`cw-sheet-tab ${heroLoomType === 'powerloom' ? 'active' : ''}`}
                onClick={() => {
                  setHeroLoomType('powerloom');
                  setWeavingType('Powerloom (MOQ: 50 pcs)');
                }}
              >
                POWERLOOM (VOLUME PRODUCTION)
              </button>
            </div>

            {/* INLINE DIVIDER ROWS */}
            <dl className="cw-sheet-list">
              <div className="cw-sheet-row">
                <dt className="cw-sheet-key">Minimum Order Quantity (MOQ)</dt>
                <dd className="cw-sheet-val cw-val-gold">
                  {heroLoomType === 'handloom' ? '4 Pieces / Design' : '50 Pieces / Design'}
                </dd>
              </div>
              <div className="cw-sheet-row">
                <dt className="cw-sheet-key">Pre-Weaving & Loom Setup</dt>
                <dd className="cw-sheet-val">
                  {heroLoomType === 'handloom' ? '30–45 Working Days' : '15–30 Working Days'}
                </dd>
              </div>
              <div className="cw-sheet-row">
                <dt className="cw-sheet-key">Weaving & Production Lead Time</dt>
                <dd className="cw-sheet-val">
                  {heroLoomType === 'handloom' ? '20–90 Working Days' : '15–45 Working Days'}
                </dd>
              </div>
              <div className="cw-sheet-row">
                <dt className="cw-sheet-key">Weave & Motif Capability</dt>
                <dd className="cw-sheet-val">
                  {heroLoomType === 'handloom' ? 'Kadhwa, Phekwa, Meenakari, Cutwork' : 'High-Density Jacquard, Brocade'}
                </dd>
              </div>
              <div className="cw-sheet-row">
                <dt className="cw-sheet-key">Zari Compatibility</dt>
                <dd className="cw-sheet-val">
                  {heroLoomType === 'handloom' ? 'Tested Zari & Certified Real Zari' : 'Tested Metallic Zari'}
                </dd>
              </div>
            </dl>

            <div className="cw-sheet-action">
              <a href="#inquiry-form" className="cw-btn cw-btn-primary">
                Configure This Specification <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IS A CUSTOM WOVEN BANARASI SAREE */}
      <section className="cw-section cw-bg-light">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>What is a Custom Woven Banarasi Saree?</h2>
            <p className="cw-section-subtitle">
              Dedicated weave planning engineered specifically around your brand's exclusive visual identity.
            </p>
          </div>

          <div className="cw-concept-narrative">
            <p className="cw-concept-lead">
              A <strong>custom woven Banarasi saree</strong> is a saree created through a dedicated weaving process based on your brand’s 
              design requirements. Unlike ready-to-ship products, the weaving is planned specifically for your project, with decisions made on the 
              weave structure, motifs, fabric, zari, colours, and finishing before production begins.
            </p>
            <p className="cw-concept-body">
              Each project starts with design evaluation and technical planning, followed by loom development, sampling (where required), 
              and production. This approach enables businesses to develop exclusive Banarasi sarees that are not part of standard wholesale collections.
            </p>
          </div>
        </div>
      </section>

      {/* SHARE ANY OF THE FOLLOWING & TEAM ASSISTANCE */}
      <section className="cw-section">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>Acceptable Design Inputs for Custom Weaving</h2>
            <p className="cw-section-subtitle">
              To help us evaluate your custom weaving requirements, you may share one or more design references with our team.
            </p>
          </div>

          {/* INPUT TYPES GRID */}
          <div className="cw-inputs-grid">
            {designInputs.map((item, idx) => (
              <div className="cw-input-card" key={idx}>
                <div className="cw-input-icon">{item.icon}</div>
                <h3 className="cw-input-title">{item.title}</h3>
                <p className="cw-input-desc">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* TEAM ASSISTANCE BANNER */}
          <div className="cw-assistance-wrapper">
            <div className="cw-assistance-header">
              <Award size={28} className="cw-gold-icon" />
              <div>
                <h3>How Our Varanasi Weaving Team Assists You</h3>
                <p>Once we receive your inputs, our technical weaving experts guide your project through every stage:</p>
              </div>
            </div>

            <div className="cw-assistance-list">
              {teamAssistance.map((item, idx) => (
                <div className="cw-assistance-item" key={idx}>
                  <div className="cw-assistance-num">{idx + 1}</div>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7-STEP CUSTOM BANARASI SAREE WEAVING PROCESS */}
      <section id="weaving-process" className="cw-section cw-bg-light">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>The 7-Step Custom Weaving Process</h2>
            <p className="cw-section-subtitle">
              From design submission to final loom dispatch, explore our 7-stage quality-controlled production workflow.
            </p>
          </div>

          {/* STEP CONTROLS / TIMELINE TABS */}
          <div className="cw-step-tabs">
            {steps.map((st) => (
              <button
                key={st.step}
                type="button"
                className={`cw-step-tab ${activeStep === st.step ? 'active' : ''}`}
                onClick={() => setActiveStep(st.step)}
              >
                <span className="cw-step-num">Step {st.step}</span>
                <span className="cw-step-name">{st.short}</span>
              </button>
            ))}
          </div>

          {/* ACTIVE STEP CARD */}
          {(() => {
            const cur = steps.find(s => s.step === activeStep) || steps[0];
            return (
              <div className="cw-active-step-card">
                <div className="cw-step-card-header">
                  <div className="cw-step-badge">STAGE 0{cur.step}</div>
                  <h3>{cur.name}</h3>
                </div>

                <div className="cw-step-body-fixed">
                  <p className="cw-step-card-desc">{cur.desc}</p>

                  <div className="cw-step-details-box">
                    <h4>Key Milestones & Activities:</h4>
                    <ul>
                      {cur.details.map((d, i) => (
                        <li key={i}><Check size={16} className="cw-gold-icon" /> {d}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="cw-step-nav-btns">
                  <button
                    type="button"
                    className="cw-btn-text"
                    disabled={activeStep === 1}
                    onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                  >
                    ← Previous Stage
                  </button>
                  <span className="cw-step-counter">{activeStep} of 7</span>
                  <button
                    type="button"
                    className="cw-btn-text"
                    disabled={activeStep === 7}
                    onClick={() => setActiveStep(Math.min(7, activeStep + 1))}
                  >
                    Next Stage →
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* LOOM DEVELOPMENT DEEP DIVE */}
      <section className="cw-section">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>Loom Setup & Development Deep-Dive</h2>
            <p className="cw-section-subtitle">
              Loom development is the process of developing and configuring a weaving loom according to the approved 
              design and technical weaving specifications before production begins.
            </p>
          </div>

          <div className="cw-loom-impact-showcase">
            <div className="cw-impact-header">
              <h3>Why Loom Development is Critical</h3>
              <p className="cw-impact-lead">
                Loom development directly governs the tactile weight, pattern accuracy, motif sharpness, and structural durability of every handwoven Banarasi saree.
              </p>
            </div>

            <div className="cw-impact-metrics-list">
              <div className="cw-impact-metric-item">
                <div className="cw-metric-header">
                  <span className="cw-metric-title">Weaving Precision & Warp Tension</span>
                  <span className="cw-metric-val">100% Calibrated</span>
                </div>
                <p className="cw-metric-desc">Zero warp-break distortion or motif misalignment across full saree length.</p>
              </div>

              <div className="cw-impact-metric-item">
                <div className="cw-metric-header">
                  <span className="cw-metric-title">Fabric Hand-Feel & Density</span>
                  <span className="cw-metric-val">Certified Saree GSM</span>
                </div>
                <p className="cw-metric-desc">Exact thread density control for Katan, Georgette, Organza & Tissue silk warps.</p>
              </div>

              <div className="cw-impact-metric-item">
                <div className="cw-metric-header">
                  <span className="cw-metric-title">Motif Sharpness & Zari Finish</span>
                  <span className="cw-metric-val">Clean Lock</span>
                </div>
                <p className="cw-metric-desc">Clean reverse weaving without loose floats (Kadhwa & Phekwa specs).</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KEY WEAVING ACTIVITIES IN LOOM DEVELOPMENT */}
      <section className="cw-section cw-bg-light">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>Key Activities in Loom Development</h2>
            <p className="cw-section-subtitle">
              Explore the 6-stage technical setup workflow executed by master Varanasi weavers prior to bulk production.
            </p>
          </div>

          <div className="cw-loom-milestone-grid">
            <div className="cw-loom-milestone-item">
              <span className="cw-loom-num">01</span>
              <p>Analyses approved design & weaving requirements</p>
            </div>
            <div className="cw-loom-milestone-item">
              <span className="cw-loom-num">02</span>
              <p>Determines weave structure & weaving technique</p>
            </div>
            <div className="cw-loom-milestone-item">
              <span className="cw-loom-num">03</span>
              <p>Selects suitable yarn, fabric & zari combination</p>
            </div>
            <div className="cw-loom-milestone-item">
              <span className="cw-loom-num">04</span>
              <p>Plans motifs, borders, pallu & colour placement</p>
            </div>
            <div className="cw-loom-milestone-item">
              <span className="cw-loom-num">05</span>
              <p>Prepares loom settings & production specs</p>
            </div>
            <div className="cw-loom-milestone-item">
              <span className="cw-loom-num">06</span>
              <p>Conducts trial adjustments for accurate weaving</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMMERCIAL PARAMETERS: MOQ, TIMELINE, CHARGES, COST */}
      <section className="cw-section cw-bg-light">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>Commercial Parameters & Guidelines</h2>
            <p className="cw-section-subtitle">
              Clear, transparent operational benchmarks for planning your custom woven saree orders.
            </p>
          </div>

          <div className="cw-commercial-grid">
            {/* CARD 1: MOQ */}
            <div className="cw-comm-card">
              <div className="cw-comm-icon"><Box size={24} /></div>
              <h3>Minimum Order Quantity (MOQ)</h3>
              <p className="cw-comm-intro">
                Custom loom development involves design planning, technical development, and loom preparation before production begins. 
                As a result, an MOQ is required to make the weaving process commercially viable.
              </p>
              <div className="cw-moq-pills">
                <div className="cw-moq-pill">
                  <span className="cw-moq-val">From 4 pcs</span>
                  <span className="cw-moq-lbl">Handloom / Design</span>
                </div>
                <div className="cw-moq-pill">
                  <span className="cw-moq-val">From 50 pcs</span>
                  <span className="cw-moq-lbl">Powerloom / Design</span>
                </div>
              </div>
              <p className="cw-note-sm">
                *Final MOQ depends on design complexity, weave structure, fabric composition, zari type, and color count.
              </p>
            </div>

            {/* CARD 2: TIMELINE */}
            <div className="cw-comm-card">
              <div className="cw-comm-icon"><Clock size={24} /></div>
              <h3>Development & Production Timeline</h3>
              <p className="cw-comm-intro">
                Timeline depends on design complexity, weave structure, yarn/zari availability, sampling requirements, and quantity.
              </p>
              <div className="cw-timeline-rows">
                <div className="cw-tl-row">
                  <span className="cw-tl-stage">1. Pre-Weaving Development</span>
                  <span className="cw-tl-days">30–45 Working Days</span>
                  <p className="cw-tl-desc">Design review, material planning, loom development, and sample approval.</p>
                </div>
                <div className="cw-tl-row">
                  <span className="cw-tl-stage">2. Weaving & Production</span>
                  <span className="cw-tl-days">20–90 Working Days</span>
                  <p className="cw-tl-desc">Bulk weaving, quality inspection, pressing, finishing, packing, and dispatch.</p>
                </div>
              </div>
            </div>

            {/* CARD 3: PRE-PRODUCTION CHARGES */}
            <div className="cw-comm-card">
              <div className="cw-comm-icon"><FileText size={24} /></div>
              <h3>Pre-Production Charges</h3>
              <p className="cw-comm-intro">
                Every custom woven project requires design evaluation, technical planning, and loom preparation before production.
              </p>
              <ul className="cw-check-list">
                <li><Check size={16} className="cw-gold-icon" /> Design evaluation & technical consultation</li>
                <li><Check size={16} className="cw-gold-icon" /> Point paper graph & jacquard setup</li>
                <li><Check size={16} className="cw-gold-icon" /> Loom setting & trial weaving</li>
                <li><Check size={16} className="cw-gold-icon" /> Physical development sample (if required)</li>
              </ul>
              <p className="cw-note-sm">
                *Pre-production charges are quoted after our weaving team reviews your design specifications.
              </p>
            </div>

            {/* CARD 4: ESTIMATED COST DRIVERS */}
            <div className="cw-comm-card">
              <div className="cw-comm-icon"><DollarSign size={24} /></div>
              <h3>Estimated Saree Cost Factors</h3>
              <p className="cw-comm-intro">
                Since every custom weaving project is developed to approved specifications, there is no single standard price.
              </p>
              <ul className="cw-check-list">
                <li><Check size={16} className="cw-gold-icon" /> Motif density & weave technique (Kadhwa vs Phekwa)</li>
                <li><Check size={16} className="cw-gold-icon" /> Pure Silk fabric composition (Katan, Organza, Georgette)</li>
                <li><Check size={16} className="cw-gold-icon" /> Zari grade (Tested Metallic vs Certified Real Zari)</li>
                <li><Check size={16} className="cw-gold-icon" /> Total order volume & finishing requirements</li>
              </ul>
              <p className="cw-note-sm">
                *A detailed commercial quotation is shared upon completion of design evaluation.
              </p>
            </div>
          </div>

          {/* PRICE BENCHMARK & SPEC MATRIX */}
          <div className="cw-table-wrapper" style={{ marginTop: 40 }}>
            <h3 className="cw-table-title">Technique & Price Range Benchmarks</h3>
            <table className="cw-pricing-table">
              <thead>
                <tr>
                  <th>Weaving Technique / Style</th>
                  <th>Estimated Price Range (per saree)</th>
                  <th>Suitable Applications & Specifications</th>
                </tr>
              </thead>
              <tbody>
                {priceReferenceTable.map((row, i) => (
                  <tr key={i}>
                    <td className="cw-td-highlight">{row.technique}</td>
                    <td className="cw-td-price">{row.priceRange}</td>
                    <td>{row.suitable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FABRICS & ZARI MATRICES */}
          <div className="cw-spec-matrix">
            <div className="cw-spec-col">
              <h4>Available Fabric Compositions</h4>
              <div className="cw-tags">
                <span className="cw-tag">Katan Silk</span>
                <span className="cw-tag">Organza</span>
                <span className="cw-tag">Satin Silk</span>
                <span className="cw-tag">Tissue Silk</span>
                <span className="cw-tag">Tussar Silk</span>
                <span className="cw-tag">Georgette</span>
                <span className="cw-tag">Mashroo</span>
              </div>
            </div>
            <div className="cw-spec-col">
              <h4>Weaving Techniques & Motifs</h4>
              <div className="cw-tags">
                <span className="cw-tag">Kadhwa</span>
                <span className="cw-tag">Phekwa</span>
                <span className="cw-tag">Pick n Pick</span>
                <span className="cw-tag">Buta</span>
                <span className="cw-tag">Buti</span>
                <span className="cw-tag">Malti</span>
              </div>
            </div>
            <div className="cw-spec-col">
              <h4>Zari Quality Options</h4>
              <div className="cw-tags">
                <span className="cw-tag">Tested Zari (Silver/Gold Plated)</span>
                <span className="cw-tag">Real Zari (Certified Pure Silver/Gold)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IS CUSTOM WEAVING SUITABLE FOR */}
      <section className="cw-section">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>Target Audience & Business Models</h2>
            <p className="cw-section-subtitle">
              Custom woven Banarasi sarees are ideal for businesses looking to build exclusive proprietary lines.
            </p>
          </div>

          <div className="cw-audience-grid">
            {suitableAudiences.map((aud, i) => {
              const AudIcon = aud.icon || Building2;
              return (
                <div className="cw-audience-card" key={i}>
                  <AudIcon size={24} className="cw-gold-icon" style={{ marginBottom: 12 }} />
                  <h3>{aud.title}</h3>
                  <p>{aud.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CUSTOM WEAVING VS READY COLLECTIONS */}
      <section className="cw-section cw-bg-light">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>Custom Weaving vs. Ready Wholesale Saree Collections</h2>
            <p className="cw-section-subtitle">
              Choose the sourcing approach that best aligns with your brand strategy and inventory timeline.
            </p>
          </div>

          <div className="cw-comparison-table-wrapper">
            <table className="cw-comp-table">
              <thead>
                <tr>
                  <th>Feature / Parameter</th>
                  <th className="cw-col-custom">Choose Custom Weaving</th>
                  <th className="cw-col-ready">Choose Ready Collections</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Design Exclusivity</strong></td>
                  <td className="cw-td-custom"><Check size={16} className="cw-gold-icon" /> Exclusive proprietary brand designs</td>
                  <td className="cw-td-ready">Ready-to-order catalog designs</td>
                </tr>
                <tr>
                  <td><strong>Branding & Labeling</strong></td>
                  <td className="cw-td-custom"><Check size={16} className="cw-gold-icon" /> Private label manufacturing</td>
                  <td className="cw-td-ready">Standard wholesale catalog / white-label</td>
                </tr>
                <tr>
                  <td><strong>Minimum Order Quantity (MOQ)</strong></td>
                  <td className="cw-td-custom">4 pcs (Handloom) / 50 pcs (Powerloom)</td>
                  <td className="cw-td-ready"><Check size={16} className="cw-gold-icon" /> Low MOQ (5–10 pieces)</td>
                </tr>
                <tr>
                  <td><strong>Customization Scope</strong></td>
                  <td className="cw-td-custom"><Check size={16} className="cw-gold-icon" /> Custom weave structures, zari & shades</td>
                  <td className="cw-td-ready">Pre-set colorways and weaving specs</td>
                </tr>
                <tr>
                  <td><strong>Lead Time / Availability</strong></td>
                  <td className="cw-td-custom">50–135 Working Days total development</td>
                  <td className="cw-td-ready"><Check size={16} className="cw-gold-icon" /> Immediate dispatch (24–48 Hours)</td>
                </tr>
                <tr>
                  <td><strong>Business Objective</strong></td>
                  <td className="cw-td-custom">Long-term brand equity & proprietary lines</td>
                  <td className="cw-td-ready">Fast stock turnaround & lower initial investment</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="cw-section">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>Frequently Asked Questions</h2>
            <p className="cw-section-subtitle">
              Got questions about custom weaving, loom setups, or sampling? Find answers below.
            </p>
          </div>

          <div className="cw-faq-accordion">
            {faqs.map((faq, idx) => (
              <div className={`cw-faq-item ${openFaq === idx ? 'open' : ''}`} key={idx}>
                <button
                  type="button"
                  className="cw-faq-question"
                  onClick={() => toggleFaq(idx)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className={`cw-faq-chevron ${openFaq === idx ? 'rotated' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="cw-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* START YOUR CUSTOM DEVELOPMENT / INQUIRY FORM */}
      <section id="inquiry-form" className="cw-section cw-bg-light">
        <div className="cw-container">
          <div className="cw-inquiry-box">
            <div className="cw-inquiry-intro">
              <h2>Start Your Custom Banarasi Saree Development</h2>
              <p>
                If you already have a design, share your reference image, sketch, artwork, or concept with our team. 
                We will review the weaving feasibility, recommend suitable fabric and zari options, estimate the development cost, 
                advise the minimum order quantity, and provide an expected production timeline.
              </p>
              <p className="cw-inquiry-note">
                <Info size={16} className="cw-gold-icon" style={{ display: 'inline', marginRight: 6 }} />
                If your current requirement is only 5 to 10 pieces, we recommend selecting from our existing 
                <AppLink to="wholesale-catalogue" navigate={navigate} style={{ color: '#b78646', textDecoration: 'underline', marginLeft: 4 }}>
                  Banarasi Saree Wholesale Collections
                </AppLink>.
              </p>
            </div>

            <form className="cw-inquiry-form" onSubmit={handleFormSubmit}>
              <div className="cw-form-grid">
                <div className="cw-field">
                  <label htmlFor={businessTypeSelectId}>Your Business Segment *</label>
                  <select 
                    id={businessTypeSelectId}
                    value={businessType} 
                    onChange={(e) => setBusinessType(e.target.value)}
                  >
                    <option value="Private Label Brand">Private Label Brand</option>
                    <option value="Luxury Fashion Label">Luxury Fashion Label</option>
                    <option value="Fashion Designer">Fashion Designer</option>
                    <option value="Boutique Owner">Boutique Owner</option>
                    <option value="Bridal Wear Brand">Bridal Wear Brand</option>
                    <option value="Wholesaler / Exporter">Wholesaler / Exporter</option>
                    <option value="Corporate Gifting">Corporate Gifting</option>
                  </select>
                </div>

                <div className="cw-field">
                  <label htmlFor={weavingTypeSelectId}>Weaving Preference & MOQ *</label>
                  <select 
                    id={weavingTypeSelectId}
                    value={weavingType} 
                    onChange={(e) => setWeavingType(e.target.value)}
                  >
                    <option value="Handloom (MOQ: 4 pcs)">Handloom (MOQ: 4 pcs per design)</option>
                    <option value="Powerloom (MOQ: 50 pcs)">Powerloom (MOQ: 50 pcs per design)</option>
                    <option value="Need Guidance">Need Weaving Guidance</option>
                  </select>
                </div>

                <div className="cw-field">
                  <label htmlFor={fabricPrefSelectId}>Preferred Fabric Composition</label>
                  <select 
                    id={fabricPrefSelectId}
                    value={fabricPref} 
                    onChange={(e) => setFabricPref(e.target.value)}
                  >
                    <option value="Katan Silk">Pure Katan Silk</option>
                    <option value="Organza">Organza Silk</option>
                    <option value="Satin Silk">Satin Silk</option>
                    <option value="Tissue Silk">Tissue Silk</option>
                    <option value="Tussar Silk">Tussar Silk</option>
                    <option value="Georgette">Pure Georgette</option>
                    <option value="Mashroo">Mashroo Fabric</option>
                    <option value="Open to Suggestion">Open to Suggestion</option>
                  </select>
                </div>

                <div className="cw-field">
                  <label htmlFor={zariPrefSelectId}>Zari Quality Option</label>
                  <select 
                    id={zariPrefSelectId}
                    value={zariPref} 
                    onChange={(e) => setZariPref(e.target.value)}
                  >
                    <option value="Tested Zari">Tested Zari (Silver/Gold Plated Metallic)</option>
                    <option value="Real Zari">Real Zari (Certified Pure Silver/Gold)</option>
                    <option value="Silk Threads / Resham">Silk Threads / Resham (No Zari)</option>
                    <option value="Open to Suggestion">Open to Suggestion</option>
                  </select>
                </div>

                <div className="cw-field">
                  <label htmlFor={inputTypeSelectId}>Design Input Type You Will Share</label>
                  <select 
                    id={inputTypeSelectId}
                    value={inputType} 
                    onChange={(e) => setInputType(e.target.value)}
                  >
                    <option value="Design Reference Image">Design Reference Image</option>
                    <option value="Hand Sketch">Hand Sketch</option>
                    <option value="Digital Artwork">Digital Artwork / CAD</option>
                    <option value="Fabric Swatch">Fabric Swatch / Photo</option>
                    <option value="Concept / Theme">Brand Concept / Theme</option>
                  </select>
                </div>

                <div className="cw-field">
                  <label htmlFor="cw-contact-name">Full Name *</label>
                  <input
                    id="cw-contact-name"
                    type="text"
                    placeholder="Enter your name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </div>

                <div className="cw-field">
                  <label htmlFor="cw-contact-phone">Phone / WhatsApp Number *</label>
                  <input
                    id="cw-contact-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="cw-field">
                  <label htmlFor="cw-contact-email">Email Address</label>
                  <input
                    id="cw-contact-email"
                    type="email"
                    placeholder="name@brand.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="cw-field cw-field-full">
                <label htmlFor="cw-project-notes">Design Notes & Specification Details</label>
                <textarea
                  id="cw-project-notes"
                  rows={3}
                  placeholder="Describe your design concept, preferred colorways, estimated order quantity, or any specific motif requirements..."
                  value={projectNotes}
                  onChange={(e) => setProjectNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="cw-btn cw-btn-primary cw-btn-sm">
                Submit Inquiry via WhatsApp <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
