/**
 * @file trafficTracker.js
 * Client-side non-blocking traffic tracker.
 * Features:
 * - Session-Deduplicated (logs 1 visit per session to prevent DB bloat & cloudflare server burden)
 * - Zero-Latency / Non-Blocking (uses navigator.sendBeacon or async fetch with keepalive: true)
 * - Completely silent and crash-proof
 */

let isTrackedInSession = false;

export function trackSiteTraffic() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Session Deduplication Check (Prevents logging page reloads & avoids server burden)
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

    // 3. Send using SendBeacon (0ms TTFB / zero main thread impact) or fetch keepalive
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics', blob);
    } else {
      void fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  } catch (err) {
    // Fail silently so user experience is never impacted
    console.warn('[Analytics Tracker] Silent warning:', err);
  }
}
