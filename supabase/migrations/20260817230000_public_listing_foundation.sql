create function private.unique_listing_slug(listing_name text, target_listing_id uuid)
returns text language plpgsql set search_path = '' as $$
declare
  base_slug text := trim(both '-' from regexp_replace(lower(replace(listing_name, '&', ' and ')), '[^a-z0-9]+', '-', 'g'));
  candidate text;
  suffix integer := 1;
begin
  if base_slug = '' then base_slug := 'business'; end if;
  candidate := left(base_slug, 80);
  while exists (select 1 from public.listings l where l.slug = candidate and l.id <> target_listing_id) loop
    suffix := suffix + 1;
    candidate := left(base_slug, 74) || '-' || suffix::text;
  end loop;
  return candidate;
end;
$$;
revoke all on function private.unique_listing_slug(text, uuid) from public;

create function private.assign_public_listing_slug()
returns trigger language plpgsql set search_path = '' as $$
declare approved_name text;
begin
  if new.current_published_version_id is not null and (new.slug like 'draft-%' or old.current_published_version_id is null) then
    select v.business_name into approved_name from public.listing_versions v where v.id = new.current_published_version_id;
    new.slug := private.unique_listing_slug(approved_name, new.id);
  end if;
  return new;
end;
$$;
create trigger assign_public_listing_slug before update of current_published_version_id on public.listings
for each row execute function private.assign_public_listing_slug();
revoke all on function private.assign_public_listing_slug() from public;

update public.listings l set slug = private.unique_listing_slug(v.business_name, l.id)
from public.listing_versions v
where v.id = l.current_published_version_id and l.slug like 'draft-%';

create function public.get_public_listing_taxonomy(target_version_id uuid)
returns table(primary_category jsonb, additional_categories jsonb, service_tags jsonb, services jsonb)
language sql stable security definer set search_path = '' as $$
  select
    (select jsonb_build_object('name', c.name, 'slug', c.slug)
      from public.listing_category_assignments a join public.categories c on c.id = a.category_id
      where a.listing_version_id = target_version_id and a.is_primary limit 1),
    coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'slug', c.slug) order by c.sort_order, c.name)
      from public.listing_category_assignments a join public.categories c on c.id = a.category_id
      where a.listing_version_id = target_version_id and not a.is_primary), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('name', t.name, 'slug', t.slug) order by t.sort_order, t.name)
      from public.listing_service_tags selected join public.service_tags t on t.id = selected.service_tag_id
      where selected.listing_version_id = target_version_id), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('name', s.name) order by s.sort_order)
      from public.listing_services s where s.listing_version_id = target_version_id), '[]'::jsonb)
  where exists (
    select 1 from public.listings l join public.listing_versions v on v.id = l.current_published_version_id
    where v.id = target_version_id and l.publication_status = 'published' and v.status = 'approved' and v.is_uk_based
  );
$$;
revoke all on function public.get_public_listing_taxonomy(uuid) from public;
grant execute on function public.get_public_listing_taxonomy(uuid) to anon, authenticated;

create table public.listing_outbound_clicks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  listing_version_id uuid not null references public.listing_versions(id) on delete restrict,
  link_type text not null check (link_type in ('website')),
  clicked_at timestamptz not null default now()
);
create index listing_outbound_clicks_listing_idx on public.listing_outbound_clicks(listing_id, clicked_at desc);
alter table public.listing_outbound_clicks enable row level security;
create policy listing_outbound_clicks_admin_read on public.listing_outbound_clicks for select to authenticated
using ((select private.is_admin()));
grant select on public.listing_outbound_clicks to authenticated;
grant all on public.listing_outbound_clicks to service_role;

create function public.record_listing_outbound_click(target_slug text, target_link_type text)
returns text language plpgsql security definer set search_path = '' as $$
declare selected_listing_id uuid; selected_version_id uuid; destination text;
begin
  if target_link_type <> 'website' then raise exception 'Unsupported link type'; end if;
  select l.id, v.id, v.website_url into selected_listing_id, selected_version_id, destination
  from public.listings l join public.listing_versions v on v.id = l.current_published_version_id
  where l.slug = target_slug and l.publication_status = 'published' and v.status = 'approved' and v.is_uk_based;
  if not found then raise exception 'Published listing not found'; end if;
  if destination is null or destination !~ '^https?://' then raise exception 'Website unavailable'; end if;
  insert into public.listing_outbound_clicks(listing_id, listing_version_id, link_type)
  values(selected_listing_id, selected_version_id, target_link_type);
  return destination;
end;
$$;
revoke all on function public.record_listing_outbound_click(text, text) from public;
grant execute on function public.record_listing_outbound_click(text, text) to anon, authenticated;
