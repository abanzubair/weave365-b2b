/**
 * @file presenceResolver.js
 * Computes, resolves, and formats real-time and historical "Last Seen" presence for any buyer profile.
 * Aggregates multiple touchpoints:
 * 1. Live presence / heartbeat ping (last_seen_at)
 * 2. Supabase Auth last_sign_in_at
 * 3. Shopping cart activity (cart_items updated_at / created_at)
 * 4. Favourites activity (favorites created_at)
 * 5. Orders activity (orders updated_at / created_at)
 * 6. Inquiries / Quotes activity (inquiries updated_at / created_at)
 * 7. Catalogue downloads (download_logs downloaded_at / created_at)
 * 8. Profile sync & modification (profiles updated_at)
 * 9. Initial account registration (profiles created_at fallback)
 */

/**
 * Format a timestamp into user-friendly online status and relative/absolute time.
 * @param {string|number|Date} dateStr - Timestamp
 * @param {Date} [now=new Date()] - Reference current date
 * @returns {Object} Formatted presence details
 */
export function formatPresence(dateStr, now = new Date()) {
  if (!dateStr) {
    return {
      isOnline: false,
      primaryLabel: '—',
      secondaryLabel: 'Never',
      fullFormatted: 'No activity recorded',
      timestamp: 0,
      isToday: false,
      isThisWeek: false,
      rawIso: null,
    };
  }

  const d = new Date(dateStr);
  const timeMs = d.getTime();
  if (isNaN(timeMs)) {
    return {
      isOnline: false,
      primaryLabel: '—',
      secondaryLabel: 'Never',
      fullFormatted: 'Invalid date',
      timestamp: 0,
      isToday: false,
      isThisWeek: false,
      rawIso: null,
    };
  }

  const diffMs = now.getTime() - timeMs;
  const diffMin = Math.round(diffMs / (60 * 1000));
  const diffHours = Math.round(diffMs / (60 * 60 * 1000));

  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStrShort = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fullFormatted = `${dateStrShort} at ${timeStr}`;

  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const isThisWeek = timeMs >= sevenDaysAgo.getTime();

  // Active within 7 minutes is classified as Online
  const isOnline = diffMs >= 0 && diffMs <= 7 * 60 * 1000;

  if (isOnline) {
    return {
      isOnline: true,
      primaryLabel: 'Online',
      secondaryLabel: 'Active now',
      fullFormatted,
      timestamp: timeMs,
      isToday: true,
      isThisWeek: true,
      rawIso: d.toISOString(),
    };
  }

  // Active within the last hour
  if (diffMin < 60 && diffMin >= 0) {
    return {
      isOnline: false,
      primaryLabel: `${Math.max(1, diffMin)}m ago`,
      secondaryLabel: `Today, ${timeStr}`,
      fullFormatted,
      timestamp: timeMs,
      isToday: true,
      isThisWeek: true,
      rawIso: d.toISOString(),
    };
  }

  // Active earlier today
  if (isToday) {
    return {
      isOnline: false,
      primaryLabel: `Today, ${timeStr}`,
      secondaryLabel: `${Math.max(1, diffHours)}h ago`,
      fullFormatted,
      timestamp: timeMs,
      isToday: true,
      isThisWeek: true,
      rawIso: d.toISOString(),
    };
  }

  // Active yesterday
  if (isYesterday) {
    return {
      isOnline: false,
      primaryLabel: 'Yesterday',
      secondaryLabel: timeStr,
      fullFormatted,
      timestamp: timeMs,
      isToday: false,
      isThisWeek: true,
      rawIso: d.toISOString(),
    };
  }

  // Active on an older date
  return {
    isOnline: false,
    primaryLabel: dateStrShort,
    secondaryLabel: timeStr,
    fullFormatted,
    timestamp: timeMs,
    isToday: false,
    isThisWeek,
    rawIso: d.toISOString(),
  };
}

/**
 * Resolves the latest online timestamp for a buyer profile across all known touchpoints.
 * @param {Object} profile - Buyer profile record
 * @param {Object} [options] - Associated records
 * @param {Object} [options.userPresenceMap] - Map of user ID to auth presence { last_sign_in_at, last_seen_at }
 * @param {Array} [options.cartRows=[]] - User's cart items
 * @param {Array} [options.favoriteRows=[]] - User's favourites
 * @param {Array} [options.orders=[]] - Orders matching user
 * @param {Array} [options.inquiries=[]] - Inquiries matching user
 * @param {Array} [options.downloadLogs=[]] - Catalogue download logs matching user
 * @returns {Object} Resolved presence record
 */
export function resolveBuyerPresence(profile, options = {}) {
  if (!profile) return formatPresence(null);

  const {
    userPresenceMap = {},
    cartRows = [],
    favoriteRows = [],
    orders = [],
    inquiries = [],
    downloadLogs = [],
  } = options;

  const timestamps = [];

  const addTime = (val) => {
    if (!val) return;
    const t = new Date(val).getTime();
    if (!isNaN(t) && t > 0) timestamps.push(t);
  };

  // 1. Direct profile timestamps
  addTime(profile.last_seen_at);
  addTime(profile.updated_at);
  addTime(profile.created_at);

  // 2. Auth presence map (from Supabase Auth admin API)
  const authRecord = userPresenceMap?.[profile.id];
  if (authRecord) {
    addTime(authRecord.last_seen_at);
    addTime(authRecord.last_sign_in_at);
  }

  // 3. Cart activity
  (cartRows || []).forEach((c) => {
    addTime(c.updated_at);
    addTime(c.created_at);
  });

  // 4. Favourites activity
  (favoriteRows || []).forEach((f) => {
    addTime(f.created_at);
  });

  // 5. Orders activity
  (orders || []).forEach((o) => {
    addTime(o.updated_at);
    addTime(o.created_at);
  });

  // 6. Inquiries activity
  (inquiries || []).forEach((i) => {
    addTime(i.updated_at);
    addTime(i.created_at);
  });

  // 7. Catalogue downloads activity
  (downloadLogs || []).forEach((d) => {
    addTime(d.downloaded_at);
    addTime(d.created_at);
  });

  if (timestamps.length === 0) {
    return formatPresence(profile.created_at || null);
  }

  const latestTime = Math.max(...timestamps);
  return formatPresence(latestTime);
}

