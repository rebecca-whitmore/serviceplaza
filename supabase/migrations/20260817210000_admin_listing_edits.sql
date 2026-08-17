alter table public.listing_management_events drop constraint listing_management_events_action_check;
alter table public.listing_management_events add constraint listing_management_events_action_check
check (action in ('hidden', 'restored', 'edited'));

create function public.admin_publish_listing_edit(
  target_listing_id uuid,
  edit_payload jsonb,
  primary_category_id uuid,
  additional_category_ids uuid[],
  selected_service_tag_ids uuid[],
  custom_service_names text[],
  edit_reason text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  target_listing public.listings%rowtype;
  source public.listing_versions%rowtype;
  new_version_id uuid;
  new_version_number integer;
  clean_reason text := nullif(trim(edit_reason), '');
  service_name text;
  service_index integer := 0;
begin
  if not private.is_admin() then raise exception 'Administrator access is required'; end if;
  if clean_reason is null or char_length(clean_reason) > 2000 then raise exception 'A valid edit reason is required'; end if;
  if primary_category_id is null then raise exception 'A primary category is required'; end if;
  if coalesce(array_length(additional_category_ids, 1), 0) > 2 then raise exception 'Too many additional categories'; end if;
  if coalesce(array_length(selected_service_tag_ids, 1), 0) > 8 then raise exception 'Too many service tags'; end if;
  if coalesce(array_length(custom_service_names, 1), 0) > 15 then raise exception 'Too many custom services'; end if;

  select l.* into target_listing from public.listings l where l.id = target_listing_id for update;
  if not found or target_listing.current_published_version_id is null then raise exception 'Approved listing not found'; end if;
  select v.* into source from public.listing_versions v where v.id = target_listing.current_published_version_id and v.status = 'approved';
  if not found then raise exception 'Approved version not found'; end if;
  if exists (select 1 from public.listing_versions v where v.listing_id = target_listing.id and v.status in ('draft', 'pending')) then
    raise exception 'A listing update is already in progress';
  end if;

  select coalesce(max(v.version_number), 0) + 1 into new_version_number from public.listing_versions v where v.listing_id = target_listing.id;
  insert into public.listing_versions(
    listing_id, version_number, created_by_user_id, supersedes_version_id, status, decided_at,
    business_name, short_summary, full_description, public_contact_name,
    public_email, show_public_email, public_phone, show_public_phone,
    offers_online, offers_in_person, serves_local, serves_uk_wide,
    base_town_city, uk_region, website_url, social_links, has_plaza_perk,
    perk_title, perk_description, perk_redemption, perk_conditions, perk_expires_on,
    category_help_requested, category_help_text, published_image_path
  ) values (
    target_listing.id, new_version_number, (select auth.uid()), source.id, 'approved', now(),
    trim(edit_payload->>'businessName'), trim(edit_payload->>'shortSummary'), trim(edit_payload->>'fullDescription'), nullif(trim(edit_payload->>'publicContactName'), ''),
    nullif(trim(edit_payload->>'publicEmail'), ''), coalesce((edit_payload->>'showPublicEmail')::boolean, false), nullif(trim(edit_payload->>'publicPhone'), ''), coalesce((edit_payload->>'showPublicPhone')::boolean, false),
    coalesce((edit_payload->>'offersOnline')::boolean, false), coalesce((edit_payload->>'offersInPerson')::boolean, false), coalesce((edit_payload->>'servesLocal')::boolean, false), coalesce((edit_payload->>'servesUkWide')::boolean, false),
    nullif(trim(edit_payload->>'baseTownCity'), ''), nullif(trim(edit_payload->>'ukRegion'), ''), nullif(trim(edit_payload->>'websiteUrl'), ''), coalesce(edit_payload->'socialLinks', '{}'::jsonb), coalesce((edit_payload->>'hasPlazaPerk')::boolean, false),
    case when coalesce((edit_payload->>'hasPlazaPerk')::boolean, false) then nullif(trim(edit_payload->>'perkTitle'), '') end,
    case when coalesce((edit_payload->>'hasPlazaPerk')::boolean, false) then nullif(trim(edit_payload->>'perkDescription'), '') end,
    case when coalesce((edit_payload->>'hasPlazaPerk')::boolean, false) then nullif(trim(edit_payload->>'perkRedemption'), '') end,
    case when coalesce((edit_payload->>'hasPlazaPerk')::boolean, false) then nullif(trim(edit_payload->>'perkConditions'), '') end,
    case when coalesce((edit_payload->>'hasPlazaPerk')::boolean, false) then nullif(edit_payload->>'perkExpiresOn', '')::date end,
    false, null, source.published_image_path
  ) returning id into new_version_id;

  insert into public.listing_category_assignments(listing_version_id, category_id, is_primary) values(new_version_id, primary_category_id, true);
  insert into public.listing_category_assignments(listing_version_id, category_id, is_primary)
    select new_version_id, category_id, false from unnest(coalesce(additional_category_ids, '{}'::uuid[])) category_id where category_id <> primary_category_id;
  insert into public.listing_service_tags(listing_version_id, service_tag_id)
    select new_version_id, service_tag_id from unnest(coalesce(selected_service_tag_ids, '{}'::uuid[])) service_tag_id;
  foreach service_name in array coalesce(custom_service_names, '{}'::text[]) loop
    service_name := trim(service_name);
    if service_name <> '' then
      if char_length(service_name) > 80 then raise exception 'A service name is too long'; end if;
      insert into public.listing_services(listing_version_id, name, sort_order) values(new_version_id, service_name, service_index);
      service_index := service_index + 1;
    end if;
  end loop;

  update public.listings set current_published_version_id = new_version_id, published_at = now() where id = target_listing.id;
  insert into public.review_events(listing_version_id, event_type, performed_by_user_id, private_admin_note)
    values(new_version_id, 'approved', (select auth.uid()), 'Administrator edit: ' || clean_reason);
  insert into public.listing_management_events(listing_id, listing_version_id, action, performed_by_user_id, reason)
    values(target_listing.id, new_version_id, 'edited', (select auth.uid()), clean_reason);
  return new_version_id;
end;
$$;

revoke all on function public.admin_publish_listing_edit(uuid, jsonb, uuid, uuid[], uuid[], text[], text) from public;
grant execute on function public.admin_publish_listing_edit(uuid, jsonb, uuid, uuid[], uuid[], text[], text) to authenticated;
