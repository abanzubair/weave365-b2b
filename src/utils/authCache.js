/**
 * @file authCache.js
 * @description Fast client-side session and profile cache utilities for instant, zero-latency hydration.
 * Resolves authenticated user state synchronously from localStorage on initial page load / refresh,
 * preventing layout shift and ensuring the user's name displays immediately instead of waiting for
 * asynchronous network roundtrips.
 *
 * @module utils/authCache
 */

export const WEAVE365_USER_CACHE_KEY = 'weave365_cached_user';
export const WEAVE365_PROFILE_CACHE_KEY = 'weave365_cached_buyer_profile';

/**
 * Synchronously retrieves cached user session and buyer profile from localStorage.
 * Checks dedicated keys, legacy keys, and scans for native Supabase auth token.
 * 
 * @returns {{ user: Object|null, buyerProfile: Object|null }}
 */
export function getCachedAuth() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { user: null, buyerProfile: null };
  }

  try {
    let user = null;
    let buyerProfile = null;

    // 1. Check dedicated Weave365 user cache
    const cachedUserRaw = localStorage.getItem(WEAVE365_USER_CACHE_KEY);
    if (cachedUserRaw) {
      try {
        user = JSON.parse(cachedUserRaw);
      } catch (e) {
        console.warn('[authCache] Failed to parse cached user:', e);
      }
    }

    // 2. Check dedicated Weave365 profile cache
    const cachedProfileRaw = localStorage.getItem(WEAVE365_PROFILE_CACHE_KEY);
    if (cachedProfileRaw) {
      try {
        buyerProfile = JSON.parse(cachedProfileRaw);
      } catch (e) {
        console.warn('[authCache] Failed to parse cached profile:', e);
      }
    }



    // 4. Fallback scan for native Supabase session token in localStorage
    if (!user) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.user) {
                user = parsed.user;
                if (!buyerProfile) {
                  buyerProfile = parsed.user.user_metadata?.buyer_profile || parsed.user.buyer_profile || null;
                }
                // Backfill our cache for next instant read
                saveCachedUser(user);
                if (buyerProfile) {
                  saveCachedProfile(buyerProfile);
                }
                break;
              }
            }
          }
        }
      } catch (e) {
        console.warn('[authCache] Error inspecting Supabase session storage:', e);
      }
    }

    // 5. Ensure buyerProfile fallback from user_metadata if available
    if (user && !buyerProfile) {
      buyerProfile = user.user_metadata?.buyer_profile || user.buyer_profile || null;
    }

    return { user, buyerProfile };
  } catch (err) {
    console.warn('[authCache] Unexpected error in getCachedAuth:', err);
    return { user: null, buyerProfile: null };
  }
}

/**
 * Persists user session to fast localStorage cache.
 * @param {Object|null} user 
 */
export function saveCachedUser(user) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(WEAVE365_USER_CACHE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(WEAVE365_USER_CACHE_KEY);
    }
  } catch (e) {
    console.warn('[authCache] saveCachedUser error:', e);
  }
}

/**
 * Persists buyer profile to fast localStorage cache.
 * @param {Object|null} buyerProfile 
 */
export function saveCachedProfile(buyerProfile) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    if (buyerProfile) {
      localStorage.setItem(WEAVE365_PROFILE_CACHE_KEY, JSON.stringify(buyerProfile));
    } else {
      localStorage.removeItem(WEAVE365_PROFILE_CACHE_KEY);
    }
  } catch (e) {
    console.warn('[authCache] saveCachedProfile error:', e);
  }
}

/**
 * Clears all cached authentication and profile data from localStorage.
 */
export function clearCachedAuth() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(WEAVE365_USER_CACHE_KEY);
    localStorage.removeItem(WEAVE365_PROFILE_CACHE_KEY);
    localStorage.removeItem('sareeva_user'); // Clean up any stale legacy demo user
    localStorage.removeItem('just_registered_b2b');
  } catch (e) {
    console.warn('[authCache] clearCachedAuth error:', e);
  }
}
