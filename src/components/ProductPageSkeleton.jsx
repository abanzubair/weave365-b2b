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

          {/* Product Meta Header */}
          <div className="product-meta-header" style={{ marginBottom: '14px' }}>
            <div className="skeleton-code skeleton-shimmer" style={{ height: '26px', width: '120px', borderRadius: '6px', margin: 0 }}></div>
            <div className="skeleton-status-badge skeleton-shimmer" style={{ height: '26px', width: '90px', borderRadius: '6px', margin: 0 }}></div>
          </div>

          {/* B2B Price Box */}
          <div className="b2b-pricing-grid" style={{ marginBottom: '14px' }}>
            <div className="b2b-price-card skeleton-shimmer" style={{ height: '90px', border: 'none' }}></div>
            <div className="b2b-price-card skeleton-shimmer" style={{ height: '90px', border: 'none' }}></div>
          </div>

          {/* Logistics Strip */}
          <div className="product-logistics-info" style={{ marginBottom: '16px' }}>
            <div className="skeleton-disclaimer skeleton-shimmer" style={{ width: '220px', height: '16px', borderRadius: '4px', marginBottom: '8px' }}></div>
            <div className="skeleton-disclaimer skeleton-shimmer" style={{ width: '300px', height: '16px', borderRadius: '4px' }}></div>
          </div>

          {/* Product Specs List */}
          <div className="product-specs-list" style={{ marginBottom: '18px', gap: '16px' }}>
            <div className="skeleton-fact-row skeleton-shimmer" style={{ width: '140px', height: '18px' }}></div>
            <div className="skeleton-fact-row skeleton-shimmer" style={{ width: '160px', height: '18px' }}></div>
            <div className="skeleton-fact-row skeleton-shimmer" style={{ width: '150px', height: '18px' }}></div>
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
