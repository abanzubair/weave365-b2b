import { storeConfig } from '../config.js';
import brandLogo from '../../assets/Weave365.svg';
import { Linkedin, Instagram, Youtube, Facebook, Phone, Mail, Clock, UserPlus, Handshake } from 'lucide-react';

export function Footer({ navigate }) {
  return (
    <footer id="contact" className="footer">
      <div>
        <a
          href="/"
          className="brand footer-brand"
          onClick={(e) => {
            e.preventDefault();
            navigate('home');
          }}
        >
          <img src={brandLogo} alt={storeConfig.name} className="brand-logo footer-logo" />
        </a>
        <p>Your trusted wholesale partner for premium quality sarees at unbeatable wholesale prices.</p>
      </div>
      <div>
        <h3>Company</h3>
        <a href="#about">About Us</a>
        <a href="#contact">Contact Us</a>
        <a href="/catalog" onClick={(e) => { e.preventDefault(); navigate('catalog'); }}>Catalogue</a>
        <a href="/bulk-inquiry" onClick={(e) => { e.preventDefault(); navigate('bulk-inquiry'); }}>Bulk Order</a>
        <a href="/favorites" onClick={(e) => { e.preventDefault(); navigate('favorites'); }}>My Favorites</a>
      </div>
      <div>
        <h3>Information</h3>
        <a href="#disclaimer">Disclaimer</a>
        <a href="#shipping">Shipping & Delivery</a>
        <a href="#returns">Returns & Cancellation</a>
        <a href="#privacy">Privacy & Security</a>
        <a href="#terms">Terms & Conditions</a>
      </div>
      <div>
        <h3>Social Links</h3>
        <a href="https://www.linkedin.com/company/weaves365" target="_blank" rel="noreferrer"><Linkedin size={16} /> LinkedIn</a>
        <a href="https://www.instagram.com/weaves365.wholesale" target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram</a>
        <a href="https://www.facebook.com/weaves365" target="_blank" rel="noreferrer"><Facebook size={16} /> Facebook</a>
        <a href="https://www.youtube.com/@weaves365" target="_blank" rel="noreferrer"><Youtube size={16} /> YouTube</a>
      </div>
      <div>
        <h3>Get In Touch</h3>
        <a href={`tel:${storeConfig.phone}`}><Phone size={16} /> {storeConfig.phone}</a>
        <a href={`mailto:${storeConfig.email}`}><Mail size={16} /> {storeConfig.email}</a>
        <a href="#working-hours"><Clock size={16} /> Mon - Sat (10AM - 6PM)</a>
        <a href="#collaboration" className="footer-link"><Handshake size={16} /> Collaboration</a>
        <a href="#onboarding" className="footer-link"><UserPlus size={16} /> Weaver Onboarding</a>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {storeConfig.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
