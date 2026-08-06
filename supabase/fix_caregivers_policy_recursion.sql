-- Fix CareTak RLS recursion between caregivers, matching and care_requests.
-- Run once in the Supabase SQL editor.

create or replace function public.is_own_caregiver(target_caregiver_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.caregivers c
    where c.id = target_caregiver_id and c.user_id = auth.uid()
  );
$$;

create or replace function public.guardian_can_view_caregiver(target_caregiver_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matching m
    join public.care_requests cr on cr.id = m.request_id
    join public.guardians g on g.id = cr.guardian_id
    where m.caregiver_id = target_caregiver_id
      and g.user_id = auth.uid()
  );
$$;

create or replace function public.caregiver_can_view_request(target_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matching m
    join public.caregivers c on c.id = m.caregiver_id
    where m.request_id = target_request_id
      and c.user_id = auth.uid()
  );
$$;

grant execute on function public.is_own_caregiver(uuid) to authenticated;
grant execute on function public.guardian_can_view_caregiver(uuid) to authenticated;
grant execute on function public.caregiver_can_view_request(uuid) to authenticated;

drop policy if exists "matching_caregiver_read" on public.matching;
create policy "matching_caregiver_read"
on public.matching for select to authenticated
using (public.is_own_caregiver(caregiver_id));

drop policy if exists "matching_caregiver_update" on public.matching;
create policy "matching_caregiver_update"
on public.matching for update to authenticated
using (public.is_own_caregiver(caregiver_id))
with check (
  public.is_own_caregiver(caregiver_id)
  and status in ('accepted', 'rejected', 'active', 'completed')
);

drop policy if exists "care_requests_caregiver_assigned_read" on public.care_requests;
create policy "care_requests_caregiver_assigned_read"
on public.care_requests for select to authenticated
using (public.caregiver_can_view_request(id));

drop policy if exists "caregivers_guardian_matched_read" on public.caregivers;
create policy "caregivers_guardian_matched_read"
on public.caregivers for select to authenticated
using (public.guardian_can_view_caregiver(id));

-- An authenticated caregiver can always read their own profile row.
drop policy if exists "caregivers_own_read" on public.caregivers;
create policy "caregivers_own_read"
on public.caregivers for select to authenticated
using (user_id = auth.uid());
