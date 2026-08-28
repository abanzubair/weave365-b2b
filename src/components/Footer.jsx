/**
 * Footer Component
 * Purpose: Renders standard B2B navigation links, corporate social anchors with icons,
 * primary support details with icons, policies, and developer credits with GitHub/LinkedIn.
 */
import { storeConfig } from '../config.js';
import brandLogo from '../../assets/Weave365.svg';
import { assetSrc } from '../utils/assetSrc.js';
import { AppLink } from './AppLink.jsx';
import { Instagram, Youtube, Facebook, MapPin, Phone, Mail, Github } from 'lucide-react';

function LinkedInIcon({ size = 15, className = "" }) {
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

function PinterestIcon({ size = 15, className = "" }) {
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

export function Footer({ navigate }) {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer id="contact" className="footer" aria-label="Site Footer">
      <div className="footer-inner-container">
        <div className="footer-main-layout">
        
        {/* Left Column: Brand & Contact Info */}
        <div className="footer-brand-section">
          <AppLink to="home" href="/" navigate={navigate} className="footer-brand" aria-label="Weave 365 Home">
            <img src={assetSrc(brandLogo)} alt={storeConfig.name} className="brand-logo footer-logo" />
          </AppLink>

          <h3 className="footer-tagline">Banarasi Sourcing &amp; Commerce Platform</h3>

          <p className="footer-desc">
            Weave 365 connects businesses and customers with Banarasi sarees and suits from Varanasi. We support wholesale and bulk buyers, importers and exporters, resellers and social sellers, boutiques, private labels, and retail customers with sourcing, custom collections, branded resale and fulfilment solutions.
          </p>

          <div className="footer-contact-details">
            <div className="footer-contact-line">
              <MapPin size={14} className="contact-icon" />
              <strong className="contact-label">Registered Office:</strong>
              <span className="contact-value">Varanasi, Uttar Pradesh, India</span>
            </div>
            <div className="footer-contact-line">
              <Phone size={14} className="contact-icon" />
              <strong className="contact-label">Support:</strong>
              <a href="tel:+919919101369" className="contact-value contact-link">+91 9919101369</a>
            </div>
            <div className="footer-contact-line">
              <Mail size={14} className="contact-icon" />
              <strong className="contact-label">Email:</strong>
              <a href="mailto:weave365@gmail.com" className="contact-value contact-link">weave365@gmail.com</a>
            </div>
          </div>
        </div>

        {/* Right Navigation Columns Grid */}
        <div className="footer-nav-grid">
          
          {/* Column 1: Company */}
          <div className="footer-nav-col">
            <h4 className="footer-col-heading">Company</h4>
            <ul className="footer-link-list">
              <li><AppLink to="about" href="/about" navigate={navigate}>About</AppLink></li>
              <li><AppLink to="contact" href="/contact" navigate={navigate}>Contact</AppLink></li>
              <li><AppLink to="sourcing-partners" href="/sourcing-partners" navigate={navigate}>Partners</AppLink></li>
              <li><AppLink to="affiliate-program" href="/affiliate-program" navigate={navigate}>Affiliates</AppLink></li>
              <li><AppLink to="developer-api" href="/developer-api" navigate={navigate}>Developer API</AppLink></li>
              <li><AppLink to="reseller-faqs" href="/reseller-faqs" navigate={navigate}>Reseller FAQs</AppLink></li>
            </ul>
          </div>

          {/* Column 2: Policies */}
          <div className="footer-nav-col">
            <h4 className="footer-col-heading">Policies</h4>
            <ul className="footer-link-list">
              <li><AppLink to="terms-conditions" href="/terms-conditions" navigate={navigate}>Terms &amp; Conditions</AppLink></li>
              <li><AppLink to="shipping-delivery" href="/shipping-delivery" navigate={navigate}>Shipping &amp; Delivery</AppLink></li>
              <li><AppLink to="returns-cancellation" href="/returns-cancellation" navigate={navigate}>Returns &amp; Cancellation</AppLink></li>
              <li><AppLink to="privacy-security" href="/privacy-security" navigate={navigate}>Privacy &amp; Security</AppLink></li>
              <li><AppLink to="payment-policy" href="/payment-policy" navigate={navigate}>Payment Policy</AppLink></li>
              <li><AppLink to="disclaimer" href="/disclaimer" navigate={navigate}>Disclaimer</AppLink></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="footer-nav-col">
            <h4 className="footer-col-heading">Resources</h4>
            <ul className="footer-link-list">
              <li><AppLink to="resell-sarees-online" href="/resell-sarees-online" navigate={navigate}>Reseller Guides</AppLink></li>
              <li><AppLink to="wholesale-catalogue" href="/wholesale-catalogue" navigate={navigate}>Wholesale Guides</AppLink></li>
              <li><AppLink to="custom-woven" href="/custom-woven" navigate={navigate}>Fabric &amp; Weave</AppLink></li>
              <li><AppLink to="collaboration" href="/collaboration" navigate={navigate}>Business Growth</AppLink></li>
              <li><AppLink to="blog" href="/blog" navigate={navigate}>Banarasi Insights</AppLink></li>
            </ul>
          </div>

          {/* Column 4: Social */}
          <div className="footer-nav-col">
            <h4 className="footer-col-heading">Social</h4>
            <ul className="footer-link-list footer-social-list">
              <li>
                <a href="https://www.instagram.com/weaves365/" target="_blank" rel="noreferrer" className="footer-social-link">
                  <Instagram size={15} className="social-icon" />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a href="https://www.facebook.com/weaves365" target="_blank" rel="noreferrer" className="footer-social-link">
                  <Facebook size={15} className="social-icon" />
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a href="https://www.youtube.com/@weaves365" target="_blank" rel="noreferrer" className="footer-social-link">
                  <Youtube size={15} className="social-icon" />
                  <span>YouTube</span>
                </a>
              </li>
              <li>
                <a href="https://in.pinterest.com/weaves365/" target="_blank" rel="noreferrer" className="footer-social-link">
                  <PinterestIcon size={15} className="social-icon" />
                  <span>Pinterest</span>
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/company/weaves365" target="_blank" rel="noreferrer" className="footer-social-link">
                  <LinkedInIcon size={15} className="social-icon" />
                  <span>LinkedIn</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: My Account */}
          <div className="footer-nav-col">
            <h4 className="footer-col-heading">My Account</h4>
            <ul className="footer-link-list">
              <li><AppLink to="account" href="/account" navigate={navigate}>Dashboard</AppLink></li>
              <li><AppLink to="catalogue" href="/catalogue" navigate={navigate}>Sell Catalogue</AppLink></li>
              <li><AppLink to="white-label" href="/white-label" navigate={navigate}>Brand Building</AppLink></li>
              <li><AppLink to="developer-api" href="/developer-api" navigate={navigate}>Agentic Commerce</AppLink></li>
              <li><a href="https://wa.me/919919101369?text=Hi%20Weave365%2C%20I%20would%20like%20to%20join%20the%20community" target="_blank" rel="noreferrer">Community</a></li>
            </ul>
          </div>

        </div>

      </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">&copy; {new Date().getFullYear()} {storeConfig.name}. All rights reserved.</p>
          <div className="footer-bottom-right">
            <span className="developer-credit-text">Designed &amp; Developed by</span>
            <a 
              href="https://github.com/abanzubair" 
              target="_blank" 
              rel="noreferrer" 
              className="developer-name-link"
            >
              Aban Zubair
            </a>
            <div className="developer-social-icons">
              <a 
                href="https://github.com/abanzubair" 
                target="_blank" 
                rel="noreferrer" 
                className="developer-icon-btn" 
                aria-label="Aban Zubair GitHub Profile"
                title="GitHub"
              >
                <Github size={13} />
              </a>
              <a 
                href="https://linkedin.com/in/abanzubair" 
                target="_blank" 
                rel="noreferrer" 
                className="developer-icon-btn" 
                aria-label="Aban Zubair LinkedIn Profile"
                title="LinkedIn"
              >
                <LinkedInIcon size={13} />
              </a>
            </div>
            <span className="footer-divider" aria-hidden="true">•</span>
            <button type="button" onClick={scrollToTop} className="footer-back-to-top">
              Back to Top &uarr;
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
