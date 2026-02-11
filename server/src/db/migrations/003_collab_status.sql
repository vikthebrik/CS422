-- 003_collab_status.sql
-- Add status column to collaborations table for approval workflow.

-- Create status enum
do $$ begin
    create type collab_status as enum ('pending', 'accepted', 'rejected');
exception
    when duplicate_object then null;
end $$;

-- Add column with default 'pending'
alter table collaborations
add column if not exists status collab_status default 'pending';

-- Optional: auto-accept existing ones if any
-- update collaborations set status = 'accepted' where status is null;
