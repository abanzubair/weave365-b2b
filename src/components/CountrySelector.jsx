/**
 * @file CountrySelector.jsx
 * @description Country code selector with dropdown of all existing countries.
 * Placed after search icon on desktop. Includes search filter and store synchronization.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useCountryCurrency } from '../store/useCountryCurrency.js';
import { ChevronDown, Check, Globe, Search, X } from './icons.jsx';
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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  // Handle outside click & escape key for desktop
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
    if (!searchQuery.trim()) return enabledCountries;
    const q = searchQuery.toLowerCase().trim();
    return enabledCountries.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.currency && c.currency.toLowerCase().includes(q))
      );
    });
  }, [enabledCountries, searchQuery]);

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
              <span className="curr-pill-code">{currentCountry?.code || 'IN'}</span>
              <span className="curr-pill-sym">({currentCountry?.currency || 'INR'})</span>
            </span>
          </span>
          <ChevronDown
            size={18}
            className={`mobile-menu-chevron ${isOpen ? 'rotated' : ''}`}
          />
        </button>

        <div className={`mobile-account-items ${isOpen ? 'is-open' : ''}`}>
          <div className="mobile-account-items-inner">
            <div className="country-search-wrapper" style={{ margin: '6px 8px 8px 8px' }}>
              <Search size={14} className="country-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="country-search-input"
                placeholder="Search country..."
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
                  <X size={13} />
                </button>
              )}
            </div>

            {filteredCountries.length === 0 ? (
              <div className="country-dropdown-empty">No matching countries found</div>
            ) : (
              filteredCountries.map((country) => {
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
                        {country.code} · {formatCurrencyDisplay(country)}
                      </span>
                    </span>
                    {isSelected && (
                      <span className="country-subitem-check">
                        <Check size={16} strokeWidth={2.4} />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 2. DESKTOP VARIANT (Placed right after search icon in SiteHeader.jsx)
  // ---------------------------------------------------------
  return (
    <div className="country-selector-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`country-selector-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={`Country: ${currentCountry?.name || 'India'} (${currentCountry?.code || 'IN'}) · Currency: ${currentCountry?.currency || 'INR'}`}
      >
        <span className="country-trigger-code">
          {currentCountry?.code || 'IN'}
        </span>
        <ChevronDown
          size={11}
          className={`country-trigger-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="country-dropdown-menu" role="listbox">
          <div className="country-search-wrapper">
            <Search size={14} className="country-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="country-search-input"
              placeholder="Search country..."
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
                <X size={13} />
              </button>
            )}
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
                            {country.code} · {formatCurrencyDisplay(country)}
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
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
