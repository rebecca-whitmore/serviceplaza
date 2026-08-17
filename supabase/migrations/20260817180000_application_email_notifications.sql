create table public.application_email_notifications (
  id uuid primary key default gen_random_uuid(),
  listing_version_id uuid not null references public.listing_versions(id) on delete cascade,
  notification_type text not null check (notification_type in (
    'submission_received', 'resubmission_received', 'changes_requested', 'approved', 'declined'
  )),
  recipient_email text not null check (char_length(recipient_email) between 3 and 320),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  provider_message_id text check (provider_message_id is null or char_length(provider_message_id) <= 255),
  last_error text check (last_error is null or char_length(last_error) <= 1000),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(listing_version_id, notification_type)
);
create trigger application_email_notifications_updated_at before update on public.application_email_notifications
for each row execute function private.set_updated_at();
alter table public.application_email_notifications enable row level security;
create policy application_email_notifications_admin_read on public.application_email_notifications for select to authenticated
using ((select private.is_admin()));
grant select on public.application_email_notifications to authenticated;
grant all on public.application_email_notifications to service_role;

create function public.queue_application_notification(target_version_id uuid, notification_kind text)
returns table(notification_id uuid, recipient_email text, business_name text, delivery_status text)
language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := (select auth.uid());
  owner_id uuid;
  target_status public.submission_status;
  target_recipient text;
  target_business_name text;
begin
  if notification_kind not in ('submission_received', 'resubmission_received', 'changes_requested', 'approved', 'declined') then raise exception 'Invalid notification type'; end if;
  select b.owner_user_id, v.status, b.contact_email, v.business_name
  into owner_id, target_status, target_recipient, target_business_name
  from public.listing_versions v join public.listings l on l.id = v.listing_id
  join public.businesses b on b.id = l.business_id where v.id = target_version_id;
  if not found then raise exception 'Application not found'; end if;
  if notification_kind in ('submission_received', 'resubmission_received') then
    if owner_id <> current_user_id or target_status <> 'pending' then raise exception 'Notification not permitted'; end if;
  elsif not private.is_admin() then raise exception 'Administrator access is required'; end if;
  insert into public.application_email_notifications(listing_version_id, notification_type, recipient_email)
  values(target_version_id, notification_kind, target_recipient)
  on conflict(listing_version_id, notification_type) do update set recipient_email = excluded.recipient_email
  returning id, status into notification_id, delivery_status;
  recipient_email := target_recipient;
  business_name := target_business_name;
  return next;
end;
$$;

create function public.complete_application_notification(
  target_notification_id uuid, delivery_succeeded boolean, resend_message_id text, delivery_error text
)
returns void language plpgsql security definer set search_path = '' as $$
declare owner_id uuid;
begin
  select b.owner_user_id into owner_id from public.application_email_notifications n
  join public.listing_versions v on v.id = n.listing_version_id join public.listings l on l.id = v.listing_id
  join public.businesses b on b.id = l.business_id where n.id = target_notification_id;
  if not found or (owner_id <> (select auth.uid()) and not private.is_admin()) then raise exception 'Notification not permitted'; end if;
  update public.application_email_notifications set
    status = case when delivery_succeeded then 'sent' else 'failed' end,
    attempts = attempts + 1,
    provider_message_id = case when delivery_succeeded then left(resend_message_id, 255) else null end,
    last_error = case when delivery_succeeded then null else left(delivery_error, 1000) end,
    sent_at = case when delivery_succeeded then now() else null end
  where id = target_notification_id;
end;
$$;

revoke all on function public.queue_application_notification(uuid, text) from public;
revoke all on function public.complete_application_notification(uuid, boolean, text, text) from public;
grant execute on function public.queue_application_notification(uuid, text) to authenticated;
grant execute on function public.complete_application_notification(uuid, boolean, text, text) to authenticated;
