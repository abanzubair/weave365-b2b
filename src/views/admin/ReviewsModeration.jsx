import React from 'react';
import { Clock, Check, Eye, RefreshCw, MessageSquareText, ThumbsUp, Trash2, PhotoIcon } from '../../components/icons.jsx';
import { SharpStar } from '../ReviewsPage.jsx';
import AdminLoadingScreen from './AdminLoadingScreen.jsx';

export function ReviewsModeration({
  reviewsFilter,
  setReviewsFilter,
  reviewsCategory = 'product',
  setReviewsCategory,
  allSiteReviews = [],
  allProductReviews = [],
  reviewsLoading,
  reviewsError,
  loadSiteReviews,
  reviewActionLoading,
  handleReviewAction,
  loading = false,
}) {
  const isProductMode = reviewsCategory === 'product';
  const activeList = isProductMode ? allProductReviews : allSiteReviews;
  const isOverallLoading = reviewsLoading || loading;

  return (
    <div className="admin-reviews-tab">
      <div className="admin-reviews-header">
        <h2 className="admin-reviews-title">Review Moderation Center</h2>
        <p className="admin-reviews-subtitle">
          Moderate verified client sourcing feedback and platform reviews. Approve authentic submissions or remove spam.
        </p>
      </div>

      {/* Category selector */}
      <div style={{ display: 'flex', gap: 'var(--admin-space-2, 8px)', marginBottom: 'var(--admin-space-5, 1.25rem)', borderBottom: '1px solid var(--admin-border, #e2e8f0)', paddingBottom: 'var(--admin-space-3, 0.75rem)' }}>
        <button
          type="button"
          onClick={() => setReviewsCategory && setReviewsCategory('product')}
          className={`admin-review-filter-btn ${isProductMode ? 'active' : ''}`}
          style={{ fontWeight: isProductMode ? 'var(--admin-font-weight-bold, 700)' : 'var(--admin-font-weight-medium, 500)' }}
        >
          <span>👗 Product Sourcing Reviews ({allProductReviews.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setReviewsCategory && setReviewsCategory('service')}
          className={`admin-review-filter-btn ${!isProductMode ? 'active' : ''}`}
          style={{ fontWeight: !isProductMode ? 'var(--admin-font-weight-bold, 700)' : 'var(--admin-font-weight-medium, 500)' }}
        >
          <span>🏢 Platform Service Reviews ({allSiteReviews.length})</span>
        </button>
      </div>

      {/* Status Filter bar */}
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
            <span>{f} ({f === 'all' ? activeList.length : activeList.filter(r => r.status === f).length})</span>
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

      {isOverallLoading ? (
        <AdminLoadingScreen
          title="Loading Customer Reviews..."
          subtitle="Fetching verified product reviews and service testimonials for moderation…"
        />
      ) : (() => {
        const filtered = reviewsFilter === 'all' ? activeList : activeList.filter(r => r.status === reviewsFilter);
        if (filtered.length === 0) {
          return (
            <div className="admin-reviews-empty">
              <MessageSquareText size={36} />
              <p>No {reviewsFilter === 'all' ? '' : reviewsFilter} {isProductMode ? 'product' : 'service'} reviews found.</p>
            </div>
          );
        }
        return (
          <div className="admin-reviews-list">
            {filtered.map(review => {
              const reviewImages = Array.isArray(review.images) ? review.images.filter(Boolean) : [];
              return (
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
                        {review.verified_buyer && (
                          <span className="admin-review-guest-pill" style={{ background: 'var(--admin-accent-subtle, rgba(198, 158, 106, 0.15))', color: 'var(--admin-accent-hover, #8b6534)', borderColor: 'var(--admin-accent-border, var(--admin-accent))' }}>
                            ✓ Verified Buyer
                          </span>
                        )}
                        {isProductMode && review.product_id && (
                          <span style={{ fontSize: 'var(--admin-font-size-12, 0.75rem)', color: 'var(--admin-text-muted, #64748b)', background: 'var(--admin-surface-muted, #f1f5f9)', padding: 'var(--admin-space-1, 2px) var(--admin-space-2, 8px)', borderRadius: 'var(--admin-radius-xs, 4px)', border: '1px solid var(--admin-border, #e2e8f0)' }}>
                            SKU: {review.product_id}
                          </span>
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

                      {/* Attached Customer Photos in Admin */}
                      {reviewImages.length > 0 && (
                        <div style={{ marginTop: 'var(--admin-space-2, 8px)' }}>
                          <span style={{ fontSize: 'var(--admin-font-size-12, 0.75rem)', fontWeight: 'var(--admin-font-weight-semibold, 600)', color: 'var(--admin-text-muted, #64748b)', display: 'inline-flex', alignItems: 'center', gap: 'var(--admin-space-1, 4px)', marginBottom: 'var(--admin-space-1, 6px)' }}>
                            <PhotoIcon size={13} /> {reviewImages.length} Attached Photo{reviewImages.length === 1 ? '' : 's'}:
                          </span>
                          <div style={{ display: 'flex', gap: 'var(--admin-space-2, 8px)', flexWrap: 'wrap' }}>
                            {reviewImages.map((imgUrl, imgIdx) => (
                              <a
                                key={imgIdx}
                                href={imgUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'block', width: 'var(--admin-space-16, 64px)', height: 'var(--admin-space-16, 64px)', borderRadius: 'var(--admin-radius-sm, 6px)', overflow: 'hidden', border: '1px solid var(--admin-border, #e2e8f0)', background: 'var(--admin-surface-muted, #f1f5f9)' }}
                                title="Click to view full image in new tab"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Attached review photo ${imgIdx + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="admin-review-card-actions">
                      {review.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleReviewAction(review.id, 'approve', isProductMode ? 'product' : 'service')}
                          disabled={reviewActionLoading === review.id}
                          className="admin-review-btn-approve"
                        >
                          <ThumbsUp size={14} /> Approve
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete review by "${review.reviewer_name}"?`)) {
                            handleReviewAction(review.id, 'delete', isProductMode ? 'product' : 'service');
                          }
                        }}
                        disabled={reviewActionLoading === review.id}
                        className="admin-review-btn-delete"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
