-- Create clubs table
create table if not exists clubs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  ics_source_url text,
  metadata_tags jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(name)
);

-- Create event_types table
create table if not exists event_types (
  id uuid default gen_random_uuid() primary key,
  name text not null unique
);

-- Seed default event types
insert into event_types (name) values 
  ('Office Hours'),
  ('Weekly Meeting'),
  ('Large Event'),
  ('Other')
on conflict (name) do nothing;

-- Create events table
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references clubs(id) not null,
  type_id uuid references event_types(id),
  title text not null,
  description text,
  location text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  uid text not null,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  requires_rsvp boolean default false,
  rsvp_link text,
  unique(club_id, uid)
);

-- Index for querying events
create index if not exists events_club_id_idx on events(club_id);
create index if not exists events_start_time_idx on events(start_time);

-- Bug reports (migration 016)
do $$ begin
  create type report_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type report_type as enum ('bug', 'feature_request', 'feedback');
exception when duplicate_object then null;
end $$;

create table if not exists bug_reports (
  id uuid default gen_random_uuid() primary key,
  reporter_email text,
  reporter_id uuid references auth.users(id),
  type report_type default 'bug' not null,
  status report_status default 'open' not null,
  title text not null,
  description text not null,
  url text,
  user_agent text,
  screen_resolution text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone,
  admin_notes text
);

create index if not exists bug_reports_status_idx on bug_reports(status);
create index if not exists bug_reports_created_at_idx on bug_reports(created_at desc);

-- Announcements (migration 017)
do $$ begin
  create type announcement_type as enum ('info', 'success', 'warning');
exception when duplicate_object then null;
end $$;

create table if not exists announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text,
  link_url text,
  link_text text,
  type announcement_type default 'info' not null,
  active boolean default true not null,
  starts_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists announcements_active_idx on announcements(active);
create index if not exists announcements_created_at_idx on announcements(created_at desc);
