/**
 * ProductTrustStrip Component
 * Purpose: Minimal, distilled B2B trust signals for Varanasi handlooms.
 * Sizing, typography, and ratios aligned with the site design system.
 */
import React from 'react';
import '../styles/productTrustStrip.css';
import { Globe, IndianRupee, ShieldCheck, Headphones } from './icons.jsx';

const trustItems = [
  {
    icon: Globe,
    title: 'Worldwide Delivery',
    subtitle: 'Direct dispatch from Varanasi',
  },
  {
    icon: IndianRupee,
    title: 'Weaver Wholesale Rates',
    subtitle: 'Loom-direct, zero middlemen',
  },
  {
    icon: ShieldCheck,
    title: 'Hand-Inspected Quality',
    subtitle: '5-point artisan verification',
  },
  {
    icon: Headphones,
    title: 'Dedicated B2B Desk',
    subtitle: 'Live WhatsApp assistance',
  },
];

export function ProductTrustStrip() {
  return (
    <section className="product-trust-strip" aria-label="Purchase Assurances">
      <div className="trust-strip-grid">
        {trustItems.map(({ icon: Icon, title, subtitle }) => (
          <div className="trust-item" key={title}>
            <Icon className="trust-item-icon" size={24} />
            <div className="trust-item-text">
              <span className="trust-item-title">{title}</span>
              <span className="trust-item-subtitle">{subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
