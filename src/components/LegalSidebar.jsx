import React from 'react';
import { FileText, Truck, RotateCcw, ShieldCheck, CreditCard, ShieldAlert, HelpCircle } from 'lucide-react';
import '../styles/legal.css';

export function LegalSidebar({ activeTab, navigate }) {
  const menuItems = [
    { id: 'terms-conditions', label: 'Terms & Conditions', path: 'terms-conditions', icon: FileText },
    { id: 'shipping-delivery', label: 'Shipping & Delivery', path: 'shipping-delivery', icon: Truck },
    { id: 'returns-cancellation', label: 'Returns & Cancellation', path: 'returns-cancellation', icon: RotateCcw },
    { id: 'privacy-security', label: 'Privacy & Security', path: 'privacy-security', icon: ShieldCheck },
    { id: 'payment-policy', label: 'Payment Policies', path: 'payment-policy', icon: CreditCard },
    { id: 'disclaimer', label: 'Disclaimer', path: 'disclaimer', icon: ShieldAlert },
    { id: 'reseller-faqs', label: 'Reseller FAQs', path: 'reseller-faqs', icon: HelpCircle },
  ];

  return (
    <nav className="legal-sidebar" aria-label="Legal documents index">
      <div className="legal-sidebar-header">
        <span className="legal-sidebar-kicker">Information Desk</span>
      </div>
      <div className="legal-sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              type="button"
              key={item.id}
              className={`legal-menu-btn ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={15} className="legal-menu-icon" />
              <span className="legal-menu-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
