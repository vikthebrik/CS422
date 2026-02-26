import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { populate } from './scripts/populate_supabase';
import { clearAllCache } from './cache';

const CLUBS_FILE = path.resolve(__dirname, '../clubs.json');

interface ClubDef {
  name: string;
  url: string;
}

async function runSync() {
  console.log(`[cron] Starting scheduled sync at ${new Date().toISOString()}`);

  if (!fs.existsSync(CLUBS_FILE)) {
    console.error(`[cron] clubs.json not found at ${CLUBS_FILE}`);
    return;
  }

  const clubs: ClubDef[] = JSON.parse(fs.readFileSync(CLUBS_FILE, 'utf-8'));
  let succeeded = 0;
  let failed = 0;

  for (const club of clubs) {
    try {
      await populate(club.name, club.url);
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
