import React from 'react';
import { 
  Globe, 
  Zap, 
  ShoppingBag, 
  ShieldCheck,
  Check
} from './icons.jsx';
import { WhatsappIcon } from './WhatsappIcon.jsx';
import { storeConfig } from '../config.js';
import '../styles/resellerUpgrade.css';

export function ResellerUpgradeCard({ user, buyerProfile }) {
  const userIdentifier = user?.email || buyerProfile?.business_name || 'Boutique Owner';
  const whatsappNumber = storeConfig.whatsapp || '9919101369';
  
  const whatsappMessage = `Hi Weave 365 team! I would like to activate the 'Build Your Own Website' add-on (₹999/month) for my account (${userIdentifier}).`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="rt-upgrade-distilled">
      {/* Header */}
      <div className="rt-distilled-header">
        <h2 className="rt-distilled-title">Launch Your Own Saree Boutique Website</h2>
        <p className="rt-distilled-subtitle">
          Get a dedicated, mobile-first online store with your brand name, automated Weave 365 catalog syncing, and custom profit markups.
        </p>
      </div>

      {/* Feature List (Unboxed, clean, scannable) */}
      <div className="rt-distilled-features">
        <div className="rt-distilled-item">
          <div className="rt-distilled-icon"><Globe size={18} /></div>
          <div>
            <strong>Branded Turnkey Storefront</strong>
            <span>Pre-built luxury mobile layout tailored for your brand name and logo.</span>
          </div>
        </div>

        <div className="rt-distilled-item">
          <div className="rt-distilled-icon"><Zap size={18} /></div>
          <div>
            <strong>1-Click Catalog Auto-Sync</strong>
            <span>Add handloom sarees from Weave 365 with your customized retail price markup.</span>
          </div>
        </div>

        <div className="rt-distilled-item">
          <div className="rt-distilled-icon"><ShoppingBag size={18} /></div>
          <div>
            <strong>Direct WhatsApp Checkout</strong>
            <span>Zero sales commission. Customer orders and carts route straight to your WhatsApp.</span>
          </div>
        </div>

        <div className="rt-distilled-item">
          <div className="rt-distilled-icon"><ShieldCheck size={18} /></div>
          <div>
            <strong>Confidential Base Costs</strong>
            <span>Wholesale prices are strictly protected. Buyers only see your retail rates.</span>
          </div>
        </div>
      </div>

      {/* Pricing & Activation Bar */}
      <div className="rt-distilled-footer">
        <div className="rt-distilled-price-wrap">
          <div className="rt-distilled-price-line">
            <span className="rt-distilled-curr">₹</span>
            <span className="rt-distilled-amount">999</span>
            <span className="rt-distilled-period">/ month</span>
            <span className="rt-distilled-strike">₹2,999</span>
          </div>
          <span className="rt-distilled-subtext">Includes cloud hosting, template themes & free setup support</span>
        </div>

        <div className="rt-distilled-action">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rt-distilled-btn"
          >
            <WhatsappIcon size={18} />
            <span>Activate on WhatsApp</span>
          </a>
          <span className="rt-distilled-note">
            Setup ready in ~5 mins
          </span>
        </div>
      </div>
    </div>
  );
}
