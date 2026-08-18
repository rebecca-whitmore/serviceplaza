create function public.admin_update_published_listing_image(
  target_listing_id uuid, new_private_storage_path text, new_public_storage_path text,
  filename text, file_mime_type text, file_byte_size bigint, image_alt_text text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare target_version_id uuid; previous_private text; previous_public text;
begin
  if not private.is_admin() then raise exception 'Administrator access is required'; end if;
  select current_published_version_id into target_version_id from public.listings where id=target_listing_id for update;
  if target_version_id is null or not exists(select 1 from public.listing_versions where id=target_version_id and status='approved') then raise exception 'Published listing not found'; end if;
  if char_length(coalesce(image_alt_text,''))>300 then raise exception 'Image description is too long'; end if;
  select private_storage_path,published_storage_path into previous_private,previous_public from public.listing_images where listing_version_id=target_version_id;
  if previous_public is null then select published_image_path into previous_public from public.listing_versions where id=target_version_id; end if;
  if new_public_storage_path is null then
    if previous_public is null then raise exception 'Choose an image'; end if;
    update public.listing_images set alt_text=nullif(trim(image_alt_text),'') where listing_version_id=target_version_id;
    return jsonb_build_object('private_path',null,'public_path',null);
  end if;
  if file_mime_type not in('image/jpeg','image/png','image/webp') or file_byte_size<1 or file_byte_size>5242880 then raise exception 'Invalid image'; end if;
  insert into public.listing_images(listing_version_id,private_storage_path,published_storage_path,original_filename,mime_type,byte_size,width,height,display_publicly,alt_text)
  values(target_version_id,new_private_storage_path,new_public_storage_path,filename,file_mime_type,file_byte_size,null,null,true,nullif(trim(image_alt_text),''))
  on conflict(listing_version_id) do update set private_storage_path=excluded.private_storage_path,published_storage_path=excluded.published_storage_path,
    original_filename=excluded.original_filename,mime_type=excluded.mime_type,byte_size=excluded.byte_size,width=null,height=null,display_publicly=true,alt_text=excluded.alt_text;
  update public.listing_versions set published_image_path=new_public_storage_path where id=target_version_id;
  return jsonb_build_object('private_path',previous_private,'public_path',previous_public);
end;
$$;

create function public.admin_remove_published_listing_image(target_listing_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare target_version_id uuid; previous_private text; previous_public text;
begin
  if not private.is_admin() then raise exception 'Administrator access is required'; end if;
  select current_published_version_id into target_version_id from public.listings where id=target_listing_id for update;
  if target_version_id is null then raise exception 'Published listing not found'; end if;
  delete from public.listing_images where listing_version_id=target_version_id returning private_storage_path,published_storage_path into previous_private,previous_public;
  if previous_public is null then select published_image_path into previous_public from public.listing_versions where id=target_version_id; end if;
  update public.listing_versions set published_image_path=null where id=target_version_id;
  return jsonb_build_object('private_path',previous_private,'public_path',previous_public);
end;
$$;

revoke all on function public.admin_update_published_listing_image(uuid,text,text,text,text,bigint,text) from public;
grant execute on function public.admin_update_published_listing_image(uuid,text,text,text,text,bigint,text) to authenticated;
revoke all on function public.admin_remove_published_listing_image(uuid) from public;
grant execute on function public.admin_remove_published_listing_image(uuid) to authenticated;
