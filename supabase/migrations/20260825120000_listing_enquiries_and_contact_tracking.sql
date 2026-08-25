create table public.listing_enquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  listing_version_id uuid not null references public.listing_versions(id) on delete restrict,
  sender_name text not null check (char_length(sender_name) between 2 and 120),
  sender_email text not null check (char_length(sender_email) between 3 and 320),
  sender_phone text check (sender_phone is null or char_length(sender_phone) between 5 and 40),
  preferred_contact text not null check (preferred_contact in ('email', 'telephone', 'either')),
  message text not null check (char_length(message) between 20 and 3000),
  privacy_accepted_at timestamptz not null,
  ip_hash text not null check (char_length(ip_hash) = 64),
  delivery_email text not null check (char_length(delivery_email) between 3 and 320),
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed')),
  provider_message_id text check (provider_message_id is null or char_length(provider_message_id) <= 255),
  delivery_error text check (delivery_error is null or char_length(delivery_error) <= 1000),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger listing_enquiries_updated_at before update on public.listing_enquiries
for each row execute function private.set_updated_at();
create index listing_enquiries_listing_idx on public.listing_enquiries(listing_id, created_at desc);
create index listing_enquiries_ip_rate_idx on public.listing_enquiries(ip_hash, created_at desc);
create index listing_enquiries_email_rate_idx on public.listing_enquiries(lower(sender_email), created_at desc);

alter table public.listing_enquiries enable row level security;
create policy listing_enquiries_admin_read on public.listing_enquiries for select to authenticated
using ((select private.is_admin()));
grant select on public.listing_enquiries to authenticated;
grant all on public.listing_enquiries to service_role;

alter table public.listing_outbound_clicks
  drop constraint listing_outbound_clicks_link_type_check;
alter table public.listing_outbound_clicks
  add constraint listing_outbound_clicks_link_type_check check (
    link_type in ('website', 'email', 'phone', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube')
  );

create or replace function public.record_listing_outbound_click(target_slug text, target_link_type text)
returns text language plpgsql security definer set search_path = '' as $$
declare selected_listing_id uuid; selected_version_id uuid; destination text;
begin
  if target_link_type not in ('website', 'email', 'phone', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube') then
    raise exception 'Unsupported link type';
  end if;

  select l.id, v.id,
    case target_link_type
      when 'website' then v.website_url
      when 'email' then case when v.show_public_email then 'mailto:' || v.public_email else null end
      when 'phone' then case when v.show_public_phone then 'tel:' || regexp_replace(v.public_phone, '[^+0-9]', '', 'g') else null end
      else v.social_links ->> target_link_type
    end
  into selected_listing_id, selected_version_id, destination
  from public.listings l join public.listing_versions v on v.id = l.current_published_version_id
  where l.slug = target_slug and l.publication_status = 'published' and v.status = 'approved' and v.is_uk_based;

  if not found then raise exception 'Published listing not found'; end if;
  if destination is null then raise exception 'Contact method unavailable'; end if;
  if target_link_type in ('website', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube') and destination !~ '^https?://' then
    raise exception 'Invalid destination';
  end if;

  insert into public.listing_outbound_clicks(listing_id, listing_version_id, link_type)
  values(selected_listing_id, selected_version_id, target_link_type);
  return destination;
end;
$$;
