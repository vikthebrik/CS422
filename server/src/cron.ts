/**
 * @file cron.ts
 * @description In-process ICS sync scheduler.
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
 * SYNC_CRON_SCHEDULE env var (default: every 14 min — every14 notation).
 * Override with any valid cron string, e.g. "0 * * * *" for hourly.
 *
 * ## Implementation note
 * node-cron v4 has a DST infinite-loop bug in its LocalizedTime.getTimezoneGMT()
 * that causes 100% CPU on every DST spring-forward (the missed-execution while
 * loop gets stuck because the computed "next" time goes backward). We use
 * node-cron only for expression validation; scheduling itself uses setInterval
 * aligned to the wall-clock boundary, which is immune to this issue.
 *
 * ## Called from
 * `server/src/index.ts` on startup: `startCron()`
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

// Parse a simple every-N-minutes or every-N-hours cron into milliseconds.
// Returns null if the pattern is not a simple periodic interval.
function parseIntervalMs(expr: string): number | null {
  // Matches "*/N * * * *" — every N minutes
  const everyNMin = expr.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
  if (everyNMin) return parseInt(everyNMin[1], 10) * 60 * 1000;

  // Matches "0 */N * * *" — every N hours (at :00)
  const everyNHour = expr.match(/^0\s+\*\/(\d+)\s+\*\s+\*\s+\*$/);
  if (everyNHour) return parseInt(everyNHour[1], 10) * 60 * 60 * 1000;

  return null;
}

export function startCron() {
  CRON_SCHEDULE = process.env.SYNC_CRON_SCHEDULE ?? '*/14 * * * *';

  if (!cron.validate(CRON_SCHEDULE)) {
    log.error(`Invalid SYNC_CRON_SCHEDULE: "${CRON_SCHEDULE}". Cron not started.`);
    return;
  }

  const intervalMs = parseIntervalMs(CRON_SCHEDULE);
  if (intervalMs === null) {
    // Complex expression: fall back to node-cron but without timezone to
    // minimise (but not eliminate) the DST bug surface.
    cron.schedule(CRON_SCHEDULE, runSync);
    log.cron(`Sync scheduled via node-cron: "${CRON_SCHEDULE}"`);
    return;
  }

  // Align the first run to the next wall-clock boundary, then repeat.
  // e.g. for 14 min: if now is HH:09, wait 5 min so first run is at HH:14.
  // setInterval counts milliseconds — no timezone library, no DST issues.
  const msToNextBoundary = intervalMs - (Date.now() % intervalMs);
  setTimeout(() => {
    runSync();
    setInterval(runSync, intervalMs);
  }, msToNextBoundary);

  const mins = Math.round(intervalMs / 60000);
  log.cron(`Sync scheduled every ${mins} min (next run in ${Math.round(msToNextBoundary / 1000)}s)`);
}

export async function triggerSync() {
  return runSync();
}
