import { useEffect } from 'react';
import { Award, PackageCheck, Truck, User } from 'lucide-react';
import { CURRENCIES, CurrencyManager, useCurrency } from '../storefrontShared.jsx';

const topBarItems = [
  { icon: Award, text: 'B2B Wholesale Only' },
  { icon: PackageCheck, text: 'Bulk Pricing Advantage' },
  { icon: Truck, text: 'PAN India & Export Delivery' },
  { icon: User, text: 'WhatsApp for Orders & Enquiry' },
];

export function TopBar() {
  const currentCurrency = useCurrency();

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
        {topBarItems.map(({ icon: Icon, text }, i) => (
          <span key={text} className={i === 3 ? 'whatsapp-span' : ''}><Icon size={14} /> {text}</span>
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
          {[...topBarItems, ...topBarItems].map(({ icon: Icon, text }, index) => (
            <span key={`${text}-${index}`}><Icon size={14} /> {text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
