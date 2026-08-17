import React from 'react';
import { ChevronRight, ShieldAlert, Truck, RotateCcw, ShieldCheck, FileText } from 'lucide-react';
import '../styles/legal.css';

export function LegalSidebar({ activeTab, navigate }) {
  const menuItems = [
    { id: 'disclaimer', label: 'Disclaimer', path: 'disclaimer', icon: ShieldAlert },
    { id: 'shipping-delivery', label: 'Shipping & Delivery', path: 'shipping-delivery', icon: Truck },
    { id: 'returns-cancellation', label: 'Returns & Cancellation', path: 'returns-cancellation', icon: RotateCcw },
    { id: 'privacy-security', label: 'Privacy & Security', path: 'privacy-security', icon: ShieldCheck },
    { id: 'terms-conditions', label: 'Terms & Conditions', path: 'terms-conditions', icon: FileText },
  ];

  return (
    <aside className="legal-sidebar">
      <h3>Information Desk</h3>
      <div className="legal-sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button type="button"
              key={item.id}
              className={`legal-menu-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={16} />
                {item.label}
              </span>
              <ChevronRight size={14} />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
