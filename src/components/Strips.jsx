import { Award, Tag, Truck, Headphones, PackageCheck, ShieldCheck } from 'lucide-react';

const featureStripItems = [
  { icon: Award, title: 'Premium Quality', copy: 'Finest fabrics, crafted to perfection' },
  { icon: Tag, title: 'Best Wholesale Prices', copy: 'Competitive pricing for maximum profit' },
  { icon: Truck, title: 'Pan India Delivery', copy: 'Safe and fast delivery across India' },
  { icon: Headphones, title: 'Dedicated Support', copy: '24/7 support for all your business needs' },
];

const benefitStripItems = [
  { icon: PackageCheck, title: 'Easy Returns', copy: 'Hassle-free returns for eligible issues' },
  { icon: ShieldCheck, title: 'Secure Payments', copy: '100% secure payments and data safety' },
  { icon: Tag, title: 'Bulk Discounts', copy: 'Special offers on bulk and repeat orders' },
  { icon: Truck, title: 'Fast Dispatch', copy: 'Quick processing and on-time dispatch' },
];

export function FeatureStrip() {
  return (
    <section className="feature-strip">
      {featureStripItems.map(({ icon: Icon, title, copy }) => (
        <div key={title}>
          <Icon />
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
          <Icon />
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
