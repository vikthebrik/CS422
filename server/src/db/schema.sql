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
