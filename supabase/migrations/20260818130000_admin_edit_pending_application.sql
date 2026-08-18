alter type public.review_event_type add value if not exists 'admin_edited';

create function public.admin_edit_pending_application(target_version_id uuid, edit_payload jsonb, custom_service_names text[], edit_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.listing_versions%rowtype; clean_reason text := nullif(trim(edit_reason), ''); service_name text; service_index integer := 0;
begin
  if not private.is_admin() then raise exception 'Administrator access is required'; end if;
  if clean_reason is null or char_length(clean_reason) > 2000 then raise exception 'A valid edit reason is required'; end if;
  if coalesce(array_length(custom_service_names, 1), 0) > 15 then raise exception 'Too many custom services'; end if;
  select * into target from public.listing_versions where id = target_version_id and status = 'pending' for update;
  if not found then raise exception 'Pending application not found'; end if;
  update public.listing_versions set
    business_name=trim(edit_payload->>'businessName'), short_summary=trim(edit_payload->>'shortSummary'), full_description=trim(edit_payload->>'fullDescription'),
    public_contact_name=nullif(trim(edit_payload->>'publicContactName'), ''), public_email=nullif(trim(edit_payload->>'publicEmail'), ''), show_public_email=coalesce((edit_payload->>'showPublicEmail')::boolean,false),
    public_phone=nullif(trim(edit_payload->>'publicPhone'), ''), show_public_phone=coalesce((edit_payload->>'showPublicPhone')::boolean,false), website_url=nullif(trim(edit_payload->>'websiteUrl'), ''), social_links=coalesce(edit_payload->'socialLinks','{}'::jsonb),
    is_uk_based=coalesce((edit_payload->>'isUkBased')::boolean,false), offers_online=coalesce((edit_payload->>'offersOnline')::boolean,false), offers_in_person=coalesce((edit_payload->>'offersInPerson')::boolean,false),
    serves_local=coalesce((edit_payload->>'offersInPerson')::boolean,false), serves_uk_wide=coalesce((edit_payload->>'offersOnline')::boolean,false), show_base_location=coalesce((edit_payload->>'offersInPerson')::boolean,false),
    base_town_city=case when coalesce((edit_payload->>'offersInPerson')::boolean,false) then nullif(trim(edit_payload->>'baseTownCity'),'') end,
    uk_region=case when coalesce((edit_payload->>'offersInPerson')::boolean,false) then nullif(trim(edit_payload->>'ukRegion'),'') end,
    has_plaza_perk=coalesce((edit_payload->>'hasPlazaPerk')::boolean,false),
    perk_title=case when coalesce((edit_payload->>'hasPlazaPerk')::boolean,false) then nullif(trim(edit_payload->>'perkTitle'),'') end,
    perk_description=case when coalesce((edit_payload->>'hasPlazaPerk')::boolean,false) then nullif(trim(edit_payload->>'perkDescription'),'') end,
    perk_redemption=case when coalesce((edit_payload->>'hasPlazaPerk')::boolean,false) then nullif(trim(edit_payload->>'perkRedemption'),'') end,
    perk_conditions=case when coalesce((edit_payload->>'hasPlazaPerk')::boolean,false) then nullif(trim(edit_payload->>'perkConditions'),'') end,
    perk_expires_on=case when coalesce((edit_payload->>'hasPlazaPerk')::boolean,false) then nullif(edit_payload->>'perkExpiresOn','')::date end
  where id=target_version_id;
  delete from public.listing_services where listing_version_id=target_version_id;
  foreach service_name in array coalesce(custom_service_names,'{}'::text[]) loop
    service_name:=trim(service_name);
    if service_name<>'' then
      if char_length(service_name)>80 then raise exception 'A service name is too long'; end if;
      insert into public.listing_services(listing_version_id,name,sort_order) values(target_version_id,service_name,service_index);
      service_index:=service_index+1;
    end if;
  end loop;
  insert into public.review_events(listing_version_id,event_type,performed_by_user_id,private_admin_note)
    values(target_version_id,'admin_edited',(select auth.uid()),clean_reason);
end;
$$;

revoke all on function public.admin_edit_pending_application(uuid,jsonb,text[],text) from public;
grant execute on function public.admin_edit_pending_application(uuid,jsonb,text[],text) to authenticated;
