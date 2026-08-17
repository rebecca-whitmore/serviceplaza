create function public.start_listing_edit()
returns table(listing_version_id uuid, source_version_id uuid, created_new boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  current_user_id uuid := (select auth.uid());
  selected_listing_id uuid;
  selected_source_id uuid;
  selected_draft_id uuid;
  next_version_number integer;
begin
  if current_user_id is null then raise exception 'Authentication is required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 1));

  select l.id, l.current_published_version_id into selected_listing_id, selected_source_id
  from public.listings l join public.businesses b on b.id = l.business_id
  where b.owner_user_id = current_user_id and l.publication_status = 'published';
  if selected_listing_id is null or selected_source_id is null then raise exception 'Published listing not found'; end if;

  select v.id, v.supersedes_version_id into selected_draft_id, selected_source_id
  from public.listing_versions v where v.listing_id = selected_listing_id and v.status = 'draft'
  order by v.version_number desc limit 1;
  if selected_draft_id is not null then
    return query select selected_draft_id, selected_source_id, false;
    return;
  end if;
  if exists (select 1 from public.listing_versions where listing_id = selected_listing_id and status = 'pending') then
    raise exception 'An update is already awaiting review';
  end if;

  select l.current_published_version_id into selected_source_id from public.listings l where l.id = selected_listing_id;
  select coalesce(max(v.version_number), 0) + 1 into next_version_number
  from public.listing_versions v where v.listing_id = selected_listing_id;

  insert into public.listing_versions(
    listing_id, version_number, created_by_user_id, supersedes_version_id,
    business_name, short_summary, full_description, public_contact_name,
    public_email, show_public_email, public_phone, show_public_phone,
    offers_online, offers_in_person, serves_local, serves_uk_wide,
    base_town_city, uk_region, website_url, social_links, has_plaza_perk,
    perk_title, perk_description, perk_redemption, perk_conditions, perk_expires_on,
    category_help_requested, category_help_text
  ) select
    selected_listing_id, next_version_number, current_user_id, source.id,
    source.business_name, source.short_summary, source.full_description, source.public_contact_name,
    source.public_email, source.show_public_email, source.public_phone, source.show_public_phone,
    source.offers_online, source.offers_in_person, source.serves_local, source.serves_uk_wide,
    source.base_town_city, source.uk_region, source.website_url, source.social_links, source.has_plaza_perk,
    source.perk_title, source.perk_description, source.perk_redemption, source.perk_conditions, source.perk_expires_on,
    source.category_help_requested, source.category_help_text
  from public.listing_versions source where source.id = selected_source_id
  returning id into selected_draft_id;

  insert into public.listing_category_assignments(listing_version_id, category_id, is_primary)
    select selected_draft_id, category_id, is_primary from public.listing_category_assignments where listing_version_id = selected_source_id;
  insert into public.listing_service_tags(listing_version_id, service_tag_id)
    select selected_draft_id, service_tag_id from public.listing_service_tags where listing_version_id = selected_source_id;
  insert into public.listing_services(listing_version_id, name, sort_order)
    select selected_draft_id, name, sort_order from public.listing_services where listing_version_id = selected_source_id;

  return query select selected_draft_id, selected_source_id, true;
end;
$$;

revoke all on function public.start_listing_edit() from public;
grant execute on function public.start_listing_edit() to authenticated;
