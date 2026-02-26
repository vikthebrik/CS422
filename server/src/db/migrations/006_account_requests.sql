-- Migration: Account Requests
-- Stores "Request an Account" form submissions from clubs that don't have an account yet.
-- Root admins review these and manually provision accounts via the Admin panel.

CREATE TABLE IF NOT EXISTS account_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_name text NOT NULL,
  contact_email text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Only root admins (via service role key on the backend) can read all requests.
-- No public access.
ALTER TABLE account_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root Full Access Account Requests" ON account_requests
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'root'));
