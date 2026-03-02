-- Migration 011: site_settings table for flexible page content storage
-- Run this in the Supabase Dashboard SQL editor.

CREATE TABLE IF NOT EXISTS site_settings (
  key        text        PRIMARY KEY,
  value      jsonb       NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Public read access (via service-role API — no RLS needed since all access
-- is proxied through the backend, but grant is harmless for future anon use).
-- Write access is enforced at the API layer via requireRoot middleware.
