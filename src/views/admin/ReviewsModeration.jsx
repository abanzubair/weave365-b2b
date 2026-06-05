import React from 'react';
import { Clock, Check, Eye, RefreshCw, MessageSquareText, ThumbsUp, Trash2 } from 'lucide-react';
import { SharpStar } from '../ReviewsPage.jsx';

export function ReviewsModeration({ reviewsFilter, setReviewsFilter, allSiteReviews, reviewsLoading, reviewsError, loadSiteReviews, reviewActionLoading, handleReviewAction }) {
  return (
        <div className="admin-reviews-tab">
          <div className="admin-section-header" style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontFamily: 'var(--font-heading)', fontWeight: 500, color: 'var(--ink)' }}>Guest Review Moderation</h2>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
              Approve or remove guest-submitted reviews. Logged-in user reviews are auto-approved.
            </p>
          </div>

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            {['pending', 'approved', 'all'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setReviewsFilter(f)}
                className={`admin-tab-btn ${reviewsFilter === f ? 'active' : ''}`}
                style={{ padding: '6px 16px', fontSize: '12px', textTransform: 'capitalize' }}
              >
                {f === 'pending' && <Clock size={14} />}
                {f === 'approved' && <Check size={14} />}
                {f === 'all' && <Eye size={14} />}
                {f} ({f === 'all' ? allSiteReviews.length : allSiteReviews.filter(r => r.status === f).length})
              </button>
            ))}
            <button
              type="button"
              onClick={() => loadSiteReviews()}
              className="admin-tab-btn"
              style={{ marginLeft: 'auto', padding: '6px 16px', fontSize: '12px' }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {reviewsError && (
            <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '6px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
              {reviewsError}
            </div>
          )}

          {reviewsLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
              <RefreshCw size={28} className="spin" style={{ marginBottom: '12px' }} />
              <p>Loading reviews...</p>
            </div>
          ) : (() => {
            const filtered = reviewsFilter === 'all' ? allSiteReviews : allSiteReviews.filter(r => r.status === reviewsFilter);
            if (filtered.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
                  <MessageSquareText size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <p style={{ fontSize: '14px' }}>No {reviewsFilter === 'all' ? '' : reviewsFilter} reviews found.</p>
                </div>
              );
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.map(review => (
                  <article
                    key={review.id}
                    style={{
                      background: 'var(--paper, #fff)',
                      border: '1px solid var(--line, #eadbc8)',
                      borderRadius: '8px',
                      padding: '20px 24px',
                      borderLeft: review.status === 'pending' ? '3px solid #f59e0b' : review.status === 'approved' ? '3px solid #22c55e' : '3px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <strong style={{ fontSize: '15px', color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>{review.reviewer_name}</strong>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            padding: '2px 8px',
                            borderRadius: '3px',
                            background: review.status === 'pending' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
                            color: review.status === 'pending' ? '#b45309' : '#15803d',
                            fontFamily: 'var(--font-ui)',
                          }}>{review.status}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', fontFamily: 'var(--font-body)' }}>
                          {review.business_name || 'No business name'} · {new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                          {!review.user_id && <span style={{ marginLeft: '8px', fontSize: '10px', padding: '1px 6px', background: 'rgba(99,102,241,0.1)', color: '#4f46e5', borderRadius: '3px' }}>Guest</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
                          {[1,2,3,4,5].map(s => (
                            <SharpStar key={s} size={14} fill={s <= review.rating ? '#c69e6a' : 'none'} stroke="#c69e6a" />
                          ))}
                        </div>
                        {review.title && <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>{review.title}</div>}
                        <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)', margin: 0, opacity: 0.85 }}>{review.comment}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {review.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleReviewAction(review.id, 'approve')}
                            disabled={reviewActionLoading === review.id}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '7px 14px', fontSize: '12px', fontWeight: 600,
                              background: '#22c55e', color: '#fff', border: 'none',
                              borderRadius: '5px', cursor: 'pointer', fontFamily: 'var(--font-ui)',
                              opacity: reviewActionLoading === review.id ? 0.5 : 1,
                            }}
                          >
                            <ThumbsUp size={14} /> Approve
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { if (window.confirm(`Delete review by "${review.reviewer_name}"?`)) handleReviewAction(review.id, 'delete'); }}
                          disabled={reviewActionLoading === review.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '7px 14px', fontSize: '12px', fontWeight: 600,
                            background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)',
                            borderRadius: '5px', cursor: 'pointer', fontFamily: 'var(--font-ui)',
                            opacity: reviewActionLoading === review.id ? 0.5 : 1,
                          }}
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
