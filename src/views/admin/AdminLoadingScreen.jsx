/**
 * @file AdminLoadingScreen.jsx
 * @description Minimal, clean, and modern loading screen for Weave 365 Admin pages.
 * Displays a refined animated SVG spinner, branded emerald accents, crisp typography,
 * and a subtle glowing progress shimmer bar.
 */

import React from 'react';

export default function AdminLoadingScreen({
  title = 'Loading data...',
  subtitle = 'Fetching real-time records from secure database…',
  compact = false,
  minHeight,
  className = '',
  icon: CustomIcon = null,
}) {
  const containerStyle = minHeight
    ? { minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }
    : undefined;

  return (
    <div
      className={`admin-modern-loading-wrap ${compact ? 'compact' : ''} ${className}`}
      style={containerStyle}
      role="status"
      aria-live="polite"
    >
      <div className={`admin-modern-loading-card ${compact ? 'compact' : ''}`}>
        <div className="admin-modern-spinner-container">
          {CustomIcon ? (
            <div className="admin-modern-custom-icon-wrap">
              <CustomIcon size={26} className="admin-modern-custom-icon" />
              <div className="admin-modern-icon-ring" />
            </div>
          ) : (
            <>
              <svg
                className="admin-modern-svg-spinner"
                viewBox="0 0 50 50"
                aria-hidden="true"
              >
                <circle
                  className="admin-modern-track"
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  strokeWidth="3.5"
                />
                <circle
                  className="admin-modern-arc"
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  strokeWidth="3.5"
                  strokeDasharray="95"
                  strokeDashoffset="28"
                  strokeLinecap="round"
                />
              </svg>
            </>
          )}
        </div>

        {title && <h3 className="admin-modern-loading-title">{title}</h3>}
        {subtitle && <p className="admin-modern-loading-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

