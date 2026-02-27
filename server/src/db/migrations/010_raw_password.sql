-- Migration: Add raw_password column to user_roles for root-admin visibility
-- The root admin needs to be able to look up and communicate credentials to club admins.
-- This column is only readable via the service-role key (backend); RLS prevents direct client access.

ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS raw_password text;
