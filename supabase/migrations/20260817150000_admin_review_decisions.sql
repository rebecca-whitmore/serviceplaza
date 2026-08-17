-- Administrators alone may copy approved images into the public bucket.
create policy public_images_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'listing-images-public' and (select private.is_admin()));
create policy public_images_admin_update on storage.objects for update to authenticated
using (bucket_id = 'listing-images-public' and (select private.is_admin()))
with check (bucket_id = 'listing-images-public' and (select private.is_admin()));
create policy public_images_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'listing-images-public' and (select private.is_admin()));

create function public.admin_decide_application(
  target_version_id uuid,
  decision text,
  message_to_applicant text,
  administrator_note text,
  approved_public_image_path text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  target public.listing_versions%rowtype;
  owner_id uuid;
  new_version_id uuid;
  new_version_number integer;
  clean_message text := nullif(trim(message_to_applicant), '');
  clean_note text := nullif(trim(administrator_note), '');
begin
  if not private.is_admin() then raise exception 'Administrator access is required'; end if;
  if decision not in ('approve', 'request_changes', 'decline') then raise exception 'Invalid decision'; end if;
  if decision in ('request_changes', 'decline') and clean_message is null then raise exception 'An applicant message is required'; end if;
  if char_length(coalesce(clean_message, '')) > 2000 or char_length(coalesce(clean_note, '')) > 4000 then raise exception 'Review message is too long'; end if;

  select v.* into target from public.listing_versions v
  where v.id = target_version_id and v.status = 'pending' for update;
  if not found then raise exception 'Pending application not found'; end if;
  select b.owner_user_id into owner_id from public.listings l
  join public.businesses b on b.id = l.business_id where l.id = target.listing_id;

  if decision = 'approve' then
    update public.listing_versions set status = 'approved', decided_at = now(), published_image_path = approved_public_image_path where id = target.id;
    update public.listings set current_published_version_id = target.id, publication_status = 'published', published_at = now() where id = target.listing_id;
    update public.listing_images set published_storage_path = approved_public_image_path where listing_version_id = target.id;
    insert into public.review_events(listing_version_id, event_type, performed_by_user_id, applicant_message, private_admin_note)
    values(target.id, 'approved', (select auth.uid()), clean_message, clean_note);
    return null;
  end if;

  if decision = 'decline' then
    update public.listing_versions set status = 'declined', decided_at = now() where id = target.id;
    insert into public.review_events(listing_version_id, event_type, performed_by_user_id, applicant_message, private_admin_note)
    values(target.id, 'declined', (select auth.uid()), clean_message, clean_note);
    return null;
  end if;

  update public.listing_versions set status = 'changes_requested', decided_at = now() where id = target.id;
  select coalesce(max(version_number), 0) + 1 into new_version_number from public.listing_versions where listing_id = target.listing_id;
  insert into public.listing_versions(
    listing_id, version_number, created_by_user_id, supersedes_version_id,
    business_name, short_summary, full_description, public_contact_name,
    public_email, show_public_email, public_phone, show_public_phone,
    offers_online, offers_in_person, serves_local, serves_uk_wide,
    base_town_city, uk_region, website_url, social_links, has_plaza_perk,
    perk_title, perk_description, perk_redemption, perk_conditions, perk_expires_on,
    category_help_requested, category_help_text
  ) values (
    target.listing_id, new_version_number, owner_id, target.id,
    target.business_name, target.short_summary, target.full_description, target.public_contact_name,
    target.public_email, target.show_public_email, target.public_phone, target.show_public_phone,
    target.offers_online, target.offers_in_person, target.serves_local, target.serves_uk_wide,
    target.base_town_city, target.uk_region, target.website_url, target.social_links, target.has_plaza_perk,
    target.perk_title, target.perk_description, target.perk_redemption, target.perk_conditions, target.perk_expires_on,
    target.category_help_requested, target.category_help_text
  ) returning id into new_version_id;
  insert into public.listing_category_assignments(listing_version_id, category_id, is_primary)
    select new_version_id, category_id, is_primary from public.listing_category_assignments where listing_version_id = target.id;
  insert into public.listing_service_tags(listing_version_id, service_tag_id)
    select new_version_id, service_tag_id from public.listing_service_tags where listing_version_id = target.id;
  insert into public.listing_services(listing_version_id, name, sort_order)
    select new_version_id, name, sort_order from public.listing_services where listing_version_id = target.id;
  insert into public.review_events(listing_version_id, event_type, performed_by_user_id, applicant_message, private_admin_note)
    values(target.id, 'changes_requested', (select auth.uid()), clean_message, clean_note);
  return new_version_id;
end;
$$;

revoke all on function public.admin_decide_application(uuid, text, text, text, text) from public;
grant execute on function public.admin_decide_application(uuid, text, text, text, text) to authenticated;

-- The existing submission function records a generic submitted event. Convert
-- it to resubmitted when the new draft follows a requested-changes version.
create function private.mark_review_resubmission()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.event_type = 'submitted' and exists (
    select 1 from public.listing_versions current_version
    join public.listing_versions previous_version on previous_version.id = current_version.supersedes_version_id
    where current_version.id = new.listing_version_id and previous_version.status = 'changes_requested'
  ) then new.event_type = 'resubmitted'; end if;
  return new;
end;
$$;
create trigger mark_review_resubmission before insert on public.review_events
for each row execute function private.mark_review_resubmission();
revoke all on function private.mark_review_resubmission() from public;
