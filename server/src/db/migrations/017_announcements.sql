-- Migration 017: Add announcements table for admin-broadcast notifications/newsletters

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
