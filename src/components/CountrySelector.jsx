/**
 * @file CountrySelector.jsx
 * @description Centralized Country & Currency selector for both Desktop Navbar and Mobile Hamburger Menu.
 * Synchronizes with useCountryCurrency store.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useCountryCurrency } from '../store/useCountryCurrency.js';
import { ChevronDown, Search, Check, X, Globe } from './icons.jsx';
import '../styles/countrySelector.css';

export function CountrySelector({ variant = 'desktop', onClose = null }) {
  const { currentCountry, countries, setCountry, initCountryCurrency } = useCountryCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Initialize store on first mount
  useEffect(() => {
    initCountryCurrency();
  }, [initCountryCurrency]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

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

  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return enabledCountries;
    return enabledCountries.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const code = (c.code || '').toLowerCase();
      const currency = (c.currency || '').toLowerCase();
      return name.includes(q) || code.includes(q) || currency.includes(q);
    });
  }, [enabledCountries, searchQuery]);

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
      <div className="mobile-country-selector">
        <button
          type="button"
          className={`mobile-country-trigger-btn ${isOpen ? 'is-open' : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label="Change country or currency"
        >
          <div className="mobile-country-trigger-left">
            <span className="mobile-country-trigger-icon">
              <Globe size={18} />
            </span>
            <div className="mobile-country-trigger-label">
              <span className="mobile-country-title">Country &amp; Currency</span>
              <span className="mobile-country-current">
                <span className="mobile-country-current-flag">{currentCountry?.flag || '🌐'}</span>
                <span>{currentCountry?.name || 'India'}</span>
                <span style={{ color: 'var(--gold-dark, #805d31)', fontWeight: 600 }}>
                  ({currentCountry?.currency} {currentCountry?.currencySymbol})
                </span>
              </span>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`country-trigger-chevron ${isOpen ? 'rotated' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="mobile-country-body">
            <div className="country-search-input-wrapper">
              <Search size={14} className="country-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="country-search-input"
                placeholder="Search country or currency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="country-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <ul className="mobile-country-list">
              {filteredCountries.length === 0 ? (
                <li className="country-dropdown-empty">No matching countries found</li>
              ) : (
                filteredCountries.map((country) => {
                  const isSelected = country.code === currentCountry?.code;
                  return (
                    <li key={country.code}>
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
                              {country.currency} ({country.currencySymbol})
                              {country.markupPercent > 0 ? ` · +${country.markupPercent}%` : ''}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="country-item-check">
                            <Check size={16} strokeWidth={2.5} />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
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
        <span className="country-trigger-text">
          <span>{currentCountry?.name || 'India'}</span>
          <span>·</span>
          <span className="country-trigger-code">
            {currentCountry?.currency} {currentCountry?.currencySymbol}
          </span>
        </span>
        <ChevronDown
          size={13}
          className={`country-trigger-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="country-dropdown-menu" role="listbox">
          <div className="country-dropdown-header">
            <div className="country-search-input-wrapper">
              <Search size={14} className="country-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="country-search-input"
                placeholder="Search country or currency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="country-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <ul className="country-dropdown-list">
            {filteredCountries.length === 0 ? (
              <li className="country-dropdown-empty">No matching countries found</li>
            ) : (
              filteredCountries.map((country) => {
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
                            {country.currency} ({country.currencySymbol})
                            {country.markupPercent > 0 ? ` · +${country.markupPercent}%` : ''}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="country-item-check">
                          <Check size={16} strokeWidth={2.5} />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
