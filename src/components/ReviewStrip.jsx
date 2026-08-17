/**
 * ReviewStrip Component
 * Purpose: Renders a premium, glassmorphism-themed review strip on the homepage.
 * Invites boutique partners and resellers to leave sourcing feedback.
 */
import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import '../styles/reviewStrip.css';

export function ReviewStrip({ navigate }) {
  const handleClick = (e) => {
    e.preventDefault();
    navigate('reviews?write=true');
  };

  return (
    <section className="review-strip">
      <div className="review-strip-content">
        <span className="strip-icon-wrapper">
          <MessageSquare className="strip-icon" />
        </span>
        <div className="review-strip-text">
          <h2 className="review-strip-title">Share Your Sourcing Experience</h2>
          <p className="review-strip-description">
            Help us support our weaver network by reviewing your wholesale sourcing, fabric quality, or shipping experience.
          </p>
        </div>
      </div>
      <div className="review-strip-actions">
        <div className="review-rating-summary">
          <div className="review-stars-preview">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={16} fill="var(--gold)" stroke="var(--gold)" />
            ))}
          </div>
          <span className="rating-text">5.0 / 5 Sourcing Trust</span>
        </div>
        <a
          href="/reviews?write=true"
          onClick={handleClick}
          className="review-write-btn-strip"
        >
          Write a Review
        </a>
      </div>
    </section>
  );
}
