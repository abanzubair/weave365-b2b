/**
 * @file CountrySelector.jsx
 * @description Minimal Country & Currency selector for Desktop Navbar and Mobile Menu.
 * Synchronizes with useCountryCurrency store.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useCountryCurrency } from '../store/useCountryCurrency.js';
import { ChevronDown, Check, Globe } from './icons.jsx';
import '../styles/countrySelector.css';

export function CountrySelector({ variant = 'desktop', onClose = null }) {
  const { currentCountry, countries, setCountry, initCountryCurrency } = useCountryCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Initialize store on first mount
  useEffect(() => {
    initCountryCurrency();
  }, [initCountryCurrency]);

  // Handle outside click for desktop
  useEffect(() => {
    if (!isOpen || variant === 'mobile') return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, variant]);

  const enabledCountries = useMemo(() => {
    return countries.filter((c) => c.enabled !== false);
  }, [countries]);

  const formatCurrencyDisplay = (c) => {
    if (!c) return '';
    const code = c.currency || '';
    const symbol = c.currencySymbol || '';
    if (!symbol || symbol === code) {
      return code;
    }
    return `${code} (${symbol})`;
  };

  const handleSelectCountry = (country) => {
    setCountry(country.code, true);
    setIsOpen(false);
    if (variant === 'mobile' && typeof onClose === 'function') {
      onClose();
    }
  };

  // ---------------------------------------------------------
  // 1. MOBILE VARIANT (Used inside MobileMenu.jsx)
  // ---------------------------------------------------------
  if (variant === 'mobile') {
    return (
      <div className={`mobile-account-dropdown mobile-country-dropdown ${isOpen ? 'is-open' : ''}`} ref={dropdownRef}>
        <button
          type="button"
          className="mobile-menu-item mobile-menu-account-trigger"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label="Change country or currency"
        >
          <span className="mobile-menu-icon">
            <Globe size={20} />
          </span>
          <span className="mobile-menu-label">
            <span>Country &amp; Currency</span>
            <span className="mobile-menu-curr-pill">
              <span className="curr-pill-flag">{currentCountry?.flag || '🌐'}</span>
              <span className="curr-pill-code">{currentCountry?.currency || 'INR'}</span>
              {currentCountry?.currencySymbol && currentCountry.currencySymbol !== currentCountry.currency && (
                <span className="curr-pill-sym">({currentCountry.currencySymbol})</span>
              )}
            </span>
          </span>
          <ChevronDown
            size={18}
            className={`mobile-menu-chevron ${isOpen ? 'rotated' : ''}`}
          />
        </button>

        <div className="mobile-account-items">
          <div className="mobile-account-items-inner">
            {enabledCountries.map((country) => {
              const isSelected = country.code === currentCountry?.code;
              return (
                <button
                  key={country.code}
                  type="button"
                  className={`mobile-account-subitem ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelectCountry(country)}
                >
                  <span className="subitem-icon" style={{ fontSize: '18px' }}>
                    {country.flag || '🌐'}
                  </span>
                  <span className="subitem-label">
                    <span>{country.name}</span>
                    <span className="country-subitem-curr">
                      {formatCurrencyDisplay(country)}
                    </span>
                  </span>
                  {isSelected && (
                    <span className="country-subitem-check">
                      <Check size={16} strokeWidth={2.4} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 2. DESKTOP VARIANT (Used inside SiteHeader.jsx)
  // ---------------------------------------------------------
  return (
    <div className="country-selector-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`country-selector-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Switch Country / Currency"
      >
        <span className="country-flag-icon">{currentCountry?.flag || '🌐'}</span>
        <span className="country-trigger-code">
          {currentCountry?.currency || 'INR'}
        </span>
        <ChevronDown
          size={12}
          className={`country-trigger-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="country-dropdown-menu" role="listbox">
          <ul className="country-dropdown-list">
            {enabledCountries.map((country) => {
              const isSelected = country.code === currentCountry?.code;
              return (
                <li key={country.code} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    className={`country-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectCountry(country)}
                  >
                    <div className="country-item-left">
                      <span className="country-item-flag">{country.flag || '🌐'}</span>
                      <div className="country-item-details">
                        <span className="country-item-name">{country.name}</span>
                        <span className="country-item-currency">
                          {formatCurrencyDisplay(country)}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="country-item-check">
                        <Check size={14} strokeWidth={2.2} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

