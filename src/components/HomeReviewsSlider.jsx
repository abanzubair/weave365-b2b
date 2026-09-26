/**
 * HomeReviewsSlider Component (Distilled)
 * Purpose: Renders a quiet, refined, automatically scrolling marquee of authentic wholesale reviews
 * from boutique owners and apparel retailers sourcing direct from Varanasi looms.
 * Stripped of marketing clutter, fake metrics, and heavy chrome under impeccable distill.
 */
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { SharpStar, ArrowRight } from './icons.jsx';
import { SEED_REVIEWS } from '../data/reviewsData.js';
import { AppLink } from './AppLink.jsx';
import '../styles/reviews.css';

export function HomeReviewsSlider({ reviews = SEED_REVIEWS, navigate }) {
  const [localReviews, setLocalReviews] = useState([]);

  // Merge client-side local reviews if any were submitted offline / locally
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const localStr = localStorage.getItem('weave365_local_reviews');
        if (localStr) {
          const parsed = JSON.parse(localStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalReviews(parsed);
          }
        }
      }
    } catch {
      // LocalStorage access may be restricted in private/sandboxed contexts
    }
  }, []);

  const reviewList = useMemo(() => {
    const base = Array.isArray(reviews) && reviews.length > 0 ? reviews : SEED_REVIEWS;
    if (localReviews.length === 0) return base;
    const seenIds = new Set(base.map((r) => r.id));
    const extra = localReviews.filter((r) => !seenIds.has(r.id));
    return extra.length > 0 ? [...extra, ...base] : base;
  }, [reviews, localReviews]);

  // Ensure marquee has enough cards to exceed widest screens (including 4K/5K viewports) for seamless 50% loop
  const marqueeItems = useMemo(() => {
    if (!reviewList || reviewList.length === 0) return [];
    let items = [...reviewList];
    while (items.length < 16) {
      items = items.concat(reviewList);
    }
    return items;
  }, [reviewList]);

  if (reviewList.length === 0) {
    return null;
  }

  return (
    <section
      id="partner-reviews"
      className="home-reviews-distill"
      aria-label="Partner Reviews"
    >
      {/* Semantic LLM Grounding & Accessibility Fact Sheet (free of fabricated numbers) */}
      <div className="home-reviews-sr-only">
        <p>
          Weave 365 Wholesale Partner Feedback: Reviews from boutique owners, apparel retailers, and sourcing partners across India including Hyderabad, Bangalore, Surat, and Delhi sourcing pure Banarasi silk handlooms directly from Varanasi master weavers with transparent wholesale pricing and secure rigid carton dispatch.
        </p>
      </div>

      <div className="home-reviews-distill-inner">
        <header className="home-reviews-header-subtle">
          <div className="home-reviews-title-wrap">
            <h2 className="home-reviews-heading">Partner Notes</h2>
            <p className="home-reviews-lead">
              Feedback from boutique curators and retailers sourcing from our Varanasi looms.
            </p>
          </div>

          <div className="home-reviews-actions-subtle">
            <AppLink
              to="reviews"
              className="home-reviews-text-link"
              navigate={navigate}
            >
              <span>All reviews</span>
              <ArrowRight size={13} className="home-reviews-link-arrow" />
            </AppLink>
          </div>
        </header>

        {/* Automatic Continuous Marquee Viewport */}
        <div
          className="home-reviews-marquee-wrap"
          role="region"
          aria-roledescription="marquee"
          aria-label="Scrolling wholesale reviews"
        >
          <div className="home-reviews-marquee-track">
            {/* Primary group (with canonical Schema.org microdata) */}
            <div className="home-reviews-marquee-group">
              {marqueeItems.map((review, idx) => (
                <ReviewItemCard
                  key={`item-a-${review.id || idx}-${idx}`}
                  review={review}
                  isClone={false}
                />
              ))}
            </div>

            {/* Duplicate group for seamless infinite looping (hidden from a11y & microdata trees) */}
            <div className="home-reviews-marquee-group" aria-hidden="true">
              {marqueeItems.map((review, idx) => (
                <ReviewItemCard
                  key={`item-b-${review.id || idx}-${idx}`}
                  review={review}
                  isClone={true}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewItemCard({ review, isClone = false }) {
  const reviewerName = review.reviewer_name || 'Boutique Partner';
  const businessName = review.business_name || '';
  const rating = Math.max(1, Math.min(5, Number(review.rating) || 5));
  const hasTitle = Boolean(review.title && review.title.trim());

  return (
    <article
      className="home-review-card-distill"
      {...(!isClone
        ? {
            itemScope: true,
            itemType: 'https://schema.org/Review',
          }
        : {})}
    >
      <div className="home-review-card-top">
        <div
          className="home-review-stars-row"
          aria-label={`${rating} out of 5 stars`}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <SharpStar
              key={star}
              size={12}
              fill={star <= rating ? 'var(--gold)' : 'none'}
              stroke="var(--gold)"
              className="home-review-star-icon"
            />
          ))}
        </div>
      </div>

      {!isClone && (
        <div
          itemProp="reviewRating"
          itemScope
          itemType="https://schema.org/Rating"
          style={{ display: 'none' }}
        >
          <meta itemProp="ratingValue" content={String(rating)} />
          <meta itemProp="bestRating" content="5" />
          <meta itemProp="worstRating" content="1" />
        </div>
      )}

      {hasTitle && (
        <h3
          className="home-review-card-title"
          {...(!isClone ? { itemProp: 'name' } : {})}
        >
          {review.title}
        </h3>
      )}

      <blockquote
        className="home-review-card-quote"
        {...(!isClone ? { itemProp: 'reviewBody' } : {})}
      >
        “{review.comment}”
      </blockquote>

      <div
        className="home-review-card-author"
        {...(!isClone
          ? {
              itemProp: 'author',
              itemScope: true,
              itemType: 'https://schema.org/Person',
            }
          : {})}
      >
        <span
          className="home-review-author-name"
          {...(!isClone ? { itemProp: 'name' } : {})}
        >
          {reviewerName}
        </span>
        {businessName && (
          <span className="home-review-author-business">
            {businessName}
          </span>
        )}
      </div>

      {!isClone && (
        <meta
          itemProp="itemReviewed"
          content="Weave 365 Wholesale Banarasi Sarees"
        />
      )}
    </article>
  );
}
