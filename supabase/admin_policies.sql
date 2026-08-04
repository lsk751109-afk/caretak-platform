-- CareTak admin access policies
-- Run this file once in Supabase SQL Editor.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- profiles
drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select"
on public.profiles for select to authenticated
using (public.is_admin());

-- caregivers
drop policy if exists "caregivers_admin_select" on public.caregivers;
drop policy if exists "caregivers_admin_update" on public.caregivers;
create policy "caregivers_admin_select"
on public.caregivers for select to authenticated
using (public.is_admin());
create policy "caregivers_admin_update"
on public.caregivers for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- guardians
drop policy if exists "guardians_admin_select" on public.guardians;
create policy "guardians_admin_select"
on public.guardians for select to authenticated
using (public.is_admin());

-- care requests
drop policy if exists "care_requests_admin_select" on public.care_requests;
drop policy if exists "care_requests_admin_update" on public.care_requests;
create policy "care_requests_admin_select"
on public.care_requests for select to authenticated
using (public.is_admin());
create policy "care_requests_admin_update"
on public.care_requests for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- vip care
drop policy if exists "vip_care_admin_all" on public.vip_care;
create policy "vip_care_admin_all"
on public.vip_care for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- matching
drop policy if exists "matching_admin_all" on public.matching;
create policy "matching_admin_all"
on public.matching for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- payments
drop policy if exists "payments_admin_all" on public.payments;
create policy "payments_admin_all"
on public.payments for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- support
drop policy if exists "support_admin_select" on public.customer_support;
drop policy if exists "support_admin_update" on public.customer_support;
create policy "support_admin_select"
on public.customer_support for select to authenticated
using (public.is_admin());
create policy "support_admin_update"
on public.customer_support for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- notifications
drop policy if exists "notifications_admin_insert" on public.notifications;
create policy "notifications_admin_insert"
on public.notifications for insert to authenticated
with check (public.is_admin());

-- Promote one existing member to administrator by replacing the email below.
-- update public.profiles set role = 'admin' where email = 'YOUR_ADMIN_EMAIL';
