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

Events with `manually_edited = true` are **fully frozen** from sync:
- Sync **only updates**: `last_updated` (timestamp)
- Sync **skips all other fields**: `title`, `description`, `location`, `type_id`, `start_time`, `end_time`, `requires_rsvp`, `rsvp_link`

This is intentional — a club officer editing an event manually means they've taken ownership of all its details, including the date/time. To resume auto-sync, the officer can click "Resume Auto-Sync" on the event page, which calls `PATCH /events/:id { resumeSync: true }` and sets `manually_edited = false`.

Note: RSVP-only changes (`requiresRsvp`, `rsvpLink`, `rsvpNote`) do **not** set `manually_edited = true`, so editing only the RSVP fields does not freeze the event from future syncs.

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
