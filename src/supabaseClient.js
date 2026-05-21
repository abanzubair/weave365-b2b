/**
 * @file supabaseClient.js
 * @description Core Supabase client initialization.
 * Safe initialization module that exports the unified `supabase` client instance and configuration checks
 * to support offline/mock fallbacks gracefully if environment tokens are absent.
 * 
 * @module supabaseClient
 */

if (typeof globalThis !== 'undefined' && !globalThis.process) {
  globalThis.process = { env: {} };
}

import { createClient } from '@supabase/supabase-js';

const url = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined;
const anonKey = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
