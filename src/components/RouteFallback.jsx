import React from 'react';

export function RouteFallback() {
  return (
    <section className="section" aria-hidden="true" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Page Title Shimmer */}
      <div className="skeleton-text skeleton-title" style={{ width: '40%', height: '32px', marginBottom: '30px' }}></div>
      
      {/* Paragraph Lines Shimmer */}
      <div className="skeleton-text" style={{ width: '100%', height: '16px', marginBottom: '12px' }}></div>
      <div className="skeleton-text" style={{ width: '95%', height: '16px', marginBottom: '12px' }}></div>
      <div className="skeleton-text" style={{ width: '90%', height: '16px', marginBottom: '12px' }}></div>
      <div className="skeleton-text" style={{ width: '40%', height: '16px', marginBottom: '30px' }}></div>

      {/* Subheading Shimmer */}
      <div className="skeleton-text skeleton-title" style={{ width: '25%', height: '24px', marginBottom: '20px' }}></div>

      {/* Paragraph Lines Shimmer */}
      <div className="skeleton-text" style={{ width: '100%', height: '16px', marginBottom: '12px' }}></div>
      <div className="skeleton-text" style={{ width: '85%', height: '16px', marginBottom: '12px' }}></div>
    </section>
  );
}
