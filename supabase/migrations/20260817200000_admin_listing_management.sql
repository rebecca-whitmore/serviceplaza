create table public.listing_management_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  listing_version_id uuid not null references public.listing_versions(id) on delete restrict,
  action text not null check (action in ('hidden', 'restored')),
  performed_by_user_id uuid not null references auth.users(id) on delete restrict,
  reason text check (reason is null or char_length(reason) <= 2000),
  created_at timestamptz not null default now()
);
create index listing_management_events_listing_idx on public.listing_management_events(listing_id, created_at desc);
alter table public.listing_management_events enable row level security;
create policy listing_management_events_admin_read on public.listing_management_events for select to authenticated
using ((select private.is_admin()));
grant select on public.listing_management_events to authenticated;
grant all on public.listing_management_events to service_role;

create function public.admin_set_listing_visibility(target_listing_id uuid, make_visible boolean, administrator_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target public.listings%rowtype;
  clean_reason text := nullif(trim(administrator_reason), '');
begin
  if not private.is_admin() then raise exception 'Administrator access is required'; end if;
  if char_length(coalesce(clean_reason, '')) > 2000 then raise exception 'Reason is too long'; end if;
  if not make_visible and clean_reason is null then raise exception 'A reason is required when hiding a listing'; end if;

  select l.* into target from public.listings l where l.id = target_listing_id for update;
  if not found or target.current_published_version_id is null then raise exception 'Approved listing not found'; end if;
  if not exists (select 1 from public.listing_versions v where v.id = target.current_published_version_id and v.status = 'approved') then
    raise exception 'The current listing version is not approved';
  end if;

  update public.listings set publication_status = case when make_visible then 'published'::public.publication_status else 'hidden'::public.publication_status end
  where id = target.id;
  insert into public.listing_management_events(listing_id, listing_version_id, action, performed_by_user_id, reason)
  values(target.id, target.current_published_version_id, case when make_visible then 'restored' else 'hidden' end, (select auth.uid()), clean_reason);
end;
$$;

revoke all on function public.admin_set_listing_visibility(uuid, boolean, text) from public;
grant execute on function public.admin_set_listing_visibility(uuid, boolean, text) to authenticated;
