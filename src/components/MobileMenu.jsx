import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  Layers,
  MessageCircle,
  PackageCheck,
  Sparkles,
  Store,
  User,
  X,
} from 'lucide-react';
import { storeConfig } from '../config.js';
import brandLogo from '../../assets/Weave365.svg';

export function MobileMenu({ onClose, navigate, setCategory, user, openAuth }) {
  const navItems = [
    { icon: <Layers size={20} />, label: 'Categories', action: () => navigate('catalog') },
    {
      icon: <BadgeCheck size={20} />,
      label: 'Bestsellers',
      action: () => {
        setCategory('Bestsellers');
        navigate('catalog');
      },
    },
    {
      icon: <Sparkles size={20} />,
      label: 'New Arrivals',
      action: () => {
        setCategory('All');
        navigate('catalog');
      },
    },
    { icon: <PackageCheck size={20} />, label: 'Bulk Order', action: () => navigate('bulk-inquiry') },
    { icon: <Store size={20} />, label: 'Catalogue', action: () => navigate('catalog') },
  ];

  return (
    <>
      <div className="mobile-menu-backdrop" onClick={onClose} />
      <aside className="mobile-menu">
        <div className="mobile-menu-head">
          <img src={brandLogo} alt={storeConfig.name} className="brand-logo" style={{ height: 36 }} />
          <button className="icon-button" onClick={onClose} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>
        <nav className="mobile-menu-nav">
          {navItems.map(({ icon, label, action }) => (
            <button key={label} onClick={action} className="mobile-menu-item">
              <span className="mobile-menu-icon">{icon}</span>
              {label}
              <ArrowRight size={16} className="mobile-menu-arrow" />
            </button>
          ))}
        </nav>
        <div className="mobile-menu-divider" />
        <button className="mobile-menu-item mobile-menu-account" onClick={openAuth}>
          <span className="mobile-menu-icon"><User size={20} /></span>
          {user ? user.email || 'Account' : 'Login / Register'}
          <ArrowRight size={16} className="mobile-menu-arrow" />
        </button>
        <div className="mobile-menu-footer">
          <span><Headphones size={16} /> {storeConfig.phone}</span>
          <span><MessageCircle size={16} /> {storeConfig.email}</span>
        </div>
      </aside>
    </>
  );
}
