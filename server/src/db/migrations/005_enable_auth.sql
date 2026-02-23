-- Migration: Enable Supabase Auth with Role-Based Row Level Security
-- Run this in Supabase SQL Editor after manually creating users via the Dashboard

-- 1. Create a table to map auth users to roles and clubs
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('root', 'club_admin')),
  club_id uuid REFERENCES clubs(id), -- NULL for root, required for club_admin
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 2. PUBLIC ACCESS (Guest)
-- Everyone (logged in or not) can view events and clubs
CREATE POLICY "Public Read Events" ON events FOR SELECT USING (true);
CREATE POLICY "Public Read Clubs" ON clubs FOR SELECT USING (true);
CREATE POLICY "Public Read Collabs" ON collaborations FOR SELECT USING (true);
-- Users can read their own role
CREATE POLICY "Read Own Role" ON user_roles FOR SELECT USING (auth.uid() = user_id);

-- 3. ROOT ADMIN ACCESS (Super User)
CREATE POLICY "Root Full Access Events" ON events
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'root'));

CREATE POLICY "Root Full Access Clubs" ON clubs
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'root'));

CREATE POLICY "Root Full Access UserRoles" ON user_roles
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'root'));

-- 4. CLUB ADMIN ACCESS (Scoped to own club)
CREATE POLICY "Club Admin Manage Own Events" ON events
    FOR ALL
    TO authenticated
    USING (club_id IN (SELECT club_id FROM user_roles WHERE user_id = auth.uid() AND role = 'club_admin'))
    WITH CHECK (club_id IN (SELECT club_id FROM user_roles WHERE user_id = auth.uid() AND role = 'club_admin'));

-- Club admins can update their own club details (e.g. description)
CREATE POLICY "Club Admin Update Own Club" ON clubs
    FOR UPDATE
    TO authenticated
    USING (id IN (SELECT club_id FROM user_roles WHERE user_id = auth.uid() AND role = 'club_admin'));
