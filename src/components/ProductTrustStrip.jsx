/**
 * ProductTrustStrip Component
 * Purpose: Renders standard high-fidelity trust symbols and assurances (shipping, wholesale rates, quality check).
 * Displays beneath details/catalogues to maximize B2B buyer conversion and reliability signals.
 */
import { Truck, Tag, ShieldCheck, Headphones } from 'lucide-react';
import '../styles/productTrustStrip.css';

const productTrustItems = [
  { icon: Truck, title: 'Pan India & Worldwide Delivery', copy: 'Secure shipping across India & overseas' },
  { icon: Tag, title: 'Best Wholesale Prices', copy: 'Get the best prices on bulk orders' },
  { icon: ShieldCheck, title: 'Quality Guaranteed', copy: 'Every piece is hand-inspected for perfection' },
  { icon: Headphones, title: 'Dedicated Support', copy: "We're here to help you at every step" },
];

export function ProductTrustStrip() {
  return (
    <section className="product-trust-strip">
      {productTrustItems.map(({ icon: Icon, title, copy }) => (
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
