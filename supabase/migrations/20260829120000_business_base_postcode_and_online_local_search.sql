-- Every new application now uses a private UK business-base postcode. The
-- broader derived area can be shown for online-only businesses, while the full
-- postcode and coordinates remain private.
create or replace view public.published_listing_details
with (security_invoker=true,security_barrier=true) as
select
  l.id,l.slug,v.id as version_id,v.business_name,v.short_summary,v.full_description,v.public_contact_name,
  case when v.show_public_email then v.public_email end as public_email,
  case when v.show_public_phone then v.public_phone end as public_phone,
  v.offers_online,v.offers_in_person,v.serves_local,v.serves_uk_wide,
  v.base_town_city,
  v.uk_region,
  v.website_url,v.social_links,v.has_plaza_perk,v.perk_title,v.perk_description,v.perk_redemption,
  v.perk_conditions,v.perk_expires_on,v.published_image_path,l.published_at,v.is_uk_based,l.first_published_at,
  v.founder_story,v.in_person_mode,v.travel_radius_miles,v.in_person_nationwide
from public.listings l join public.listing_versions v on v.id=l.current_published_version_id
where l.publication_status='published' and v.status='approved' and v.is_uk_based;

-- Postcode searches now include nearby online-only businesses. Their distance
-- describes where the business is based; it does not imply in-person delivery.
create or replace function public.search_published_listings_by_postcode(
  search_latitude double precision,
  search_longitude double precision,
  visitor_radius_miles integer default 30
)
returns table(version_id uuid,distance_miles numeric,match_kind text)
language sql stable security definer set search_path='' as $$
  with candidates as (
    select v.id,
      3958.7613 * 2 * asin(sqrt(
        power(sin(radians(v.postcode_latitude-search_latitude)/2),2) +
        cos(radians(search_latitude))*cos(radians(v.postcode_latitude))*
        power(sin(radians(v.postcode_longitude-search_longitude)/2),2)
      )) as miles,
      v.offers_online,v.offers_in_person,v.in_person_mode,v.travel_radius_miles,v.in_person_nationwide
    from public.listings l join public.listing_versions v on v.id=l.current_published_version_id
    where l.publication_status='published' and v.status='approved' and v.is_uk_based
      and v.postcode_latitude is not null and v.postcode_longitude is not null
  )
  select id,round(miles::numeric,1),
    case when offers_in_person and in_person_nationwide then 'travels_nationwide'
         when offers_in_person and in_person_mode in ('travels_to_customer','both') and miles<=coalesce(travel_radius_miles,30) then 'travels_to_you'
         when offers_in_person and in_person_mode in ('customers_visit','both') and miles<=greatest(1,least(visitor_radius_miles,150)) then 'you_visit_them'
         else 'online_near_you' end
  from candidates
  where (offers_in_person and in_person_nationwide)
     or (offers_in_person and in_person_mode in ('travels_to_customer','both') and miles<=coalesce(travel_radius_miles,30))
     or (offers_in_person and in_person_mode in ('customers_visit','both') and miles<=greatest(1,least(visitor_radius_miles,150)))
     or (offers_online and miles<=greatest(1,least(visitor_radius_miles,150)))
  order by miles;
$$;

revoke all on function public.search_published_listings_by_postcode(double precision,double precision,integer) from public;
grant execute on function public.search_published_listings_by_postcode(double precision,double precision,integer) to anon,authenticated;

-- Submission now requires a valid geocoded UK base postcode for online and
-- in-person businesses alike. Travel settings remain conditional on in-person work.
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
  if target.offers_in_person and target.in_person_mode in ('travels_to_customer','both') and not target.in_person_nationwide and target.travel_radius_miles is null then raise exception 'Travel distance is required'; end if;
  if trim(coalesce(target.public_contact_name,''))='' then raise exception 'Listing contact name is required'; end if;
  if target.has_plaza_perk and (trim(coalesce(target.perk_title,''))='' or trim(coalesce(target.perk_description,''))='' or trim(coalesce(target.perk_redemption,''))='') then raise exception 'Plaza Perk is incomplete'; end if;
  update public.listing_versions set status='pending',submitted_at=now(),declaration_accepted_at=now() where id=target.id;
  insert into public.review_events(listing_version_id,event_type,performed_by_user_id) values(target.id,'submitted',(select auth.uid()));
end; $$;
