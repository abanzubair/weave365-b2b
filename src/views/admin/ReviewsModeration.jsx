import React from 'react';
import { Clock, Check, Eye, RefreshCw, MessageSquareText, ThumbsUp, Trash2 } from 'lucide-react';
import { SharpStar } from '../ReviewsPage.jsx';

export function ReviewsModeration({ reviewsFilter, setReviewsFilter, allSiteReviews, reviewsLoading, reviewsError, loadSiteReviews, reviewActionLoading, handleReviewAction }) {
  return (
    <div className="admin-reviews-tab">
      <div className="admin-reviews-header">
        <h2 className="admin-reviews-title">Guest Review Moderation</h2>
        <p className="admin-reviews-subtitle">
          Approve or remove guest-submitted reviews. Logged-in user reviews are auto-approved.
        </p>
      </div>

      {/* Filter bar */}
      <div className="admin-reviews-filter-bar">
        {['pending', 'approved', 'all'].map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setReviewsFilter(f)}
            className={`admin-review-filter-btn ${reviewsFilter === f ? 'active' : ''}`}
          >
            {f === 'pending' && <Clock size={14} />}
            {f === 'approved' && <Check size={14} />}
            {f === 'all' && <Eye size={14} />}
            <span>{f} ({f === 'all' ? allSiteReviews.length : allSiteReviews.filter(r => r.status === f).length})</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => loadSiteReviews()}
          className="admin-review-refresh-btn"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {reviewsError && (
        <div className="admin-reviews-error">
          {reviewsError}
        </div>
      )}

      {reviewsLoading ? (
        <div className="admin-reviews-loading">
          <RefreshCw size={28} className="spin" />
          <p>Loading reviews...</p>
        </div>
      ) : (() => {
        const filtered = reviewsFilter === 'all' ? allSiteReviews : allSiteReviews.filter(r => r.status === reviewsFilter);
        if (filtered.length === 0) {
          return (
            <div className="admin-reviews-empty">
              <MessageSquareText size={36} />
              <p>No {reviewsFilter === 'all' ? '' : reviewsFilter} reviews found.</p>
            </div>
          );
        }
        return (
          <div className="admin-reviews-list">
            {filtered.map(review => (
              <article
                key={review.id}
                className={`admin-review-card status-border-${review.status}`}
              >
                <div className="admin-review-card-content">
                  <div className="admin-review-card-main">
                    <div className="admin-review-author-row">
                      <strong className="admin-review-author-name">{review.reviewer_name}</strong>
                      <span className={`admin-review-status-badge status-badge-${review.status}`}>
                        {review.status}
                      </span>
                      {!review.user_id && (
                        <span className="admin-review-guest-pill">Guest</span>
                      )}
                    </div>
                    <div className="admin-review-meta">
                      {review.business_name || 'No business name'} · {new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="admin-review-stars">
                      {[1, 2, 3, 4, 5].map(s => (
                        <SharpStar key={s} size={14} fill={s <= review.rating ? '#c69e6a' : 'none'} stroke="#c69e6a" />
                      ))}
                    </div>
                    {review.title && <div className="admin-review-title">{review.title}</div>}
                    <p className="admin-review-comment">{review.comment}</p>
                  </div>
                  <div className="admin-review-card-actions">
                    {review.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleReviewAction(review.id, 'approve')}
                        disabled={reviewActionLoading === review.id}
                        className="admin-review-btn-approve"
                      >
                        <ThumbsUp size={14} /> Approve
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { if (window.confirm(`Delete review by "${review.reviewer_name}"?`)) handleReviewAction(review.id, 'delete'); }}
                      disabled={reviewActionLoading === review.id}
                      className="admin-review-btn-delete"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
