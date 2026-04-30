import { Award, PackageCheck, Truck, User } from 'lucide-react';

const topBarItems = [
  { icon: Award, text: 'B2B Wholesale Only' },
  { icon: PackageCheck, text: 'Bulk Pricing Advantage' },
  { icon: Truck, text: 'PAN India & Export Delivery' },
  { icon: User, text: 'Register for New Arrivals' },
];

export function TopBar() {
  return (
    <div className="top-bar">
      <div className="top-bar-static">
        {topBarItems.map(({ icon: Icon, text }) => (
          <span key={text}><Icon size={14} /> {text}</span>
        ))}
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
