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
import { log } from './logger';

// ---------------------------------------------------------------------------
// Sync history (last 20 runs, for the /status dashboard)
// ---------------------------------------------------------------------------
export interface SyncRun {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  succeeded: number;
  failed: number;
  clubs: Array<{ name: string; status: 'ok' | 'error'; error?: string }>;
}

const SYNC_HISTORY: SyncRun[] = [];
const MAX_SYNC_HISTORY = 20;
let CRON_SCHEDULE = '*/14 * * * *';

export function getSyncHistory(): SyncRun[] { return [...SYNC_HISTORY]; }
export function getCronSchedule(): string { return CRON_SCHEDULE; }

async function runSync() {
  log.cron(`Starting scheduled sync`);
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  const { data: clubs, error } = await supabase
    .from('clubs')
    .select('id, name, ics_source_url')
    .not('ics_source_url', 'is', null);

  if (error) {
    log.error(`[cron] Failed to fetch clubs from DB: ${error.message}`);
    return;
  }

  log.cron(`Found ${clubs.length} club(s) with ICS URLs`);

  let succeeded = 0;
  let failed = 0;
  const clubResults: SyncRun['clubs'] = [];

  for (const club of clubs) {
    try {
      await populate(club.name, club.ics_source_url!);
      log.cron(`Synced "${club.name}"`);
      clubResults.push({ name: club.name, status: 'ok' });
      succeeded++;
    } catch (err: any) {
      log.error(`[cron] Failed to sync "${club.name}": ${err.message}`);
      clubResults.push({ name: club.name, status: 'error', error: err.message });
      failed++;
    }
  }

  clearAllCache();
  const completedAt = new Date().toISOString();
  log.cron(`Sync complete — ${succeeded} succeeded, ${failed} failed. Cache cleared.`);

  SYNC_HISTORY.push({
    startedAt,
    completedAt,
    durationMs: Date.now() - startMs,
    succeeded,
    failed,
    clubs: clubResults,
  });
  if (SYNC_HISTORY.length > MAX_SYNC_HISTORY) SYNC_HISTORY.shift();
}

export function startCron() {
  CRON_SCHEDULE = process.env.SYNC_CRON_SCHEDULE ?? '*/14 * * * *';

  if (!cron.validate(CRON_SCHEDULE)) {
    log.error(`Invalid SYNC_CRON_SCHEDULE: "${CRON_SCHEDULE}". Cron not started.`);
    return;
  }

  cron.schedule(CRON_SCHEDULE, runSync, { timezone: 'America/Los_Angeles' });
  log.cron(`Sync scheduled: "${CRON_SCHEDULE}" (America/Los_Angeles)`);
}

export async function triggerSync() {
  return runSync();
}
