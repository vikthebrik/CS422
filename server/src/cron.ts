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
