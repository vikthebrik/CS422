-- 004_add_logos.sql
-- Add logo_url column to clubs table.

alter table clubs
add column if not exists logo_url text;

-- Example update (you would do this manually or via admin UI):
-- update clubs set logo_url = 'https://your-supabase-project.supabase.co/storage/v1/object/public/club-logos/msa.png' where name = 'Muslim Student Association';
