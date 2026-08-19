-- Allow authenticated business owners to save the optional founder story.
grant update (founder_story) on public.listing_versions to authenticated;
