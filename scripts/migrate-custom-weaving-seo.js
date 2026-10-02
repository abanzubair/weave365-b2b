/**
 * Migration Script: Migrate /custom-woven SEO settings to /custom-weaving
 * Updates path and canonical_path in Supabase `page_seo_settings` table.
 */

import { createClient } from '@supabase/supabase-js';
import { supabase as defaultSupabase, isSupabaseConfigured } from '../src/supabaseClient.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = serviceKey && supabaseUrl
  ? createClient(supabaseUrl, serviceKey)
  : defaultSupabase;

async function migrateCustomWeavingSeo() {
  console.log('=== Migrating /custom-woven SEO settings in Supabase ===');
  if (serviceKey) {
    console.log('Using SUPABASE_SERVICE_ROLE_KEY for admin database access.');
  }

  if (!supabase) {
    console.error('Supabase client is not configured. Check environment variables.');
    process.exit(1);
  }

  // 1. Check existing rows
  const { data: existingRows, error: fetchErr } = await supabase
    .from('page_seo_settings')
    .select('*')
    .or('path.eq./custom-woven,path.eq./custom-weaving');

  if (fetchErr) {
    console.error('Failed to fetch page_seo_settings:', fetchErr.message);
    process.exit(1);
  }

  console.log('Found existing rows:', existingRows);

  const oldRow = existingRows?.find(r => r.path === '/custom-woven');
  const newRow = existingRows?.find(r => r.path === '/custom-weaving');

  if (!oldRow && newRow) {
    console.log('Row is already migrated to /custom-weaving! Ensuring canonical_path is /custom-weaving...');
    if (newRow.canonical_path !== '/custom-weaving') {
      const { error: updateCanonicalErr } = await supabase
        .from('page_seo_settings')
        .update({
          canonical_path: '/custom-weaving',
          updated_at: new Date().toISOString(),
        })
        .eq('id', newRow.id);

      if (updateCanonicalErr) {
        console.error('Failed to update canonical_path:', updateCanonicalErr.message);
        process.exit(1);
      }
      console.log('Updated canonical_path to /custom-weaving.');
    } else {
      console.log('Row is completely up to date.');
    }
    return;
  }

  if (oldRow) {
    if (newRow) {
      console.log('Both old and new rows exist. Deleting legacy /custom-woven row to avoid duplication...');
      await supabase.from('page_seo_settings').delete().eq('id', oldRow.id);
      console.log('Deleted old row.');
      return;
    }

    console.log(`Migrating row ${oldRow.id} from /custom-woven to /custom-weaving...`);
    const { data: updated, error: updateErr } = await supabase
      .from('page_seo_settings')
      .update({
        path: '/custom-weaving',
        canonical_path: '/custom-weaving',
        updated_at: new Date().toISOString(),
      })
      .eq('id', oldRow.id)
      .select();

    if (updateErr) {
      console.error('Update failed:', updateErr.message);
      process.exit(1);
    }

    console.log('Successfully migrated row:', updated);
  } else {
    console.log('No existing /custom-woven row found to migrate.');
  }

  // Verification step
  const { data: verifyData } = await supabase
    .from('page_seo_settings')
    .select('*')
    .eq('path', '/custom-weaving');

  console.log('Verification: active /custom-weaving settings:', verifyData);
}

migrateCustomWeavingSeo()
  .then(() => {
    console.log('Migration finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
