/**
 * @file CustomWovenPage.jsx
 * @description Custom Woven Banarasi Sarees Landing Page.
 * Showcases private label custom weaving, loom development, MOQ rules,
 * technical review steps, 7-step production process, pricing benchmarks,
 * materials/zari matrices, comparison tables, FAQs, and an interactive inquiry form.
 * 
 * @module views/CustomWovenPage
 */

import { useState, useId, useEffect } from 'react';
import { 
  Sliders, 
  Layers, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
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
  IndianRupee,
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

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    }
  }, []);

  const [heroLoomType, setHeroLoomType] = useState('handloom');

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
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
    { title: 'Technical Feasibility Review', desc: 'Reviewing the technical feasibility of your design for traditional Banarasi weaving.' },
    { title: 'Weave & Yarn Structuring', desc: 'Determining the appropriate weave structure, weaving technique, fabric composition, and zari combination required for your design.' },
    { title: 'Motif & Color Curation', desc: 'Suggesting suitable motifs, colour combinations, and finishing options to achieve the desired look.' },
    { title: 'Practical Weaving Optimization', desc: 'Identifying any design elements that may require modification for practical weaving and production.' },
    { title: 'Design Intent Preservation', desc: 'Recommending the most suitable weaving approach while preserving your original design intent.' },
    { title: 'Commercial & Timeline Guidance', desc: 'Providing guidance on the estimated MOQ, sampling requirements, pre-production charges, and expected production timeline.' },
    { title: 'Full Lifecycle Support', desc: 'Guiding you through every stage, from loom development and sample approval to final production.' },
  ];

  const steps = [
    {
      step: 1,
      name: 'Share Your Design',
      short: 'Share Design',
      desc: 'Send us your design reference, artwork, sketch, concept, or inspiration.',
      details: [
        'Photos, sketches, CAD files, or physical fabric swatches accepted',
        'Target colorway and quantity requirement assessment',
        'Complete brand privacy and design confidentiality'
      ],
      note: ''
    },
    {
      step: 2,
      name: 'Technical Design Review',
      short: 'Design Review',
      desc: 'Our weaving experts evaluate technical feasibility and loom compatibility:',
      details: [
        'Design feasibility & weave structure',
        'Fabric selection (Katan, Organza, Georgette, Tissue)',
        'Zari quality (Tested Zari vs Certified Real Gold/Silver Zari)',
        'Motif complexity, border and pallu balance',
        'Colour combinations & production suitability'
      ],
      note: 'If required, we may recommend technical modifications to improve weaving quality and production efficiency.'
    },
    {
      step: 3,
      name: 'Development Planning',
      short: 'Dev Planning',
      desc: 'After evaluation, our technical team prepares:',
      details: [
        'Technical weaving specifications & fabric recommendation',
        'Yarn and zari requirement calculation',
        'Estimated development cost & sampling plan',
        'Production timeline & MOQ schedule'
      ],
      note: ''
    },
    {
      step: 4,
      name: 'Custom Loom Development',
      short: 'Loom Setup',
      desc: 'A dedicated loom is developed and configured according to your approved design and technical weaving specifications.',
      intro: 'This stage includes:',
      details: [
        'Design graph preparation (Point paper mapping)',
        'Punching or electronic jacquard programming',
        'Loom setup & warp preparation',
        'Colour planning & trial weaving',
        'Sample development'
      ],
      note: 'Every custom project is prepared independently according to the approved design.'
    },
    {
      step: 5,
      name: 'Sample Approval',
      short: 'Sample Review',
      desc: 'A development sample is produced for your physical review.',
      details: [
        'Physical sample piece or swatch created on configured loom',
        'High-resolution photo & video documentation for remote review',
        'Physical inspection and client feedback sign-off'
      ],
      note: 'Production begins only after the sample is approved.'
    },
    {
      step: 6,
      name: 'Final Weaving',
      short: 'Final Weaving',
      desc: 'After approval, final weaving starts according to agreed specifications.',
      details: [
        'Bulk weaving executed on dedicated handlooms or powerlooms',
        'Master artisan supervision under strict quality parameters',
        'Consistent thread tension and color accuracy across the order lot'
      ],
      note: ''
    },
    {
      step: 7,
      name: 'Quality Inspection and Finishing',
      short: 'QC & Finishing',
      desc: 'Each saree passes through comprehensive quality checks and export finishing:',
      details: [
        'Quality inspection & thread checking',
        'Fabric inspection & defect verification',
        'Finishing & roll polishing',
        'Folding, private label packing & worldwide dispatch'
      ],
      note: ''
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
    { title: 'Private Label Brands', icon: Tag },
    { title: 'Luxury Fashion Labels', icon: Crown },
    { title: 'Fashion Designers', icon: PenTool },
    { title: 'Fashion Entrepreneurs', icon: Sparkles },
    { title: 'Boutique Owners', icon: Store },
    { title: 'Bridal Wear Brands', icon: Heart },
    { title: 'Wedding Wear Collections', icon: Layers },
    { title: 'White Label Businesses', icon: ShieldCheck },
    { title: 'Export Buyers', icon: Globe },
    { title: 'Retail Chains', icon: Building2 },
    { title: 'Corporate Gifting Projects', icon: Gift },
    { title: 'Premium Ethnic Wear Brands', icon: Award },
  ];

  const faqs = [
    {
      q: 'Can I make only 10 custom Banarasi sarees?',
      a: 'Normally no. Custom loom development is generally not commercially viable for such small quantities. In most cases, 5 to 10 pieces are not sufficient for custom loom development, and existing collections are recommended for orders of 5 to 10 pieces.'
    },
    {
      q: 'What is the minimum order quantity for custom woven Banarasi sarees?',
      a: 'The MOQ generally starts from around 50 pieces per design. The exact quantity depends on the design, fabric, and weaving complexity.'
    },
    {
      q: 'Can I provide my own design?',
      a: 'Yes. You can share artwork, sketches, images, CAD files, fabric references, motifs, or design concepts for evaluation.'
    },
    {
      q: 'Are sampling charges applicable?',
      a: 'Yes. Pre-production charges generally apply for design evaluation, technical development, loom setup, sampling, and production planning.'
    },
    {
      q: 'How long does custom Banarasi saree development take?',
      a: 'The timeline depends on the design complexity, sampling requirements, loom preparation, approvals, and production quantity. An estimated schedule is shared after reviewing the design.'
    },
    {
      q: 'Do you manufacture under private label?',
      a: 'Yes. We support custom weaving and private label manufacturing for eligible production quantities.'
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
                  sampling, and production before full-scale weaving starts. This process enables you to develop a unique Banarasi saree that reflects your brand identity rather than choosing from existing catalogue designs.
                </p>
              </div>




            </div>

            {/* RIGHT COLUMN: CLEAN EDITORIAL CRAFT PHOTOGRAPHY SHOWCASE */}
            <div className="cw-hero-visual-editorial">
              <div className="cw-editorial-frame">
                <img
                  src="https://assets.weave365.com/assets/banner/custom-woven-hero.webp"
                  alt="Varanasi Master Silk Weaver at Handloom"
                  className="cw-editorial-main-img"
                />
              </div>
              <div className="cw-editorial-caption">
                <span className="cw-caption-dot" />
                <span>Varanasi Master Weavers Network</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IS A CUSTOM WOVEN BANARASI SAREE */}
      <section className="cw-section cw-bg-light">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>What is a Custom Woven Banarasi Saree?</h2>
          </div>

          <div className="cw-concept-narrative">
            <p className="cw-concept-lead">
              A <strong>custom woven Banarasi saree</strong> is a saree created through a dedicated weaving process based on your brand's 
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

      {/* PRODUCTION MATRIX, WEAVING WORKFLOW & TIMELINE (SIMPLE ELEGANT TABLE) */}
      <section className="cw-matrix-section" id="production-matrix">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>Production Matrix, Weaving Workflow &amp; Timeline</h2>
            <p className="cw-section-subtitle">
              Select your preferred production method to compare Minimum Order Quantities (MOQ), pre-weaving lead times, production timelines, and weaving capabilities for Handloom and Powerloom Banarasi sarees.
            </p>
          </div>

          <div className="cw-simple-table-card">
            <table className="cw-simple-table">
              <thead>
                <tr>
                  <th className="th-param">Weaving Workflow &amp; MOQ</th>
                  <th className="th-mode">Handloom</th>
                  <th className="th-mode">Powerloom</th>
                </tr>
              </thead>
              <tbody>
                {/* ROW 1: MOQ */}
                <tr>
                  <td>
                    <div className="cw-table-param-title">Minimum Order Quantity (MOQ)</div>
                  </td>
                  <td>
                    <span className="cw-table-val-gold">4 Pieces / Design</span>
                  </td>
                  <td>
                    <span className="cw-table-val-bold">50 Pieces / Design</span>
                  </td>
                </tr>

                {/* ROW 2: PRE-WEAVING PREPARATION */}
                <tr>
                  <td>
                    <div className="cw-table-param-title">Pre-Weaving Preparation &amp; Loom Development</div>
                    <ul className="cw-table-bullets">
                      <li>Design graphing (Naksha)</li>
                      <li>Yarn selection</li>
                      <li>Dyeing</li>
                      <li>Warp (Tana) preparation</li>
                      <li>Weft (Bana) preparation</li>
                      <li>Jacquard card punching (if applicable)</li>
                      <li>Loom setup</li>
                    </ul>
                  </td>
                  <td>
                    <span className="cw-table-val-bold">30–45 Working Days</span>
                  </td>
                  <td>
                    <span className="cw-table-val-bold">30–45 Working Days</span>
                  </td>
                </tr>

                {/* ROW 3: WEAVING, FINISHING & DISPATCH */}
                <tr>
                  <td>
                    <div className="cw-table-param-title">Weaving, Finishing &amp; Dispatch Timeline</div>
                    <ul className="cw-table-bullets">
                      <li>Handloom weaving</li>
                      <li>Quality inspection</li>
                      <li>Finishing &amp; polishing</li>
                      <li>Packing</li>
                      <li>Dispatch</li>
                    </ul>
                  </td>
                  <td>
                    <span className="cw-table-val-bold">20–90 Working Days</span>
                  </td>
                  <td>
                    <span className="cw-table-val-bold">30–60 Working Days</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="cw-table-note">
            <strong>Note:</strong> The final MOQ is confirmed after our weaving team reviews your design and technical requirements.
          </div>
        </div>
      </section>

      {/* SHARE ANY OF THE FOLLOWING & TEAM ASSISTANCE */}
      <section className="cw-section cw-bg-light">
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
                <div className="cw-card-header">
                  <h3 className="cw-input-title">{item.title}</h3>
                  <span className="cw-input-icon">{item.icon}</span>
                </div>
                <p className="cw-input-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM ASSISTANCE — OVERDRIVE EDITORIAL LAYOUT */}
      <section className="cw-assist-section">
        <div className="cw-container">
          <div className="cw-assist-grid">
            {/* Left column — sticky intro with interlocking metrics */}
              <div className="cw-assist-intro">
                <div className="cw-assist-intro-inner">
                  <h3 className="cw-assist-heading">
                    How Our Varanasi Weaving Team <i>Assists You.</i>
                  </h3>
                  <p className="cw-assist-subtitle">
                    From technical feasibility to final production planning, our master weavers bridge the gap between your conceptual vision and the physical loom.
                  </p>
                  
                  <div className="cw-assist-metrics">
                    <div className="cw-assist-metric">
                      <span className="cw-assist-metric-val">100%</span>
                      <span className="cw-assist-metric-lbl">Design Intent<br />Preserved</span>
                    </div>
                    <div className="cw-assist-metric-divider" />
                    <div className="cw-assist-metric">
                      <span className="cw-assist-metric-val">7</span>
                      <span className="cw-assist-metric-lbl">Areas of<br />Expertise</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column — interactive focus list */}
              <div className="cw-assist-steps-list" role="list">
                {teamAssistance.map((item, idx) => (
                  <div className="cw-assist-step-card" key={idx} role="listitem">
                    <div className="cw-assist-step-num-bg">{idx + 1}</div>
                    <div className="cw-assist-step-content">
                      <span className="cw-assist-step-num">{idx + 1}</span>
                      <div className="cw-assist-step-body">
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </section>

      {/* CUSTOM BANARASI SAREE WEAVING PROCESS — UI/UX PRO MAX REDESIGN */}
      <section id="weaving-process" className="cw-section cw-bg-light cw-process-section-pro">
        <div className="cw-container">
          <div className="cw-section-header cw-process-header-pro">
            <h2>Custom Banarasi Saree Weaving Process</h2>
            <p className="cw-section-subtitle">
              A transparent, step-by-step journey from initial artwork review to final loom execution and quality inspection.
            </p>
          </div>

          {/* STEP CONTROLS / TIMELINE TRACK */}
          <div className="cw-step-tabs-container-pro">
            <div className="cw-step-tabs-pro">
              {steps.map((st) => (
                <button
                  key={st.step}
                  type="button"
                  className={`cw-step-tab-pro ${activeStep === st.step ? 'active' : ''}`}
                  onClick={() => setActiveStep(st.step)}
                >
                  <span className="cw-step-tab-num-pro">0{st.step}</span>
                  <span className="cw-step-tab-name-pro">{st.short}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ACTIVE STEP BENTO CARD */}
          {(() => {
            const cur = steps.find(s => s.step === activeStep) || steps[0];
            return (
              <div className="cw-active-step-card-pro">
                <div className="cw-step-card-top-pro">
                  <div className="cw-step-card-header-pro">
                    <div className="cw-step-badge-pro">
                      <span className="cw-step-badge-label">STAGE 0{cur.step} OF 0{steps.length}</span>
                    </div>
                    <h3>{cur.name}</h3>
                  </div>
                  <p className="cw-step-card-desc-pro">{cur.desc}</p>
                </div>

                <div className="cw-step-body-pro">
                  {cur.intro && (
                    <p className="cw-step-intro-text-pro">
                      {cur.intro}
                    </p>
                  )}

                  {cur.details && cur.details.length > 0 && (
                    <div className="cw-step-details-grid-pro">
                      {cur.details.map((d, i) => (
                        <div className="cw-step-detail-card-pro" key={i}>
                          <div className="cw-detail-icon-pill">
                            <Check size={14} />
                          </div>
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {cur.note && (
                    <div className="cw-step-note-box-pro">
                      <Info size={16} className="cw-note-icon-pro" />
                      <span>{cur.note}</span>
                    </div>
                  )}
                </div>

                <div className="cw-step-nav-bar-pro">
                  <button
                    type="button"
                    className="cw-step-nav-btn-pro prev"
                    disabled={activeStep === 1}
                    onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                  >
                    <ChevronLeft size={16} /> Previous Step
                  </button>

                  <div className="cw-step-progress-indicator-pro">
                    <div className="cw-progress-track-dots">
                      {steps.map(s => (
                        <span
                          key={s.step}
                          className={`cw-progress-dot ${s.step === activeStep ? 'active' : ''} ${s.step < activeStep ? 'completed' : ''}`}
                          onClick={() => setActiveStep(s.step)}
                          title={s.name}
                        />
                      ))}
                    </div>
                    <span className="cw-step-counter-pro">Step {activeStep} of {steps.length}</span>
                  </div>

                  <button
                    type="button"
                    className="cw-step-nav-btn-pro next"
                    disabled={activeStep === steps.length}
                    onClick={() => setActiveStep(Math.min(steps.length, activeStep + 1))}
                  >
                    Next Step <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </section>



      {/* LOOM DEVELOPMENT */}
      <section className="cw-section cw-bg-light">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>Loom Development</h2>
            <p className="cw-section-subtitle">
              Loom development is the process of developing and configuring a weaving loom according to the approved design and technical weaving specifications before production begins.
            </p>
          </div>

          <p style={{ fontWeight: 600, color: '#1c1917', marginBottom: '1.5rem', fontSize: 'var(--body-large-size)' }}>
            During loom development, our weaving team:
          </p>

          <div className="cw-loom-milestone-grid" style={{ marginBottom: '2.5rem' }}>
            <div className="cw-loom-milestone-item">
              <span className="cw-loom-num">01</span>
              <p>Analyses the approved design and its weaving requirements.</p>
            </div>
            <div className="cw-loom-milestone-item">
              <span className="cw-loom-num">02</span>
              <p>Determines the appropriate weave structure and weaving technique.</p>
            </div>
            <div className="cw-loom-milestone-item">
              <span className="cw-loom-num">03</span>
              <p>Selects the suitable yarn, fabric composition, and zari combination.</p>
            </div>
            <div className="cw-loom-milestone-item">
              <span className="cw-loom-num">04</span>
              <p>Plans motifs, borders, pallu, and colour placement.</p>
            </div>
            <div className="cw-loom-milestone-item">
              <span className="cw-loom-num">05</span>
              <p>Prepares the loom settings and weaving specifications required for production.</p>
            </div>
            <div className="cw-loom-milestone-item">
              <span className="cw-loom-num">06</span>
              <p>Conducts trial adjustments where necessary to ensure accurate weaving.</p>
            </div>
          </div>

          <div className="cw-table-note" style={{ borderLeft: '3px solid #b78646', paddingLeft: '1.25rem' }}>
            <span>Loom development is a critical stage because it directly influences the appearance, fabric quality, weaving accuracy, durability, and production efficiency of the finished Banarasi saree.</span>
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
              <div className="cw-card-header">
                <h3>Minimum Order Quantity (MOQ)</h3>
                <div className="cw-comm-icon"><Box size={22} /></div>
              </div>
              <p className="cw-comm-intro">
                Custom loom development involves design planning, technical development, and loom preparation before production begins. 
                As a result, a minimum order quantity (MOQ) is required to make the weaving process commercially viable.
              </p>
              
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: 600, color: '#1c1917', fontSize: 'var(--small-size)', marginBottom: '0.5rem' }}>
                  The typical minimum order quantity (MOQ) is:
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
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: 600, color: '#1c1917', fontSize: 'var(--small-size)', marginBottom: '0.4rem' }}>
                  The final MOQ may vary depending on:
                </p>
                <ul className="cw-check-list" style={{ gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <li><Check size={15} className="cw-gold-icon" /> Design complexity</li>
                  <li><Check size={15} className="cw-gold-icon" /> Weave structure</li>
                  <li><Check size={15} className="cw-gold-icon" /> Fabric composition</li>
                  <li><Check size={15} className="cw-gold-icon" /> Zari type</li>
                  <li><Check size={15} className="cw-gold-icon" /> Number of colours</li>
                  <li><Check size={15} className="cw-gold-icon" /> Production feasibility</li>
                </ul>
              </div>

              <p className="cw-note-sm" style={{ fontStyle: 'italic', marginTop: 'auto' }}>
                Note: The final MOQ is confirmed after our weaving team reviews your design and technical requirements.
              </p>
            </div>

            {/* CARD 2: TIMELINE */}
            <div className="cw-comm-card">
              <div className="cw-card-header">
                <h3>Timeline</h3>
                <div className="cw-comm-icon"><Clock size={22} /></div>
              </div>
              <p className="cw-comm-intro">
                The development and production timeline for a custom woven Banarasi saree depends on the design complexity, weave structure, yarn and zari availability, sampling requirements, and order quantity.
              </p>
              
              <div className="cw-timeline-rows" style={{ gap: '1.25rem' }}>
                <div className="cw-tl-row">
                  <span className="cw-tl-stage">1. Pre-Weaving Development</span>
                  <span className="cw-tl-days">30–45 Working Days</span>
                  <p className="cw-tl-desc" style={{ marginBottom: '0.4rem', fontStyle: 'italic' }}>
                    Before weaving begins, a typical project progresses through the following stages:
                  </p>
                  <ul className="cw-check-list" style={{ gap: '0.35rem', marginBottom: 0 }}>
                    <li><Check size={14} className="cw-gold-icon" /> Design review & technical feasibility assessment</li>
                    <li><Check size={14} className="cw-gold-icon" /> Weave structure & material planning</li>
                    <li><Check size={14} className="cw-gold-icon" /> Loom development & setup</li>
                    <li><Check size={14} className="cw-gold-icon" /> Sample development (if required)</li>
                    <li><Check size={14} className="cw-gold-icon" /> Sample review & approval</li>
                  </ul>
                </div>

                <div className="cw-tl-row">
                  <span className="cw-tl-stage">2. Weaving & Production</span>
                  <span className="cw-tl-days">20–90 Working Days</span>
                  <p className="cw-tl-desc" style={{ marginBottom: '0.4rem', fontStyle: 'italic' }}>
                    Once the design and sample are approved, production typically includes:
                  </p>
                  <ul className="cw-check-list" style={{ gap: '0.35rem', marginBottom: 0 }}>
                    <li><Check size={14} className="cw-gold-icon" /> Bulk weaving using traditional Banarasi weaving techniques</li>
                    <li><Check size={14} className="cw-gold-icon" /> Finishing & quality inspection</li>
                    <li><Check size={14} className="cw-gold-icon" /> Packing & dispatch</li>
                  </ul>
                </div>
              </div>

              <p className="cw-note-sm" style={{ fontStyle: 'italic', marginTop: 'auto' }}>
                Note: The estimated production timeline is shared after our weaving team reviews your design, technical requirements, and order quantity.
              </p>
            </div>

            {/* CARD 3: PRE-PRODUCTION CHARGES */}
            <div className="cw-comm-card">
              <div className="cw-card-header">
                <h3>Pre-Production Charges</h3>
                <div className="cw-comm-icon"><FileText size={22} /></div>
              </div>
              <p className="cw-comm-intro">
                Every custom woven Banarasi saree project requires design development, technical planning, and loom preparation before production begins.
              </p>
              
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: 600, color: '#1c1917', fontSize: 'var(--small-size)', marginBottom: '0.4rem' }}>
                  Pre-production charges may include:
                </p>
                <ul className="cw-check-list" style={{ gap: '0.35rem', marginBottom: '0.75rem' }}>
                  <li><Check size={14} className="cw-gold-icon" /> Design evaluation</li>
                  <li><Check size={14} className="cw-gold-icon" /> Technical consultation</li>
                  <li><Check size={14} className="cw-gold-icon" /> Weave structure planning</li>
                  <li><Check size={14} className="cw-gold-icon" /> Loom development and setup</li>
                  <li><Check size={14} className="cw-gold-icon" /> Design development</li>
                  <li><Check size={14} className="cw-gold-icon" /> Sample development (if required)</li>
                  <li><Check size={14} className="cw-gold-icon" /> Production planning</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: 600, color: '#1c1917', fontSize: 'var(--small-size)', marginBottom: '0.4rem' }}>
                  The final pre-production cost depends on:
                </p>
                <ul className="cw-check-list" style={{ gap: '0.35rem', marginBottom: '0.5rem' }}>
                  <li><Check size={14} className="cw-gold-icon" /> Design complexity</li>
                  <li><Check size={14} className="cw-gold-icon" /> Fabric composition</li>
                  <li><Check size={14} className="cw-gold-icon" /> Zari type and quality</li>
                  <li><Check size={14} className="cw-gold-icon" /> Weaving technique</li>
                  <li><Check size={14} className="cw-gold-icon" /> Sampling requirements</li>
                  <li><Check size={14} className="cw-gold-icon" /> Project scope</li>
                </ul>
              </div>

              <p className="cw-note-sm" style={{ fontStyle: 'italic', marginTop: 'auto' }}>
                Note: Pre-production charges are quoted after our weaving team reviews your design and technical requirements.
              </p>
            </div>

            {/* CARD 4: ESTIMATED SAREE COST */}
            <div className="cw-comm-card">
              <div className="cw-card-header">
                <h3>Estimated Saree Cost</h3>
                <div className="cw-comm-icon"><IndianRupee size={22} /></div>
              </div>
              <p className="cw-comm-intro">
                The cost of a custom woven Banarasi saree varies depending on the design specifications and production requirements. Since every custom weaving project is developed according to the approved design specifications, there is no standard price.
              </p>
              
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: 600, color: '#1c1917', fontSize: 'var(--small-size)', marginBottom: '0.4rem' }}>
                  The final saree cost is determined by factors such as:
                </p>
                <ul className="cw-check-list" style={{ gap: '0.35rem', marginBottom: '0.75rem' }}>
                  <li><Check size={14} className="cw-gold-icon" /> Design complexity</li>
                  <li><Check size={14} className="cw-gold-icon" /> Fabric composition</li>
                  <li><Check size={14} className="cw-gold-icon" /> Weave structure</li>
                  <li><Check size={14} className="cw-gold-icon" /> Zari type and quality</li>
                  <li><Check size={14} className="cw-gold-icon" /> Colour combinations</li>
                  <li><Check size={14} className="cw-gold-icon" /> Weaving time and labour</li>
                  <li><Check size={14} className="cw-gold-icon" /> Order quantity</li>
                  <li><Check size={14} className="cw-gold-icon" /> Finishing requirements</li>
                </ul>
              </div>

              <p className="cw-comm-intro" style={{ marginBottom: '1rem', fontStyle: 'normal' }}>
                If your project proceeds to bulk production, we will provide a detailed commercial quotation based on the approved design, final specifications, minimum order quantity (MOQ), and production requirements.
              </p>

              <p className="cw-note-sm" style={{ fontStyle: 'italic', marginTop: 'auto' }}>
                Note: A detailed cost estimate is shared after the design review and technical feasibility assessment are completed.
              </p>
            </div>
          </div>


        </div>
      </section>

      {/* COMPLETE GUIDE TO BANARASI SAREE WEAVE TECHNIQUES */}
      <section id="weaving-techniques" className="cw-section cw-bg-light">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>Complete Guide to Banarasi Saree Weave Techniques</h2>
            <p className="cw-section-subtitle" style={{ maxWidth: '1200px', margin: '0 auto' }}>
              Banarasi sarees are crafted using a variety of traditional weaving techniques, each offering a unique combination of craftsmanship, texture, motif formation, and production complexity. These weaving techniques can be applied to different Banarasi fabric bases, including Katan Silk, Kora (Organza), Georgette, Tissue, Satin, Cotton Silk, and other silk-blend fabrics. Depending on the chosen fabric, the same weave technique can produce different textures, drape, weight, and appearance. The breakdown below summarizes the most important Banarasi weave techniques and the fabric types in which they are commonly woven, helping buyers, designers, resellers, and textile enthusiasts understand their key differences.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', marginTop: '2.5rem', alignItems: 'start' }}>
            {/* CATEGORY 1 */}
            <div style={{ borderTop: '1px solid #e8ded0', paddingTop: '1.5rem' }}>
              <h3 style={{ fontFamily: "var(--font-heading, 'Cormorant Garamond', Georgia, serif)", fontSize: 'var(--h4-size)', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                Traditional Banarasi Weaving Techniques
              </h3>
              <p style={{ fontSize: 'var(--body-size)', color: '#574c40', fontStyle: 'italic', marginBottom: '1.25rem', lineHeight: '1.6' }}>
                These are the primary weaving methods used by Banarasi artisans to create motifs and patterns. Each technique differs in weaving process, craftsmanship, production time, and fabric appearance.
              </p>
              <ul className="cw-check-list" style={{ gap: '0.75rem', marginBottom: 0 }}>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Kadhwa Weaving</strong> – Individual motifs woven separately without floats on the reverse.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Phekwa Weaving</strong> – Continuous supplementary weft weaving with floats on the back.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Cutwork Weaving</strong> – Floating threads are cut after weaving for a cleaner reverse finish.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Tanchoi Weaving</strong> – Dense silk weave with intricate self-patterns and minimal zari floats.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Jamdani Weaving</strong> – Supplementary weft technique for detailed floral and geometric motifs.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Brocade Weaving</strong> – Rich decorative weaving using silk and zari threads.</span></li>
              </ul>
            </div>

            {/* CATEGORY 2 */}
            <div style={{ borderTop: '1px solid #e8ded0', paddingTop: '1.5rem' }}>
              <h3 style={{ fontFamily: "var(--font-heading, 'Cormorant Garamond', Georgia, serif)", fontSize: 'var(--h4-size)', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                Banarasi Design & Motif Weaving Styles
              </h3>
              <p style={{ fontSize: 'var(--body-size)', color: '#574c40', fontStyle: 'italic', marginBottom: '1.25rem', lineHeight: '1.6' }}>
                These weaving styles define the visual appearance and decorative motifs of Banarasi sarees rather than the weaving mechanism itself.
              </p>
              <ul className="cw-check-list" style={{ gap: '0.75rem', marginBottom: 0 }}>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Jangla Weaving</strong> – Large interconnected floral vine patterns across the fabric.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Meenakari Weaving</strong> – Multicolour silk highlights woven within zari motifs.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Butidar Weaving</strong> – Small repeating buti motifs distributed across the fabric.</span></li>
              </ul>
            </div>

            {/* CATEGORY 3 */}
            <div style={{ borderTop: '1px solid #e8ded0', paddingTop: '1.5rem' }}>
              <h3 style={{ fontFamily: "var(--font-heading, 'Cormorant Garamond', Georgia, serif)", fontSize: 'var(--h4-size)', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                Banarasi Fabric Base Weaves
              </h3>
              <p style={{ fontSize: 'var(--body-size)', color: '#574c40', fontStyle: 'italic', marginBottom: '1.25rem', lineHeight: '1.6' }}>
                These refer to the base fabric on which Banarasi motifs and weave techniques are created. The fabric influences the saree's texture, weight, drape, and overall appearance.
              </p>
              <ul className="cw-check-list" style={{ gap: '0.75rem', marginBottom: 0 }}>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Katan Weaving</strong> – Fine pure silk plain weave with a smooth finish.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Kora Weaving</strong> – Crisp, lightweight silk organza base.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Organza Banarasi Weaving</strong> – Sheer organza fabric decorated with Banarasi motifs.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Georgette Banarasi Weaving</strong> – Lightweight crepe-textured fabric with fluid drape.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Satin Weaving</strong> – Smooth and lustrous fabric with a glossy surface.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Dupion Weaving</strong> – Textured silk fabric woven from uneven silk yarns.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Tissue Weaving</strong> – Lightweight shimmering fabric woven with silk and metallic zari.</span></li>
              </ul>
            </div>

            {/* CATEGORY 4 */}
            <div style={{ borderTop: '1px solid #e8ded0', paddingTop: '1.5rem' }}>
              <h3 style={{ fontFamily: "var(--font-heading, 'Cormorant Garamond', Georgia, serif)", fontSize: 'var(--h4-size)', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                Banarasi Blended Fabric Weaves
              </h3>
              <p style={{ fontSize: 'var(--body-size)', color: '#574c40', fontStyle: 'italic', marginBottom: '1.25rem', lineHeight: '1.6' }}>
                These fabrics combine two or more natural fibres to achieve a balance of appearance, texture, durability, comfort, and cost.
              </p>
              <ul className="cw-check-list" style={{ gap: '0.75rem', marginBottom: 0 }}>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Cotton-Silk Weaving</strong> – Blend of cotton and silk for comfort and sheen.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Silk Linen Weaving</strong> – Blend of silk and linen with a natural textured finish.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Silk Cotton Tissue Weaving</strong> – Tissue fabric woven using silk and cotton yarns.</span></li>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Mashru Weaving</strong> – Traditional silk-cotton weave offering the appearance of silk with the comfort of cotton.</span></li>
              </ul>
            </div>

            {/* CATEGORY 5 */}
            <div style={{ borderTop: '1px solid #e8ded0', paddingTop: '1.5rem' }}>
              <h3 style={{ fontFamily: "var(--font-heading, 'Cormorant Garamond', Georgia, serif)", fontSize: 'var(--h4-size)', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                Traditional & Specialty Banarasi Weaves
              </h3>
              <p style={{ fontSize: 'var(--body-size)', color: '#574c40', fontStyle: 'italic', marginBottom: '1.25rem', lineHeight: '1.6' }}>
                Specialized or less commonly used weaving techniques that represent traditional craftsmanship and niche textile applications.
              </p>
              <ul className="cw-check-list" style={{ gap: '0.75rem', marginBottom: 0 }}>
                <li><Check size={16} className="cw-gold-icon" style={{ flexShrink: 0, marginTop: 3 }} /> <span><strong>Ektara Weaving</strong> – A traditional weaving technique used for specific fabric constructions and niche Banarasi textiles.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IS CUSTOM WEAVING SUITABLE FOR */}
      <section className="cw-section">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>Who is Custom Weaving Suitable For?</h2>
            <p className="cw-section-subtitle">
              Custom woven Banarasi sarees are ideal for businesses and professionals looking to develop exclusive products instead of purchasing ready-made wholesale collections.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 600, color: '#1c1917', fontSize: 'var(--body-large-size)', marginBottom: '1.25rem' }}>
              Custom weaving is suitable for:
            </p>
            <div className="cw-audience-grid">
              {suitableAudiences.map((aud, i) => {
                const AudIcon = aud.icon || Building2;
                return (
                  <div className="cw-audience-card" key={i}>
                    <div className="cw-card-header">
                      <h3>{aud.title}</h3>
                      <AudIcon size={20} className="cw-gold-icon" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cw-table-note" style={{ borderLeft: '3px solid #b78646', paddingLeft: '1.25rem', marginTop: '2.25rem' }}>
            <span>Custom weaving is suitable for businesses that want to develop exclusive Banarasi saree collections under their own brand.</span>
          </div>
        </div>
      </section>

      {/* CUSTOM WEAVING VS READY COLLECTIONS */}
      <section className="cw-section cw-bg-light">
        <div className="cw-container">
          <div className="cw-section-header">
            <h2>Custom Weaving vs Ready Collections</h2>
          </div>

          <div className="cw-comparison-table-wrapper">
            <table className="cw-comp-table">
              <thead>
                <tr>
                  <th className="cw-col-custom" style={{ width: '50%' }}>Choose Custom Weaving</th>
                  <th className="cw-col-ready" style={{ width: '50%' }}>Choose Ready Collections</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="cw-td-custom"><Check size={16} className="cw-gold-icon" /> Exclusive brand designs</td>
                  <td className="cw-td-ready">Ready-to-order collections</td>
                </tr>
                <tr>
                  <td className="cw-td-custom"><Check size={16} className="cw-gold-icon" /> Private label manufacturing</td>
                  <td className="cw-td-ready">Low MOQ (5–10 pieces)</td>
                </tr>
                <tr>
                  <td className="cw-td-custom"><Check size={16} className="cw-gold-icon" /> Custom weave structures</td>
                  <td className="cw-td-ready">Immediate availability</td>
                </tr>
                <tr>
                  <td className="cw-td-custom"><Check size={16} className="cw-gold-icon" /> Medium to large production quantities</td>
                  <td className="cw-td-ready">Faster dispatch</td>
                </tr>
                <tr>
                  <td className="cw-td-custom"><Check size={16} className="cw-gold-icon" /> Long-term product development</td>
                  <td className="cw-td-ready">Lower initial investment</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* START YOUR CUSTOM DEVELOPMENT / INQUIRY BOX */}
      <section id="inquiry-form" className="cw-section cw-bg-light">
        <div className="cw-container">
          <div className="cw-inquiry-box">
            <div className="cw-inquiry-intro">
              <h2>Start Your Custom Banarasi Saree Development</h2>
              <p style={{ marginBottom: '1rem', lineHeight: '1.65' }}>
                If you already have a design, share your reference image, sketch, artwork, CAD file, or concept with our team. We will evaluate its weaving feasibility, recommend the most suitable Banarasi weave structure, fabric, yarn, and zari options, estimate the loom development cost, advise the Minimum Order Quantity (MOQ), and provide an estimated production and delivery timeline.
              </p>
              <p className="cw-inquiry-note" style={{ marginBottom: '1.75rem' }}>
                <Info size={16} className="cw-gold-icon" style={{ display: 'inline', marginRight: 6 }} />
                If your current requirement is only 5–10 pieces, we recommend selecting from our existing{' '}
                <AppLink to="wholesale-catalogue" navigate={navigate} style={{ color: '#b78646', textDecoration: 'underline', marginLeft: 4 }}>
                  Banarasi Saree Wholesale Collections
                </AppLink>. Custom loom development is generally recommended for brands, designers, boutiques, wholesalers, exporters, and private-label businesses planning larger production quantities.
              </p>

              <h3 style={{ fontFamily: "var(--font-heading, 'Cormorant Garamond', Georgia, serif)", fontSize: 'var(--h3-size)', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>
                Ready to Bring Your Design to the Loom?
              </h3>
              <p style={{ marginBottom: '1.25rem', lineHeight: '1.65' }}>
                Whether you are developing a private label collection, designer collection, bridal collection, or an exclusive Banarasi saree range, our team can guide you through every stage of the process—from loom development and yarn preparation to weaving, quality inspection, finishing, packing, and dispatch.
              </p>

              <div style={{ margin: '2rem 0', background: '#ffffff', padding: '2rem 2.25rem', borderRadius: '12px', border: '1px solid #e8ded0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '1.25rem', fontSize: 'var(--h5-size)', fontFamily: "var(--font-heading, 'Cormorant Garamond', Georgia, serif)" }}>
                  Share your design with us to receive:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem 2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--body-size)', color: 'var(--ink)' }}>
                    <Check size={18} className="cw-gold-icon" style={{ flexShrink: 0 }} />
                    <span>Weaving feasibility assessment</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--body-size)', color: 'var(--ink)' }}>
                    <Check size={18} className="cw-gold-icon" style={{ flexShrink: 0 }} />
                    <span>Recommended weave structure and fabric</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--body-size)', color: 'var(--ink)' }}>
                    <Check size={18} className="cw-gold-icon" style={{ flexShrink: 0 }} />
                    <span>MOQ recommendation</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--body-size)', color: 'var(--ink)' }}>
                    <Check size={18} className="cw-gold-icon" style={{ flexShrink: 0 }} />
                    <span>Loom development cost estimate</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--body-size)', color: 'var(--ink)' }}>
                    <Check size={18} className="cw-gold-icon" style={{ flexShrink: 0 }} />
                    <span>Production timeline</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--body-size)', color: 'var(--ink)' }}>
                    <Check size={18} className="cw-gold-icon" style={{ flexShrink: 0 }} />
                    <span>Quotation for custom manufacturing</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed #e8ded0' }}>
                <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: 'var(--small-size)', marginBottom: '0.2rem' }}>Direct Email</span>
                    <a href="mailto:weave365@gmail.com" style={{ color: 'var(--ink)', fontWeight: 700, fontSize: 'var(--body-large-size)', textDecoration: 'none' }}>weave365@gmail.com</a>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: 'var(--small-size)', marginBottom: '0.2rem' }}>Direct WhatsApp</span>
                    <a href="https://wa.me/919919101369" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 'var(--body-large-size)', textDecoration: 'none' }}>+91 99191 01369</a>
                  </div>
                </div>

                <a 
                  href="https://wa.me/919919101369?text=Hi%20Weave365,%20I%20have%20a%20custom%20Banarasi%20saree%20design%20to%20share." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="cw-btn cw-btn-primary cw-btn-sm"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Share Your Design on WhatsApp <Send size={16} />
                </a>
              </div>
            </div>
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
    </div>
  );
}
