create or replace function public.start_application(contact_name text)
returns table (
  business_id uuid,
  listing_id uuid,
  listing_version_id uuid,
  created_new boolean
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  current_user_id uuid := (select auth.uid());
  current_email text;
  selected_business_id uuid;
  selected_listing_id uuid;
  selected_version_id uuid;
  superseded_version_id uuid;
  next_version_number integer;
  clean_contact_name text := nullif(trim(contact_name), '');
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if clean_contact_name is null or char_length(clean_contact_name) > 120 then
    raise exception 'Contact name must be between 1 and 120 characters';
  end if;

  -- Serialise repeated clicks/requests for this user before checking records.
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select email into current_email
  from auth.users
  where id = current_user_id;

  if current_email is null then
    raise exception 'The authenticated account has no email address';
  end if;

  select id into selected_business_id
  from public.businesses
  where owner_user_id = current_user_id;

  if selected_business_id is null then
    insert into public.businesses (
      owner_user_id,
      contact_name,
      contact_email
    ) values (
      current_user_id,
      clean_contact_name,
      lower(current_email)
    )
    returning id into selected_business_id;

    update public.profiles
    set full_name = coalesce(full_name, clean_contact_name)
    where id = current_user_id;
  end if;

  select id into selected_listing_id
  from public.listings
  where business_id = selected_business_id;

  if selected_listing_id is null then
    insert into public.listings (business_id, slug)
    values (
      selected_business_id,
      'draft-' || regexp_replace(gen_random_uuid()::text, '-', '', 'g')
    )
    returning id into selected_listing_id;
  end if;

  select id into selected_version_id
  from public.listing_versions
  where listing_id = selected_listing_id and status = 'draft'
  order by version_number desc
  limit 1;

  if selected_version_id is not null then
    return query select
      selected_business_id,
      selected_listing_id,
      selected_version_id,
      false;
    return;
  end if;

  if exists (
    select 1 from public.listing_versions
    where listing_id = selected_listing_id and status = 'pending'
  ) then
    raise exception 'This application is already awaiting review';
  end if;

  select id into superseded_version_id
  from public.listing_versions
  where listing_id = selected_listing_id and status = 'changes_requested'
  order by version_number desc
  limit 1;

  if superseded_version_id is null then
    select current_published_version_id into superseded_version_id
    from public.listings
    where id = selected_listing_id;
  end if;

  select coalesce(max(version_number), 0) + 1 into next_version_number
  from public.listing_versions
  where listing_id = selected_listing_id;

  insert into public.listing_versions (
    listing_id,
    version_number,
    created_by_user_id,
    supersedes_version_id
  ) values (
    selected_listing_id,
    next_version_number,
    current_user_id,
    superseded_version_id
  )
  returning id into selected_version_id;

  return query select
    selected_business_id,
    selected_listing_id,
    selected_version_id,
    true;
end;
$$;
