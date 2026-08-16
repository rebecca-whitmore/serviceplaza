-- Section 1 lets a business user correct their own account contact name.
create policy businesses_update_own_contact
on public.businesses
for update
to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

grant update (contact_name) on public.businesses to authenticated;
