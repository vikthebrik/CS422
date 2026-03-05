# ICS Sync

Tags: #backend #sync

**Files:**
- `server/src/cron.ts` — schedules the sync
- `server/src/scripts/sync_all.ts` — sync logic

Automated background job that parses Outlook ICS calendar feeds and upserts events into Supabase.

## Cron Schedule

Configured via `SYNC_CRON_SCHEDULE` env var. Default: every 14 minutes.
In-process cron via `node-cron` — runs inside the same Express process (started on app boot via `startCron()`).

## Sync Logic (sync_all.ts)

1. Fetches all clubs from Supabase that have a non-null `ics_source_url`
2. For each club, downloads the ICS feed from `ics_source_url`
3. Parses events using `ical.js` or similar
4. Upserts events by UID into the `events` table
5. Detects collaborations from shared events → upserts into `collaborations` table
6. After all clubs synced, posts `POST /internal/cache/clear` with `x-sync-secret` header

## Manually Edited Events

Events with `manually_edited = true` are partially protected:
- Sync **skips** overwriting: `title`, `description`, `location`, `type_id`
- Sync **still updates**: `start_time`, `end_time`, `requires_rsvp`, `rsvp_link`

## Club Lookup

Clubs are looked up by `ics_source_url` (not name). If no club has that URL (e.g., deleted by admin), the sync silently skips it — admin renames and deletions are permanent.

## After Sync

Calls `POST /internal/cache/clear` → [[Cache]] is wiped → next frontend request fetches fresh data.

## Related
- [[Cache]] — cleared after every sync run
- [[Database]] — events + collaborations tables
- [[Collab]] — collaboration records created here
- [[Server Entry]] — hosts the /internal/cache/clear endpoint
- [[API]] — ICS endpoint: GET /events/ics
