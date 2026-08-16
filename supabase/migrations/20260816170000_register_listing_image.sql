-- Atomically register or replace the one private draft image for a listing version.
create function public.register_listing_image(
  target_version_id uuid,
  storage_path text,
  filename text,
  file_mime_type text,
  file_byte_size bigint,
  image_width integer,
  image_height integer,
  show_publicly boolean,
  image_alt_text text
)
returns text language plpgsql set search_path = '' as $$
declare previous_path text;
begin
  if not exists (select 1 from public.listing_versions where id = target_version_id
    and status = 'draft' and private.owns_version(target_version_id)) then
    raise exception 'Draft not found';
  end if;
  if storage_path not like (select auth.uid())::text || '/' || target_version_id::text || '/%' then
    raise exception 'Invalid private image path';
  end if;
  select private_storage_path into previous_path from public.listing_images where listing_version_id = target_version_id;
  insert into public.listing_images(listing_version_id, private_storage_path, original_filename,
    mime_type, byte_size, width, height, display_publicly, alt_text)
  values(target_version_id, storage_path, filename, file_mime_type, file_byte_size,
    image_width, image_height, show_publicly, nullif(trim(image_alt_text), ''))
  on conflict (listing_version_id) do update set
    private_storage_path = excluded.private_storage_path,
    published_storage_path = null,
    original_filename = excluded.original_filename,
    mime_type = excluded.mime_type,
    byte_size = excluded.byte_size,
    width = excluded.width,
    height = excluded.height,
    display_publicly = excluded.display_publicly,
    alt_text = excluded.alt_text;
  return previous_path;
end;
$$;

revoke all on function public.register_listing_image(uuid, text, text, text, bigint, integer, integer, boolean, text) from public;
grant execute on function public.register_listing_image(uuid, text, text, text, bigint, integer, integer, boolean, text) to authenticated;
