-- 1. Database Schema Expansion (Clubs & Auth)

-- Update Clubs Table
alter table clubs
add column if not exists exec_members jsonb default '[]'::jsonb,
add column if not exists social_links jsonb default '{}'::jsonb;
-- Ensure JSON structure via checks if desired, but flexible JSONB is standard for "Text/JSON type for names and emails"

-- Implement Authentication Schema (Users Table)
do $$ begin
    create type user_role as enum ('base', 'org_admin', 'root_admin');
exception
    when duplicate_object then null;
end $$;

create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password_hash text not null, -- Stores hashed password
  role user_role default 'base',
  club_id uuid references clubs(id), -- For Org Admins (optional link)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Event Logic & Duplicate Detection

-- Duplicate Handling: Ensure Unique constraint on ICS UID
-- First, handle existing duplicates if any (keep latest updated)
delete from events a using events b
where a.uid = b.uid and a.last_updated < b.last_updated;

-- Now add constraint
alter table events
drop constraint if exists events_club_id_uid_key; -- Remove old verify
alter table events
drop constraint if exists events_uid_key; -- Ensure clean slate for new constraint

alter table events
add constraint events_uid_key unique (uid);

-- Collaborations Table
create table if not exists collaborations (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  club_id uuid references clubs(id) on delete cascade not null,
  role text default 'secondary', -- 'secondary' collaborator
  unique(event_id, club_id)
);

-- 3. Intelligent Event Parsing & Categorization

-- Update Event Types to match strict categories: Events, Meetings, Office Hours, Other
-- First, ensure we have these exact names.
insert into event_types (name) values 
  ('Events'), 
  ('Meetings'),
  ('Office Hours'),
  ('Other')
on conflict (name) do nothing;

-- Optional: Clean up old types if desired, or just map them to 'Other'.
-- For a clean slate, you might want to delete the others if no events point to them, 
-- but safe migration is just to ensure the new ones exist.

-- Migration: Move existing events to "Other" initially so they can be re-classified by the new strict logic
do $$
declare
  other_type_id uuid;
begin
  select id into other_type_id from event_types where name = 'Other';
  
  if other_type_id is not null then
    update events set type_id = other_type_id;
  end if;
end $$;
