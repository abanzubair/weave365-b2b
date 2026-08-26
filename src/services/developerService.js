/**
 * @file developerService.js
 * @description B2B Developer API Key Management & Analytics Service.
 * Coordinates cryptographic key generation, SHA-256 hashing, Supabase CRUD operations,
 * and daily usage aggregation for the Weave365 Developer Platform.
 * 
 * @module services/developerService
 */

import { supabase, isSupabaseConfigured } from '../supabaseClient';

/**
 * Generates a cryptographically random secure API key with prefix `w365_live_...`
 * @returns {string} Raw secret API key
 */
export function generateRawApiKey() {
  const bytes = new Uint8Array(24);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `w365_live_${hex}`;
}

/**
 * Computes the SHA-256 hash of an API key
 * @param {string} rawKey 
 * @returns {Promise<string>} Hex hash
 */
export async function hashApiKey(rawKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const TIER_CONFIGS = {
  free: {
    name: 'Starter (Free)',
    priceLabel: '₹0 / month',
    price: 0,
    monthlyQuota: 2000,
    rateLimitRps: 1,
    description: 'Bulk catalog feed, stock status sync, and standard rate limit for testing & small boutiques.',
  },
  growth: {
    name: 'Growth Partner',
    priceLabel: '₹699 / month',
    price: 699,
    monthlyQuota: 20000,
    rateLimitRps: 5,
    description: 'Real-time stock sync, automated Order Placement API, stock alert webhooks & priority rate limit.',
  },
  pro: {
    name: 'Pro / Scale',
    priceLabel: '₹1,499 / month',
    price: 1499,
    monthlyQuota: 75000,
    rateLimitRps: 15,
    description: 'High-speed burst rate limits, dedicated white-label fulfillment queue & multi-store sync.',
  },
};

export const developerService = {
  /**
   * Fetch API key for a specific user ID
   */
  async getApiKeyForUser(userId) {
    if (!isSupabaseConfigured || !userId) return { data: null, error: null };
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    return { data, error };
  },

  /**
   * Fetch API key by Key ID (for Admin inspection)
   */
  async getApiKeyById(keyId) {
    if (!isSupabaseConfigured || !keyId) return { data: null, error: null };
    const { data, error } = await supabase
      .from('api_keys')
      .select('*, profiles:user_id(id, email, full_name, business_name, whatsapp)')
      .eq('id', keyId)
      .single();

    return { data, error };
  },

  /**
   * Fetch daily usage stats for a key for the past N days
   */
  async getUsageStats(keyId, days = 30) {
    if (!isSupabaseConfigured || !keyId) return { usage: [], totalMonth: 0 };
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const dateStr = startDate.toISOString().split('T')[0];

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    const monthStartStr = currentMonthStart.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('api_usage_daily')
      .select('*')
      .eq('api_key_id', keyId)
      .gte('usage_date', dateStr)
      .order('usage_date', { ascending: true });

    if (error) {
      console.warn('[developerService] getUsageStats error:', error);
      return { usage: [], totalMonth: 0 };
    }

    const usage = data || [];
    const totalMonth = usage
      .filter(r => r.usage_date >= monthStartStr)
      .reduce((sum, r) => sum + (r.total_requests || 0), 0);

    return { usage, totalMonth };
  },

  /**
   * Create a new API Key for a user
   */
  async createApiKey(userId, { clientName, clientWebsite = '', tier = 'free', customQuota, customRps }) {
    if (!isSupabaseConfigured || !userId) throw new Error('Supabase not configured or missing userId');

    const tierConfig = TIER_CONFIGS[tier] || TIER_CONFIGS.free;
    const rawKey = generateRawApiKey();
    const keyHash = await hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 16) + '...';

    const insertPayload = {
      user_id: userId,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      client_name: clientName || 'B2B Client Portal',
      client_website: clientWebsite || '',
      tier: tier,
      monthly_quota: customQuota || tierConfig.monthlyQuota,
      rate_limit_rps: customRps || tierConfig.rateLimitRps,
      is_active: true,
      allowed_endpoints: ['catalog', 'stock', 'product', 'orders'],
    };

    const { data, error } = await supabase
      .from('api_keys')
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw error;

    return {
      keyRecord: data,
      rawSecretKey: rawKey, // Shown once to user/admin
    };
  },

  /**
   * Regenerate API key secret
   */
  async regenerateApiKey(keyId) {
    if (!isSupabaseConfigured || !keyId) throw new Error('Missing keyId');

    const rawKey = generateRawApiKey();
    const keyHash = await hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 16) + '...';

    const { data, error } = await supabase
      .from('api_keys')
      .update({
        key_hash: keyHash,
        key_prefix: keyPrefix,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyId)
      .select()
      .single();

    if (error) throw error;

    return {
      keyRecord: data,
      rawSecretKey: rawKey,
    };
  },

  /**
   * Update API key settings (tier, quota, active status)
   */
  async updateApiKey(keyId, updates) {
    if (!isSupabaseConfigured || !keyId) return { data: null, error: 'Missing keyId' };

    const { data, error } = await supabase
      .from('api_keys')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', keyId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Delete / Revoke API key
   */
  async deleteApiKey(keyId) {
    if (!isSupabaseConfigured || !keyId) return { error: 'Missing keyId' };
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId);

    return { error };
  },

  /**
   * Admin: Fetch all API Keys with linked profile data & current month usage
   */
  async getAllApiKeys() {
    if (!isSupabaseConfigured) return { data: [], error: null };

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    const monthStartStr = currentMonthStart.toISOString().split('T')[0];

    const [{ data: keys, error: keysError }, { data: usageData }] = await Promise.all([
      supabase
        .from('api_keys')
        .select('*, profiles:user_id(id, email, full_name, business_name, whatsapp, city)')
        .order('created_at', { ascending: false }),
      supabase
        .from('api_usage_daily')
        .select('api_key_id, total_requests')
        .gte('usage_date', monthStartStr),
    ]);

    if (keysError) return { data: [], error: keysError };

    const usageMap = {};
    (usageData || []).forEach(row => {
      usageMap[row.api_key_id] = (usageMap[row.api_key_id] || 0) + (row.total_requests || 0);
    });

    const enriched = (keys || []).map(k => ({
      ...k,
      monthTotal: usageMap[k.id] || 0,
      quotaPercent: Math.min(100, Math.round(((usageMap[k.id] || 0) / (k.monthly_quota || 1)) * 100)),
    }));

    return { data: enriched, error: null };
  },

  /**
   * Admin: Calculate overall system API usage vs 10% safety ceiling (50,000 requests)
   */
  async getSystemApiOverview() {
    if (!isSupabaseConfigured) {
      return {
        totalRequestsThisMonth: 0,
        safetyLimit: 50000,
        activeKeysCount: 0,
        paidTiersCount: 0,
        monthlyRevenueEst: 0,
      };
    }

    const { data: allKeys } = await this.getAllApiKeys();
    const totalRequestsThisMonth = (allKeys || []).reduce((sum, k) => sum + (k.monthTotal || 0), 0);
    const activeKeysCount = (allKeys || []).filter(k => k.is_active).length;
    const paidTiers = (allKeys || []).filter(k => k.tier === 'growth' || k.tier === 'pro');
    const monthlyRevenueEst = paidTiers.reduce((sum, k) => {
      return sum + (k.tier === 'growth' ? 699 : 1499);
    }, 0);

    return {
      totalRequestsThisMonth,
      safetyLimit: 50000,
      safetyUsagePercent: Math.min(100, Math.round((totalRequestsThisMonth / 50000) * 100)),
      activeKeysCount,
      totalKeysCount: (allKeys || []).length,
      paidTiersCount: paidTiers.length,
      monthlyRevenueEst,
      allKeys: allKeys || [],
    };
  },
};
