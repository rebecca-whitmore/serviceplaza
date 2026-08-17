alter table public.listing_versions
  add column is_uk_based boolean not null default false,
  add column show_base_location boolean not null default false;

grant update(is_uk_based, show_base_location) on public.listing_versions to authenticated;

create function private.inherit_uk_business_details()
returns trigger language plpgsql set search_path = '' as $$
declare source public.listing_versions%rowtype;
begin
  if new.supersedes_version_id is not null then
    select v.* into source from public.listing_versions v where v.id = new.supersedes_version_id;
    if found then
      new.is_uk_based := source.is_uk_based;
      new.show_base_location := source.show_base_location;
    end if;
  end if;
  return new;
end;
$$;
create trigger inherit_uk_business_details before insert on public.listing_versions
for each row execute function private.inherit_uk_business_details();
revoke all on function private.inherit_uk_business_details() from public;

create or replace function public.submit_application(target_version_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.listing_versions%rowtype;
begin
  select v.* into target from public.listing_versions v
  join public.listings l on l.id = v.listing_id
  join public.businesses b on b.id = l.business_id
  where v.id = target_version_id and v.status = 'draft' and b.owner_user_id = (select auth.uid()) for update;
  if not found then raise exception 'Draft not found'; end if;
  if trim(target.business_name) = '' then raise exception 'Business name is required'; end if;
  if target.category_help_requested then
    if trim(coalesce(target.category_help_text, '')) = '' then raise exception 'Category help description is required'; end if;
  elsif not exists (select 1 from public.listing_category_assignments where listing_version_id = target.id and is_primary) then
    raise exception 'Primary category is required';
  end if;
  if trim(target.short_summary) = '' or char_length(trim(target.full_description)) < 100 then raise exception 'Business description is incomplete'; end if;
  if not target.is_uk_based then raise exception 'UK business confirmation is required'; end if;
  if trim(coalesce(target.base_town_city, '')) = '' or trim(coalesce(target.uk_region, '')) = '' then raise exception 'Business base is required'; end if;
  if not target.offers_online and not target.offers_in_person then raise exception 'Delivery method is required'; end if;
  if not target.serves_local and not target.serves_uk_wide then raise exception 'Service area is required'; end if;
  if trim(coalesce(target.public_contact_name, '')) = '' then raise exception 'Listing contact name is required'; end if;
  if target.has_plaza_perk and (trim(coalesce(target.perk_title, '')) = '' or trim(coalesce(target.perk_description, '')) = '' or trim(coalesce(target.perk_redemption, '')) = '') then raise exception 'Plaza Perk is incomplete'; end if;
  update public.listing_versions set status = 'pending', submitted_at = now(), declaration_accepted_at = now() where id = target.id;
  insert into public.review_events(listing_version_id, event_type, performed_by_user_id) values(target.id, 'submitted', (select auth.uid()));
end;
$$;

-- Published records are exposed only through the masked API function below.
drop policy listing_versions_public_read on public.listing_versions;

create or replace view public.published_listing_details
with (security_invoker = true, security_barrier = true) as
select
  l.id, l.slug, v.id as version_id, v.business_name, v.short_summary, v.full_description,
  v.public_contact_name,
  case when v.show_public_email then v.public_email end as public_email,
  case when v.show_public_phone then v.public_phone end as public_phone,
  v.offers_online, v.offers_in_person, v.serves_local, v.serves_uk_wide,
  case when v.show_base_location then v.base_town_city end as base_town_city,
  case when v.show_base_location then v.uk_region end as uk_region,
  v.website_url, v.social_links, v.has_plaza_perk, v.perk_title, v.perk_description,
  v.perk_redemption, v.perk_conditions, v.perk_expires_on, v.published_image_path,
  l.published_at, v.is_uk_based
from public.listings l
join public.listing_versions v on v.id = l.current_published_version_id
where l.publication_status = 'published' and v.status = 'approved' and v.is_uk_based;

revoke all on public.published_listing_details from anon, authenticated;
create function public.get_published_listing_details(target_slug text default null)
returns setof public.published_listing_details
language sql stable security definer set search_path = '' as $$
  select details.* from public.published_listing_details details
  where target_slug is null or details.slug = target_slug;
$$;
revoke all on function public.get_published_listing_details(text) from public;
grant execute on function public.get_published_listing_details(text) to anon, authenticated;

create function public.admin_publish_listing_edit_with_uk(
  target_listing_id uuid, edit_payload jsonb, primary_category_id uuid,
  additional_category_ids uuid[], selected_service_tag_ids uuid[], custom_service_names text[],
  edit_reason text, confirm_uk_based boolean, display_base_location boolean
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_version_id uuid;
begin
  if not private.is_admin() then raise exception 'Administrator access is required'; end if;
  if not confirm_uk_based then raise exception 'UK business confirmation is required'; end if;
  new_version_id := public.admin_publish_listing_edit(target_listing_id, edit_payload, primary_category_id,
    additional_category_ids, selected_service_tag_ids, custom_service_names, edit_reason);
  update public.listing_versions set is_uk_based = confirm_uk_based, show_base_location = display_base_location
  where id = new_version_id;
  return new_version_id;
end;
$$;
revoke all on function public.admin_publish_listing_edit_with_uk(uuid, jsonb, uuid, uuid[], uuid[], text[], text, boolean, boolean) from public;
grant execute on function public.admin_publish_listing_edit_with_uk(uuid, jsonb, uuid, uuid[], uuid[], text[], text, boolean, boolean) to authenticated;
