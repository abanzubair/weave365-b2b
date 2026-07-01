/**
 * StateMessage Component
 * Purpose: Provides standardized UX feedback states for loading, errors, or offline status.
 * Used during catalog fetching, API calls, or empty listings across the boutique dashboard.
 */
export function StateMessage({ status, error, message = 'Loading...' }) {
  if (status === 'loading') return <p className="empty-state">{message}</p>;
  if (status === 'error') return <p className="error-state">{error}</p>;
  return null;
}
