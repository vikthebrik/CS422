-- 002_cleanup_types.sql
-- Remove unwanted event types to strictly enforce the 4 allowed categories.

-- 1. Ensure all events point to 'Other' if they point to an invalid type
-- (Based on verification, all are 'Other' anyway, but safety first)
do $$
declare
  other_id uuid;
begin
  select id into other_id from event_types where name = 'Other';
  
  -- Update events using invalid types to 'Other'
  update events 
  set type_id = other_id 
  where type_id in (
    select id from event_types 
    where name not in ('Events', 'Meetings', 'Office Hours', 'Other')
  );
end $$;

-- 2. Delete the invalid types
delete from event_types 
where name not in ('Events', 'Meetings', 'Office Hours', 'Other');

-- 3. Verify result (Command for you to run afterwards)
-- select * from event_types;
