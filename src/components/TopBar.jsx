/**
 * TopBar Component
 * Purpose: Renders the site's top informational banner, reinforcing key B2B value propositions
 * (Wholesale Only, Bulk Pricing, PAN India & Export shipping) and housing the currency/exchange-rate selector.
 */
import { useEffect, useState, useRef } from 'react';
import { Award, PackageCheck, Truck, ChevronDown } from 'lucide-react';
import { CURRENCIES, CurrencyManager, useCurrency } from '../storefrontShared.jsx';
import { WhatsappIcon } from './WhatsappIcon.jsx';
import { storeConfig } from '../config.js';

const topBarItems = [
  { icon: Award, text: 'B2B Wholesale Only' },
  { icon: PackageCheck, text: 'Bulk Pricing Advantage' },
  { icon: Truck, text: 'PAN India & Export Delivery' },
  { icon: WhatsappIcon, text: '', isLink: true },
];

export function TopBar({ isHome = false }) {
  const currentCurrency = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const waUrl = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(`Hello ${storeConfig.name}, I want to enquire about bulk orders.`)}`;
  const topBarWhatsapp = '+91 99191 01369';

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/INR')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          CurrencyManager.setRates(data.rates);
        }
      })
      .catch(err => console.error('Failed to fetch exchange rates', err));
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCurrency = CURRENCIES.find(c => c.code === currentCurrency) || CURRENCIES[0];

  return (
    <div className={`top-bar ${isHome ? 'home-top-bar' : ''}`}>
      <div className="top-bar-static">
        {topBarItems.map(({ icon: Icon, text, isLink }, i) => (
          isLink ? (
            <a key={text} href={waUrl} target="_blank" rel="noreferrer" className="whatsapp-span" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Icon size={14} /> <span className="wa-number">{topBarWhatsapp}</span>
            </a>
          ) : (
            <span key={text} className={i === 3 ? 'whatsapp-span' : ''}>
              <Icon size={14} /> {text}
            </span>
          )
        ))}
        
        <div className="currency-dropdown-custom" ref={dropdownRef}>
          <button 
            className="currency-trigger" 
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            <img 
              src={`https://flagcdn.com/w20/${activeCurrency.flag}.png`} 
              alt={activeCurrency.code}
              className="flag-img"
            />
            <span>{activeCurrency.code}</span>
            <ChevronDown size={12} className={isOpen ? 'rotate' : ''} />
          </button>
          
          {isOpen && (
            <div className="currency-options-panel">
              {CURRENCIES.map(c => (
                <button 
                  key={c.code}
                  className={`currency-option ${c.code === currentCurrency ? 'active' : ''}`}
                  onClick={() => {
                    CurrencyManager.setCurrency(c.code);
                    setIsOpen(false);
                  }}
                >
                  <img src={`https://flagcdn.com/w20/${c.flag}.png`} alt="" className="flag-img" />
                  <span>{c.code}</span>
                  {c.code === currentCurrency && <div className="active-dot" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="top-bar-marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...topBarItems, ...topBarItems].map(({ icon: Icon, text, isLink }, index) => (
            isLink ? (
              <a key={`${text}-${index}`} href={waUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Icon size={14} /> <span className="wa-number">{topBarWhatsapp}</span>
              </a>
            ) : (
              <span key={`${text}-${index}`}>
                <Icon size={14} /> {text}
              </span>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
