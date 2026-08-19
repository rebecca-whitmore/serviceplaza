-- Add founder_story column to listing_versions table to support "Meet the founder" section
alter table public.listing_versions
add column founder_story text default null;

-- Add comment to describe the column
comment on column public.listing_versions.founder_story is 'Personal story about the founder/owner - how they started, why they started, their background. Max 2000 characters.';
