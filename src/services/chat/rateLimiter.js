/**
 * @file rateLimiter.js
 * @description Lightweight Edge-safe sliding-window rate limiter per IP and per session.
 * Limits:
 * - Max 20 text messages per 10 minutes
 * - Max 5 image uploads per hour
 * Uses bounded Map storage with periodic expired-entry pruning to prevent memory leaks.
 */

export const TEXT_RATE_LIMIT = 20;
export const TEXT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const IMAGE_RATE_LIMIT = 5;
export const IMAGE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const MAX_RATE_LIMIT_KEYS = 2000;

/**
 * Extracts best-effort client IP from Cloudflare/Next request headers.
 * Returns empty string if no IP header is present (e.g. local unit test requests).
 */
export function extractClientIp(request) {
  const headers = request?.headers;
  if (!headers || typeof headers.get !== 'function') return '';
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '';
}

function pruneBucket(timestamps, windowMs, now) {
  const cutoff = now - windowMs;
  let idx = 0;
  while (idx < timestamps.length && timestamps[idx] <= cutoff) {
    idx++;
  }
  if (idx > 0) {
    timestamps.splice(0, idx);
  }
  return timestamps;
}

function enforceBoundedMap(map, windowMs, now, maxEntries) {
  // First pass: delete empty/expired buckets
  for (const [k, timestamps] of map.entries()) {
    pruneBucket(timestamps, windowMs, now);
    if (timestamps.length === 0) {
      map.delete(k);
    }
  }
  // Second pass: if still over cap, evict oldest inserted keys
  while (map.size >= maxEntries) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) break;
    map.delete(oldestKey);
  }
}

/**
 * Creates an isolated sliding-window rate limiter instance.
 */
export function createRateLimiter({
  textLimit = TEXT_RATE_LIMIT,
  textWindowMs = TEXT_WINDOW_MS,
  imageLimit = IMAGE_RATE_LIMIT,
  imageWindowMs = IMAGE_WINDOW_MS,
  maxKeys = MAX_RATE_LIMIT_KEYS,
} = {}) {
  const textBuckets = new Map();
  const imageBuckets = new Map();

  function buildKeys(ip, sessionId) {
    const keys = [];
    if (ip && typeof ip === 'string' && ip.trim()) {
      keys.push(`ip:${ip.trim()}`);
    }
    if (sessionId && typeof sessionId === 'string' && sessionId.trim()) {
      keys.push(`sess:${sessionId.trim()}`);
    }
    if (keys.length === 0) {
      keys.push('anon');
    }
    return keys;
  }

  function checkAndRecordBucket(map, keys, limit, windowMs, now) {
    if (map.size >= maxKeys) {
      enforceBoundedMap(map, windowMs, now, maxKeys);
    }

    for (const key of keys) {
      const existing = pruneBucket(map.get(key) || [], windowMs, now);
      if (existing.length >= limit) {
        const oldestTs = existing[0] || now;
        const retryAfterMs = Math.max(1000, windowMs - (now - oldestTs));
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs,
        };
      }
    }

    let minRemaining = limit;
    for (const key of keys) {
      const existing = pruneBucket(map.get(key) || [], windowMs, now);
      existing.push(now);
      // Refresh LRU insertion order
      map.delete(key);
      map.set(key, existing);
      minRemaining = Math.min(minRemaining, Math.max(0, limit - existing.length));
    }

    return {
      allowed: true,
      remaining: minRemaining,
      retryAfterMs: 0,
    };
  }

  return {
    /**
     * Checks and consumes rate-limit tokens for text and optional image upload.
     * Image limit is checked BEFORE recording text tokens so failed image attempts don't skew cleanly,
     * or both are checked before mutating state.
     */
    check({ ip = '', sessionId = '', hasImage = false, now = Date.now() } = {}) {
      const keys = buildKeys(ip, sessionId);

      // Dry-check image limit first if hasImage
      if (hasImage) {
        if (imageBuckets.size >= maxKeys) {
          enforceBoundedMap(imageBuckets, imageWindowMs, now, maxKeys);
        }
        for (const key of keys) {
          const existing = pruneBucket(imageBuckets.get(key) || [], imageWindowMs, now);
          if (existing.length >= imageLimit) {
            return {
              allowed: false,
              reason: 'image_rate_limit',
              remainingText: null,
              remainingImage: 0,
              retryAfterMs: Math.max(1000, imageWindowMs - (now - (existing[0] || now))),
            };
          }
        }
      }

      const textResult = checkAndRecordBucket(textBuckets, keys, textLimit, textWindowMs, now);
      if (!textResult.allowed) {
        return {
          allowed: false,
          reason: 'text_rate_limit',
          remainingText: 0,
          remainingImage: null,
          retryAfterMs: textResult.retryAfterMs,
        };
      }

      let remainingImage = null;
      if (hasImage) {
        const imgResult = checkAndRecordBucket(imageBuckets, keys, imageLimit, imageWindowMs, now);
        remainingImage = imgResult.remaining;
      }

      return {
        allowed: true,
        reason: null,
        remainingText: textResult.remaining,
        remainingImage,
        retryAfterMs: 0,
      };
    },
  };
}

const defaultRateLimiter = createRateLimiter();

export function checkChatRateLimit(options = {}) {
  return defaultRateLimiter.check(options);
}
