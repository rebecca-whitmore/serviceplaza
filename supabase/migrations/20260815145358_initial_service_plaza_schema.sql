-- Service Plaza MVP initial schema.
-- New Data API privileges are granted explicitly; RLS is enabled on every table.

create schema if not exists private;
revoke all on schema private from public;

create type public.user_role as enum ('business_user', 'admin');
create type public.submission_status as enum (
  'draft', 'pending', 'changes_requested', 'approved', 'declined', 'withdrawn'
);
create type public.publication_status as enum (
  'unpublished', 'published', 'hidden', 'archived'
);
create type public.review_event_type as enum (
  'submitted', 'changes_requested', 'resubmitted', 'approved', 'declined', 'withdrawn'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'business_user',
  full_name text check (full_name is null or char_length(full_name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users (id) on delete restrict,
  contact_name text not null check (char_length(contact_name) between 1 and 120),
  contact_email text not null check (char_length(contact_email) between 3 and 320),
  contact_phone text check (contact_phone is null or char_length(contact_phone) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  publication_status public.publication_status not null default 'unpublished',
  current_published_version_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listing_versions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  version_number integer not null check (version_number > 0),
  created_by_user_id uuid not null references auth.users (id) on delete restrict,
  status public.submission_status not null default 'draft',
  supersedes_version_id uuid references public.listing_versions (id) on delete restrict,
  submitted_at timestamptz,
  decided_at timestamptz,
  business_name text not null default '' check (char_length(business_name) <= 160),
  short_summary text not null default '' check (char_length(short_summary) <= 160),
  full_description text not null default '' check (char_length(full_description) <= 2000),
  public_contact_name text check (public_contact_name is null or char_length(public_contact_name) <= 120),
  public_email text check (public_email is null or char_length(public_email) <= 320),
  show_public_email boolean not null default false,
  public_phone text check (public_phone is null or char_length(public_phone) <= 40),
  show_public_phone boolean not null default false,
  offers_online boolean not null default false,
  offers_in_person boolean not null default false,
  serves_local boolean not null default false,
  serves_uk_wide boolean not null default false,
  base_town_city text check (base_town_city is null or char_length(base_town_city) <= 120),
  uk_region text check (uk_region is null or char_length(uk_region) <= 120),
  website_url text check (website_url is null or char_length(website_url) <= 2048),
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links) = 'object'),
  has_plaza_perk boolean not null default false,
  perk_title text check (perk_title is null or char_length(perk_title) <= 160),
  perk_description text check (perk_description is null or char_length(perk_description) <= 1000),
  perk_redemption text check (perk_redemption is null or char_length(perk_redemption) <= 1000),
  perk_conditions text check (perk_conditions is null or char_length(perk_conditions) <= 1000),
  perk_expires_on date,
  category_help_requested boolean not null default false,
  category_help_text text check (category_help_text is null or char_length(category_help_text) <= 1000),
  declaration_accepted_at timestamptz,
  terms_version text check (terms_version is null or char_length(terms_version) <= 40),
  privacy_version text check (privacy_version is null or char_length(privacy_version) <= 40),
  published_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, version_number),
  check (not show_public_email or public_email is not null),
  check (not show_public_phone or public_phone is not null),
  check (
    (has_plaza_perk and perk_title is not null and perk_description is not null and perk_redemption is not null)
    or
    (not has_plaza_perk and perk_title is null and perk_description is null and perk_redemption is null
      and perk_conditions is null and perk_expires_on is null)
  ),
  check (not category_help_requested or category_help_text is not null)
);

alter table public.listings
  add constraint listings_current_version_fkey
  foreign key (current_published_version_id)
  references public.listing_versions (id) on delete restrict;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 500),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_tags (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, slug)
);

create table public.listing_category_assignments (
  listing_version_id uuid not null references public.listing_versions (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (listing_version_id, category_id)
);
create unique index listing_one_primary_category
  on public.listing_category_assignments (listing_version_id) where is_primary;

create table public.listing_service_tags (
  listing_version_id uuid not null references public.listing_versions (id) on delete cascade,
  service_tag_id uuid not null references public.service_tags (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (listing_version_id, service_tag_id)
);

create table public.listing_services (
  id uuid primary key default gen_random_uuid(),
  listing_version_id uuid not null references public.listing_versions (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  sort_order integer not null default 0 check (sort_order between 0 and 14),
  created_at timestamptz not null default now(),
  unique (listing_version_id, sort_order)
);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_version_id uuid not null unique references public.listing_versions (id) on delete cascade,
  private_storage_path text not null unique,
  published_storage_path text unique,
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 5242880),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  display_publicly boolean not null default false,
  alt_text text check (alt_text is null or char_length(alt_text) <= 300),
  created_at timestamptz not null default now()
);

create table public.review_events (
  id uuid primary key default gen_random_uuid(),
  listing_version_id uuid not null references public.listing_versions (id) on delete cascade,
  event_type public.review_event_type not null,
  performed_by_user_id uuid not null references auth.users (id) on delete restrict,
  applicant_message text check (applicant_message is null or char_length(applicant_message) <= 2000),
  private_admin_note text check (private_admin_note is null or char_length(private_admin_note) <= 4000),
  created_at timestamptz not null default now()
);

create index businesses_owner_idx on public.businesses (owner_user_id);
create index listing_versions_listing_idx on public.listing_versions (listing_id, version_number desc);
create index listing_versions_status_idx on public.listing_versions (status, submitted_at);
create index review_events_version_idx on public.review_events (listing_version_id, created_at);

create function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger businesses_updated_at before update on public.businesses
for each row execute function private.set_updated_at();
create trigger listings_updated_at before update on public.listings
for each row execute function private.set_updated_at();
create trigger listing_versions_updated_at before update on public.listing_versions
for each row execute function private.set_updated_at();
create trigger categories_updated_at before update on public.categories
for each row execute function private.set_updated_at();
create trigger service_tags_updated_at before update on public.service_tags
for each row execute function private.set_updated_at();

create function private.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));
  return new;
end;
$$;
create trigger create_profile_after_signup
after insert on auth.users for each row execute function private.create_profile_for_new_user();

create function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create function private.owns_listing(target_listing_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.listings l
    join public.businesses b on b.id = l.business_id
    where l.id = target_listing_id and b.owner_user_id = (select auth.uid())
  );
$$;

create function private.owns_version(target_version_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.listing_versions v
    join public.listings l on l.id = v.listing_id
    join public.businesses b on b.id = l.business_id
    where v.id = target_version_id and b.owner_user_id = (select auth.uid())
  );
$$;

create function private.enforce_category_assignment_limit()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (
    select count(*) >= 3
    from public.listing_category_assignments
    where listing_version_id = new.listing_version_id
  ) then
    raise exception 'A listing version may have no more than three categories';
  end if;
  return new;
end;
$$;
create trigger enforce_category_assignment_limit
before insert on public.listing_category_assignments
for each row execute function private.enforce_category_assignment_limit();

grant usage on schema private to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.owns_listing(uuid) to authenticated, service_role;
grant execute on function private.owns_version(uuid) to authenticated, service_role;
revoke all on function private.set_updated_at() from public;
revoke all on function private.create_profile_for_new_user() from public;
revoke all on function private.enforce_category_assignment_limit() from public;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.listings enable row level security;
alter table public.listing_versions enable row level security;
alter table public.categories enable row level security;
alter table public.service_tags enable row level security;
alter table public.listing_category_assignments enable row level security;
alter table public.listing_service_tags enable row level security;
alter table public.listing_services enable row level security;
alter table public.listing_images enable row level security;
alter table public.review_events enable row level security;

create policy profiles_read_own_or_admin on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy businesses_read_own_or_admin on public.businesses for select to authenticated
using (owner_user_id = (select auth.uid()) or (select private.is_admin()));

create policy listings_read_own_or_admin on public.listings for select to authenticated
using ((select private.owns_listing(id)) or (select private.is_admin()));

create policy versions_read_own_or_admin on public.listing_versions for select to authenticated
using ((select private.owns_listing(listing_id)) or (select private.is_admin()));
create policy versions_insert_own_draft on public.listing_versions for insert to authenticated
with check (status = 'draft' and created_by_user_id = (select auth.uid()) and (select private.owns_listing(listing_id)));
create policy versions_update_own_draft on public.listing_versions for update to authenticated
using (status = 'draft' and (select private.owns_listing(listing_id)))
with check (status = 'draft' and created_by_user_id = (select auth.uid()) and (select private.owns_listing(listing_id)));
create policy versions_delete_own_draft on public.listing_versions for delete to authenticated
using (status = 'draft' and (select private.owns_listing(listing_id)));

create policy categories_public_read on public.categories for select to anon, authenticated
using (is_active);
create policy categories_admin_read on public.categories for select to authenticated
using ((select private.is_admin()));
create policy service_tags_public_read on public.service_tags for select to anon, authenticated
using (is_active);
create policy service_tags_admin_read on public.service_tags for select to authenticated
using ((select private.is_admin()));

create policy category_assignments_owner_read on public.listing_category_assignments for select to authenticated
using ((select private.owns_version(listing_version_id)) or (select private.is_admin()));
create policy category_assignments_owner_insert on public.listing_category_assignments for insert to authenticated
with check ((select private.owns_version(listing_version_id)) and exists (
  select 1 from public.listing_versions where id = listing_version_id and status = 'draft'
));
create policy category_assignments_owner_delete on public.listing_category_assignments for delete to authenticated
using ((select private.owns_version(listing_version_id)) and exists (
  select 1 from public.listing_versions where id = listing_version_id and status = 'draft'
));

create policy service_assignments_owner_all on public.listing_service_tags for all to authenticated
using ((select private.owns_version(listing_version_id)) and exists (
  select 1 from public.listing_versions where id = listing_version_id and status = 'draft'
)) with check ((select private.owns_version(listing_version_id)) and exists (
  select 1 from public.listing_versions where id = listing_version_id and status = 'draft'
));
create policy service_assignments_admin_read on public.listing_service_tags for select to authenticated
using ((select private.is_admin()));
create policy listing_services_owner_all on public.listing_services for all to authenticated
using ((select private.owns_version(listing_version_id)) and exists (
  select 1 from public.listing_versions where id = listing_version_id and status = 'draft'
)) with check ((select private.owns_version(listing_version_id)) and exists (
  select 1 from public.listing_versions where id = listing_version_id and status = 'draft'
));
create policy listing_services_admin_read on public.listing_services for select to authenticated
using ((select private.is_admin()));
create policy listing_images_owner_all on public.listing_images for all to authenticated
using ((select private.owns_version(listing_version_id)) and exists (
  select 1 from public.listing_versions where id = listing_version_id and status = 'draft'
)) with check ((select private.owns_version(listing_version_id)) and exists (
  select 1 from public.listing_versions where id = listing_version_id and status = 'draft'
));
create policy listing_images_admin_read on public.listing_images for select to authenticated
using ((select private.is_admin()));
create policy review_events_admin_read on public.review_events for select to authenticated
using ((select private.is_admin()));

-- Explicit Data API grants. No new table is exposed automatically.
grant select on public.categories, public.service_tags to anon, authenticated;
grant select on public.profiles, public.businesses, public.listings,
  public.listing_versions, public.listing_category_assignments,
  public.listing_service_tags, public.listing_services, public.listing_images,
  public.review_events to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant insert on public.listing_versions to authenticated;
grant update (
  business_name, short_summary, full_description, public_contact_name,
  public_email, show_public_email, public_phone, show_public_phone,
  offers_online, offers_in_person, serves_local, serves_uk_wide,
  base_town_city, uk_region, website_url, social_links, has_plaza_perk,
  perk_title, perk_description, perk_redemption, perk_conditions,
  perk_expires_on, category_help_requested, category_help_text,
  declaration_accepted_at, terms_version, privacy_version
) on public.listing_versions to authenticated;
grant delete on public.listing_versions to authenticated;
grant insert, update, delete on public.listing_category_assignments,
  public.listing_service_tags, public.listing_services, public.listing_images
  to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- BUs see applicant-facing review messages, never private administrator notes.
create view public.business_review_events
with (security_barrier = true) as
select
  e.id,
  e.listing_version_id,
  e.event_type,
  e.applicant_message,
  e.created_at
from public.review_events e
join public.listing_versions v on v.id = e.listing_version_id
join public.listings l on l.id = v.listing_id
join public.businesses b on b.id = l.business_id
where b.owner_user_id = (select auth.uid());

revoke all on public.business_review_events from public;
grant select on public.business_review_events to authenticated, service_role;

-- Public-safe view: private contacts, declarations, draft paths and admin data
-- are deliberately absent. The view owner filters to the current live version.
create view public.published_listing_details
with (security_barrier = true) as
select
  l.id,
  l.slug,
  v.id as version_id,
  v.business_name,
  v.short_summary,
  v.full_description,
  v.public_contact_name,
  case when v.show_public_email then v.public_email end as public_email,
  case when v.show_public_phone then v.public_phone end as public_phone,
  v.offers_online,
  v.offers_in_person,
  v.serves_local,
  v.serves_uk_wide,
  v.base_town_city,
  v.uk_region,
  v.website_url,
  v.social_links,
  v.has_plaza_perk,
  v.perk_title,
  v.perk_description,
  v.perk_redemption,
  v.perk_conditions,
  v.perk_expires_on,
  v.published_image_path,
  l.published_at
from public.listings l
join public.listing_versions v on v.id = l.current_published_version_id
where l.publication_status = 'published' and v.status = 'approved';

revoke all on public.published_listing_details from public;
grant select on public.published_listing_details to anon, authenticated, service_role;

-- Draft uploads remain private. Only approved image copies use the public bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('listing-images-private', 'listing-images-private', false, 5242880,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('listing-images-public', 'listing-images-public', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp']);

create policy private_images_insert_own_folder
on storage.objects for insert to authenticated
with check (
  bucket_id = 'listing-images-private'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy private_images_read_own_or_admin
on storage.objects for select to authenticated
using (
  bucket_id = 'listing-images-private'
  and (owner_id = (select auth.uid())::text or (select private.is_admin()))
);

create policy private_images_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'listing-images-private'
  and owner_id = (select auth.uid())::text
);

insert into public.categories (name, slug, description, sort_order) values
('Business & Administrative Support', 'business-administrative-support', 'Virtual assistants, operations, project management and bookkeeping support.', 10),
('Marketing, Sales & PR', 'marketing-sales-pr', 'Social media, SEO, advertising, lead generation and public relations.', 20),
('Web, Tech & Digital Services', 'web-tech-digital-services', 'Web designers, developers, automation specialists, tech VAs and cybersecurity.', 30),
('Design, Content & Photography', 'design-content-photography', 'Graphic design, branding, copywriting, photography, video and illustration.', 40),
('Coaching, Consulting & Careers', 'coaching-consulting-careers', 'Business coaches, life coaches, consultants, mentors and career specialists.', 50),
('Education & Tutoring', 'education-tutoring', 'Tutors, language teachers, music teachers, course providers and trainers.', 60),
('Health, Therapy & Wellbeing', 'health-therapy-wellbeing', 'Counsellors, hypnotherapists, nutritionists, fitness professionals and holistic practitioners.', 70),
('Beauty & Aesthetics', 'beauty-aesthetics', 'Beauty therapists, makeup artists, injectors, skincare and hair professionals.', 80),
('Travel & Experiences', 'travel-experiences', 'Travel consultants, itinerary planners, tour providers and retreat organisers.', 90),
('Events & Celebrations', 'events-celebrations', 'Wedding professionals, event planners, celebrants, entertainers and venue services.', 100),
('Finance, Legal & Professional Services', 'finance-legal-professional-services', 'Accountants, financial advisers, insurance specialists, HR and legal professionals.', 110),
('Personal, Family & Lifestyle Services', 'personal-family-lifestyle-services', 'Personal stylists, organisers, parenting support, pet services and other personal assistance.', 120);
