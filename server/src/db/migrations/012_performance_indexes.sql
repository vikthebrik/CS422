-- Migration: 012_performance_indexes.sql
-- Description: Add indexes to frequently queried columns to speed up joins and filtering.

-- Index for filtering events by club
CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);

-- Index for ordering events by start time (used in the main /events query)
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);

-- Indexes for collaborations table to speed up joins
CREATE INDEX IF NOT EXISTS idx_collaborations_event_id ON collaborations(event_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_club_id ON collaborations(club_id);
