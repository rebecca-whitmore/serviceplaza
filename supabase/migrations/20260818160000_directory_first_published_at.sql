alter table public.listings add column first_published_at timestamptz;

update public.listings l set first_published_at=coalesce(
  (select min(e.created_at) from public.review_events e join public.listing_versions v on v.id=e.listing_version_id
    where v.listing_id=l.id and e.event_type='approved'),
  l.published_at
) where l.current_published_version_id is not null;

create function private.set_first_published_at()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.first_published_at is null and new.current_published_version_id is not null and new.publication_status='published' then
    new.first_published_at:=coalesce(new.published_at,now());
  end if;
  return new;
end;
$$;
create trigger set_listing_first_published_at before insert or update of current_published_version_id,publication_status on public.listings
for each row execute function private.set_first_published_at();
revoke all on function private.set_first_published_at() from public;

create or replace view public.published_listing_details
with (security_invoker=true,security_barrier=true) as
select
  l.id,l.slug,v.id as version_id,v.business_name,v.short_summary,v.full_description,v.public_contact_name,
  case when v.show_public_email then v.public_email end as public_email,
  case when v.show_public_phone then v.public_phone end as public_phone,
  v.offers_online,v.offers_in_person,v.serves_local,v.serves_uk_wide,
  case when v.offers_in_person then v.base_town_city end as base_town_city,
  case when v.offers_in_person then v.uk_region end as uk_region,
  v.website_url,v.social_links,v.has_plaza_perk,v.perk_title,v.perk_description,v.perk_redemption,
  v.perk_conditions,v.perk_expires_on,v.published_image_path,l.published_at,v.is_uk_based,l.first_published_at
from public.listings l join public.listing_versions v on v.id=l.current_published_version_id
where l.publication_status='published' and v.status='approved' and v.is_uk_based;
