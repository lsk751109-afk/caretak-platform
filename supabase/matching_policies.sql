-- CareTak matching security and admin helper

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

alter table public.matching enable row level security;

-- Remove old policies when this script is run again.
drop policy if exists "matching_admin_all" on public.matching;
drop policy if exists "matching_guardian_read" on public.matching;
drop policy if exists "matching_caregiver_read" on public.matching;

create policy "matching_admin_all"
on public.matching
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "matching_guardian_read"
on public.matching
for select
to authenticated
using (
  request_id in (
    select cr.id
    from public.care_requests cr
    join public.guardians g on g.id = cr.guardian_id
    where g.user_id = auth.uid()
  )
);

create policy "matching_caregiver_read"
on public.matching
for select
to authenticated
using (
  caregiver_id in (
    select c.id from public.caregivers c where c.user_id = auth.uid()
  )
);

-- Admin access needed by the matching dashboard.
drop policy if exists "care_requests_admin_all" on public.care_requests;
create policy "care_requests_admin_all"
on public.care_requests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "caregivers_admin_all" on public.caregivers;
create policy "caregivers_admin_all"
on public.caregivers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select"
on public.profiles
for select
to authenticated
using (public.is_admin());

create unique index if not exists matching_request_unique_idx
on public.matching(request_id)
where status in ('matching', 'assigned', 'active');
