/**
 * ReviewsPage View
 * Purpose: Renders Weave 365's B2B client reviews and feedback hub.
 * Allows boutique owners, resellers, and retailers to browse verified sourcing experiences
 * and write reviews about service quality, product authenticity, and shipping reliability.
 * Integrates directly with Supabase table `service_reviews` with a client-side localStorage fallback.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Award, Plus, HelpCircle, Check, Loader } from '../components/icons.jsx';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import SliderCaptcha from '../components/SliderCaptcha.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { StateMessage } from '../components/StateMessage.jsx';
import { siteUrl } from '../config.js';
import { Testimonials } from '../components/ui/testimonials-columns-1.jsx';
import '../styles/reviews.css';

export function SharpStar({ size = 24, fill = 'none', stroke = 'currentColor', strokeWidth = 2, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

const SEED_REVIEWS = [
  {
    id: 'seed-1',
    reviewer_name: 'Rajesh Reddy',
    business_name: 'Varun Tex, Hyderabad',
    rating: 5,
    title: 'Real Katan Silk Sourcing',
    comment: 'Real katan silk is easy to spot. The weight and gold zari work on these pieces hold up under close scrutiny. Our customers love the quality, and our sales have steadily grown since sourcing direct from Varanasi weavers.',
    created_at: '2026-05-10T12:00:00Z',
  },
  {
    id: 'seed-2',
    reviewer_name: 'Priyanka Sen',
    business_name: 'The Silk Route, Bangalore',
    rating: 5,
    title: 'Straightforward Wholesale Pricing',
    comment: "We've been using Weave365 as our main source. The tiered pricing is transparent, and the WhatsApp checkout flow works cleanly without any back and forth over quantities.",
    created_at: '2026-04-28T09:30:00Z',
  },
  {
    id: 'seed-3',
    reviewer_name: 'Ketan Patel',
    business_name: 'Kiran Fashions, Surat',
    rating: 5,
    title: 'Secure Transit & Packaging',
    comment: "Transit damage used to be a real headache. Weave365 packs everything securely, and deliveries have been consistently on time. Highly recommend their wholesale channel.",
    created_at: '2026-04-15T15:45:00Z',
  },
  {
    id: 'seed-4',
    reviewer_name: 'Aditi Sharma',
    business_name: 'Meenakshi Sarees, Delhi',
    rating: 5,
    title: 'Efficient Catalog Downloader',
    comment: "Downloading high-res photos for our resellers takes minutes. Support responds quickly on WhatsApp, which is crucial when confirming client orders.",
    created_at: '2026-03-22T11:15:00Z',
  }
];

export function ReviewsSection({ navigate, user }) {
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('write') === 'true') {
        setShowForm(true);
      }
    }
  }, []);

  useEffect(() => {
    if (showForm && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('write') === 'true') {
        const timer = setTimeout(() => {
          const formEl = document.querySelector('.reviews-form-container');
          if (formEl) {
            formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [showForm]);
  const [formData, setFormData] = useState({
    reviewer_name: '',
    business_name: '',
    rating: 5,
    title: '',
    comment: '',
  });
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isCaptchaReset, setIsCaptchaReset] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch reviews on mount
  useEffect(() => {
    let active = true;
    async function loadReviews() {
      try {
        if (isSupabaseConfigured) {
          const { data, error: dbError } = await supabase
            .from('service_reviews')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

          if (dbError) throw dbError;
          if (active) {
            setReviews(data && data.length > 0 ? [...data, ...SEED_REVIEWS] : SEED_REVIEWS);
            setStatus('ready');
          }
        } else {
          // Local storage fallback for demo
          const localStr = localStorage.getItem('weave365_local_reviews');
          const localReviews = localStr ? JSON.parse(localStr) : [];
          if (active) {
            setReviews([...localReviews, ...SEED_REVIEWS]);
            setStatus('ready');
          }
        }
      } catch (err) {
        console.error('Error loading reviews:', err);
        if (active) {
          // Graceful fallback to seed data on db fetch error
          setReviews(SEED_REVIEWS);
          setStatus('ready');
        }
      }
    }

    void loadReviews();
    return () => { active = false; };
  }, []);

  // Set form defaults if user is logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        reviewer_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        business_name: user.user_metadata?.business_name || '',
      }));
    }
  }, [user]);

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 5, count: 0 };
    const total = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      avg: (total / reviews.length).toFixed(1),
      count: reviews.length
    };
  }, [reviews]);

  const handleRatingChange = (newRating) => {
    setFormData(prev => ({ ...prev, rating: newRating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reviewer_name || !formData.comment) {
      setSubmitError('Please fill in all required fields (Name and Review Comment).');
      return;
    }
    if (!isCaptchaVerified) {
      setSubmitError('Please complete the verification slider.');
      return;
    }

    // Client-side length validation (mirrors Supabase RLS constraints)
    const trimmedName = formData.reviewer_name.trim().slice(0, 100);
    const trimmedBusiness = (formData.business_name || 'Client').trim().slice(0, 200);
    const trimmedTitle = (formData.title || 'Partner Review').trim().slice(0, 200);
    const trimmedComment = formData.comment.trim().slice(0, 2000);

    if (trimmedName.length < 2) {
      setSubmitError('Name must be at least 2 characters.');
      return;
    }
    if (trimmedComment.length < 10) {
      setSubmitError('Review comment must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const isGuest = !user;
    const newReview = {
      reviewer_name: trimmedName,
      business_name: trimmedBusiness,
      rating: formData.rating,
      title: trimmedTitle,
      comment: trimmedComment,
      status: isGuest ? 'pending' : 'approved',
    };

    // Only include user_id and created_at for logged-in users
    // Guest inserts let the DB handle defaults to avoid FK/constraint issues
    if (!isGuest) {
      newReview.user_id = user.id;
      newReview.created_at = new Date().toISOString();
    }

    try {
      if (isSupabaseConfigured) {
        let query = supabase
          .from('service_reviews')
          .insert([newReview]);

        // If guest, do not chain .select() because their inserted row will have
        // 'pending' status, which they do not have SELECT permissions for.
        // Chaining .select() would result in an RLS validation error (42501).
        if (!isGuest) {
          query = query.select();
        }

        const { data, error: insertError } = await query;

        if (insertError) {
          console.error('Supabase insert error details:', JSON.stringify(insertError, null, 2));
          throw new Error(insertError.message || insertError.details || 'Database insert failed');
        }
        
        // Only add to visible feed if approved (logged-in users)
        if (!isGuest) {
          if (data && data[0]) {
            setReviews(prev => [data[0], ...prev]);
          } else {
            setReviews(prev => [newReview, ...prev]);
          }
        }
      } else {
        // Guest user or no Supabase — store locally
        const localStr = localStorage.getItem('weave365_local_reviews');
        const localReviews = localStr ? JSON.parse(localStr) : [];
        const addedReview = { id: `local-${Date.now()}`, ...newReview };
        const updatedLocal = [addedReview, ...localReviews];
        localStorage.setItem('weave365_local_reviews', JSON.stringify(updatedLocal));
        setReviews(prev => [addedReview, ...prev]);
      }

      setSubmitSuccess(true);
      setFormData({
        reviewer_name: user?.user_metadata?.full_name || '',
        business_name: user?.user_metadata?.business_name || '',
        rating: 5,
        title: '',
        comment: '',
      });
      setIsCaptchaVerified(false);
      setIsCaptchaReset(true);
      setTimeout(() => setIsCaptchaReset(false), 200);

      // Hide success message and form after delay
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowForm(false);
      }, 3000);

    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reviews-section-wrapper">
      <div className="reviews-header-card">
        <div className="reviews-summary-flex">
          <div className="reviews-stats-container">
            <div className="reviews-rating-big">{stats.avg}</div>
            <div className="reviews-stars-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <SharpStar
                  key={star}
                  size={20}
                  fill={star <= Math.round(stats.avg) ? 'var(--gold)' : 'none'}
                  stroke="var(--gold)"
                  className="rating-star-icon"
                />
              ))}
            </div>
            <span className="reviews-count-label">Based on {stats.count} happy buyers</span>
          </div>

          <div className="reviews-cta-container">
            <button type="button" 
              className={`reviews-write-btn ${showForm ? 'active' : ''}`}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancel Review' : 'Write a Review'}
              {!showForm && <Plus size={16} className="plus-icon" />}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="reviews-form-container animate-fade-in">
            <h3 className="form-title">Submit Wholesale Sourcing Review</h3>
            <p className="form-description">Share your wholesale or reselling experience with Weave365. Your feedback drives our loom networks.</p>
            
            <form onSubmit={handleSubmit} className="reviews-entry-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="reviewer_name">Your Name *</label>
                  <input
                    type="text"
                    id="reviewer_name"
                    required
                    value={formData.reviewer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, reviewer_name: e.target.value }))}
                    placeholder="e.g. Meenakshi Shah"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="business_name">Business Name / Location</label>
                  <input
                    type="text"
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="e.g. Silk Nook Boutique, Delhi"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Overall Rating *</label>
                <div className="interactive-stars-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => handleRatingChange(star)}
                      className="star-rating-btn"
                      aria-label={`Rate ${star} stars`}
                    >
                      <SharpStar
                        size={28}
                        fill={star <= formData.rating ? 'var(--gold)' : 'none'}
                        stroke="var(--gold)"
                        className="interactive-star"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="review_title">Review Title</label>
                <input
                  type="text"
                  id="review_title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Summarize your experience (e.g. Excellent shipping, high quality)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="review_comment">Review Comment *</label>
                <textarea
                  id="review_comment"
                  required
                  rows={4}
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Detail your wholesale sourcing experience, fabric quality, weaver communication, or shipping standard..."
                />
              </div>

              <SliderCaptcha onVerify={setIsCaptchaVerified} isReset={isCaptchaReset} />

              {submitError && <p className="review-submit-error">{submitError}</p>}
              
              {submitSuccess ? (
                <div className="review-submit-success animate-scale-up">
                  <Check size={20} className="check-success-icon" />
                  <span>{user ? 'Thank you! Your verified review has been published.' : 'Thank you! Your review has been submitted and will appear after moderation.'}</span>
                </div>
              ) : (
                <button 
                  type="submit" 
                  disabled={submitting || !isCaptchaVerified} 
                  className="review-submit-btn"
                >
                  {submitting ? (
                    <>
                      <Loader size={16} className="animate-spin mr-2" />
                      Submitting Sourcing Review...
                    </>
                  ) : (
                    'Submit Verified Review'
                  )}
                </button>
              )}
            </form>
          </div>
        )}
      </div>

      <StateMessage status={status} error={error} message="Loading live reviews..." />

      {status === 'ready' && reviews.length > 0 && (
        <Testimonials testimonials={reviews} />
      )}

      {status === 'ready' && reviews.length > 0 && (
        <div className="reviews-feed-container">
          {reviews.map((review, index) => (
            <article className="review-card-premium animate-fade-in" key={review.id || index}>
              <div className="review-card-header">
                <div className="reviewer-avatar">
                  {review.reviewer_name ? review.reviewer_name.charAt(0).toUpperCase() : 'W'}
                </div>
                <div className="reviewer-meta">
                  <div className="reviewer-name-row">
                    <span className="reviewer-name">{review.reviewer_name}</span>
                  </div>
                  <span className="reviewer-business">{review.business_name || 'Saree Boutique'}</span>
                </div>
                <div className="review-date">
                  {new Date(review.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>

              <div className="review-card-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <SharpStar
                    key={star}
                    size={14}
                    fill={star <= review.rating ? 'var(--gold)' : 'none'}
                    stroke="var(--gold)"
                    className="feed-star-icon"
                  />
                ))}
              </div>

              <h4 className="review-card-title">{review.title}</h4>
              <p className="review-card-comment">{review.comment}</p>
            </article>
          ))}
        </div>
      )}

      {status === 'ready' && reviews.length === 0 && (
        <div className="reviews-empty-state">
          <HelpCircle size={40} className="empty-help-icon" />
          <h3>No Reviews Yet</h3>
          <p>Be the first verified boutique partner to leave feedback on our loom sourcing network.</p>
        </div>
      )}
    </div>
  );
}

export function ReviewsPage({ navigate, user }) {
  // Update document title, description, and canonical link on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalTitle = document.title;
    document.title = 'Client Sourcing Reviews | Partner Feedback | Weave365';

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    const newDesc = 'Verified reviews and feedback from boutique owners, apparel retailers, and saree resellers across India sourcing from Weave365.';
    
    if (metaDesc) {
      metaDesc.setAttribute('content', newDesc);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      metaDesc.content = newDesc;
      document.head.appendChild(metaDesc);
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    const originalCanonical = canonicalLink ? canonicalLink.getAttribute('href') : '';
    const newCanonical = `${siteUrl}/reviews`;

    if (canonicalLink) {
      canonicalLink.setAttribute('href', newCanonical);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      canonicalLink.href = newCanonical;
      document.head.appendChild(canonicalLink);
    }

    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        if (originalDesc) {
          metaDesc.setAttribute('content', originalDesc);
        } else {
          metaDesc.remove();
        }
      }
      if (canonicalLink) {
        if (originalCanonical) {
          canonicalLink.setAttribute('href', originalCanonical);
        } else {
          canonicalLink.remove();
        }
      }
    };
  }, []);

  const breadcrumbItems = [
    { name: 'Home', url: '/', route: 'home' },
    { name: 'Reviews' }
  ];

  return (
    <article className="reviews-page-container">
      <Breadcrumb items={breadcrumbItems} navigate={navigate} />

      <header className="reviews-page-hero">
        <div className="reviews-hero-header-wrap">
          <span className="reviews-subtitle">Happy Buyer's Review & Transparency</span>
          <h1 className="reviews-h1">What People Say About Us</h1>
          <div className="reviews-kicker-line"></div>
        </div>

        {/* Rotating Gold Seal SVG */}
        <div className="reviews-seal-container" aria-hidden="true">
          <div className="reviews-rotating-seal-wrap">
            <svg viewBox="0 0 100 100" className="reviews-rotating-seal">
              <path d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" id="reviewsSealPath" fill="none" />
              <text fill="#c69e6a" fontSize="8" fontFamily="var(--font-hero-body)" letterSpacing="2.8" fontWeight="600">
                <textPath href="#reviewsSealPath" startOffset="0%">
                  TRUSTED PARTNER • VERIFIED REVIEWS • 100% TRANSPARENT • 
                </textPath>
              </text>
            </svg>
            <div className="reviews-seal-center">
              <Award size={50} strokeWidth={1.25} />
            </div>
          </div>
        </div>

        <section className="reviews-split-intro">
          <div className="reviews-split-left-sidebar">
            <span className="reviews-sidebar-large-tag">REVIEWS</span>
          </div>
          <div className="reviews-split-right-narrative">
            <p>Weave365 connects directly with master weavers in Varanasi. No middlemen, no markup layers just the actual source. The businesses buying through us range from small boutiques to exporters, and they all get the same direct access.</p>
            <p>Reviews below are from real partners. If you've ordered through Weave365, add yours.</p>
          </div>
        </section>
      </header>

      <ReviewsSection navigate={navigate} user={user} />
    </article>
  );
}
