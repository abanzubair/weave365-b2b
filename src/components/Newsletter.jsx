/**
 * Partner Hub: Updates & Sourcing Reviews Strip
 * Purpose: Editorial, non-card, full-width (1600px) layout for WhatsApp updates and weaver reviews.
 */
import React from 'react';
import { Star, ArrowRight } from './icons.jsx';
import { useRouter } from 'next/navigation';
import { WhatsappIcon } from './WhatsappIcon.jsx';
import '../styles/newsletter.css';

export function Newsletter({ navigate }) {
  const router = useRouter();

  const handleNav = (event, path) => {
    event.preventDefault();
    if (typeof navigate === 'function') {
      navigate(path.replace(/^\//, ''));
    } else if (router) {
      router.push(path.startsWith('/') ? path : `/${path}`);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="editorial-hub-section" aria-label="Wholesale Updates & Sourcing Reviews">
      <div className="editorial-hub-container">
        
        {/* Left Side: Stay Updated */}
        <div className="editorial-hub-col">
          <div className="editorial-hub-header">
            <h2 className="editorial-hub-title">Stay Updated</h2>
            <p className="editorial-hub-desc">
              Get instant WhatsApp alerts on new Banarasi handloom arrivals, restocks, and exclusive wholesale lot offers.
            </p>
          </div>

          <div className="editorial-hub-actions">
            <a
              href="https://wa.me/919919101369?text=Hi%20Weave365%2C%20I%20would%20like%20to%20get%20wholesale%20updates"
              target="_blank"
              rel="noopener noreferrer"
              className="editorial-hub-whatsapp-btn"
            >
              <WhatsappIcon size={19} />
              <span>Get WhatsApp Updates</span>
            </a>
          </div>
        </div>

        {/* Center Vertical Divider */}
        <div className="editorial-hub-divider" role="separator" aria-orientation="vertical" />

        {/* Right Side: Share Your Sourcing Experience */}
        <div className="editorial-hub-col">
          <div className="editorial-hub-header">
            <div className="editorial-hub-rating">
              <div className="editorial-hub-stars" aria-label="5 out of 5 stars rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={15} fill="var(--gold)" stroke="var(--gold)" />
                ))}
              </div>
              <span className="editorial-hub-rating-text">5.0 / 5 Sourcing Trust</span>
            </div>

            <h2 className="editorial-hub-title">Share Your Experience</h2>
            <p className="editorial-hub-desc">
              Help support our weaver network by reviewing your wholesale fabric quality, loom authenticity, and delivery.
            </p>
          </div>

          <div className="editorial-hub-actions editorial-hub-review-actions">
            <a
              href="/reviews?write=true"
              onClick={(e) => handleNav(e, '/reviews?write=true')}
              className="editorial-hub-review-btn"
            >
              Write a Review
            </a>
            <a
              href="/reviews"
              onClick={(e) => handleNav(e, '/reviews')}
              className="editorial-hub-link"
            >
              <span>Read Reviews</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
