-- CareTak assignment visibility and caregiver response policies

alter table public.matching enable row level security;

-- Recreate user-facing matching policies safely.
drop policy if exists "matching_guardian_read" on public.matching;
drop policy if exists "matching_caregiver_read" on public.matching;
drop policy if exists "matching_caregiver_update" on public.matching;

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
    select c.id
    from public.caregivers c
    where c.user_id = auth.uid()
  )
);

create policy "matching_caregiver_update"
on public.matching
for update
to authenticated
using (
  caregiver_id in (
    select c.id
    from public.caregivers c
    where c.user_id = auth.uid()
  )
)
with check (
  caregiver_id in (
    select c.id
    from public.caregivers c
    where c.user_id = auth.uid()
  )
  and status in ('accepted', 'rejected')
);

-- Users must be able to read the related request and caregiver rows for joined dashboard queries.
drop policy if exists "care_requests_caregiver_assigned_read" on public.care_requests;
create policy "care_requests_caregiver_assigned_read"
on public.care_requests
for select
to authenticated
using (
  id in (
    select m.request_id
    from public.matching m
    join public.caregivers c on c.id = m.caregiver_id
    where c.user_id = auth.uid()
  )
);

drop policy if exists "caregivers_guardian_matched_read" on public.caregivers;
create policy "caregivers_guardian_matched_read"
on public.caregivers
for select
to authenticated
using (
  id in (
    select m.caregiver_id
    from public.matching m
    join public.care_requests cr on cr.id = m.request_id
    join public.guardians g on g.id = cr.guardian_id
    where g.user_id = auth.uid()
  )
);

-- Notification creation helper for assignment changes.
create or replace function public.notify_matching_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  guardian_user_id uuid;
  caregiver_user_id uuid;
begin
  select g.user_id
  into guardian_user_id
  from public.care_requests cr
  join public.guardians g on g.id = cr.guardian_id
  where cr.id = new.request_id;

  select c.user_id
  into caregiver_user_id
  from public.caregivers c
  where c.id = new.caregiver_id;

  if tg_op = 'INSERT' then
    if caregiver_user_id is not null then
      insert into public.notifications(user_id, title, message, is_read)
      values (caregiver_user_id, '새 간병 배정 요청', '새로운 간병 일정이 배정되었습니다. 간병인 마이페이지에서 확인해 주세요.', false);
    end if;

    if guardian_user_id is not null then
      insert into public.notifications(user_id, title, message, is_read)
      values (guardian_user_id, '간병인 배정 진행', '간병인이 배정되어 응답을 기다리고 있습니다.', false);
    end if;
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if guardian_user_id is not null then
      insert into public.notifications(user_id, title, message, is_read)
      values (
        guardian_user_id,
        case when new.status = 'accepted' then '간병인 배정 확정' else '간병인 배정 상태 변경' end,
        case when new.status = 'accepted' then '간병인이 배정을 수락했습니다.' when new.status = 'rejected' then '간병인이 배정을 거절했습니다. 새로운 간병인을 확인 중입니다.' else '배정 상태가 변경되었습니다.' end,
        false
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists matching_notification_trigger on public.matching;
create trigger matching_notification_trigger
after insert or update of status on public.matching
for each row execute function public.notify_matching_change();
