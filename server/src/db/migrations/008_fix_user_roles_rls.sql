-- Migration: Fix infinite recursion in user_roles RLS policy
-- The original "Root Full Access UserRoles" policy queries user_roles within itself,
-- causing infinite recursion whenever an authenticated user reads the table.
-- Fix: use a SECURITY DEFINER function that bypasses RLS for the role check.

CREATE OR REPLACE FUNCTION is_root_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'root'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop and recreate the recursive policy
DROP POLICY IF EXISTS "Root Full Access UserRoles" ON user_roles;

CREATE POLICY "Root Full Access UserRoles" ON user_roles
  FOR ALL
  TO authenticated
  USING (is_root_admin());
