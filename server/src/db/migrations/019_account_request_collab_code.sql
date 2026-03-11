-- Migration: Add desired_collab_code to account_requests
-- Lets orgs suggest a short collab code when requesting an account.
-- The MCC admin can edit it before approving.

ALTER TABLE account_requests
  ADD COLUMN IF NOT EXISTS desired_collab_code text;
