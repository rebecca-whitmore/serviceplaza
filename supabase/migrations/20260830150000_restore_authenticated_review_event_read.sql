-- Business owners intentionally have column-limited access to review_events,
-- excluding private_admin_note. Give the admin interface a guarded RPC rather
-- than broadening the authenticated table grant.
create function public.get_admin_review_events(target_listing_version_ids uuid[])
returns table(
  listing_version_id uuid,
  event_type text,
  applicant_message text,
  private_admin_note text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Administrator access is required';
  end if;

  return query
  select
    e.listing_version_id,
    e.event_type::text,
    e.applicant_message,
    e.private_admin_note,
    e.created_at
  from public.review_events e
  where e.listing_version_id = any(target_listing_version_ids)
  order by e.created_at desc;
end;
$$;

revoke all on function public.get_admin_review_events(uuid[]) from public, anon;
grant execute on function public.get_admin_review_events(uuid[]) to authenticated;
