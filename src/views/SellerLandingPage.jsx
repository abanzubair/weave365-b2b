/**
 * @file SellerLandingPage.jsx
 * @description Dedicated Landing View for Varanasi Saree & Suit Weavers, Manufacturers, and Stockists.
 * Impeccable cardless design: zero nested cards, zero left borders, pure luxury hairline ledgers.
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
  ShieldCheck 
} from '../components/icons.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { assetSrc } from '../utils/assetSrc.js';
import '../styles/sellerLandingPage.css';

const HERO_IMAGE_URL = 'https://assets.weave365.com/assets/banner/sellersHero.webp';

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

  // Section 3: Weave 365 Built for Varanasi Saree & Suit Sellers
  const pillars = [
    {
      title: 'Aapka Collection',
      desc: 'Apni Banarasi saree, suit, lehenga aur dupatta collections submit kijiye.'
    },
    {
      title: 'B2B & B2C Buyer Network',
      desc: 'Aapki products ko wholesale, boutique, retail aur sourcing buyers ke saamne place kiya ja sakta hai.'
    },
    {
      title: 'No Consumer Marketplace Setup',
      desc: 'Aapko apna business model marketplace listing ke around build karne ki zarurat nahi.'
    },
    {
      title: 'Direct Commercial Relationship',
      desc: 'Orders wholesale/sourcing requirements ke framework mein process hote hain, applicable commercial terms ke according.'
    },
    {
      title: 'Catalog Support',
      desc: 'Product images, collection information aur catalog presentation mein Weave 365 support karta hai.'
    },
    {
      title: 'Grow Beyond Local Buyers',
      desc: 'Varanasi ke local market aur brokers ke bahar national aur international business demand tak pahunch banaiye.'
    }
  ];

  // Section 4: Marketplace Selling se Pareshan Hain? items
  const marketplacePains = [
    {
      title: 'Return requests',
      desc: 'customer ko product pasand nahi aaya ya preference change ho gayi.'
    },
    {
      title: 'Cancellation pressure',
      desc: 'order confirm hone ke baad bhi cancellation aur operational follow-up.'
    },
    {
      title: 'NDR & RTO',
      desc: 'customer available nahi, address issue, refusal — aur order wapas.'
    },
    {
      title: 'After-Sales Management',
      desc: 'customer communication, claims aur delivery-related problems.'
    },
    {
      title: 'Marketplace Rules',
      desc: 'platform policies aur commercial deductions ke saath constantly adapt karna.'
    }
  ];

  // Section 5: Join Karne Ke Baad Kya Hoga?
  const onboardingSteps = [
    {
      title: '1. Register Your Business',
      desc: 'Apna naam, business details, location aur collection information submit kijiye.'
    },
    {
      title: '2. Share Your Collection',
      desc: 'Banarasi sarees, suits, lehengas, dupattas ya other Varanasi textile collections ke photos, specifications aur pricing details share kijiye.'
    },
    {
      title: '3. Collection Verification',
      desc: 'Our team product details, quality information aur sourcing credentials review karta hai.'
    },
    {
      title: '4. Professional Cataloging',
      desc: 'Approved products ko Weave 365 ke B2B & B2C catalog aur sourcing network ke liye professionally present kiya jata hai.'
    },
    {
      title: '5. Buyer Discovery',
      desc: 'Boutiques, retailers, resellers, exporters aur other business buyers aapki available collection discover kar sakte hain.'
    },
    {
      title: '6. Order & Fulfilment',
      desc: 'Approved commercial terms ke according orders process, dispatch aur payout kiye jaate hain.'
    }
  ];

  // Section 6: Aap Kya Sell Kar Sakte Hain
  const categories = [
    {
      title: 'Banarasi Sarees',
      desc: 'Katan, Organza, Soft Silk, Meenakari, Bridal aur Designer collections.'
    },
    {
      title: 'Banarasi Suits',
      desc: 'festive, wedding, premium aur everyday collections.'
    },
    {
      title: 'Silk Dupattas',
      desc: 'Banarasi and woven silk collections for boutique and retail buyers.'
    },
    {
      title: 'Custom Collections',
      desc: 'specific colours, motifs, designs, fabric requirements aur bulk production.'
    },
    {
      title: 'Private Label Supply',
      desc: 'eligible business arrangements ke liye branded and white-label supply options.'
    }
  ];

  // Section 7: Connects with
  const buyerNetworkList = [
    'Boutiques',
    'Retail Stores',
    'Resellers',
    'Online Sellers',
    'Export Buyers',
    'Private Labels',
    'Fashion Brands'
  ];

  // Section 8: Sellers Ke Liye B2B & B2C Model Kyun Behtar Hai?
  const modelBenefits = [
    {
      title: 'No Need to Build Your Business Around Marketplace Rules',
      desc: 'Aapka primary business product supply aur collection development reh sakta hai.'
    },
    {
      title: 'Sell Collection Instead of Chasing Individual Customers',
      desc: 'B2B & B2C buyers ko curated collections aur reliable supply chahiye — sirf ek individual retail order nahi.'
    },
    {
      title: 'Better Fit for Manufacturers & Weavers',
      desc: 'Agar aap multiple pieces, repeat collections ya custom production karte hain, B2B & B2C sourcing model aapke business ke zyada kareeb ho sakta hai.'
    },
    {
      title: 'Professional Digital Presence',
      desc: 'Aapki collection online catalog mein professionally showcase ho sakti bina traditional marketplace storefront setup ke.'
    },
    {
      title: 'Expand Beyond Varanasi',
      desc: 'Apne collection ko boutiques, retailers aur sourcing buyers ke liye accessible banaiye — India aur eligible international markets mein.'
    }
  ];

  // Section 10: Kya Weave 365 Aapke Liye Hai?
  const suitabilityList = [
    'Banarasi sarees ya suits manufacture karte hain.',
    'Varanasi se saree collections source karte hain.',
    'Wholesalers ya stockists hain.',
    'Boutiques aur retailers ko supply karte hain.',
    'Online sellers ke liye collections provide karte hain.',
    'Custom or bulk Banarasi production kar sakte hain.',
    'Apne local buyer network ke bahar expand karna chahte hain.'
  ];

  // Section 11: Frequently Asked Questions
  const sellerFaqs = [
    {
      num: '01 -',
      q: 'Kya registration free hai?',
      a: 'Haan. Weave 365 par Seller registration bilkul free hai. Koi monthly ya yearly fee nahi hai.'
    },
    {
      num: '02 -',
      q: 'Kya mujhe apni poori collection Weave 365 par list karni hogi?',
      a: 'Nahi. Aapko apni poori collection list karne ki zaroorat nahi hai. Aap apne selected products hi Weave 365 par list kar sakte hain. Aap product ki photo aur details share kar dijiye. Baaki listing ka kaam hum kar lenge. Jitna product available hoga, utna hi aap sell kar sakte hain.'
    },
    {
      num: '03 -',
      q: 'Kya main saree ke saath suit, lehenga and dupatta bhi list kar sakta hoon?',
      a: 'Haan. Aap Banarasi Sarees ke saath Suits, Dupattas aur Lehengas bhi list kar sakte hain. Aap jo products sell karna chahte hain, unki photo aur details share karna hoga.'
    },
    {
      num: '04 -',
      q: 'Kya meri collection online catalog mein show hogi?',
      a: 'Haan. Aapke approved products Weave 365 ke online catalog mein show kiye jayenge. Aapko extra listing ya product promotion fee dene ki zaroorat nahi hai. Marketplace ki tarah apne products ko upar dikhane ke liye alag se paid promotion karna nahi padega. Aap product ki photos aur details share kijiye. Hum unhe catalog mein add karke customers ke liye available karenge. Aapka fayda: Aap apne products ko bina extra promotion fee ke India aur worldwide customers tak pahucha sakte hain. Agar aapke product ki price competitive hogi, to customers ke order aane ke chances bhi zyada honge. Weave 365 website customer demand aur price ke basis par products ko automatically promote karegi — iske liye aapko koi extra promotion fee nahi deni hogi.'
    },
    {
      num: '05 -',
      q: 'Kya mujhe marketplace ki tarah customer returns manage karne padenge?',
      a: 'Nahi. Customer return, cancellation ka kaam Weave 365 handle karega. Aapko ko sirf product ki quality check karke jo photo diya hai wahi product hamare warehouse tak bhejna hai. Product mein koi quality problem ya galat product ho, to uske liye alag claim process rahega.'
    },
    {
      num: '06 -',
      q: 'NDR aur RTO ka kya hoga?',
      a: 'NDR ke liye aap zimmedaar nahi honge. RTO ke rules order process karne se pehle clear kar diye jayenge. Aapko order lene se pehle saari terms aur zimmedari clearly bata di jayegi.'
    },
    {
      num: '07 -',
      q: 'GST ka kya hoga?',
      a: 'GST ka rule aapke business aur order ke hisaab se rahega. Weave 365 applicable transaction ka GST invoice provide karega. Aapke customer ko sale par GST ki zimmedari aapke business par ho sakti hai, jo aapke GST registration aur business setup par depend karegi.'
    },
    {
      num: '08 -',
      q: 'Kya main apna existing business bhi continue kar sakta hoon?',
      a: 'Haan. Aap apna existing business jaise chal raha hai waise hi continue kar sakte hain. Weave 365 ko aap extra business line ki tarah use kar sakte hain.'
    },
    {
      num: '09 -',
      q: 'Weave 365 par sell karna marketplace se kaise alag hai?',
      a: 'Weave 365 par seller ko sirf product list karke competition mein nahi chhod diya jata. Aapke approved products ko Weave 365 ke catalog mein customers ke liye available kiya jata hai. Aapko monthly fee ya paid promotion ke bina apne products showcase karne ka option milta hai. Aapka kaam product ki quality aur availability maintain karna hai. Baaki sales aur fulfilment ka process Weave 365 handle karta hai.'
    },
    {
      num: '10 -',
      q: 'Mujhe apne products Weave 365 ke through hi kyun sell karne chahiye?',
      a: 'Kyuki aapko apna alag online store banane aur customers lane ka poora burden nahi lena padta. Aap apne Banarasi products Weave 365 par list kijiye aur naye customers tak pahunchiye. Aap product ki quality check karke hamare warehouse tak product bhejiye; sales aur fulfilment Weave 365 handle karega. Isse aap apna existing business bhi continue kar sakte hain aur Weave 365 ko ek additional sales channel ke roop mein use kar sakte hain.'
    }
  ];

  return (
    <div className="seller-page-wrapper">
      {/* ==================================================================
          1. HERO BANNER (Standardized 2-Column Site Layout)
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
          2. APNA BANARASI COLLECTION HOOK (Editorial 2-Column Ledger)
          ================================================================== */}
      <section className="seller-section seller-hook-section">
        <div className="seller-container">
          <div className="seller-editorial-split">
            <div className="seller-hook-left">
              <h2 className="seller-section-title">
                Apna Banarasi Collection Sell Kijiye — Weave 365 Ke Saath, Bina Marketplace Seller Bane
              </h2>
              <p className="seller-hero-subtitle">
                Varanasi ke Saree &amp; Suit Sellers ke liye ek B2B &amp; B2C selling option
              </p>
              <p className="seller-hero-question">
                Aap Banarasi sarees aur suits banate hain, source karte hain ya Varanasi mein apna collection sell karte hain ya online sell karna chahte hain — lekin online marketplaces ke complicated rules ke saath business nahi karna chahte?
              </p>
              <div className="seller-hero-pains">
                Returns. Cancellations. NDR. RTO. Customer complaints. Platform deductions. Listing restrictions.
              </div>
            </div>

            <div className="seller-hook-right">
              <div className="seller-narrative-block">
                <p className="seller-hero-statement">
                  Ab ek alternative hai.
                </p>
                <p className="seller-hero-statement">
                  Weave 365 par apni Banarasi collection ko B2B &amp; B2C buyers ke liye showcase kijiye.
                </p>
                <p className="seller-hero-statement">
                  Aapki collection Weave 365 ke wholesale &amp; sourcing website par list hoti hai, jahan boutiques, retailers, resellers, online stores, exporters aur other business buyers Varanasi se authentic saree aur suit collections source karte hain.
                </p>
                <div className="seller-hero-callout">
                  Marketplace seller banne ke bajay — Weave 365 ke verified supply network ka collection partner baniye.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          3. PILLARS (3-Column Hairline Ledger)
          ================================================================== */}
      <section className="seller-section">
        <div className="seller-container">
          <h2 className="seller-section-title">
            Weave 365 Built for Varanasi Saree &amp; Suit Sellers
          </h2>
          <div className="seller-hairline-ledger">
            {pillars.map((item, idx) => (
              <div key={idx} className="seller-ledger-cell">
                <h3 className="seller-ledger-title">{item.title}</h3>
                <p className="seller-ledger-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================
          4. MARKETPLACE PAINS & RELIEF (Editorial 2-Column Ledger)
          ================================================================== */}
      <section className="seller-section">
        <div className="seller-container">
          <div className="seller-friction-split">
            <div className="seller-friction-left">
              <h2 className="seller-section-title">
                Marketplace Selling se Pareshan Hain?
              </h2>
              <p className="seller-lead-paragraph">
                Agar aapne online marketplaces par sell karne ki koshish ki hai, to problem sirf product bechne ki nahi hoti. Aapko customer-facing operations bhi sambhalne padte hain:
              </p>
              <div className="seller-friction-ledger">
                {marketplacePains.map((item, idx) => (
                  <div key={idx} className="seller-friction-row">
                    <span className="seller-friction-name">{item.title}</span> — <span className="seller-friction-detail">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="seller-friction-right">
              <div className="seller-contrast-narrative">
                <p className="seller-lead-paragraph">
                  Agar aapka core business Banarasi saree aur suit banana, source karna aur supply karna hai, to aapko zaroori nahi ki aap poora consumer marketplace operation bhi chalayein.
                </p>
                <div className="seller-relief-manifesto">
                  <p className="seller-narrative-line">
                    Weave 365 gives you another route.
                  </p>
                  <p className="seller-narrative-line">
                    Focus on your collection.
                  </p>
                  <p className="seller-narrative-line">
                    Weave 365 ko sourcing, B2B &amp; B2C commerce channel banaiye.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          5. ONBOARDING STEPS (Hairline Progression Ledger)
          ================================================================== */}
      <section className="seller-section">
        <div className="seller-container">
          <h2 className="seller-section-title">
            Join Karne Ke Baad Kya Hoga?
          </h2>
          <div className="seller-steps-ledger">
            {onboardingSteps.map((step, idx) => (
              <div key={idx} className="seller-step-cell">
                <h3 className="seller-step-title">{step.title}</h3>
                <p className="seller-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================
          6 & 7. WHAT YOU CAN SELL & BUYER REACH (Editorial 2-Column Ledger)
          ================================================================== */}
      <section className="seller-section">
        <div className="seller-container">
          <div className="seller-dual-grid">
            <div className="seller-dual-col">
              <h2 className="seller-section-title">
                Aap Kya Sell Kar Sakte Hain
              </h2>
              <p className="seller-lead-paragraph">
                Banarasi sarees ke saath sirf ek category tak limited rehne ki zarurat nahi:
              </p>
              <div className="seller-categories-ledger">
                {categories.map((cat, idx) => (
                  <div key={idx} className="seller-category-row">
                    <span className="seller-category-name">{cat.title}</span> — <span className="seller-category-desc">{cat.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="seller-dual-col">
              <h2 className="seller-section-title">
                Aapka Collection. Zyada Customers Tak Pahunch.
              </h2>
              <p className="seller-lead-paragraph">
                Varanasi mein aapke products ki value sirf ek local customer ya ek marketplace listing tak limited nahi honi chahiye.
              </p>
              <p className="seller-lead-paragraph">
                Weave 365 connects Varanasi-based sourcing with:
              </p>
              <div className="seller-buyers-ledger">
                {buyerNetworkList.map((buyer, idx) => (
                  <span key={idx} className="seller-buyer-pill">{buyer}</span>
                ))}
              </div>
              <div className="seller-reach-manifesto">
                <p className="seller-narrative-line">
                  Aap collection provide kijiye.
                </p>
                <p className="seller-narrative-line">
                  Weave 365 ka network us collection ko business buyers ke saamne laane ke liye build kiya gaya hai.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          8. B2B & B2C MODEL ADVANTAGES (Hairline Ledger Grid)
          ================================================================== */}
      <section className="seller-section">
        <div className="seller-container">
          <h2 className="seller-section-title">
            Sellers Ke Liye B2B &amp; B2C Model Kyun Behtar Hai?
          </h2>
          <div className="seller-benefits-ledger">
            {modelBenefits.map((item, idx) => (
              <div key={idx} className={`seller-benefit-cell ${idx === modelBenefits.length - 1 ? 'seller-benefit-cell-wide' : ''}`}>
                <h3 className="seller-benefit-title">{item.title}</h3>
                <p className="seller-benefit-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================
          9. PARALLEL BUSINESS MODEL (Centered Clean Strip)
          ================================================================== */}
      <section className="seller-section">
        <div className="seller-container">
          <div className="seller-parallel-wrap">
            <h2 className="seller-section-title">
              Aap Apna Business Bhi Saath-Saath Kar Sakte Hain
            </h2>
            <p className="seller-lead-paragraph">
              Weave 365 aapke existing business ko replace karne ke liye nahi hai.
            </p>
            <p className="seller-lead-paragraph">
              Aap apne existing customers, WhatsApp buyers, retail relationships aur offline business ko continue kar sakte hain.
            </p>
            <p className="seller-lead-paragraph">
              Weave 365 ko ek additional B2B &amp; B2C sourcing channel ke roop mein use kijiye.
            </p>
            <div className="seller-parallel-formula">
              Existing Business + B2B &amp; B2C Buyer Network = More Ways to Sell
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          10. SUITABILITY CHECKLIST (Hairline Table List)
          ================================================================== */}
      <section className="seller-section">
        <div className="seller-container">
          <h2 className="seller-section-title">
            Kya Weave 365 Aapke Liye Hai?
          </h2>
          <p className="seller-lead-paragraph">
            Weave 365 Seller Network un businesses ke liye suitable hai jo:
          </p>
          <div className="seller-suitability-ledger">
            {suitabilityList.map((item, idx) => (
              <div key={idx} className="seller-suitability-row">
                <span className="seller-suitability-bullet">•</span>
                <span className="seller-suitability-text">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================
          11. FREQUENTLY ASKED QUESTIONS (Centered Elegant Accordion)
          ================================================================== */}
      <section id="faqs" className="seller-section seller-faqs-section">
        <div className="seller-container">
          <div className="seller-faqs-wrap">
            <h2 className="seller-section-title seller-title-center">
              Frequently Asked Questions
            </h2>
            <div className="seller-faqs-accordion">
              {sellerFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="seller-faq-item">
                    <button
                      type="button"
                      className="seller-faq-trigger"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                    >
                      <div className="seller-faq-q-wrap">
                        <span className="seller-faq-num">{faq.num}</span>
                        <span className="seller-faq-q">{faq.q}</span>
                      </div>
                      <ChevronDown
                        size={18}
                        aria-hidden="true"
                        className={`seller-faq-toggle-icon ${isOpen ? 'open' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="seller-faq-answer">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          12. FINAL CALL TO ACTION
          ================================================================== */}
      <section className="seller-closing-section">
        <div className="seller-container">
          <div className="seller-closing-content">
            <h2 className="seller-closing-title">
              Kya Aap Apni Collection Business Buyers Tak Pahunchane Ke Liye Ready Hain?
            </h2>
            <p className="seller-closing-line">
              Varanasi se Banarasi Collection Sell Kijiye. Marketplace Ke Bina Apni Collection Ko B2B &amp; B2C Customers Tak Pahunchaiye.
            </p>
            <p className="seller-closing-line">
              Apna Business Register Kijiye, Apni Collection Share Kijiye Aur Weave 365 Ke Saath B2B &amp; B2C Business Shuru Kijiye.
            </p>
            <div className="seller-cta-wrap">
              <a
                href="/signup"
                className="seller-btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  handleSellerSignup();
                }}
              >
                <span>Register as Seller</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div className="seller-closing-tagline">
              Varanasi Se Worldwide Buyers Tak.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
