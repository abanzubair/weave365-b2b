/**
 * MobileMenu Component
 * Purpose: Renders the full-screen slide-over B2B drawer navigation for mobile devices.
 * Displays only the curated, premium navigation categories: NEW ARRIVALS, CATALOGUE,
 * CATEGORIES, PARTNERS, and ABOUT.
 */
import { useState } from 'react';
import {
  ArrowRight,
  Layers,
  Sparkles,
  Store,
  X,
  ChevronDown,
  Globe,
  Info,
} from 'lucide-react';

import { storeConfig } from '../config.js';
import brandLogo from '../../assets/Weave365.svg';
import { assetSrc } from '../utils/assetSrc.js';

export function MobileMenu({ 
  onClose, 
  navigate, 
  setCategory, 
  categories = []
}) {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);

  return (
    <>
      <div className="mobile-menu-backdrop" onClick={onClose} />
      <aside className="mobile-menu">
        <div className="mobile-menu-head">
          <img src={assetSrc(brandLogo)} alt={storeConfig.name} className="brand-logo" style={{ height: 36 }} />
          <button className="icon-button" onClick={onClose} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="mobile-menu-nav">
          {/* 1. NEW ARRIVALS */}
          <button 
            className="mobile-menu-item" 
            onClick={() => {
              navigate('new-arrivals');
              onClose();
            }}
          >
            <span className="mobile-menu-icon"><Sparkles size={20} /></span>
            <span className="mobile-menu-label">NEW ARRIVALS</span>
            <ArrowRight size={16} className="mobile-menu-arrow" />
          </button>

          {/* 2. CATALOGUE */}
          <button 
            className="mobile-menu-item" 
            onClick={() => {
              navigate('wholesale-catalogue');
              onClose();
            }}
          >
            <span className="mobile-menu-icon"><Store size={20} /></span>
            <span className="mobile-menu-label">CATALOGUE</span>
            <ArrowRight size={16} className="mobile-menu-arrow" />
          </button>

          {/* 3. CATEGORIES */}
          <div className={`mobile-account-dropdown ${categoriesOpen ? 'is-open' : ''}`}>
            <button 
              className="mobile-menu-item mobile-menu-account-trigger" 
              onClick={() => setCategoriesOpen(!categoriesOpen)}
            >
              <span className="mobile-menu-icon"><Layers size={20} /></span>
              <span className="mobile-menu-label">CATEGORIES</span>
              <ChevronDown size={18} className={`mobile-menu-chevron ${categoriesOpen ? 'rotated' : ''}`} />
            </button>
            
            <div className="mobile-account-items">
              <div className="mobile-account-items-inner">
                {categories.map((cat) => (
                  <button 
                    key={cat} 
                    className="mobile-account-subitem" 
                    onClick={() => {
                      setCategory(cat);
                      navigate('wholesale-catalogue');
                      onClose();
                    }}
                  >
                    <span className="subitem-label" style={{ paddingLeft: '8px' }}>
                      {cat}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. PARTNERS */}
          <div className={`mobile-account-dropdown ${partnerOpen ? 'is-open' : ''}`}>
            <button 
              className="mobile-menu-item mobile-menu-account-trigger" 
              onClick={() => setPartnerOpen(!partnerOpen)}
            >
              <span className="mobile-menu-icon"><Globe size={20} /></span>
              <span className="mobile-menu-label">PARTNERS</span>
              <ChevronDown size={18} className={`mobile-menu-chevron ${partnerOpen ? 'rotated' : ''}`} />
            </button>
            
            <div className="mobile-account-items">
              <div className="mobile-account-items-inner">
                {[
                  { name: 'Sourcing Partners', slug: 'sourcing-partners' },
                  { name: 'White Label Brands', slug: 'white-label-brands' },
                ].map((item) => (
                  <button 
                    key={item.slug} 
                    className="mobile-account-subitem" 
                    onClick={() => {
                      navigate(item.slug);
                      onClose();
                    }}
                  >
                    <span className="subitem-label" style={{ paddingLeft: '8px' }}>
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. ABOUT */}
          <button 
            className="mobile-menu-item" 
            onClick={() => {
              navigate('about');
              onClose();
            }}
          >
            <span className="mobile-menu-icon"><Info size={20} /></span>
            <span className="mobile-menu-label">ABOUT</span>
            <ArrowRight size={16} className="mobile-menu-arrow" />
          </button>
        </nav>
      </aside>
    </>
  );
}
