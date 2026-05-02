import { storeConfig } from '../config.js';
import brandLogo from '../../assets/Weave365.svg';
import { Linkedin, Instagram, Youtube, Facebook, Phone, Mail, Clock } from 'lucide-react';

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
        <h3>Quick Links</h3>
        <a>Home</a>
        <a>Categories</a>
        <a>Collections</a>
        <a>Contact Us</a>
      </div>
      <div>
        <h3>Customer Service</h3>
        <a>Shipping Policy</a>
        <a>Return & Refund</a>
        <a>Terms & Conditions</a>
        <a>FAQ</a>
      </div>
      <div>
        <h3>Social Links</h3>
        <a href="https://www.linkedin.com/company/weaves365" target="_blank" rel="noreferrer"><Linkedin size={16} /> LinkedIn</a>
        <a href="https://www.instagram.com/weaves365.wholesale" target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram</a>
        <a href="https://www.youtube.com/@weaves365" target="_blank" rel="noreferrer"><Youtube size={16} /> Youtube</a>
        <a href="https://www.facebook.com/weaves365" target="_blank" rel="noreferrer"><Facebook size={16} /> Facebook</a>
      </div>
      <div>
        <h3>Get In Touch</h3>
        <p><Phone size={16} /> {storeConfig.phone}</p>
        <p><Mail size={16} /> {storeConfig.email}</p>
        <p><Clock size={16} /> Mon - Sat (10AM - 6PM)</p>
      </div>
    </footer>
  );
}
