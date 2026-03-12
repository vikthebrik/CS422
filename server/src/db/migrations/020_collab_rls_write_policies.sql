-- 020_collab_rls_write_policies.sql
-- Migration 005 enabled RLS on the collaborations table but only added a SELECT
-- policy ("Public Read Collabs"). INSERT/UPDATE/DELETE were never covered, so any
-- attempt to add or remove a collaborator throws:
--   "new row violates row-level security policy for table collaborations"
--
-- Fix: add write policies that mirror the pattern used for the events table.
-- The backend always uses the service-role key (which bypasses RLS), but PostgREST
-- still enforces WITH CHECK on upserts when no matching write policy exists.

-- Root admin can manage all collaboration records
CREATE POLICY "Root Full Access Collabs" ON collaborations
    FOR ALL
    TO authenticated
    USING (is_root_admin())
    WITH CHECK (is_root_admin());

-- Club admins can manage collaborations on events owned by their club
-- (covers adding/removing collaborators from their own events)
CREATE POLICY "Club Admin Manage Own Event Collabs" ON collaborations
    FOR ALL
    TO authenticated
    USING (
        event_id IN (
            SELECT id FROM events
            WHERE club_id = (
                SELECT club_id FROM user_roles
                WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        event_id IN (
            SELECT id FROM events
            WHERE club_id = (
                SELECT club_id FROM user_roles
                WHERE user_id = auth.uid()
            )
        )
    );

-- Club admins can update the status of collaborations directed at their club
-- (covers accepting / rejecting incoming collab requests)
CREATE POLICY "Club Admin Update Own Collab Status" ON collaborations
    FOR UPDATE
    TO authenticated
    USING (
        club_id = (
            SELECT club_id FROM user_roles
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        club_id = (
            SELECT club_id FROM user_roles
            WHERE user_id = auth.uid()
        )
    );
