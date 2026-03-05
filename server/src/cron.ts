/**
 * @file cron.ts
 * @description In-process ICS sync scheduler using node-cron.
 *
 * ## Behavior
 * - Runs on a configurable cron schedule (default: every 14 minutes).
 * - Queries the DB for all clubs with a non-null `ics_source_url`.
 * - Calls `populate()` (from populate_supabase.ts) for each club to parse
 *   their Outlook ICS feed and upsert events into Supabase.
 * - After all clubs are synced, clears the in-memory cache so the next API
 *   request returns fresh data.
 *
 * ## Configuration
 * SYNC_CRON_SCHEDULE env var (default: every 14 min — "every14" in cron notation)
 * Override with any valid cron string, e.g. "0 * * * *" for hourly.
 *
 * ## Called from
 * `server/src/index.ts` on startup: `startCron()`
 *
 * ## Sync details
 * See `populate_supabase.ts` for the ICS parsing + upsert logic. The sync
 * honours the `events.manually_edited` flag — manually edited fields
 * (title, description, location, type_id) are not overwritten by the sync.
 */
import cron from 'node-cron';
import { supabase } from './db/supabase';
import { populate } from './scripts/populate_supabase';
import { clearAllCache } from './cache';

async function runSync() {
  console.log(`[cron] Starting scheduled sync at ${new Date().toISOString()}`);

  const { data: clubs, error } = await supabase
    .from('clubs')
    .select('id, name, ics_source_url')
    .not('ics_source_url', 'is', null);

  if (error) {
    console.error('[cron] Failed to fetch clubs from DB:', error.message);
    return;
  }

  console.log(`[cron] Found ${clubs.length} clubs with ICS URLs.`);

  let succeeded = 0;
  let failed = 0;

  for (const club of clubs) {
    try {
      await populate(club.name, club.ics_source_url!);
      succeeded++;
    } catch (err: any) {
      console.error(`[cron] Failed to sync "${club.name}":`, err.message);
      failed++;
    }
  }

  clearAllCache();
  console.log(`[cron] Sync complete — ${succeeded} succeeded, ${failed} failed. Cache cleared.`);
}

export function startCron() {
  // Default: every 14 minutes. Override with SYNC_CRON_SCHEDULE env var (cron syntax).
  const schedule = process.env.SYNC_CRON_SCHEDULE ?? '*/14 * * * *';

  if (!cron.validate(schedule)) {
    console.error(`[cron] Invalid SYNC_CRON_SCHEDULE: "${schedule}". Cron not started.`);
    return;
  }

  cron.schedule(schedule, runSync, { timezone: 'America/Los_Angeles' });
  console.log(`[cron] Sync scheduled: "${schedule}" (America/Los_Angeles)`);
}
