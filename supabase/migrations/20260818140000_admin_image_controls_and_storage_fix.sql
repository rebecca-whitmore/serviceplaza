create policy public_images_admin_read on storage.objects for select to authenticated
using (bucket_id = 'listing-images-public' and (select private.is_admin()));

create policy private_images_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'listing-images-private' and (select private.is_admin()));

create function public.admin_update_pending_application_image(
  target_version_id uuid, storage_path text, filename text, file_mime_type text,
  file_byte_size bigint, image_alt_text text
)
returns text language plpgsql security definer set search_path = '' as $$
declare previous_path text;
begin
  if not private.is_admin() then raise exception 'Administrator access is required'; end if;
  if not exists (select 1 from public.listing_versions where id=target_version_id and status='pending') then raise exception 'Pending application not found'; end if;
  if char_length(coalesce(image_alt_text,'')) > 300 then raise exception 'Image description is too long'; end if;
  select private_storage_path into previous_path from public.listing_images where listing_version_id=target_version_id;
  if storage_path is null then
    if previous_path is null then raise exception 'Choose an image'; end if;
    update public.listing_images set alt_text=nullif(trim(image_alt_text),'') where listing_version_id=target_version_id;
    return null;
  end if;
  if file_mime_type not in ('image/jpeg','image/png','image/webp') or file_byte_size < 1 or file_byte_size > 5242880 then raise exception 'Invalid image'; end if;
  insert into public.listing_images(listing_version_id,private_storage_path,original_filename,mime_type,byte_size,width,height,display_publicly,alt_text)
  values(target_version_id,storage_path,filename,file_mime_type,file_byte_size,null,null,true,nullif(trim(image_alt_text),''))
  on conflict(listing_version_id) do update set private_storage_path=excluded.private_storage_path,published_storage_path=null,
    original_filename=excluded.original_filename,mime_type=excluded.mime_type,byte_size=excluded.byte_size,width=null,height=null,display_publicly=true,alt_text=excluded.alt_text;
  return previous_path;
end;
$$;

create function public.admin_remove_pending_application_image(target_version_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare previous_path text;
begin
  if not private.is_admin() then raise exception 'Administrator access is required'; end if;
  if not exists (select 1 from public.listing_versions where id=target_version_id and status='pending') then raise exception 'Pending application not found'; end if;
  delete from public.listing_images where listing_version_id=target_version_id returning private_storage_path into previous_path;
  return previous_path;
end;
$$;

revoke all on function public.admin_update_pending_application_image(uuid,text,text,text,bigint,text) from public;
grant execute on function public.admin_update_pending_application_image(uuid,text,text,text,bigint,text) to authenticated;
revoke all on function public.admin_remove_pending_application_image(uuid) from public;
grant execute on function public.admin_remove_pending_application_image(uuid) to authenticated;
