import { useEffect } from 'react';
import { Award, PackageCheck, Truck } from 'lucide-react';
import { CURRENCIES, CurrencyManager, useCurrency, WhatsappIcon } from '../storefrontShared.jsx';
import { storeConfig } from '../config.js';

const topBarItems = [
  { icon: Award, text: 'B2B Wholesale Only' },
  { icon: PackageCheck, text: 'Bulk Pricing Advantage' },
  { icon: Truck, text: 'PAN India & Export Delivery' },
  { icon: WhatsappIcon, text: 'WhatsApp for Orders & Enquiry', isLink: true },
];

export function TopBar() {
  const currentCurrency = useCurrency();
  const waUrl = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(`Hello ${storeConfig.name}, I want to enquire about bulk orders.`)}`;

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

  return (
    <div className="top-bar">
      <div className="top-bar-static">
        {topBarItems.map(({ icon: Icon, text, isLink }, i) => (
          isLink ? (
            <a key={text} href={waUrl} target="_blank" rel="noreferrer" className="whatsapp-span" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Icon size={14} /> {text}
            </a>
          ) : (
            <span key={text} className={i === 3 ? 'whatsapp-span' : ''}>
              <Icon size={14} /> {text}
            </span>
          )
        ))}
        <select 
          className="currency-select"
          value={currentCurrency} 
          onChange={(e) => CurrencyManager.setCurrency(e.target.value)}
        >
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>{c.code}</option>
          ))}
        </select>
      </div>
      <div className="top-bar-marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...topBarItems, ...topBarItems].map(({ icon: Icon, text, isLink }, index) => (
            isLink ? (
              <a key={`${text}-${index}`} href={waUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Icon size={14} /> {text}
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
