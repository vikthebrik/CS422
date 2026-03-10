-- Migration 018: Add weight column to announcements for visual prominence control

do $$ begin
  create type announcement_weight as enum ('subtle', 'banner', 'modal');
exception when duplicate_object then null;
end $$;

alter table announcements add column if not exists weight announcement_weight default 'subtle' not null;
