-- Migration 024: office_hours + office_hour_exceptions
-- Stores recurring weekly OH slot templates per club.
-- Per-week exceptions (deletions or one-off overrides) are stored separately.

CREATE TABLE IF NOT EXISTS office_hours (
  id           uuid      DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id      uuid      REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  day_of_week  smallint  NOT NULL CHECK (day_of_week BETWEEN 1 AND 5), -- 1=Mon … 5=Fri (ISO)
  start_time   time      NOT NULL,
  end_time     time      NOT NULL,
  location     text,
  member_ids   uuid[]    NOT NULL DEFAULT '{}',
  active       boolean   NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  CONSTRAINT oh_time_order CHECK (end_time > start_time)
);

-- Per-week instance overrides (skip a week, or one-off time/member change)
CREATE TABLE IF NOT EXISTS office_hour_exceptions (
  id           uuid      DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id      uuid      REFERENCES office_hours(id) ON DELETE CASCADE NOT NULL,
  week_of      date      NOT NULL, -- ISO Monday of the target week (YYYY-MM-DD)
  deleted      boolean   NOT NULL DEFAULT false,
  -- NULL means "use the template value"; non-NULL overrides for this week only
  start_time   time,
  end_time     time,
  location     text,
  member_ids   uuid[],
  created_at   timestamptz DEFAULT now(),
  UNIQUE (slot_id, week_of)
);

CREATE INDEX IF NOT EXISTS idx_oh_club_id       ON office_hours(club_id);
CREATE INDEX IF NOT EXISTS idx_oh_exc_slot_id   ON office_hour_exceptions(slot_id);
