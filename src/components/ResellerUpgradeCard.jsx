import React, { useState } from 'react';
import { 
  Globe, 
  Zap, 
  ShoppingBag, 
  ShieldCheck,
  Check,
  ExternalLink,
  Palette
} from './icons.jsx';
import { WhatsappIcon } from './WhatsappIcon.jsx';
import { storeConfig } from '../config.js';
import { AVAILABLE_THEMES } from './ResellerTools.jsx';
import '../styles/resellerUpgrade.css';

export function ResellerUpgradeCard({ user, buyerProfile }) {
  const [selectedThemeId, setSelectedThemeId] = useState('tavishi-heritage');
  const userIdentifier = user?.email || buyerProfile?.business_name || 'Boutique Owner';
  const whatsappNumber = storeConfig.whatsapp || '9919101369';

  const selectedTheme = AVAILABLE_THEMES.find(t => t.id === selectedThemeId) || AVAILABLE_THEMES[0];
  
  const whatsappMessage = `Hi Weave 365 team! I would like to activate the 'Build Your Own Website' add-on (₹999/month) with the ${selectedTheme.name} template for my account (${userIdentifier}).`;
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
          <span className="rt-distilled-subtext">
            Includes cloud hosting, {selectedTheme.name} theme & free setup support
          </span>
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
            Setup ready in ~5 mins • Selected: <strong>{selectedTheme.name}</strong>
          </span>
        </div>
      </div>

      {/* Storefront Templates Showcase (Presented at the last) */}
      <div className="rt-upgrade-templates-section">
        <div className="rt-upgrade-templates-header">
          <div className="rt-upgrade-templates-title-row">
            <Palette size={16} className="rt-upgrade-templates-icon" />
            <h3 className="rt-upgrade-templates-title">Explore Storefront Templates</h3>
          </div>
          <p className="rt-upgrade-templates-subtitle">
            Preview the luxury themes included with your subscription. Test live demos below and choose your favorite aesthetic; you can switch anytime later with zero data loss.
          </p>
        </div>

        <div className="rt-upgrade-templates-grid">
          {AVAILABLE_THEMES.map((theme) => {
            const isSelected = selectedThemeId === theme.id;
            return (
              <div
                key={theme.id}
                className={`rt-upgrade-template-card ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedThemeId(theme.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedThemeId(theme.id);
                }}
              >
                {/* 16:10 Screenshot Wrapper with Floating Selection Radio */}
                <div className="rt-upgrade-screenshot-wrap">
                  <img
                    src={theme.image}
                    alt={`${theme.name} Preview`}
                    className="rt-upgrade-screenshot-img"
                    loading="lazy"
                  />
                  <div className="rt-upgrade-radio-pill">
                    <div className={`rt-upgrade-radio-dot ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="rt-upgrade-card-body">
                  <div className="rt-upgrade-card-title-row">
                    <h4 className="rt-upgrade-card-name">{theme.name}</h4>
                    <span className="rt-upgrade-card-tag">{theme.tag}</span>
                  </div>
                  <p className="rt-upgrade-card-subtitle">{theme.subtitle}</p>

                  {/* Card Footer with Status & Live Demo button */}
                  <div className="rt-upgrade-card-footer" onClick={(e) => e.stopPropagation()}>
                    <span className={`rt-upgrade-status-text ${isSelected ? 'is-active' : ''}`}>
                      {isSelected ? (
                        <>
                          <Check size={12} strokeWidth={2.5} /> Selected Style
                        </>
                      ) : (
                        'Click to choose'
                      )}
                    </span>

                    <a
                      href={theme.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rt-upgrade-demo-link"
                      title={`Open live interactive demo of ${theme.name} in new tab`}
                    >
                      <span>Live Demo</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

