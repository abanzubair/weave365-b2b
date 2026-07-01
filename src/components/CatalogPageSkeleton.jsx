import React from 'react';

export default function CatalogPageSkeleton({ count = 12, wrap = true }) {
  const cards = Array.from({ length: count }).map((_, index) => (
    <div key={index} className="product-card skeleton-card">
      <div className="card-media skeleton-media"></div>
      <div className="product-card-copy">
        <div className="skeleton-text skeleton-title"></div>
        <div className="card-info-grid">
          <div className="info-left" style={{ border: 'none' }}>
            <div className="skeleton-text skeleton-price"></div>
          </div>
          <div className="info-right"></div>
        </div>
        <div className="card-actions-new">
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    </div>
  ));

  if (wrap) {
    return <div className="catalog-grid" aria-hidden="true">{cards}</div>;
  }
  return <>{cards}</>;
}
