-- Migration: Add manually_edited flag to events
-- When true, the ICS sync will skip overwriting title/description/location/type_id
-- so admin changes are preserved across syncs.
-- Only start_time, end_time, requires_rsvp, and rsvp_link are still updated by sync.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS manually_edited BOOLEAN NOT NULL DEFAULT FALSE;
