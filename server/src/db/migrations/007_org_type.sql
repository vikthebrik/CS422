-- Migration: Add org_type to clubs
-- Distinguishes between student unions/clubs and MCC departments.
-- Both types have the same backend permission scope (club_admin role —
-- edit your own org only), but the frontend can display them differently.

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS org_type text NOT NULL DEFAULT 'union'
    CHECK (org_type IN ('union', 'department'));

-- Mark the Multicultural Center as a department (update name to match your DB)
-- UPDATE clubs SET org_type = 'department' WHERE name = 'Multicultural Center';
