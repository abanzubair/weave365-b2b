import { Award, BadgeIndianRupee, HeartHandshake, PackagePlus, Tag, Truck, PackageCheck, ShieldCheck } from 'lucide-react';

const featureStripItems = [
  { icon: BadgeIndianRupee, title: 'Bulk Pricing Advantage', copy: 'Better margins for wholesale buyers' },
  { icon: PackagePlus, title: 'Daily New Stock', copy: 'Fresh catalog updates for repeat buying' },
  { icon: Truck, title: 'Pan India + Export Delivery', copy: 'Reliable dispatch India and overseas' },
  { icon: Award, title: 'Low MOQ / Flexible Buying', copy: 'Start small and scale your orders easily' },
];

const benefitStripItems = [
  { icon: PackageCheck, title: '1000+ Designs Available', copy: 'Wide catalog depth for every market' },
  { icon: ShieldCheck, title: '500+ Active Buyers', copy: 'Trusted by repeat wholesale customers' },
  { icon: Tag, title: '10+ Years in Banaras Network', copy: 'Strong sourcing relationships and local reach' },
  { icon: HeartHandshake, title: '95% Repeat Buyer Rate', copy: 'Reliable products, pricing, and dispatch' },
];

export function FeatureStrip() {
  return (
    <section className="feature-strip">
      {featureStripItems.map(({ icon: Icon, title, copy }) => (
        <div key={title}>
          <Icon strokeWidth={1.5} />
          <span>
            <strong>{title}</strong>
            {copy}
          </span>
        </div>
      ))}
    </section>
  );
}

export function BenefitStrip() {
  return (
    <section className="benefit-strip">
      {benefitStripItems.map(({ icon: Icon, title, copy }) => (
        <div key={title}>
          <Icon strokeWidth={1.5} />
          <span>
            <strong>{title}</strong>
            {copy}
          </span>
        </div>
      ))}
    </section>
  );
}

export function Stat({ icon, value, label }) {
  return (
    <div>
      {icon}
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
