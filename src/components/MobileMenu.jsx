import { Layers, ShoppingBag, Heart, User, Headphones, MessageCircle, ArrowRight, X } from 'lucide-react';
import { storeConfig } from '../config.js';
import brandLogo from '../../assets/Weave365.svg';

export function MobileMenu({ onClose, navigate, user, openAuth }) {
  const navItems = [
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>, label: 'Home', action: () => navigate('home') },
    { icon: <Layers size={20} />, label: 'Categories', action: () => navigate('catalog') },
    { icon: <ShoppingBag size={20} />, label: 'Collections', action: () => navigate('catalog') },
    { icon: <Heart size={20} />, label: 'Favourites', action: () => navigate('favorites') },
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
