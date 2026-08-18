import React from 'react';
import '../styles/productSkeleton.css';

export default function ProductPageSkeleton() {
  return (
    <div className="product-view product-skeleton" aria-hidden="true">
      {/* Breadcrumbs Skeleton */}
      <div className="skeleton-breadcrumb">
        <div className="skeleton-breadcrumb-item skeleton-shimmer"></div>
        <div className="skeleton-breadcrumb-item skeleton-shimmer"></div>
        <div className="skeleton-breadcrumb-item skeleton-shimmer"></div>
      </div>

      {/* Main Grid */}
      <div className="product-hero-grid">
        
        {/* Left Column: Media */}
        <div className="product-media">
          <div className="vertical-thumbs">
            {[1, 2, 3, 4].map((i) => (
              <button key={i} className="skeleton-thumb skeleton-shimmer" type="button"></button>
            ))}
          </div>
          
          <div className="catalog-main-image skeleton-main-image skeleton-shimmer"></div>
          
          {/* Product Specifications Card */}
          <div className="product-specs-card">
            <div className="specs-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="spec-item">
                  <div className="skeleton-spec-label skeleton-shimmer"></div>
                  <div className="skeleton-spec-value skeleton-shimmer"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Info Panel */}
        <div className="product-info-panel">
          {/* Status Badges */}
          <div className="panel-status-tags">
            <div className="skeleton-status-badge skeleton-shimmer"></div>
            <div className="skeleton-status-badge skeleton-shimmer"></div>
          </div>

          {/* Title */}
          <h1 className="product-title-serif skeleton-title skeleton-shimmer" style={{ border: 'none' }}></h1>
          
          {/* Partner Badge */}
          <div className="trusted-partner-card-v2 skeleton-partner-card skeleton-shimmer"></div>

          {/* Product Code */}
          <div className="product-code-new skeleton-code skeleton-shimmer"></div>

          {/* Price Block */}
          <div className="price-moq-row skeleton-price-box skeleton-shimmer"></div>

          {/* GST Disclaimer */}
          <div className="skeleton-disclaimer skeleton-shimmer"></div>



          {/* Quick Facts */}
          <div className="quick-facts">
            <div className="skeleton-fact-row skeleton-shimmer" style={{ width: '220px' }}></div>
            <div className="skeleton-fact-row skeleton-shimmer" style={{ width: '240px' }}></div>
            <div className="skeleton-fact-row skeleton-shimmer" style={{ width: '200px' }}></div>
          </div>

          {/* Variations Swatches Card */}
          <div className="product-variation-card">
            <div className="variation-card-head">
              <div className="skeleton-variation-title skeleton-shimmer"></div>
              <div className="skeleton-variation-link skeleton-shimmer"></div>
            </div>
            <div className="skeleton-disclaimer skeleton-shimmer" style={{ width: '120px', marginBottom: '16px' }}></div>
            <div className="color-swatch-row">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} className="skeleton-swatch skeleton-shimmer" type="button"></button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="product-secondary-actions">
            <button className="secondary-action-btn skeleton-action-btn skeleton-shimmer" type="button"></button>
            <button className="secondary-action-btn skeleton-action-btn skeleton-shimmer" type="button"></button>
          </div>
        </div>
      </div>

      {/* Related Products Rail */}
      <section className="you-may-like home-product-section">
        <div className="skeleton-related-title skeleton-shimmer"></div>
        <div className="scroll-wrapper">
          <div className="product-row scrollable-row">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-product-card">
                <div className="skeleton-card-media skeleton-shimmer"></div>
                <div className="skeleton-card-title skeleton-shimmer"></div>
                <div className="skeleton-card-price skeleton-shimmer"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
