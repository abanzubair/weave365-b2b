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
import Breadcrumb from '../components/Breadcrumb.jsx';
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
        <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Affiliate Program' }]} navigate={navigate} />
        <div className="affiliate-hero-inner">
          <div className="affiliate-hero-content">
            <h1 className="affiliate-hero-title">
              Turn Your Network into a
              <span className="affiliate-title-accent">High-Earning Channel.</span>
            </h1>
            <p className="affiliate-hero-description">
              Partner with Weave 365 to promote authentic Banarasi handlooms directly sourced from Varanasi artisans. Share custom referral links, earn up to 15% commission on every order, and track payouts in real-time.
            </p>
            {/* Connected 3-Step Referral Flow Sequence */}
            <div className="affiliate-flow-strip">
              <div className="aff-flow-step">
                <div className="aff-flow-step-header">
                  <span className="aff-flow-step-num">01</span>
                  <span className="aff-flow-step-tag">LINK</span>
                </div>
                <h3 className="aff-flow-step-title">Get Referral Link</h3>
                <p className="aff-flow-step-text">Instant custom link &amp; coupon code&nbsp;generation.</p>
              </div>

              <div className="aff-flow-step">
                <div className="aff-flow-step-header">
                  <span className="aff-flow-step-num">02</span>
                  <span className="aff-flow-step-tag">SHARE</span>
                </div>
                <h3 className="aff-flow-step-title">Share Everywhere</h3>
                <p className="aff-flow-step-text">Broadcast to WhatsApp, Instagram &amp; social&nbsp;feeds.</p>
              </div>

              <div className="aff-flow-step">
                <div className="aff-flow-step-header">
                  <span className="aff-flow-step-num">03</span>
                  <span className="aff-flow-step-tag">EARN</span>
                </div>
                <h3 className="aff-flow-step-title">Earn 15% Payout</h3>
                <p className="aff-flow-step-text">Monthly direct payouts to your bank or UPI&nbsp;wallet.</p>
              </div>
            </div>

            <div className="affiliate-hero-actions">
              <button 
                type="button" 
                className="affiliate-btn-primary" 
                onClick={() => {
                  if (user) {
                    navigate('account?tab=influencer');
                  } else if (navigate) {
                    navigate('signup', null, null, { type: 'reseller' });
                  } else if (openAuth) {
                    openAuth();
                  }
                }}
              >
                <span>Register as Partner</span>
                <ArrowRight size={15} className="affiliate-btn-arrow" />
              </button>
              <a href="#how-it-works" className="affiliate-btn-secondary">
                How It Works
              </a>
            </div>
          </div>

          <div className="affiliate-hero-visual">
            <div className="affiliate-photo-frame">
              <img 
                src="https://assets.weave365.com/assets/banner/affiliate-hero.jpg" 
                alt="Luxury Banarasi fabrics and digital partner catalog display" 
                className="affiliate-hero-photo" 
                loading="eager"
              />
            </div>
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
          {steps.map((step) => (
            <div className="affiliate-step-item" key={step.num}>
              <div className="affiliate-step-meta">
                <span className="affiliate-step-num">0{step.num} —</span>
              </div>
              <h3 className="affiliate-step-title">{step.title}</h3>
              <p className="affiliate-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Benefits Section */}
      <section className="affiliate-benefits-section">
        <div className="affiliate-benefits-container">
          <div className="affiliate-benefits-left">
            <h2 className="benefits-title">Why Partner <br />With Us?</h2>
            <p className="benefits-lead">
              High-demand ethnic catalog combined with direct factory-level support. We handle the production, sorting, and logistics so you can focus entirely on sharing.
            </p>
            
            {/* Redesigned Payout Notice as an elegant callout */}
            <div className="affiliate-payout-callout">
              <div className="callout-header">
                <AlertTriangle size={20} className="callout-icon" />
                <h4>Important Payout Terms</h4>
              </div>
              <p>
                Because we ship bulk bundles at narrow manufacturing margins, commission is finalized once the customer payment is verified, delivery completes, and the return window passes.
              </p>
            </div>
          </div>

          <div className="affiliate-benefits-right">
            <div className="affiliate-benefits-list">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div className="benefit-item" key={index}>
                    <div className="benefit-icon-wrapper">
                      <Icon size={20} />
                    </div>
                    <div className="benefit-details">
                      <h3>{benefit.title}</h3>
                      <p>{benefit.desc}</p>
                    </div>
                  </div>
                );
              })}
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
