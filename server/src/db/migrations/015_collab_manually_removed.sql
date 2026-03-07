-- 015_collab_manually_removed.sql
-- Tracks when an admin manually removes a collaborator so ICS sync will not re-add them.
ALTER TABLE collaborations
ADD COLUMN IF NOT EXISTS manually_removed boolean NOT NULL DEFAULT false;
