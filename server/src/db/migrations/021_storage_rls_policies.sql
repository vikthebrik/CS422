-- 021_storage_rls_policies.sql
-- All three storage buckets (club-logos, member-photos, mcc-public-assets) were
-- created as public for reads but have no write policies, causing:
--   "new row violates row-level security policy for table 'objects'"
-- on any upload attempt, even via the service-role client.
--
-- Fix: explicit service_role + authenticated write policies for each bucket.
-- The Express backend enforces business-logic scoping (club ownership, requireRoot);
-- these policies are the database-layer permission grant.

-- ── Ensure buckets exist ───────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES
    ('club-logos',        'club-logos',        true),
    ('member-photos',     'member-photos',     true),
    ('mcc-public-assets', 'mcc-public-assets', true)
  ON CONFLICT (id) DO NOTHING;

-- ── club-logos ─────────────────────────────────────────────────────────────────

-- Public read (already covered by bucket public=true, but explicit is safer)
CREATE POLICY "club-logos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'club-logos');

-- Backend service role: full access
CREATE POLICY "club-logos: service role write"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'club-logos');

CREATE POLICY "club-logos: service role update"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'club-logos');

CREATE POLICY "club-logos: service role delete"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'club-logos');

-- Authenticated users (club admins / root): upload + replace logos
-- Business-logic scoping (own club only) is enforced by requireAuth in Express.
CREATE POLICY "club-logos: authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'club-logos');

CREATE POLICY "club-logos: authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'club-logos');

-- ── member-photos ──────────────────────────────────────────────────────────────

CREATE POLICY "member-photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'member-photos');

CREATE POLICY "member-photos: service role write"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'member-photos');

CREATE POLICY "member-photos: service role update"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'member-photos');

CREATE POLICY "member-photos: service role delete"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'member-photos');

CREATE POLICY "member-photos: authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'member-photos');

CREATE POLICY "member-photos: authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'member-photos');

-- ── mcc-public-assets ──────────────────────────────────────────────────────────

CREATE POLICY "mcc-public-assets: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mcc-public-assets');

-- Write access only via service_role — the /site-settings/upload route is
-- requireRoot-gated in Express, so no authenticated policy needed here.
CREATE POLICY "mcc-public-assets: service role write"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'mcc-public-assets');

CREATE POLICY "mcc-public-assets: service role update"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'mcc-public-assets');

CREATE POLICY "mcc-public-assets: service role delete"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'mcc-public-assets');
