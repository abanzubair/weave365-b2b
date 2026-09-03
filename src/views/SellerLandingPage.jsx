/**
 * @file SellerLandingPage.jsx
 * @description Dedicated Landing View for Varanasi Saree & Suit Weavers, Manufacturers, and Stockists.
 * Allows sellers to list authentic collections on Weave 365 and reach global B2B & B2C buyer networks
 * without dealing with consumer marketplace red-tape (no return management, no NDR/RTO hassle, direct payouts).
 * 
 * Design adheres to Impeccable "quieter" and "distill" standards:
 * - Extremely minimal, cardless layout (hairline table ledgers, numbered rails, flush accordions).
 * - Softened luxury palette and restrained typographic hierarchy.
 * - Exact site-standard 2-column hero banner strictly preserved.
 * 
 * @module views/SellerLandingPage
 * @param {Object} props
 * @param {Function} [props.navigate] - Next.js router transition callback
 * @param {Function} [props.openAuth] - Auth/signup modal callback fallback
 */

import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  ShieldCheck, 
  X,
  HelpCircle,
  ShoppingBag,
  Sparkles
} from '../components/icons.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { assetSrc } from '../utils/assetSrc.js';
import '../styles/sellerLandingPage.css';

const HERO_IMAGE_URL = 'https://assets.weave365.com/assets/banner/weaver-onboard-hero.jpeg';

export function SellerLandingPage({ navigate, openAuth }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(prev => (prev === index ? null : index));
  };

  const handleSellerSignup = () => {
    if (navigate) {
      navigate('signup', 'partner');
    } else if (openAuth) {
      openAuth();
    }
  };

  const scrollToFaqs = (e) => {
    if (e) e.preventDefault();
    const el = document.getElementById('faqs');
    if (el) {
      const headerOffset = 85;
      const elementPosition = el.getBoundingClientRect().top;
      const currentScroll = window.scrollY || window.pageYOffset || 0;
      const offsetPosition = elementPosition + currentScroll - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '#faqs');
      }
    }
  };

  // 10 Detailed FAQs exactly as specified in the document
  const sellerFaqs = [
    {
      num: '01',
      q: 'Kya registration free hai?',
      a: 'Haan. Weave 365 par Seller registration bilkul free hai. Koi monthly ya yearly fee nahi hai.'
    },
    {
      num: '02',
      q: 'Kya mujhe apni poori collection Weave 365 par list karni hogi?',
      a: 'Nahi. Aapko apni poori collection list karne ki zaroorat nahi hai. Aap apne selected products hi Weave 365 par list kar sakte hain. Aap product ki photo aur details share kar dijiye. Baaki listing ka kaam hum kar lenge. Jitna product available hoga, utna hi aap sell kar sakte hain.'
    },
    {
      num: '03',
      q: 'Kya main saree ke saath suit, lehenga and dupatta bhi list kar sakta hoon?',
      a: 'Haan. Aap Banarasi Sarees ke saath Suits, Dupattas aur Lehengas bhi list kar sakte hain. Aap jo products sell karna chahte hain, unki photo aur details share karna hoga.'
    },
    {
      num: '04',
      q: 'Kya meri collection online catalog mein show hogi?',
      a: 'Haan. Aapke approved products Weave 365 ke online catalog mein show kiye jayenge. Aapko extra listing ya product promotion fee dene ki zaroorat nahi hai. Marketplace ki tarah apne products ko upar dikhane ke liye alag se paid promotion karna nahi padega. Aap product ki photos aur details share kijiye. Hum unhe catalog mein add karke customers ke liye available karenge. Aapka fayda: Aap apne products ko bina extra promotion fee ke India aur worldwide customers tak pahucha sakte hain. Agar aapke product ki price competitive hogi, to customers ke order aane ke chances bhi zyada honge. Weave 365 website customer demand aur price ke basis par products ko automatically promote karegi — iske liye aapko koi extra promotion fee nahi deni hogi.'
    },
    {
      num: '05',
      q: 'Kya mujhe marketplace ki tarah customer returns manage karne padenge?',
      a: 'Nahi. Customer return, cancellation ka kaam Weave 365 handle karega. Aapko sirf product ki quality check karke jo photo diya hai wahi product hamare warehouse tak bhejna hai. Product mein koi quality problem ya galat product ho, to uske liye alag claim process rahega.'
    },
    {
      num: '06',
      q: 'NDR aur RTO ka kya hoga?',
      a: 'NDR ke liye aap zimmedaar nahi honge. RTO ke rules order process karne se pehle clear kar diye jayenge. Aapko order lene se pehle saari terms aur zimmedari clearly bata di jayegi.'
    },
    {
      num: '07',
      q: 'GST ka kya hoga?',
      a: 'GST ka rule aapke business aur order ke hisaab se rahega. Weave 365 applicable transaction ka GST invoice provide karega. Aapke customer ko sale par GST ki zimmedari aapke business par ho sakti hai, jo aapke GST registration aur business setup par depend karegi.'
    },
    {
      num: '08',
      q: 'Kya main apna existing business bhi continue kar sakta hoon?',
      a: 'Haan. Aap apna existing business jaise chal raha hai waise hi continue kar sakte hain. Weave 365 ko aap extra business line ki tarah use kar sakte hain.'
    },
    {
      num: '09',
      q: 'Weave 365 par sell karna marketplace se kaise alag hai?',
      a: 'Weave 365 par seller ko sirf product list karke competition mein nahi chhod diya jata. Aapke approved products ko Weave 365 ke catalog mein customers ke liye available kiya jata hai. Aapko monthly fee ya paid promotion ke bina apne products showcase karne ka option milta hai. Aapka kaam product ki quality aur availability maintain karna hai. Baaki sales aur fulfilment ka process Weave 365 handle karta hai.'
    },
    {
      num: '10',
      q: 'Mujhe apne products Weave 365 ke through hi kyun sell karne chahiye?',
      a: 'Kyuki aapko apna alag online store banane aur customers lane ka poora burden nahi lena padta. Aap apne Banarasi products Weave 365 par list kijiye aur naye customers tak pahunchiye. Aap product ki quality check karke hamare warehouse tak product bhejiye; sales aur fulfilment Weave 365 handle karega. Isse aap apna existing business bhi continue kar sakte hain aur Weave 365 ko ek additional sales channel ke roop mein use kar sakte hain.'
    }
  ];

  // 6 Value Pillars (Unboxed Hairline Ledger)
  const valuePillars = [
    {
      num: '01',
      title: 'Aapka Collection',
      desc: 'Apni Banarasi saree, suit, lehenga aur dupatta collections submit kijiye.'
    },
    {
      num: '02',
      title: 'B2B & B2C Buyer Network',
      desc: 'Aapki products ko wholesale, boutique, retail aur sourcing buyers ke saamne place kiya ja sakta hai.'
    },
    {
      num: '03',
      title: 'No Consumer Marketplace Setup',
      desc: 'Aapko apna business model marketplace listing ke around build karne ki zarurat nahi.'
    },
    {
      num: '04',
      title: 'Direct Commercial Relationship',
      desc: 'Orders wholesale/sourcing requirements ke framework mein process hote hain, applicable commercial terms ke according.'
    },
    {
      num: '05',
      title: 'Catalog Support',
      desc: 'Product images, collection information aur catalog presentation mein Weave 365 support karta hai.'
    },
    {
      num: '06',
      title: 'Grow Beyond Local Buyers',
      desc: 'Varanasi ke local market aur brokers ke bahar national aur international business demand tak pahunch banaiye.'
    }
  ];

  // 6-Step Simple Progression Rail
  const onboardingSteps = [
    {
      num: '01',
      title: 'Register Your Business',
      desc: 'Apna naam, business details, location aur collection information submit kijiye.'
    },
    {
      num: '02',
      title: 'Share Your Collection',
      desc: 'Banarasi sarees, suits, lehengas, dupattas ya other Varanasi textile collections ke photos, specifications aur pricing details share kijiye.'
    },
    {
      num: '03',
      title: 'Collection Verification',
      desc: 'Our team product details, quality information aur sourcing credentials review karta hai.'
    },
    {
      num: '04',
      title: 'Professional Cataloging',
      desc: 'Approved products ko Weave 365 ke B2B & B2C catalog aur sourcing network ke liye professionally present kiya jata hai.'
    },
    {
      num: '05',
      title: 'Buyer Discovery',
      desc: 'Boutiques, retailers, resellers, exporters aur other business buyers aapki available collection discover kar sakte hain.'
    },
    {
      num: '06',
      title: 'Order & Fulfilment',
      desc: 'Approved commercial terms ke according orders process, dispatch aur payout kiye jaate hain.'
    }
  ];

  // Product categories list
  const categoriesList = [
    { name: 'Banarasi Sarees', desc: 'Katan, Organza, Soft Silk, Meenakari, Bridal aur Designer collections.' },
    { name: 'Banarasi Suits', desc: 'Festive, wedding, premium aur everyday collections.' },
    { name: 'Silk Dupattas', desc: 'Banarasi and woven silk collections for boutique and retail buyers.' },
    { name: 'Custom Collections', desc: 'Specific colours, motifs, designs, fabric requirements aur bulk production.' },
    { name: 'Private Label Supply', desc: 'Eligible business arrangements ke liye branded and white-label supply options.' }
  ];

  // Connected Buyer Networks
  const buyerNetworks = [
    'Boutiques',
    'Retail Stores',
    'Resellers',
    'Online Sellers',
    'Export Buyers',
    'Private Labels',
    'Fashion Brands'
  ];

  // Eligibility points
  const eligibilityCriteria = [
    'Banarasi sarees ya suits manufacture karte hain.',
    'Varanasi se saree collections source karte hain.',
    'Wholesalers ya stockists hain.',
    'Boutiques aur retailers ko supply karte hain.',
    'Online sellers ke liye collections provide karte hain.',
    'Custom or bulk Banarasi production kar sakte hain.',
    'Apne local buyer network ke bahar expand karna chahte hain.'
  ];

  return (
    <div className="seller-page-wrapper">
      {/* ==================================================================
          1. HERO BANNER (Strict Compliance with Site Standard 2-Column Banner)
          ================================================================== */}
      <section className="seller-hero">
        <Breadcrumb 
          items={[
            { name: 'Home', url: '/', route: 'home' },
            { name: 'Sell Banarasi Sarees' }
          ]} 
          navigate={navigate} 
        />
        
        <div className="seller-hero-inner">
          <div className="seller-hero-content">
            <h1 className="seller-hero-title">
              Sell Banarasi Sarees <span className="seller-no-wrap">&amp; Suits Online</span>
              <span className="seller-title-accent">
                Reach Buyers in <span className="seller-no-wrap">India &amp; Worldwide</span>
              </span>
            </h1>

            <p className="seller-hero-desc">
              Varanasi weavers and sellers: list Banarasi sarees &amp; suits on Weave 365, reach B2B &amp; B2C buyers across India and worldwide, with zero marketplace friction and direct fulfilment support.
            </p>

            {/* Standard Key Feature Bullets */}
            <ul className="seller-hero-bullets">
              <li className="seller-bullet-item">
                <CheckCircle2 size={16} className="seller-bullet-icon" />
                <span>List your products on Weave 365</span>
              </li>
              <li className="seller-bullet-item">
                <CheckCircle2 size={16} className="seller-bullet-icon" />
                <span>Check product quality before sending</span>
              </li>
              <li className="seller-bullet-item">
                <CheckCircle2 size={16} className="seller-bullet-icon" />
                <span>Send confirmed orders to our warehouse</span>
              </li>
              <li className="seller-bullet-item">
                <CheckCircle2 size={16} className="seller-bullet-icon" />
                <span>Sales &amp; fulfilment handled by us</span>
              </li>
              <li className="seller-bullet-item">
                <CheckCircle2 size={16} className="seller-bullet-icon" />
                <span>No Returns or Cancellations to Manage</span>
              </li>
              <li className="seller-bullet-item">
                <CheckCircle2 size={16} className="seller-bullet-icon" />
                <span>No NDR or RTO Hassle</span>
              </li>
            </ul>

            {/* Action Suite */}
            <div className="seller-action-suite">
              <div className="seller-buttons-row">
                <a 
                  href="#faqs" 
                  className="seller-btn-secondary"
                  onClick={scrollToFaqs}
                >
                  <span>Seller FAQs</span>
                </a>
                <button 
                  type="button" 
                  className="seller-btn-primary" 
                  onClick={handleSellerSignup}
                >
                  <span>Sell on Weave 365</span>
                  <ArrowRight size={15} />
                </button>
              </div>
              <div className="seller-assurance-note">
                <ShieldCheck size={16} className="seller-assurance-icon" />
                <span>Free Registration · No Monthly Subscription · Direct Payment</span>
              </div>
            </div>
          </div>

          <div className="seller-hero-visual">
            <div className="seller-photo-frame">
              <img
                src={assetSrc(HERO_IMAGE_URL)}
                alt="Master artisan weaving authentic Banarasi silk in Varanasi"
                className="seller-hero-photo"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          2. THE ALTERNATIVE HOOK (Editorial Statement, Cardless)
          ================================================================== */}
      <section className="seller-hook-section">
        <div className="seller-container">
          <div className="seller-hook-grid">
            <div>
              <span className="seller-eyebrow">A Direct-to-Loom Solution</span>
              <h2 className="seller-editorial-title">
                Apna Banarasi Collection Sell Kijiye — Weave 365 Ke Saath, <span className="seller-no-wrap">Bina Marketplace Seller Bane</span>
              </h2>
              <p className="seller-lead-paragraph">
                Varanasi ke Saree &amp; Suit Sellers ke liye ek dedicated B2B &amp; B2C selling option.
              </p>
              <p className="seller-lead-paragraph">
                Aap Banarasi sarees aur suits banate hain, source karte hain ya Varanasi mein apna collection sell karte hain ya online sell karna chahte hain — lekin online marketplaces ke complicated rules ke saath business nahi karna chahte?
              </p>
              <div className="seller-hook-contrast-box">
                <span className="seller-eyebrow" style={{ color: '#a84236' }}>Marketplace Headaches You Avoid</span>
                <div className="seller-pain-tokens">
                  <span className="seller-pain-token">Returns</span>
                  <span className="seller-pain-token">Cancellations</span>
                  <span className="seller-pain-token">NDR</span>
                  <span className="seller-pain-token">RTO</span>
                  <span className="seller-pain-token">Customer Complaints</span>
                  <span className="seller-pain-token">Platform Deductions</span>
                  <span className="seller-pain-token">Listing Restrictions</span>
                </div>
              </div>
            </div>

            <div className="seller-hook-badge-banner">
              <span className="seller-eyebrow">The Alternative Route</span>
              <h3>Verified Supply Network Partner</h3>
              <p>
                Ab ek alternative hai. Weave 365 par apni Banarasi collection ko B2B &amp; B2C buyers ke liye showcase kijiye.
              </p>
              <p style={{ marginTop: '0.85rem' }}>
                Aapki collection Weave 365 ke wholesale &amp; sourcing website par list hoti hai, jahan boutiques, retailers, resellers, online stores, exporters aur other business buyers Varanasi se authentic saree aur suit collections source karte hain.
              </p>
              <p style={{ marginTop: '0.85rem', fontWeight: 600, color: '#1a1613' }}>
                Marketplace seller banne ke bajay — Weave 365 ke verified supply network ka collection partner baniye.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          3. 6 VALUE PILLARS (Unboxed Hairline Ledger — Zero Nested Cards)
          ================================================================== */}
      <section className="seller-pillars-section">
        <div className="seller-container">
          <div className="seller-pillars-header">
            <span className="seller-eyebrow">Tailored For Varanasi</span>
            <h2 className="seller-editorial-title">
              Weave 365 Built for <span className="seller-no-wrap">Varanasi Saree &amp; Suit Sellers</span>
            </h2>
            <p className="seller-lead-paragraph">
              A business framework designed specifically around the realities of weaving, inventory lots, and wholesale trade.
            </p>
          </div>

          <div className="seller-hairline-ledger">
            {valuePillars.map((item) => (
              <div key={item.num} className="seller-ledger-cell">
                <span className="seller-ledger-idx">{item.num}</span>
                <h3 className="seller-ledger-title">{item.title}</h3>
                <p className="seller-ledger-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================
          4. MARKETPLACE PAIN VS WEAVE 365 RELIEF (Comparative Split)
          ================================================================== */}
      <section className="seller-contrast-section">
        <div className="seller-container">
          <div className="seller-contrast-grid">
            <div>
              <span className="seller-eyebrow">The Marketplace Trap</span>
              <h2 className="seller-editorial-title">
                Marketplace Selling <span className="seller-no-wrap">se Pareshan Hain?</span>
              </h2>
              <p className="seller-lead-paragraph">
                Agar aapne online marketplaces par sell karne ki koshish ki hai, to problem sirf product bechne ki nahi hoti. Aapko customer-facing operations bhi sambhalne padte hain:
              </p>

              <ul className="seller-friction-list">
                <li className="seller-friction-item">
                  <div className="seller-friction-title">
                    <X size={15} className="seller-friction-cross" />
                    <span>Return requests</span>
                  </div>
                  <p className="seller-friction-desc">Customer ko product pasand nahi aaya ya preference change ho gayi.</p>
                </li>
                <li className="seller-friction-item">
                  <div className="seller-friction-title">
                    <X size={15} className="seller-friction-cross" />
                    <span>Cancellation pressure</span>
                  </div>
                  <p className="seller-friction-desc">Order confirm hone ke baad bhi cancellation aur operational follow-up.</p>
                </li>
                <li className="seller-friction-item">
                  <div className="seller-friction-title">
                    <X size={15} className="seller-friction-cross" />
                    <span>NDR &amp; RTO</span>
                  </div>
                  <p className="seller-friction-desc">Customer available nahi, address issue, refusal — aur order wapas.</p>
                </li>
                <li className="seller-friction-item">
                  <div className="seller-friction-title">
                    <X size={15} className="seller-friction-cross" />
                    <span>After-Sales Management</span>
                  </div>
                  <p className="seller-friction-desc">Customer communication, claims aur delivery-related problems.</p>
                </li>
                <li className="seller-friction-item">
                  <div className="seller-friction-title">
                    <X size={15} className="seller-friction-cross" />
                    <span>Marketplace Rules</span>
                  </div>
                  <p className="seller-friction-desc">Platform policies aur commercial deductions ke saath constantly adapt karna.</p>
                </li>
              </ul>
            </div>

            <div className="seller-solution-narrative">
              <span className="seller-eyebrow">The Weave 365 Alternative</span>
              <h2 className="seller-editorial-title">
                Focus on Your Loom. <span className="seller-no-wrap">We Handle the Rest.</span>
              </h2>
              <p className="seller-lead-paragraph">
                Agar aapka core business Banarasi saree aur suit banana, source karna aur supply karna hai, to aapko zaroori nahi ki aap poora consumer marketplace operation bhi chalayein.
              </p>

              <div className="seller-relief-manifesto">
                <h3>Weave 365 gives you another route.</h3>
                <p>
                  Focus on your collection. Weave 365 ko sourcing, B2B &amp; B2C commerce channel banaiye.
                </p>
              </div>

              <button 
                type="button" 
                className="seller-btn-primary" 
                onClick={handleSellerSignup}
                style={{ marginTop: '1rem' }}
              >
                <span>Partner With Weave 365</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          5. 6-STEP ONBOARDING PROGRESSION (Numbered Linear Rail)
          ================================================================== */}
      <section className="seller-steps-section">
        <div className="seller-container">
          <div className="seller-steps-header">
            <span className="seller-eyebrow">Streamlined Onboarding</span>
            <h2 className="seller-editorial-title">
              Join Karne Ke Baad <span className="seller-no-wrap">Kya Hoga?</span>
            </h2>
            <p className="seller-lead-paragraph">
              A transparent, 6-step onboarding process with zero technical or listing friction.
            </p>
          </div>

          <div className="seller-steps-rail">
            {onboardingSteps.map((step) => (
              <div key={step.num} className="seller-step-node">
                <div className="seller-step-head">
                  <span className="seller-step-index">{step.num}</span>
                  <h3 className="seller-step-title">{step.title}</h3>
                </div>
                <p className="seller-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================
          6. WHAT YOU CAN SELL & BUYER REACH (Editorial Two-Column Index)
          ================================================================== */}
      <section className="seller-categories-section">
        <div className="seller-container">
          <div className="seller-dual-index-grid">
            <div className="seller-index-column">
              <span className="seller-eyebrow">Product Offerings</span>
              <h3>Aap Kya Sell <span className="seller-no-wrap">Kar Sakte Hain</span></h3>
              <p className="seller-index-lead">
                Banarasi sarees ke saath sirf ek category tak limited rehne ki zarurat nahi.
              </p>

              <ul className="seller-hairline-list">
                {categoriesList.map((item) => (
                  <li key={item.name} className="seller-hairline-item">
                    <div className="seller-item-name">{item.name}</div>
                    <p className="seller-item-desc">{item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="seller-index-column">
              <span className="seller-eyebrow">Commercial Demand</span>
              <h3>Aapka Collection. <span className="seller-no-wrap">Zyada Customers Tak Pahunch.</span></h3>
              <p className="seller-index-lead">
                Varanasi mein aapke products ki value sirf ek local customer ya ek marketplace listing tak limited nahi honi chahiye.
              </p>

              <p className="seller-audience-intro">
                Weave 365 connects Varanasi-based sourcing with verified buyers:
              </p>

              <div className="seller-audience-tags">
                {buyerNetworks.map((aud) => (
                  <span key={aud} className="seller-audience-pill">{aud}</span>
                ))}
              </div>

              <div className="seller-audience-highlight-frame">
                <p className="seller-audience-highlight-text">
                  Aap collection provide kijiye. Weave 365 ka network us collection ko business buyers ke saamne laane ke liye build kiya gaya hai.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          7. MODEL BENEFITS & PARALLEL BUSINESS (Restrained Flush Strip)
          ================================================================== */}
      <section className="seller-model-section">
        <div className="seller-container">
          <span className="seller-eyebrow">Why This Model Works</span>
          <h2 className="seller-editorial-title">
            Sellers Ke Liye B2B &amp; B2C Model <span className="seller-no-wrap">Kyun Behtar Hai?</span>
          </h2>

          <div className="seller-benefits-grid">
            <div className="seller-benefit-entry">
              <h3 className="seller-benefit-title">No Need to Build Your Business Around Marketplace Rules</h3>
              <p className="seller-benefit-desc">Aapka primary business product supply aur collection development reh sakta hai.</p>
            </div>
            <div className="seller-benefit-entry">
              <h3 className="seller-benefit-title">Sell Collection Instead of Chasing Individual Customers</h3>
              <p className="seller-benefit-desc">B2B &amp; B2C buyers ko curated collections aur reliable supply chahiye — sirf ek individual retail order nahi.</p>
            </div>
            <div className="seller-benefit-entry">
              <h3 className="seller-benefit-title">Better Fit for Manufacturers &amp; Weavers</h3>
              <p className="seller-benefit-desc">Agar aap multiple pieces, repeat collections ya custom production karte hain, B2B &amp; B2C sourcing model aapke business ke zyada kareeb ho sakta hai.</p>
            </div>
            <div className="seller-benefit-entry">
              <h3 className="seller-benefit-title">Professional Digital Presence</h3>
              <p className="seller-benefit-desc">Aapki collection online catalog mein professionally showcase ho sakti hai bina traditional marketplace storefront setup ke.</p>
            </div>
            <div className="seller-benefit-entry" style={{ gridColumn: '1 / -1' }}>
              <h3 className="seller-benefit-title">Expand Beyond Varanasi</h3>
              <p className="seller-benefit-desc">Apne collection ko boutiques, retailers aur sourcing buyers ke liye accessible banaiye — India aur eligible international markets mein.</p>
            </div>
          </div>

          <div className="seller-parallel-strip">
            <h4>Aap Apna Business Bhi Saath-Saath Kar Sakte Hain</h4>
            <p>
              Weave 365 aapke existing business ko replace karne ke liye nahi hai. Aap apne existing customers, WhatsApp buyers, retail relationships aur offline business ko continue kar sakte hain. Weave 365 ko ek additional B2B &amp; B2C sourcing channel ke roop mein use kijiye.
            </p>
            <div className="seller-parallel-formula">
              Existing Business + B2B &amp; B2C Buyer Network = More Ways to Sell
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          8. ELIGIBILITY CHECKLIST ("Kya Weave 365 Aapke Liye Hai?")
          ================================================================== */}
      <section className="seller-eligibility-section">
        <div className="seller-container">
          <span className="seller-eyebrow">Partner Suitability</span>
          <h2 className="seller-editorial-title">
            Kya Weave 365 <span className="seller-no-wrap">Aapke Liye Hai?</span>
          </h2>
          <p className="seller-lead-paragraph">
            Weave 365 Seller Network un businesses ke liye suitable hai jo:
          </p>

          <ul className="seller-eligibility-list">
            {eligibilityCriteria.map((item, idx) => (
              <li key={idx} className="seller-eligibility-item">
                <CheckCircle2 size={16} className="seller-check-icon" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ==================================================================
          9. 10 FAQS (Flush Minimalist Accordion — Zero Floating Boxes)
          ================================================================== */}
      <section id="faqs" className="seller-faqs-section">
        <div className="seller-container">
          <div className="seller-faqs-container">
            <div className="seller-faqs-header">
              <span className="seller-eyebrow">Clear Operational Answers</span>
              <h2 className="seller-editorial-title">
                Frequently <span className="seller-no-wrap">Asked Questions</span>
              </h2>
              <p className="seller-lead-paragraph" style={{ margin: '0 auto' }}>
                Everything Varanasi weavers and suppliers need to know about listing, returns, RTO, GST, and payouts.
              </p>
            </div>

            <div className="seller-faqs-accordion">
              {sellerFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={faq.num} className="seller-faq-item">
                    <button
                      type="button"
                      className="seller-faq-trigger"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                    >
                      <div className="seller-faq-q-wrap">
                        <span className="seller-faq-index">{faq.num}</span>
                        <h3 className="seller-faq-q">{faq.q}</h3>
                      </div>
                      <ChevronDown 
                        size={18} 
                        className={`seller-faq-toggle-icon ${isOpen ? 'open' : ''}`} 
                      />
                    </button>
                    {isOpen && (
                      <p className="seller-faq-answer">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          10. FINAL CALL TO ACTION (Distilled Luxury Closing)
          ================================================================== */}
      <section className="seller-closing-section">
        <div className="seller-container">
          <div className="seller-closing-content">
            <span className="seller-eyebrow">Start Your Journey</span>
            <h2 className="seller-closing-title">
              Kya Aap Apni Collection Business Buyers Tak Pahunchane Ke Liye <span className="seller-no-wrap">Ready Hain?</span>
            </h2>
            <div className="seller-closing-subtitle">
              Varanasi se Banarasi Collection Sell Kijiye. Marketplace Ke Bina Apni Collection Ko B2B &amp; B2C Customers <span className="seller-no-wrap">Tak Pahunchaiye.</span>
            </div>
            <p className="seller-closing-desc">
              Apna Business Register Kijiye, Apni Collection Share Kijiye Aur Weave 365 Ke Saath B2B &amp; B2C Business Shuru Kijiye.
            </p>
            <button 
              type="button" 
              className="seller-btn-primary" 
              onClick={handleSellerSignup}
            >
              <span>Register as Seller</span>
              <ArrowRight size={16} />
            </button>
            <div className="seller-closing-tagline">
              Varanasi Se Worldwide <span className="seller-no-wrap">Buyers Tak.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
