-- Allow an administrator to release an abandoned, unsubmitted owner edit
-- without deleting it or changing the currently published listing.
alter table public.listing_management_events
  drop constraint listing_management_events_action_check;

alter table public.listing_management_events
  add constraint listing_management_events_action_check
  check (action in ('hidden', 'restored', 'edited', 'owner_draft_released'));

create function public.admin_release_owner_draft(
  target_listing_id uuid,
  administrator_reason text
)
returns uuid
language plpgsql
security definer
set search_path = '' as $$
declare
  target_version_id uuid;
  clean_reason text := nullif(trim(administrator_reason), '');
begin
  if not private.is_admin() then
    raise exception 'Administrator access is required';
  end if;
  if clean_reason is null or char_length(clean_reason) > 2000 then
    raise exception 'A valid reason is required';
  end if;

  perform 1 from public.listings where id = target_listing_id for update;
  if not found then raise exception 'Listing not found'; end if;

  select id into target_version_id
  from public.listing_versions
  where listing_id = target_listing_id and status = 'draft'
  order by version_number desc
  limit 1
  for update;

  if target_version_id is null then
    raise exception 'No owner draft is available to release';
  end if;

  update public.listing_versions
  set status = 'withdrawn', decided_at = now()
  where id = target_version_id and status = 'draft';

  insert into public.review_events(
    listing_version_id, event_type, performed_by_user_id, private_admin_note
  ) values (
    target_version_id, 'withdrawn', (select auth.uid()),
    'Owner draft released by administrator: ' || clean_reason
  );

  insert into public.listing_management_events(
    listing_id, listing_version_id, action, performed_by_user_id, reason
  ) values (
    target_listing_id, target_version_id, 'owner_draft_released',
    (select auth.uid()), clean_reason
  );

  return target_version_id;
end;
$$;

revoke all on function public.admin_release_owner_draft(uuid, text) from public;
grant execute on function public.admin_release_owner_draft(uuid, text) to authenticated;
