import { Award, PackageCheck, Truck, User } from 'lucide-react';

const topBarItems = [
  { icon: Award, text: 'Wholesale Only' },
  { icon: PackageCheck, text: 'MOQ: 1 Set' },
  { icon: Truck, text: 'Global Delivery' },
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
