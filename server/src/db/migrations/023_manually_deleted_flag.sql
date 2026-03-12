ALTER TABLE events
  ADD COLUMN IF NOT EXISTS manually_deleted boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS events_manually_deleted_idx ON events(manually_deleted)
  WHERE manually_deleted = false;
