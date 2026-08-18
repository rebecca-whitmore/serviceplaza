create table public.listing_internal_flags (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  website_opportunity boolean not null default false,
  updated_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger listing_internal_flags_updated_at before update on public.listing_internal_flags
for each row execute function private.set_updated_at();
alter table public.listing_internal_flags enable row level security;
create policy listing_internal_flags_admin_read on public.listing_internal_flags for select to authenticated
using ((select private.is_admin()));
grant select on public.listing_internal_flags to authenticated;
grant all on public.listing_internal_flags to service_role;

create function public.admin_set_website_opportunity(target_listing_id uuid, opportunity boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Administrator access is required'; end if;
  if not exists (select 1 from public.listings l where l.id = target_listing_id and l.current_published_version_id is not null) then
    raise exception 'Approved listing not found';
  end if;
  insert into public.listing_internal_flags(listing_id, website_opportunity, updated_by_user_id)
  values(target_listing_id, opportunity, (select auth.uid()))
  on conflict(listing_id) do update set website_opportunity = excluded.website_opportunity, updated_by_user_id = excluded.updated_by_user_id;
end;
$$;
revoke all on function public.admin_set_website_opportunity(uuid, boolean) from public;
grant execute on function public.admin_set_website_opportunity(uuid, boolean) to authenticated;
