-- Migration 013: add rsvp_note column to events
-- Free-text note displayed to attendees on events that require RSVP.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS rsvp_note text;
