/**
 * @file supabaseClient.js
 * @description Core Supabase client initialization.
 * Safe initialization module that exports the unified `supabase` client instance and configuration checks
 * to support offline/mock fallbacks gracefully if environment tokens are absent.
 * 
 * @module supabaseClient
 */

// Polyfill process in browser environments to prevent edge runtime / webpack ReferenceError crashes
if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: {} };
}

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
