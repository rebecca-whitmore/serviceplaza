-- Save the category and service section as one atomic operation.
create function public.save_listing_taxonomy(
  target_version_id uuid,
  primary_category_id uuid,
  additional_category_ids uuid[],
  selected_service_tag_ids uuid[],
  custom_service_names text[],
  help_requested boolean,
  help_text text
)
returns void language plpgsql set search_path = '' as $$
declare
  category_ids uuid[] := case when primary_category_id is null then '{}'::uuid[]
    else array[primary_category_id] || coalesce(additional_category_ids, '{}'::uuid[]) end;
  cleaned_services text[];
begin
  if not exists (select 1 from public.listing_versions where id = target_version_id
    and status = 'draft' and private.owns_version(target_version_id)) then
    raise exception 'Draft not found';
  end if;

  if cardinality(coalesce(additional_category_ids, '{}'::uuid[])) > 2
    or cardinality(category_ids) <> cardinality(array(select distinct unnest(category_ids))) then
    raise exception 'Choose no more than three different categories';
  end if;
  if primary_category_id is null and cardinality(coalesce(additional_category_ids, '{}'::uuid[])) > 0 then
    raise exception 'Choose a primary category first';
  end if;
  if cardinality(category_ids) > 0 and
    (select count(*) from public.categories where id = any(category_ids) and is_active) <> cardinality(category_ids) then
    raise exception 'One or more categories is unavailable';
  end if;

  if cardinality(coalesce(selected_service_tag_ids, '{}'::uuid[])) > 8
    or cardinality(coalesce(selected_service_tag_ids, '{}'::uuid[])) <>
      cardinality(array(select distinct unnest(coalesce(selected_service_tag_ids, '{}'::uuid[])))) then
    raise exception 'Choose no more than eight different service tags';
  end if;
  if cardinality(coalesce(selected_service_tag_ids, '{}'::uuid[])) > 0 and
    (select count(*) from public.service_tags where id = any(selected_service_tag_ids)
      and is_active and category_id = any(category_ids)) <> cardinality(selected_service_tag_ids) then
    raise exception 'Service tags must belong to a selected category';
  end if;

  select coalesce(array_agg(trim(name) order by position), '{}'::text[])
  into cleaned_services
  from unnest(coalesce(custom_service_names, '{}'::text[])) with ordinality as services(name, position)
  where trim(name) <> '';
  if cardinality(cleaned_services) > 15
    or exists (select 1 from unnest(cleaned_services) name where char_length(name) > 80) then
    raise exception 'Add no more than fifteen services of up to 80 characters each';
  end if;
  if char_length(coalesce(help_text, '')) > 1000 then raise exception 'Category help text is too long'; end if;

  delete from public.listing_service_tags where listing_version_id = target_version_id;
  delete from public.listing_category_assignments where listing_version_id = target_version_id;
  delete from public.listing_services where listing_version_id = target_version_id;

  if primary_category_id is not null then
    insert into public.listing_category_assignments(listing_version_id, category_id, is_primary)
    values (target_version_id, primary_category_id, true);
    insert into public.listing_category_assignments(listing_version_id, category_id, is_primary)
    select target_version_id, id, false from unnest(coalesce(additional_category_ids, '{}'::uuid[])) id;
  end if;
  insert into public.listing_service_tags(listing_version_id, service_tag_id)
  select target_version_id, id from unnest(coalesce(selected_service_tag_ids, '{}'::uuid[])) id;
  insert into public.listing_services(listing_version_id, name, sort_order)
  select target_version_id, name, (position - 1)::integer
  from unnest(cleaned_services) with ordinality as services(name, position);

  update public.listing_versions set category_help_requested = help_requested,
    category_help_text = case when help_requested then trim(coalesce(help_text, '')) else null end
  where id = target_version_id;
end;
$$;

revoke all on function public.save_listing_taxonomy(uuid, uuid, uuid[], uuid[], text[], boolean, text) from public;
grant execute on function public.save_listing_taxonomy(uuid, uuid, uuid[], uuid[], text[], boolean, text) to authenticated;
