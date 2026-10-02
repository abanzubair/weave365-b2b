/**
 * @file acquisitionResolver.js
 * Resolves, correlates, and formats marketing acquisition attribution for any buyer profile.
 * 
 * Works for:
 * 1. New users who have attribution saved in profile or user_metadata.
 * 2. Existing users (retroactive) by correlating their registration time with site_analytics logs.
 */

import { classifyTraffic } from './universalClassifier.js';

// City neighbor mappings for telecom / ISP routing hubs in India
const REGION_PROXIMITY_MAP = {
  'rudrapur': ['haldwani', 'pantnagar', 'kashipur', 'nainital', 'bareilly', 'uttarakhand', 'uk'],
  'haldwani': ['rudrapur', 'pantnagar', 'kashipur', 'nainital'],
  'gurgaon': ['gurugram', 'delhi', 'new delhi', 'noida', 'faridabad', 'haryana'],
  'noida': ['greater noida', 'delhi', 'new delhi', 'ghaziabad', 'uttar pradesh', 'up'],
  'hosur': ['bengaluru', 'bangalore', 'tamil nadu'],
  'secunderabad': ['hyderabad', 'telangana'],
  'howrah': ['kolkata', 'west bengal'],
  'navi mumbai': ['mumbai', 'thane', 'maharashtra'],
};

/**
 * Resolves the acquisition attribution for a buyer profile.
 * 
 * @param {Object} profile - Buyer profile record from profiles table
 * @param {Array} [siteAnalyticsList=[]] - Optional list of site_analytics rows
 * @returns {Object} Standardized acquisition attribution record
 */
export function resolveBuyerAcquisition(profile, siteAnalyticsList = []) {
  if (!profile) return null;

  // 1. Direct saved attribution on profile
  let rawAcquisition = profile.acquisition;
  if (typeof rawAcquisition === 'string') {
    try {
      rawAcquisition = JSON.parse(rawAcquisition);
    } catch {
      rawAcquisition = null;
    }
  }

  if (rawAcquisition && rawAcquisition.name) {
    return enrichAttribution(rawAcquisition, profile);
  }

  // 2. Dynamic Correlation against historical site_analytics
  if (profile.created_at && Array.isArray(siteAnalyticsList) && siteAnalyticsList.length > 0) {
    const regTimeMs = new Date(profile.created_at).getTime();
    if (!Number.isNaN(regTimeMs)) {
      const WINDOW_MS = 60 * 60 * 1000; // 60-minute window prior to registration
      const candidateVisits = siteAnalyticsList.filter(visit => {
        if (!visit.created_at) return false;
        const vTimeMs = new Date(visit.created_at).getTime();
        return vTimeMs <= (regTimeMs + 2 * 60 * 1000) && vTimeMs >= (regTimeMs - WINDOW_MS);
      });

      if (candidateVisits.length > 0) {
        const userCity = String(profile.city || '').toLowerCase().trim();
        const neighborCities = REGION_PROXIMITY_MAP[userCity] || [];

        // Score candidates based on location match and proximity to registration
        let bestMatch = null;
        let highestScore = -1;

        candidateVisits.forEach(v => {
          let score = 0;
          const visitCity = String(v.city || '').toLowerCase().trim();

          if (userCity && visitCity) {
            if (userCity === visitCity) score += 50;
            else if (neighborCities.some(nc => visitCity.includes(nc) || nc.includes(visitCity))) score += 40;
            else if (userCity.includes(visitCity) || visitCity.includes(userCity)) score += 30;
          }

          // Bonus for non-admin landing pages that lead to conversion
          const p = String(v.path || '').toLowerCase();
          if (p.includes('dropshipping') || p.includes('resell') || p.includes('signup') || p.includes('custom-weav')) {
            score += 20;
          }

          // Bonus for proximity in time
          const vTimeMs = new Date(v.created_at).getTime();
          const timeDiffMinutes = Math.abs(regTimeMs - vTimeMs) / (60 * 1000);
          if (timeDiffMinutes <= 5) score += 25;
          else if (timeDiffMinutes <= 15) score += 15;
          else if (timeDiffMinutes <= 30) score += 5;

          if (score > highestScore) {
            highestScore = score;
            bestMatch = v;
          }
        });

        // Accept best match if score meets threshold or it's the sole visit in the window
        if (bestMatch && (highestScore >= 25 || candidateVisits.length === 1)) {
          const reclassified = classifyTraffic({
            referrer: bestMatch.referrer || '',
            searchParams: '',
            fullUrl: '',
            userAgent: '',
            path: bestMatch.path || '/'
          });

          // If the database already had a classified source_name, respect it
          if (bestMatch.source_name && bestMatch.source_name !== 'Direct Visit') {
            reclassified.name = bestMatch.source_name;
            reclassified.category = bestMatch.source_category || reclassified.category;
            reclassified.type = bestMatch.source_category?.toLowerCase().includes('ai')
              ? 'ai'
              : bestMatch.source_category?.toLowerCase().includes('search')
              ? 'search'
              : bestMatch.source_category?.toLowerCase().includes('social')
              ? 'social'
              : reclassified.type;
          }

          return enrichAttribution({
            ...reclassified,
            referrer: bestMatch.referrer,
            landing_path: bestMatch.path || '/',
            city: bestMatch.city,
            timestamp: bestMatch.created_at,
            matched_via_correlation: true
          }, profile);
        }
      }
    }
  }

  // 3. Fallback for unlinked accounts
  return enrichAttribution({
    category: 'Direct / App',
    name: 'Direct / Existing Account',
    brand: 'Direct',
    type: 'direct',
    landing_path: '/',
    inferred_intent: 'Registered directly or via existing user account',
    is_fallback: true
  }, profile);
}

/**
 * Enriches the attribution object with UI helpers, badge classes, icons, and detailed tooltips.
 */
function enrichAttribution(attr, profile) {
  const type = attr.type || (
    attr.category?.toLowerCase().includes('ai') ? 'ai' :
    attr.category?.toLowerCase().includes('search') ? 'search' :
    attr.category?.toLowerCase().includes('social') ? 'social' :
    attr.category?.toLowerCase().includes('referral') ? 'referral' : 'direct'
  );

  let icon = '🧭';
  let badgeClass = 'badge-attr-direct';

  if (type === 'ai') {
    icon = '🤖';
    badgeClass = 'badge-attr-ai';
  } else if (type === 'search') {
    icon = '🔍';
    badgeClass = 'badge-attr-search';
  } else if (type === 'social') {
    icon = '📱';
    badgeClass = 'badge-attr-social';
  } else if (type === 'referral') {
    icon = '🌐';
    badgeClass = 'badge-attr-referral';
  }

  const landingPath = attr.landing_path || '/';
  const cleanName = attr.name || 'Direct Visit';

  // Construct comprehensive narrative
  let narrative = attr.inferred_intent || '';
  if (!narrative || narrative.includes('Direct visit to /')) {
    if (type === 'ai') {
      narrative = `Referred by ${cleanName} · Landed on ${landingPath}`;
    } else if (type === 'search') {
      narrative = `Found via ${cleanName} · Landed on ${landingPath}`;
    } else if (type === 'social') {
      narrative = `Arrived via ${cleanName} · Landed on ${landingPath}`;
    } else if (landingPath !== '/') {
      narrative = `Direct arrival on ${landingPath} (external app/chat link)`;
    } else {
      narrative = `Direct arrival on homepage`;
    }
  }

  return {
    ...attr,
    type,
    icon,
    badgeClass,
    cleanName,
    landingPath,
    narrative,
    tooltip: `${cleanName} → ${landingPath}\n${narrative}${attr.referrer ? `\nReferrer: ${attr.referrer}` : ''}`
  };
}
