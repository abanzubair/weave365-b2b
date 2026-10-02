/**
 * @file backfill-user-acquisition.js
 * Correlates existing user accounts with site_analytics logs and stamps acquisition attribution
 * into user_metadata (and profiles table if acquisition column exists).
 * 
 * Usage:
 *   node --env-file=.env scripts/backfill-user-acquisition.js --dry-run
 *   node --env-file=.env scripts/backfill-user-acquisition.js
 */

import { createClient } from '@supabase/supabase-js';
import { resolveBuyerAcquisition } from '../src/utils/acquisitionResolver.js';

const isDryRun = process.argv.includes('--dry-run');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function runBackfill() {
  console.log('====================================================');
  console.log(`   USER ACQUISITION ATTRIBUTION BACKFILL ${isDryRun ? '(DRY RUN)' : '(LIVE)'}`);
  console.log('====================================================\n');

  // 1. Fetch all profiles and recent site analytics
  const [profilesRes, analyticsRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('site_analytics').select('*').order('created_at', { ascending: false }).limit(3000)
  ]);

  if (profilesRes.error) {
    console.error('Error fetching profiles:', profilesRes.error);
    process.exit(1);
  }

  const profiles = profilesRes.data || [];
  const analytics = analyticsRes.data || [];

  console.log(`Loaded ${profiles.length} profiles and ${analytics.length} site_analytics records.\n`);

  let matchedCount = 0;
  let skippedCount = 0;

  for (const profile of profiles) {
    // If already has direct acquisition, skip unless dry run preview
    if (profile.acquisition && Object.keys(profile.acquisition).length > 0 && !isDryRun) {
      skippedCount++;
      continue;
    }

    const attribution = resolveBuyerAcquisition(profile, analytics);
    if (!attribution) continue;

    const isMatched = attribution.matched_via_correlation;
    if (isMatched || attribution.type !== 'direct') {
      matchedCount++;
      console.log(`[${attribution.type.toUpperCase()}] ${profile.full_name || profile.email} (${profile.city || 'No city'})`);
      console.log(`   Source: ${attribution.icon} ${attribution.cleanName} ➔ ${attribution.landingPath}`);
      console.log(`   Narrative: "${attribution.narrative}"`);
      console.log(`   Reg Time: ${profile.created_at} | Visit Time: ${attribution.timestamp || 'N/A'}`);
      console.log('   ---');

      if (!isDryRun) {
        // 1. Update Supabase Auth user_metadata
        try {
          await supabase.auth.admin.updateUserById(profile.id, {
            user_metadata: {
              acquisition: attribution,
              buyer_profile: {
                ...(profile || {}),
                acquisition: attribution
              }
            }
          });
        } catch (authErr) {
          console.warn(`   Auth update failed for ${profile.id}:`, authErr.message);
        }

        // 2. Try updating public.profiles table (safe if column exists)
        try {
          await supabase
            .from('profiles')
            .update({ acquisition: attribution })
            .eq('id', profile.id);
        } catch {
          // Ignored if column doesn't exist yet
        }
      }
    }
  }

  console.log('\n====================================================');
  console.log(`Backfill Summary:`);
  console.log(`- Total Profiles: ${profiles.length}`);
  console.log(`- Matched with Acquisition Channels: ${matchedCount}`);
  console.log(`- Mode: ${isDryRun ? 'DRY RUN (no database changes written)' : 'LIVE (saved to user_metadata)'}`);
  console.log('====================================================\n');
}

runBackfill();
