# Database

Tags: #backend #database

**Provider:** Supabase (PostgreSQL, 3NF schema)
**Access:** Service role key in `server/.env` only — no Supabase client on the frontend.

## Core Tables

| Table | Description |
|-------|-------------|
| `clubs` | Organization records (name, logo_url, ics_source_url, social_links jsonb, metadata_tags jsonb, org_type) |
| `events` | Calendar events (title, description, start_time, end_time, club_id, type_id, location, requires_rsvp, rsvp_link, rsvp_note, manually_edited) |
| `event_types` | Category labels (id, name) |
| `collaborations` | Many-to-many: event ↔ club with status (pending/accepted/rejected) |
| `user_roles` | Club admin accounts (id, email, raw_password, club_id, role: root/club_admin) |
| `account_requests` | Pending join requests (club_name, contact_email, message, status) |
| `site_settings` | Key-value CMS store (key text, value jsonb) |
| `club_members` | Team directory per club (section, name, title, email, photo_url, sort_order) — migration 014 |

## Key Columns / Flags

| Column | Table | Notes |
|--------|-------|-------|
| `org_type` | clubs | `'union'` (default) or `'department'` — migration 007 |
| `manually_edited` | events | `true` = sync skips title/description/location/type_id |
| `rsvp_note` | events | Free-text note for RSVP events — migration required |
| `raw_password` | user_roles | Plaintext password — migration 010; shown to root admin |
| `metadata_tags` | clubs | jsonb; `color` key overrides palette color assignment |
| `social_links` | clubs | jsonb; keys: instagram, linktree, engage |

## Migrations

Migrations are numbered `001_` through `014_` in `server/src/db/migrations/` (or similar path).
Key migrations: 007 (org_type), 010 (raw_password), 011 (site_settings), 014 (club_members).

## Supabase Storage Buckets

| Bucket | Contents |
|--------|----------|
| `club-logos` | Club logo images (uploaded via POST /clubs/:id/logo) |
| `member-photos` | Club member photos (uploaded via POST /clubs/:id/members/:mid/photo) |
| `mcc-public-assets` | About page media (uploaded via POST /site-settings/upload) |

## Related
- [[Server Entry]] — all DB queries live here via Supabase client
- [[ICS Sync]] — upserts clubs + events
- [[Auth Flow]] — uses user_roles + account_requests tables
- [[Org Management]] — clubs table CRUD
- [[About CMS]] — site_settings table
- [[OurTeam]] — club_members table
