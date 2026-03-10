-- Migration 016: Add bug_reports table for user feedback and issue tracking

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
