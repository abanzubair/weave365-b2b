/**
 * ContactPage View
 * Purpose: Renders Weave 365's premium, minimalist Contact page.
 * Displays primary communication channels (Email, Phone), detailed operational hours,
 * and direct social links, styled within a luxury, modern visual frame.
 * Embeds crawlable LocalBusiness and Organization schemas for Google Search crawling.
 */
import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Clock, 
  Facebook, 
  Instagram, 
  Youtube, 
  Linkedin,
  ArrowRight,
  ChevronRight
} from '../components/icons.jsx';
import { siteUrl, storeConfig } from '../config.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import '../styles/contact.css';

function PinterestIcon({ size = 20, className = "" }) {
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

export function ContactSection({ navigate }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus('error');
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to send message.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('A network error occurred. Please try again.');
    }
  };

  return (
    <main className="contact-main">
      <h1 className="contact-h1">Get in touch</h1>
      
      <div className="contact-split-layout">
        
        {/* LEFT COLUMN: CONTACT FORM */}
        <div className="contact-form-card">
          <h2 className="contact-section-title">Send a Message</h2>
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group-row">
              <div className="form-group">
                <label htmlFor="contact-name">Full Name *</label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  required
                  disabled={status === 'submitting'}
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact-email">Email Address *</label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  required
                  disabled={status === 'submitting'}
                />
              </div>
            </div>
            
            <div className="form-group-row">
              <div className="form-group">
                <label htmlFor="contact-phone">Phone Number</label>
                <input
                  type="tel"
                  id="contact-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                  disabled={status === 'submitting'}
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact-subject">Subject *</label>
                <input
                  type="text"
                  id="contact-subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  required
                  disabled={status === 'submitting'}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="contact-message">Your Message *</label>
              <textarea
                id="contact-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us about your product sourcing needs, brand collaboration, bulk inquiry, or any other query..."
                rows="4"
                required
                disabled={status === 'submitting'}
              />
            </div>

            {status === 'success' && (
              <div className="contact-alert alert-success">
                Thank you! Your message has been sent successfully. We will get back to you shortly.
              </div>
            )}

            {status === 'error' && (
              <div className="contact-alert alert-error">
                {errorMessage || 'Something went wrong. Please try again.'}
              </div>
            )}

            <button
              type="submit"
              className="contact-submit-btn"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: EXISTING CHANNELS & HOURS */}
        <div className="contact-grid">
          
          {/* DIRECT CHANNELS SECTION */}
          <div className="contact-section">
            <h2 className="contact-section-title">Direct Inquiry</h2>
            <div className="contact-links">
              
              <div className="contact-item-text">
                <div className="contact-icon-box">
                  <Mail size={20} />
                </div>
                <div className="contact-item-info">
                  <span className="contact-label">Email Us</span>
                  <span className="contact-value">weave365@gmail.com</span>
                </div>
              </div>

              <div className="contact-item-text">
                <div className="contact-icon-box">
                  <Phone size={20} />
                </div>
                <div className="contact-item-info">
                  <span className="contact-label">Call / WhatsApp</span>
                  <span className="contact-value">+91 9919 101369</span>
                </div>
              </div>

            </div>
          </div>

          {/* OPERATIONAL HOURS SECTION */}
          <div className="contact-section">
            <h2 className="contact-section-title">Our Hours</h2>
            <div className="contact-hours-box">
              <div className="contact-hours-icon-box">
                <Clock size={20} />
              </div>
              <div className="contact-hours-details">
                <div className="contact-hour-row">
                  <span className="day-label">Monday - Friday</span>
                  <span className="time-value">9 AM to 7 PM IST</span>
                </div>
                <div className="contact-hour-row">
                  <span className="day-label">Saturday - Sunday</span>
                  <span className="time-value">10 AM to 2 PM IST</span>
                </div>
              </div>
            </div>
          </div>

          {/* SOCIAL REACH SECTION */}
          <div className="contact-section">
            <h2 className="contact-section-title">Follow us</h2>
            <div className="contact-socials-grid">
              
              <a 
                href="https://www.linkedin.com/company/weaves365" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="contact-social-btn"
              >
                <Linkedin size={18} />
                <span>LinkedIn</span>
              </a>

              <a 
                href="https://www.instagram.com/weaves365.wholesale" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="contact-social-btn"
              >
                <Instagram size={18} />
                <span>Instagram</span>
              </a>

              <a 
                href="https://www.facebook.com/weaves365" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="contact-social-btn"
              >
                <Facebook size={18} />
                <span>Facebook</span>
              </a>

              <a 
                href="https://www.youtube.com/@weaves365" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="contact-social-btn"
              >
                <Youtube size={18} />
                <span>Youtube</span>
              </a>

              <a 
                href="https://in.pinterest.com/weaves365/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="contact-social-btn"
              >
                <PinterestIcon size={18} />
                <span>Pinterest</span>
              </a>

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}

export function ContactPage({ navigate }) {
  
  // JSON-LD structured data for B2B Google Search crawlers
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Weave 365",
    "image": `${siteUrl}/favicon.png`,
    "email": "weave365@gmail.com",
    "telephone": "+919919101369",
    "url": `${siteUrl}/contact`,
    "priceRange": "$$$$",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Varanasi",
      "addressRegion": "Uttar Pradesh",
      "postalCode": "221001",
      "addressCountry": "India"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "19:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Saturday", "Sunday"],
        "opens": "10:00",
        "closes": "14:00"
      }
    ],
    "sameAs": [
      "https://www.facebook.com/weaves365",
      "https://www.instagram.com/weaves365.wholesale",
      "https://www.youtube.com/@weaves365",
      "https://in.pinterest.com/weaves365/",
      "https://www.linkedin.com/company/weaves365"
    ]
  };

  React.useEffect(() => {
    // Elegant header logic matching luxury background states
    document.documentElement.classList.add('header-over-dark');
    return () => {
      document.documentElement.classList.remove('header-over-dark');
    };
  }, []);

  return (
    <div className="contact-page-container">
      {/* Search Crawler Technical Schema Injector */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} 
      />

      <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Contact Us' }]} navigate={navigate} />

      <ContactSection navigate={navigate} />
    </div>
  );
}
