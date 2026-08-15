-- Make API views execute with caller permissions and protect their underlying
-- tables with both row-level policies and explicit column grants.

create policy listings_public_read
on public.listings for select to anon, authenticated
using (publication_status = 'published');

create policy listing_versions_public_read
on public.listing_versions for select to anon, authenticated
using (
  status = 'approved'
  and exists (
    select 1
    from public.listings
    where listings.current_published_version_id = listing_versions.id
      and listings.publication_status = 'published'
  )
);

grant select (
  id,
  slug,
  publication_status,
  current_published_version_id,
  published_at
) on public.listings to anon;

grant select (
  id,
  status,
  business_name,
  short_summary,
  full_description,
  public_contact_name,
  public_email,
  show_public_email,
  public_phone,
  show_public_phone,
  offers_online,
  offers_in_person,
  serves_local,
  serves_uk_wide,
  base_town_city,
  uk_region,
  website_url,
  social_links,
  has_plaza_perk,
  perk_title,
  perk_description,
  perk_redemption,
  perk_conditions,
  perk_expires_on,
  published_image_path
) on public.listing_versions to anon;

create or replace view public.published_listing_details
with (security_invoker = true, security_barrier = true) as
select
  l.id,
  l.slug,
  v.id as version_id,
  v.business_name,
  v.short_summary,
  v.full_description,
  v.public_contact_name,
  case when v.show_public_email then v.public_email end as public_email,
  case when v.show_public_phone then v.public_phone end as public_phone,
  v.offers_online,
  v.offers_in_person,
  v.serves_local,
  v.serves_uk_wide,
  v.base_town_city,
  v.uk_region,
  v.website_url,
  v.social_links,
  v.has_plaza_perk,
  v.perk_title,
  v.perk_description,
  v.perk_redemption,
  v.perk_conditions,
  v.perk_expires_on,
  v.published_image_path,
  l.published_at
from public.listings l
join public.listing_versions v on v.id = l.current_published_version_id
where l.publication_status = 'published'
  and v.status = 'approved';

revoke all on public.published_listing_details from public;
grant select on public.published_listing_details to anon, authenticated, service_role;

-- Remove direct access to the private administrator note, then restore only the
-- columns that are safe for a BU to receive.
revoke select on public.review_events from authenticated;
grant select (
  id,
  listing_version_id,
  event_type,
  applicant_message,
  created_at
) on public.review_events to authenticated;

create policy review_events_owner_read
on public.review_events for select to authenticated
using ((select private.owns_version(listing_version_id)));

create or replace view public.business_review_events
with (security_invoker = true, security_barrier = true) as
select
  e.id,
  e.listing_version_id,
  e.event_type,
  e.applicant_message,
  e.created_at
from public.review_events e
join public.listing_versions v on v.id = e.listing_version_id
join public.listings l on l.id = v.listing_id
join public.businesses b on b.id = l.business_id
where b.owner_user_id = (select auth.uid());

revoke all on public.business_review_events from public;
grant select on public.business_review_events to authenticated, service_role;
