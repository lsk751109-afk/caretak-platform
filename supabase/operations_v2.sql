-- CareTak operations v2
-- Run once in Supabase SQL Editor after launch_v1.sql.

alter table public.payments add column if not exists settlement_status text not null default 'waiting';
alter table public.payments add column if not exists settlement_amount bigint;
alter table public.payments add column if not exists settled_at timestamptz;
alter table public.payments add column if not exists settlement_note text;

-- Prevent duplicate payment requests for one care request.
create unique index if not exists payments_request_unique on public.payments(request_id);

create or replace function public.queue_caretak_notification(
  target_user_id uuid,
  notification_title text,
  notification_message text,
  target_phone text default null,
  template_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id is not null then
    insert into public.notifications(user_id, title, message, is_read)
    values (target_user_id, notification_title, notification_message, false);
  end if;

  if to_regclass('public.notification_outbox') is not null then
    insert into public.notification_outbox(user_id, channel, recipient, template_code, title, message, status)
    values (target_user_id, 'in_app', null, template_name, notification_title, notification_message, 'pending');

    if target_phone is not null and length(trim(target_phone)) > 0 then
      insert into public.notification_outbox(user_id, channel, recipient, template_code, title, message, status)
      values (target_user_id, 'sms', target_phone, template_name, notification_title, notification_message, 'pending');
    end if;
  end if;
end;
$$;

create or replace function public.handle_matching_status_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.care_requests%rowtype;
  guardian_user uuid;
  guardian_phone text;
  caregiver_name text;
  pay_amount bigint;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  select * into req from public.care_requests where id = new.request_id;
  select g.user_id, g.phone into guardian_user, guardian_phone
  from public.guardians g where g.id = req.guardian_id;
  select c.name into caregiver_name from public.caregivers c where c.id = new.caregiver_id;

  if new.status = 'assigned' then
    update public.care_requests
      set assigned_caregiver_id = new.caregiver_id,
          request_status = 'matching',
          matched_at = coalesce(matched_at, now())
      where id = new.request_id;

  elsif new.status = 'accepted' then
    update public.care_requests
      set assigned_caregiver_id = new.caregiver_id,
          request_status = 'matched',
          matched_at = coalesce(matched_at, now())
      where id = new.request_id;

    pay_amount := greatest(coalesce(req.estimated_amount, 0), 0);
    insert into public.payments(request_id, amount, payment_status, payment_method)
    values (new.request_id, pay_amount, 'ready', 'card')
    on conflict (request_id) do update
      set amount = excluded.amount,
          payment_status = case when public.payments.payment_status = 'paid' then 'paid' else 'ready' end;

    perform public.queue_caretak_notification(
      guardian_user,
      '간병인 배정이 확정되었습니다',
      coalesce(caregiver_name, '담당 간병인') || '님이 배정을 수락했습니다. 결제 페이지에서 결제를 진행해주세요.',
      guardian_phone,
      'MATCH_ACCEPTED'
    );

  elsif new.status = 'rejected' then
    update public.care_requests
      set assigned_caregiver_id = null,
          request_status = 'matching'
      where id = new.request_id;

    perform public.queue_caretak_notification(
      guardian_user,
      '간병인 재매칭을 진행합니다',
      '배정된 간병인이 일정을 수락하지 못해 새로운 간병인을 찾고 있습니다.',
      guardian_phone,
      'MATCH_REJECTED'
    );

  elsif new.status = 'active' then
    update public.care_requests
      set request_status = 'active', service_started_at = coalesce(service_started_at, now())
      where id = new.request_id;

  elsif new.status = 'completed' then
    update public.care_requests
      set request_status = 'completed', service_completed_at = coalesce(service_completed_at, now())
      where id = new.request_id;
  end if;

  return new;
end;
$$;

drop trigger if exists matching_status_workflow on public.matching;
create trigger matching_status_workflow
after update of status on public.matching
for each row execute function public.handle_matching_status_workflow();

create or replace function public.handle_payment_paid_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  guardian_user uuid;
  guardian_phone text;
  req_name text;
begin
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    new.paid_at := coalesce(new.paid_at, now());
    new.settlement_status := case when new.settlement_status = 'completed' then 'completed' else 'waiting' end;
    new.settlement_amount := coalesce(new.settlement_amount, floor(coalesce(new.amount, 0) * 0.85));

    select g.user_id, g.phone, cr.patient_name
      into guardian_user, guardian_phone, req_name
    from public.care_requests cr
    join public.guardians g on g.id = cr.guardian_id
    where cr.id = new.request_id;

    perform public.queue_caretak_notification(
      guardian_user,
      '결제가 완료되었습니다',
      coalesce(req_name, '환자') || '님의 간병 서비스 결제가 정상적으로 완료되었습니다.',
      guardian_phone,
      'PAYMENT_PAID'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists payment_paid_workflow on public.payments;
create trigger payment_paid_workflow
before update of payment_status on public.payments
for each row execute function public.handle_payment_paid_workflow();

-- Admin settlement operation, callable only by administrators.
create or replace function public.complete_settlement(target_payment_id uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'administrator permission required';
  end if;

  update public.payments
  set settlement_status = 'completed',
      settled_at = now(),
      settlement_note = note,
      settlement_amount = coalesce(settlement_amount, floor(coalesce(amount, 0) * 0.85))
  where id = target_payment_id and payment_status = 'paid';
end;
$$;

grant execute on function public.complete_settlement(uuid, text) to authenticated;
