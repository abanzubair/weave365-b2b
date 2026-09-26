import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, ArrowRight } from './icons.jsx';
import { AppLink } from './AppLink.jsx';
import { getOptimizedImageUrl, getImageSrcSet, getOriginalImageUrl } from '../utils/imageOptimizer.js';
import '../styles/homeBlog.css';

export function HomeBlogSection({ blogs = [], navigate, scrollProductRail, isMounted }) {
  return (
    <section className="home-blog-section">
      <div className="home-blog-header">
        <div className="home-blog-header-left">
          <h2>Insights from Banaras Looms</h2>
        </div>
        <div className="home-blog-header-right">
          <AppLink
            to="blog"
            className="blog-filter-btn active"
            navigate={navigate}
          >
            <span>Read All Insights</span>
            <ArrowRight size={15} />
          </AppLink>
        </div>
      </div>

      <div className="scroll-wrapper blog-scroll-wrapper">
        <button
          type="button"
          className="scroll-arrow left blog-scroll-arrow"
          onClick={() => scrollProductRail('home-blog-row', -1)}
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="home-blog-grid" id="home-blog-row">
          {isMounted && blogs.slice(0, 4).map((post) => (
            <AppLink
              key={post.slug}
              to="blog"
              productId={post.slug}
              className="blog-card"
              navigate={navigate}
              style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
            >
              <div className="card-img-wrapper">
                <img
                  src={getOptimizedImageUrl(post.image, 'card')}
                  srcSet={getImageSrcSet(post.image, ['card', 'listing'])}
                  sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 380px"
                  alt={post.title}
                  loading="lazy"
                  decoding="async"
                  width={382}
                  height={200}
                  onError={(e) => {
                    const fallback = getOriginalImageUrl(post.image);
                    if (fallback && e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                      e.currentTarget.removeAttribute('srcset');
                    }
                  }}
                />
                <span className="card-category-badge">{post.category}</span>
              </div>
              <div className="card-info-pane">
                <div className="post-meta-strip">
                  <span className="post-meta-item">
                    <Calendar size={12} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} /> {post.date}
                  </span>
                  <span className="meta-divider"></span>
                  <span className="post-meta-item">
                    <Clock size={12} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} /> {post.readTime}
                  </span>
                </div>
                <h3 style={{ fontSize: 'var(--h5-size)', fontWeight: 600, minHeight: '3.4rem' }}>{post.title}</h3>
                <p style={{ fontSize: 'var(--body-size)', fontWeight: 400 }}>{post.intro}</p>
                <span
                  className="read-more-link"
                  style={{ marginTop: 'auto', fontSize: 'var(--small-size)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Read Guide <ArrowRight size={14} />
                </span>
              </div>
            </AppLink>
          ))}
        </div>

        <button
          type="button"
          className="scroll-arrow right blog-scroll-arrow"
          onClick={() => scrollProductRail('home-blog-row', 1)}
          aria-label="Scroll right"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </section>
  );
}
