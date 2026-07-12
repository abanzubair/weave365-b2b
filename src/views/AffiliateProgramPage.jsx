/**
 * @file AffiliateProgramPage.jsx
 * @description Premium B2B Affiliate Partner Program Page.
 * Outlines the program mechanics, registration pathway, highlights of direct factory margins,
 * click-tracking, and terms of commission payouts (verification and return windows).
 * Includes interactive FAQ accordions.
 * 
 * @module views/AffiliateProgramPage
 */

import { useState } from 'react';
import { 
  ArrowRight, 
  UserPlus, 
  Link2, 
  TrendingUp, 
  Coins, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  AlertTriangle, 
  ChevronDown,
  LineChart
} from 'lucide-react';
import '../styles/affiliateProgramPage.css';

export function AffiliateProgramPage({ user, navigate, openAuth }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const steps = [
    {
      num: '1',
      icon: UserPlus,
      title: 'Join the Program',
      desc: 'Register as an affiliate partner in less than a minute. It is completely free with no setup fees or sales targets.'
    },
    {
      num: '2',
      icon: Link2,
      title: 'Share Referral Links',
      desc: 'Obtain your custom referral link or coupon code from the dashboard. Share it on social media, blogs, or WhatsApp.'
    },
    {
      num: '3',
      icon: LineChart,
      title: 'Track Performance',
      desc: 'Monitor real-time stats (clicks, registration conversions, orders, pending commissions) in your live Affiliate Center.'
    },
    {
      num: '4',
      icon: Coins,
      title: 'Earn upto 15% Commission',
      desc: 'Receive direct payouts via UPI or bank wire transfer on all successful checkouts referred by you.'
    }
  ];

  const benefits = [
    {
      icon: Sparkles,
      title: 'Direct Factory Advantage',
      desc: 'Promote high-demand, authentic handloom Banarasi sarees, suits, and fabrics directly sourced from Varanasi. High conversion rates due to genuine manufacturer pricing.'
    },
    {
      icon: TrendingUp,
      title: 'Lucrative 15% Share',
      desc: 'Enjoy a premium double-digit commission rate on every single order value. Since bulk orders are typically large, your earnings per referral scale quickly.'
    },
    {
      icon: Award,
      title: 'Transparent Dashboard',
      desc: 'Get absolute clarity with real-time tracking. Know exactly when your referral links are clicked, when orders are placed, and see the exact status of your commissions.'
    },
    {
      icon: ShieldCheck,
      title: 'Zero Capital Risk',
      desc: 'Start your own passive earning channel without managing inventory, handling packaging, sorting quality control, or coordinating complex shipping logisitics.'
    }
  ];

  const faqs = [
    {
      q: 'How does the referral tracking system operate?',
      a: 'When an end customer visits Weave 365 through your shared affiliate referral link, a unique tracking identifier is saved in their browser local storage for 30 days. Any wholesale checkout or inquiry they submit during this time is automatically credited to your affiliate profile.'
    },
    {
      q: 'What is the standard commission structure?',
      a: 'We offer upto 15% commission on the final order transaction amount (excluding tax and shipping fees) for every successful bulk order placed by a customer referred by you.'
    },
    {
      q: 'When do I receive my payouts?',
      a: 'Payouts are cleared monthly. Commissions are credited to your active wallet and become eligible for withdrawal once the referred order has been marked "Payment Verified" by our admin, successfully delivered to the customer, and the 7-day return/exchange period has expired.'
    },
    {
      q: 'Are there any registration costs or monthly targets?',
      a: 'Absolutely none. The Weave 365 Affiliate Program is completely free. There are no startup costs, renewal fees, or minimum sales quotas required to keep your affiliate account active.'
    },
    {
      q: 'How do I configure my withdrawal settings?',
      a: 'Once registered, navigate to your Affiliate tab in your Account. You can specify either your bank wire coordinates (Account number, IFSC code, Name) or a direct UPI ID to receive automatic payouts.'
    }
  ];

  return (
    <div className="affiliate-page-container">
      {/* 1. Hero Section */}
      <section className="affiliate-hero">
        <div className="affiliate-hero-inner">
          <div className="affiliate-hero-content">
            <span className="affiliate-hero-kicker">Free to Join · Zero Investment</span>
            <h1 className="affiliate-hero-title">
              Turn Your Network <br />
              into an <em>Earning Channel</em>
            </h1>
            <p className="affiliate-hero-subtitle">
              Earn up to 15% commission on referred bulk handloom orders.
            </p>
            <p className="affiliate-hero-description">
              Partner with Weave 365 to promote authentic Banarasi sarees, suits, and fabrics directly sourced from Varanasi. Share custom referral links and track premium payouts in real-time.
            </p>
            <div className="affiliate-hero-actions">
              <button 
                type="button" 
                className="affiliate-hero-action-btn" 
                onClick={() => {
                  if (user) {
                    navigate('account?tab=influencer');
                  } else {
                    openAuth();
                  }
                }}
              >
                <span>Register as Partner</span>
                <ArrowRight size={18} />
              </button>
            </div>
            <div className="affiliate-hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">15%</span>
                <span className="hero-stat-label">Commission</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-value">30-Day</span>
                <span className="hero-stat-label">Cookie Window</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-value">₹0</span>
                <span className="hero-stat-label">Setup Cost</span>
              </div>
            </div>
          </div>
          <div className="affiliate-hero-visual">
            <div className="affiliate-hero-img-wrapper">
              <img 
                src="/affiliate-hero.png" 
                alt="Luxury Banarasi fabrics and digital partner catalog display" 
                className="affiliate-hero-img" 
              />
            </div>
            <span className="visual-caption">Fig. 02 // Digital Partner Catalog, Varanasi</span>
          </div>
        </div>
      </section>

      {/* 2. Steps Section */}
      <section className="affiliate-steps-section">
        <div className="affiliate-section-header">
          <h2>How the Program Works</h2>
          <p>Four simple steps to launch your passive earning channel</p>
        </div>

        <div className="affiliate-steps-grid">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <article className="affiliate-step-card" key={step.num}>
                <span className="affiliate-step-num">{step.num}</span>
                <div className="affiliate-step-icon">
                  <IconComponent size={24} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* 3. Benefits Section */}
      <section className="affiliate-benefits-section">
        <div className="affiliate-benefits-container">
          <div className="affiliate-section-header">
            <h2>Why Partner With Us?</h2>
            <p>High-demand ethnic catalog combined with direct factory-level support</p>
          </div>

          <div className="affiliate-benefits-grid">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div className="affiliate-benefit-card" key={index}>
                  <div className="affiliate-benefit-icon-box">
                    <Icon size={22} />
                  </div>
                  <div className="affiliate-benefit-details">
                    <h3>{benefit.title}</h3>
                    <p>{benefit.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Terms Payout Notice Alert Box */}
          <div className="affiliate-alert-wrapper">
            <div className="affiliate-terms-alert">
              <AlertTriangle className="affiliate-alert-icon" size={20} />
              <div className="affiliate-alert-content">
                <h4>Important Payout Clearance Terms</h4>
                <p>
                  Because we ship large wholesale bundles at near-manufacturing margins, all affiliate commission credits are finalized only when the customer payment is verified, the courier is safely delivered, and the client return eligibility window has fully passed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ Section */}
      <section className="affiliate-faq-section">
        <div className="affiliate-section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Clear answers about referral tracking, payout intervals, and guidelines</p>
        </div>

        <div className="affiliate-faq-list">
          {faqs.map((faq, index) => (
            <div 
              className={`affiliate-faq-item ${openFaq === index ? 'active' : ''}`} 
              key={index}
            >
              <button 
                type="button" 
                className="affiliate-faq-trigger"
                onClick={() => toggleFaq(index)}
              >
                <h3>{faq.q}</h3>
                <ChevronDown className="affiliate-faq-icon" size={18} />
              </button>
              <div className="affiliate-faq-content">
                <div className="affiliate-faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
