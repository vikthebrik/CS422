-- Allow anyone to submit an account request (public form, no auth required).
-- The backend route /auth/request-account uses the service-role key, but per the
-- same pattern seen in collaborations (020) and storage (021), an explicit policy
-- is required. Restrict WITH CHECK to status='pending' so submitters cannot
-- self-approve.
CREATE POLICY "Public Insert Account Requests" ON account_requests
  FOR INSERT
  WITH CHECK (status = 'pending');
