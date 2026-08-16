-- Save every field in the first application section in one transaction.
create function public.save_basic_information(
  target_version_id uuid,
  applicant_name text,
  listing_business_name text,
  primary_category_id uuid,
  additional_category_ids uuid[],
  selected_service_tag_ids uuid[],
  custom_service_names text[],
  help_requested boolean,
  help_text text
)
returns void language plpgsql set search_path = '' as $$
begin
  if char_length(trim(coalesce(applicant_name, ''))) not between 1 and 120 then
    raise exception 'Your name is required';
  end if;
  if char_length(trim(coalesce(listing_business_name, ''))) not between 1 and 160 then
    raise exception 'Business name is required';
  end if;

  update public.businesses b
  set contact_name = trim(applicant_name)
  from public.listings l, public.listing_versions v
  where v.id = target_version_id and v.status = 'draft'
    and l.id = v.listing_id and b.id = l.business_id
    and b.owner_user_id = (select auth.uid());
  if not found then raise exception 'Draft not found'; end if;

  update public.listing_versions
  set business_name = trim(listing_business_name)
  where id = target_version_id and status = 'draft' and private.owns_version(target_version_id);
  if not found then raise exception 'Draft not found'; end if;

  perform public.save_listing_taxonomy(target_version_id, primary_category_id,
    additional_category_ids, selected_service_tag_ids, custom_service_names,
    help_requested, help_text);
end;
$$;

revoke all on function public.save_basic_information(uuid, text, text, uuid, uuid[], uuid[], text[], boolean, text) from public;
grant execute on function public.save_basic_information(uuid, text, text, uuid, uuid[], uuid[], text[], boolean, text) to authenticated;
