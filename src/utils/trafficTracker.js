/**
 * @file trafficTracker.js
 * Client-side non-blocking universal traffic tracker and acquisition persistence.
 * Features:
 * - Excludes /admin pages, localhost, and local dev network visits
 * - Universally classifies traffic (AI assistants, search, social, direct deep-links)
 * - Captures and preserves first-touch & last-touch attribution in localStorage (survives OAuth redirects)
 * - Exposes helper getStoredAttribution() for profile sync / signup forms
 * - Universally compatible with Mobile iOS, Android, and in-app webviews
 * - Completely silent and crash-proof
 */

import { classifyTraffic } from './universalClassifier.js';

let isTrackedInCurrentNav = false;

/**
 * Retrieves the stored visitor acquisition attribution (first-touch preferred, fallback to last-touch).
 * @returns {Object|null} The stored attribution object or null
 */
export function getStoredAttribution() {
  if (typeof window === 'undefined') return null;
  try {
    const firstTouch = localStorage.getItem('weave_first_touch_attribution');
    if (firstTouch) return JSON.parse(firstTouch);

    const lastTouch = localStorage.getItem('weave_last_touch_attribution');
    if (lastTouch) return JSON.parse(lastTouch);

    const sessionAttr = sessionStorage.getItem('weave_session_attribution');
    if (sessionAttr) return JSON.parse(sessionAttr);
  } catch (e) {
    console.warn('[Traffic Tracker] Error reading stored attribution:', e);
  }
  return null;
}

/**
 * Core tracker: fires on initial page mount and route transitions.
 */
export function trackSiteTraffic() {
  if (typeof window === 'undefined') return;

  try {
    // 0a. Exclude admin panel pages (/admin)
    const pathname = (window.location.pathname || '').toLowerCase();
    if (pathname.startsWith('/admin') || pathname.includes('/admin')) {
      return;
    }

    // 0b. Ignore local development environments (localhost, 127.0.0.1, local IP ranges)
    const hostname = (window.location.hostname || '').toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.endsWith('.local')
    ) {
      return;
    }

    // 1. Session & Navigation Deduplication
    // Check if new external referrer or campaign query parameter arrived
    const search = window.location.search || '';
    const referrer = document.referrer || '';
    const isExternalReferrer = referrer && !referrer.includes(window.location.hostname);
    const hasCampaignParams = /[?&](utm_|ref|source|via|origin|gclid|fbclid)/i.test(search);

    const sessionKey = 'weave_analytics_session_active';
    const isFirstInSession = !sessionStorage.getItem(sessionKey);

    // Only track if first visit in session OR new external campaign/referrer arrived
    if (!isFirstInSession && !isExternalReferrer && !hasCampaignParams && isTrackedInCurrentNav) {
      return;
    }

    isTrackedInCurrentNav = true;
    sessionStorage.setItem(sessionKey, '1');

    // 2. Generate or retrieve persistent session identifier
    let sessionId = sessionStorage.getItem('weave_analytics_sid');
    if (!sessionId) {
      sessionId = 's_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      sessionStorage.setItem('weave_analytics_sid', sessionId);
    }

    // 3. Classify traffic universally (client-side)
    const currentPath = window.location.pathname || '/';
    const classified = classifyTraffic({
      referrer,
      searchParams: search,
      fullUrl: window.location.href || '',
      userAgent: navigator.userAgent || '',
      path: currentPath
    });

    const attributionRecord = {
      ...classified,
      session_id: sessionId,
      referrer: referrer || null,
      search_params: search || null,
      timestamp: new Date().toISOString()
    };

    // 4. Persist First-Touch (Never overwritten once set) and Last-Touch (Updated on new visits)
    try {
      if (!localStorage.getItem('weave_first_touch_attribution')) {
        localStorage.setItem('weave_first_touch_attribution', JSON.stringify(attributionRecord));
      }
      localStorage.setItem('weave_last_touch_attribution', JSON.stringify(attributionRecord));
      sessionStorage.setItem('weave_session_attribution', JSON.stringify(attributionRecord));
    } catch {
      // QuotaExceeded or privacy mode
    }

    // 5. Transmit to Edge Analytics Endpoint
    const payload = JSON.stringify({
      path: currentPath,
      referrer: referrer || '',
      searchParams: search,
      fullUrl: window.location.href || '',
      userAgent: navigator.userAgent || '',
      sessionId: sessionId,
      attribution: classified
    });

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
