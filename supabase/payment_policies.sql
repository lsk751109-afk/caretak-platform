-- CareTak payment preparation and visibility policies

alter table public.payments enable row level security;

-- One payment row per care request.
create unique index if not exists payments_request_unique_idx
on public.payments(request_id);

-- Recreate payment policies safely.
drop policy if exists "payments_guardian_read" on public.payments;
drop policy if exists "payments_guardian_insert_ready" on public.payments;
drop policy if exists "payments_guardian_update_ready" on public.payments;
drop policy if exists "payments_admin_all" on public.payments;

create policy "payments_guardian_read"
on public.payments
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

-- A guardian may only create a payment preparation row for an accepted assignment.
create policy "payments_guardian_insert_ready"
on public.payments
for insert
to authenticated
with check (
  payment_status = 'ready'
  and transaction_id is null
  and request_id in (
    select cr.id
    from public.care_requests cr
    join public.guardians g on g.id = cr.guardian_id
    join public.matching m on m.request_id = cr.id
    where g.user_id = auth.uid()
      and m.status = 'accepted'
  )
);

-- Before PG approval, a guardian may only update preparation fields.
create policy "payments_guardian_update_ready"
on public.payments
for update
to authenticated
using (
  payment_status = 'ready'
  and request_id in (
    select cr.id
    from public.care_requests cr
    join public.guardians g on g.id = cr.guardian_id
    where g.user_id = auth.uid()
  )
)
with check (
  payment_status = 'ready'
  and transaction_id is null
  and request_id in (
    select cr.id
    from public.care_requests cr
    join public.guardians g on g.id = cr.guardian_id
    join public.matching m on m.request_id = cr.id
    where g.user_id = auth.uid()
      and m.status = 'accepted'
  )
);

-- Administrators can inspect and manage all payment rows.
create policy "payments_admin_all"
on public.payments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Notify the guardian when payment status is changed by the server/admin.
create or replace function public.notify_payment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  guardian_user_id uuid;
begin
  if tg_op = 'UPDATE' and old.payment_status is distinct from new.payment_status then
    select g.user_id
    into guardian_user_id
    from public.care_requests cr
    join public.guardians g on g.id = cr.guardian_id
    where cr.id = new.request_id;

    if guardian_user_id is not null then
      insert into public.notifications(user_id, title, message, is_read)
      values (
        guardian_user_id,
        case
          when new.payment_status = 'paid' then '결제 완료'
          when new.payment_status = 'failed' then '결제 실패'
          when new.payment_status = 'refunded' then '환불 완료'
          else '결제 상태 변경'
        end,
        case
          when new.payment_status = 'paid' then '간병 서비스 결제가 정상적으로 완료되었습니다.'
          when new.payment_status = 'failed' then '결제가 완료되지 않았습니다. 결제수단을 확인해 주세요.'
          when new.payment_status = 'refunded' then '결제 금액의 환불 처리가 완료되었습니다.'
          else '결제 처리 상태가 변경되었습니다.'
        end,
        false
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists payment_notification_trigger on public.payments;
create trigger payment_notification_trigger
after update of payment_status on public.payments
for each row execute function public.notify_payment_change();
