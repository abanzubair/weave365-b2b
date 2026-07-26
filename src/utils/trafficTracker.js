/**
 * @file trafficTracker.js
 * Client-side non-blocking traffic tracker.
 * Features:
 * - Session-Deduplicated per browsing session
 * - Universally compatible with Mobile iOS, Android, and in-app webviews
 * - Completely silent and crash-proof
 */

let isTrackedInSession = false;

export function trackSiteTraffic() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Session Deduplication Check (Logs 1 visit per browsing session)
    const sessionKey = 'weave_analytics_session_active';
    if (sessionStorage.getItem(sessionKey) || isTrackedInSession) {
      return;
    }

    isTrackedInSession = true;
    sessionStorage.setItem(sessionKey, '1');

    // 2. Generate or retrieve lightweight session identifier
    let sessionId = sessionStorage.getItem('weave_analytics_sid');
    if (!sessionId) {
      sessionId = 's_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      sessionStorage.setItem('weave_analytics_sid', sessionId);
    }

    const payload = JSON.stringify({
      path: window.location.pathname || '/',
      referrer: document.referrer || '',
      userAgent: navigator.userAgent || '',
      sessionId: sessionId
    });

    // 3. Reliable fetch with keepalive: true (Works across mobile Safari, Chrome, and In-App browsers)
    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => {});
  } catch (err) {
    // Fail silently so user experience is never impacted
    console.warn('[Analytics Tracker] Silent warning:', err);
  }
}
