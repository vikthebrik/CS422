-- Migration 014: club_members table
-- Stores the "Our Team" roster for each club, split into exec / board / intern sections.

CREATE TABLE IF NOT EXISTS club_members (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id     uuid    REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  section     text    NOT NULL CHECK (section IN ('exec', 'board', 'intern')),
  name        text    NOT NULL,
  title       text    NOT NULL,
  email       text,
  photo_url   text,
  sort_order  integer DEFAULT 0,
  created_at  timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);
