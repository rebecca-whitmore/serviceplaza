-- Validate and submit a complete draft for administrator review.
create function public.submit_application(target_version_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.listing_versions%rowtype;
begin
  select v.* into target from public.listing_versions v
  join public.listings l on l.id = v.listing_id
  join public.businesses b on b.id = l.business_id
  where v.id = target_version_id and v.status = 'draft'
    and b.owner_user_id = (select auth.uid())
  for update;
  if not found then raise exception 'Draft not found'; end if;

  if trim(target.business_name) = '' then raise exception 'Business name is required'; end if;
  if target.category_help_requested then
    if trim(coalesce(target.category_help_text, '')) = '' then raise exception 'Category help description is required'; end if;
  elsif not exists (select 1 from public.listing_category_assignments where listing_version_id = target.id and is_primary) then
    raise exception 'Primary category is required';
  end if;
  if not exists (select 1 from public.listing_service_tags where listing_version_id = target.id)
    and not exists (select 1 from public.listing_services where listing_version_id = target.id) then
    raise exception 'At least one service is required';
  end if;
  if trim(target.short_summary) = '' or char_length(trim(target.full_description)) < 100 then raise exception 'Business description is incomplete'; end if;
  if not target.offers_online and not target.offers_in_person then raise exception 'Delivery method is required'; end if;
  if not target.serves_local and not target.serves_uk_wide then raise exception 'Service area is required'; end if;
  if target.serves_local and (trim(coalesce(target.base_town_city, '')) = '' or trim(coalesce(target.uk_region, '')) = '') then raise exception 'Local service location is required'; end if;
  if trim(coalesce(target.public_contact_name, '')) = '' then raise exception 'Listing contact name is required'; end if;
  if not exists (select 1 from public.listing_images where listing_version_id = target.id) then raise exception 'Business image is required'; end if;
  if target.has_plaza_perk and (trim(coalesce(target.perk_title, '')) = '' or trim(coalesce(target.perk_description, '')) = '' or trim(coalesce(target.perk_redemption, '')) = '') then raise exception 'Plaza Perk is incomplete'; end if;

  update public.listing_versions set status = 'pending', submitted_at = now(),
    declaration_accepted_at = now() where id = target.id;
  insert into public.review_events(listing_version_id, event_type, performed_by_user_id)
  values(target.id, 'submitted', (select auth.uid()));
end;
$$;

revoke all on function public.submit_application(uuid) from public;
grant execute on function public.submit_application(uuid) to authenticated;
