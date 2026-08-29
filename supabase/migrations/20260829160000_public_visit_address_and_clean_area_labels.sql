alter table public.listing_versions
  add column if not exists public_visit_address text,
  add column if not exists public_visit_address_confirmed boolean not null default false;

alter table public.listing_versions
  drop constraint if exists listing_versions_public_visit_address_check,
  add constraint listing_versions_public_visit_address_check check (
    (public_visit_address is null or char_length(public_visit_address) between 5 and 500)
    and (not public_visit_address_confirmed or public_visit_address is not null)
  );

grant update(public_visit_address,public_visit_address_confirmed) on public.listing_versions to authenticated;

-- Remove historical public labels such as "CH66 area". The administrative
-- district already stored in uk_region remains available for public display.
update public.listing_versions
set base_town_city = null
where base_town_city ~* '^[A-Z]{1,2}[0-9][A-Z0-9]? area$';

create or replace function public.copy_listing_location_to_new_version()
returns trigger language plpgsql security definer set search_path='' as $$
declare source public.listing_versions%rowtype;
begin
  if new.supersedes_version_id is null then return new; end if;
  select * into source from public.listing_versions where id=new.supersedes_version_id;
  if not found then return new; end if;
  new.business_postcode := coalesce(new.business_postcode,source.business_postcode);
  new.postcode_latitude := coalesce(new.postcode_latitude,source.postcode_latitude);
  new.postcode_longitude := coalesce(new.postcode_longitude,source.postcode_longitude);
  new.in_person_mode := coalesce(new.in_person_mode,source.in_person_mode);
  new.travel_radius_miles := coalesce(new.travel_radius_miles,source.travel_radius_miles);
  if not new.in_person_nationwide then new.in_person_nationwide := source.in_person_nationwide; end if;
  new.public_visit_address := coalesce(new.public_visit_address,source.public_visit_address);
  if not new.public_visit_address_confirmed then new.public_visit_address_confirmed := source.public_visit_address_confirmed; end if;
  return new;
end; $$;

create or replace view public.published_listing_details
with (security_invoker=true,security_barrier=true) as
select
  l.id,l.slug,v.id as version_id,v.business_name,v.short_summary,v.full_description,v.public_contact_name,
  case when v.show_public_email then v.public_email end as public_email,
  case when v.show_public_phone then v.public_phone end as public_phone,
  v.offers_online,v.offers_in_person,v.serves_local,v.serves_uk_wide,
  v.base_town_city,v.uk_region,
  v.website_url,v.social_links,v.has_plaza_perk,v.perk_title,v.perk_description,v.perk_redemption,
  v.perk_conditions,v.perk_expires_on,v.published_image_path,l.published_at,v.is_uk_based,l.first_published_at,
  v.founder_story,v.in_person_mode,v.travel_radius_miles,v.in_person_nationwide,
  case when v.public_visit_address_confirmed and v.in_person_mode in ('customers_visit','both') then v.public_visit_address end as public_visit_address,
  v.public_visit_address_confirmed
from public.listings l join public.listing_versions v on v.id=l.current_published_version_id
where l.publication_status='published' and v.status='approved' and v.is_uk_based;

create or replace function public.submit_application(target_version_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare target public.listing_versions%rowtype;
begin
  select v.* into target from public.listing_versions v join public.listings l on l.id=v.listing_id join public.businesses b on b.id=l.business_id
  where v.id=target_version_id and v.status='draft' and b.owner_user_id=(select auth.uid()) for update;
  if not found then raise exception 'Draft not found'; end if;
  if trim(target.business_name)='' then raise exception 'Business name is required'; end if;
  if target.category_help_requested then
    if trim(coalesce(target.category_help_text,''))='' then raise exception 'Category help description is required'; end if;
  elsif not exists(select 1 from public.listing_category_assignments where listing_version_id=target.id and is_primary) then raise exception 'Primary category is required'; end if;
  if trim(target.short_summary)='' or char_length(trim(target.full_description))<100 then raise exception 'Business description is incomplete'; end if;
  if not target.is_uk_based or trim(coalesce(target.business_postcode,''))='' or target.postcode_latitude is null or target.postcode_longitude is null then raise exception 'A valid UK business base postcode is required'; end if;
  if not target.offers_online and not target.offers_in_person then raise exception 'Delivery method is required'; end if;
  if target.offers_in_person and target.in_person_mode is null then raise exception 'In-person arrangement is required'; end if;
  if target.offers_in_person and target.in_person_mode in ('customers_visit','both') and (not target.public_visit_address_confirmed or trim(coalesce(target.public_visit_address,''))='') then raise exception 'A confirmed public customer address is required'; end if;
  if target.offers_in_person and target.in_person_mode in ('travels_to_customer','both') and not target.in_person_nationwide and target.travel_radius_miles is null then raise exception 'Travel distance is required'; end if;
  if trim(coalesce(target.public_contact_name,''))='' then raise exception 'Listing contact name is required'; end if;
  if target.has_plaza_perk and (trim(coalesce(target.perk_title,''))='' or trim(coalesce(target.perk_description,''))='' or trim(coalesce(target.perk_redemption,''))='') then raise exception 'Plaza Perk is incomplete'; end if;
  update public.listing_versions set status='pending',submitted_at=now(),declaration_accepted_at=now() where id=target.id;
  insert into public.review_events(listing_version_id,event_type,performed_by_user_id) values(target.id,'submitted',(select auth.uid()));
end; $$;
