-- Update published_listing_details view to include founder_story
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
  v.perk_conditions,v.perk_expires_on,v.published_image_path,l.published_at,v.is_uk_based,l.first_published_at,
  v.founder_story
from public.listings l join public.listing_versions v on v.id=l.current_published_version_id
where l.publication_status='published' and v.status='approved' and v.is_uk_based;
