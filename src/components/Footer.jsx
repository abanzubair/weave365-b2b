/**
 * Footer Component
 * Purpose: Renders standard B2B navigation links, corporate social anchors,
 * primary support details (phone, email, hours), and direct SEO landing page index maps.
 */
import { storeConfig } from '../config.js';
import brandLogo from '../../assets/Weave365.svg';
import { Github, Instagram, Youtube, Facebook, Phone, Mail, UserPlus, Handshake, Coins } from 'lucide-react';
import { assetSrc } from '../utils/assetSrc.js';

function LinkedInIcon({ size = 16, className = "" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={size} 
      height={size} 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function PinterestIcon({ size = 16, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

export function Footer({ navigate, scrollToSection }) {
  const handleLinkClick = (e, to, productId = null, shopName = null) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    navigate(to, productId, shopName);
  };

  return (
    <footer id="contact" className="footer">
      <div>
        <a
          href="/"
          className="brand footer-brand"
          onClick={(e) => handleLinkClick(e, 'home')}
        >
          <img src={assetSrc(brandLogo)} alt={storeConfig.name} className="brand-logo footer-logo" />
        </a>
        <p>Your trusted wholesale partner for premium quality sarees at unbeatable wholesale prices.</p>
      </div>
      <div>
        <h3>Company</h3>
        <a href="/about" onClick={(e) => handleLinkClick(e, 'about')}>About Us</a>
        <a href="/contact" onClick={(e) => handleLinkClick(e, 'contact')}>Contact Us</a>
        <a href="/catalogue" onClick={(e) => handleLinkClick(e, 'catalogue')}>Catalogue</a>
        <a href="/bulk-inquiry" onClick={(e) => handleLinkClick(e, 'bulk-inquiry')}>Bulk Order</a>
        <a href="/dropshipping" onClick={(e) => handleLinkClick(e, 'dropshipping')}>Dropshipping</a>
        <a href="/favorites" onClick={(e) => handleLinkClick(e, 'favorites')}>My Favorites</a>
      </div>
      <div>
        <h3>Information</h3>
        <a href="/disclaimer" onClick={(e) => handleLinkClick(e, 'disclaimer')}>Disclaimer</a>
        <a href="/shipping-delivery" onClick={(e) => handleLinkClick(e, 'shipping-delivery')}>Shipping & Delivery</a>
        <a href="/returns-cancellation" onClick={(e) => handleLinkClick(e, 'returns-cancellation')}>Returns & Cancellation</a>
        <a href="/privacy-security" onClick={(e) => handleLinkClick(e, 'privacy-security')}>Privacy & Security</a>
        <a href="/terms-conditions" onClick={(e) => handleLinkClick(e, 'terms-conditions')}>Terms & Conditions</a>
      </div>
      <div>
        <h3>Blog</h3>
        <a href="/blog" onClick={(e) => handleLinkClick(e, 'blog')}>All Blog Articles</a>
        <a href="/blog?category=Wholesale Guides" onClick={(e) => handleLinkClick(e, 'blog', '?category=Wholesale Guides')}>Wholesale Guides</a>
        <a href="/blog?category=Reseller Business" onClick={(e) => handleLinkClick(e, 'blog', '?category=Reseller Business')}>Reseller Business</a>
        <a href="/blog?category=Banarasi Insights" onClick={(e) => handleLinkClick(e, 'blog', '?category=Banarasi Insights')}>Banarasi Insights</a>
        <a href="/blog?category=Business Growth" onClick={(e) => handleLinkClick(e, 'blog', '?category=Business Growth')}>Business Growth</a>
      </div>
      <div>
        <h3>Social Profiles</h3>
        <a href="https://www.linkedin.com/company/weaves365" target="_blank" rel="noreferrer"><LinkedInIcon size={16} /> LinkedIn</a>
        <a href="https://www.instagram.com/weaves365/" target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram</a>
        <a href="https://www.facebook.com/weaves365" target="_blank" rel="noreferrer"><Facebook size={16} /> Facebook</a>
        <a href="https://www.youtube.com/@weaves365" target="_blank" rel="noreferrer"><Youtube size={16} /> YouTube</a>
        <a href="https://in.pinterest.com/weaves365/" target="_blank" rel="noreferrer"><PinterestIcon size={16} /> Pinterest</a>
      </div>
      <div>
        <h3>Get In Touch</h3>
        <a href={`tel:${storeConfig.phone}`}><Phone size={16} /> {storeConfig.phone}</a>
        <a href={`mailto:${storeConfig.email}`}><Mail size={16} /> {storeConfig.email}</a>
        <a
          href="/affiliate-program"
          className="footer-link"
          onClick={(e) => handleLinkClick(e, 'affiliate-program')}
        >
          <Coins size={16} /> Affiliate Program
        </a>
        <a
          href="/collaboration"
          className="footer-link"
          onClick={(e) => handleLinkClick(e, 'collaboration')}
        >
          <Handshake size={16} /> Collaboration
        </a>
        <a
          href="/weaver-onboarding"
          className="footer-link"
          onClick={(e) => handleLinkClick(e, 'weaver-onboarding')}
        >
          <UserPlus size={16} /> Weaver Onboarding
        </a>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {storeConfig.name}. All rights reserved.</p>
        <p className="developer-credit">
          <span className="developer-label">Designed and Developed by</span>
          <a href="https://github.com/abanzubair" target="_blank" rel="noreferrer" className="developer-name">Aban Zubair</a>
          <span className="developer-socials">
            <a href="https://linkedin.com/in/abanzubair" target="_blank" rel="noreferrer" title="LinkedIn">
              <LinkedInIcon size={14} />
            </a>
            <a href="https://github.com/abanzubair" target="_blank" rel="noreferrer" title="GitHub">
              <Github size={14} />
            </a>
          </span>
        </p>
      </div>
    </footer>
  );
}
