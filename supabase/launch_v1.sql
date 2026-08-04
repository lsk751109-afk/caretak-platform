-- CareTak v1 launch workflow
-- Run once in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Extend core operational tables without destroying existing data.
alter table public.care_requests add column if not exists estimated_amount bigint default 0;
alter table public.care_requests add column if not exists is_vip boolean not null default false;
alter table public.care_requests add column if not exists assigned_caregiver_id uuid;
alter table public.care_requests add column if not exists matched_at timestamptz;
alter table public.care_requests add column if not exists service_started_at timestamptz;
alter table public.care_requests add column if not exists service_completed_at timestamptz;
alter table public.care_requests add column if not exists updated_at timestamptz not null default now();

alter table public.caregivers add column if not exists profile_image_url text;
alter table public.caregivers add column if not exists certificates text[] not null default '{}';
alter table public.caregivers add column if not exists service_regions text[] not null default '{}';
alter table public.caregivers add column if not exists rating numeric(3,2) not null default 0;
alter table public.caregivers add column if not exists review_count integer not null default 0;
alter table public.caregivers add column if not exists is_vip boolean not null default false;
alter table public.caregivers add column if not exists available boolean not null default true;

alter table public.payments add column if not exists paid_at timestamptz;
alter table public.payments add column if not exists refunded_at timestamptz;
alter table public.payments add column if not exists provider_payment_id text;
alter table public.payments add column if not exists receipt_url text;

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  channel text not null check (channel in ('in_app','sms','kakao','email')),
  recipient text,
  template_code text,
  title text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','cancelled')),
  attempts integer not null default 0,
  last_error text,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.service_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.care_requests(id) on delete cascade,
  actor_id uuid,
  event_type text not null,
  previous_status text,
  next_status text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_outbox_pending on public.notification_outbox(status, scheduled_at);
create index if not exists idx_service_events_request on public.service_events(request_id, created_at desc);
create index if not exists idx_care_requests_status on public.care_requests(request_status, created_at desc);
create index if not exists idx_payments_status on public.payments(payment_status, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists care_requests_set_updated_at on public.care_requests;
create trigger care_requests_set_updated_at before update on public.care_requests
for each row execute function public.set_updated_at();

create or replace function public.log_care_request_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.request_status is distinct from new.request_status then
    insert into public.service_events(request_id, actor_id, event_type, previous_status, next_status)
    values (new.id, auth.uid(), 'status_changed', old.request_status, new.request_status);

    if new.request_status = 'matched' then new.matched_at = coalesce(new.matched_at, now()); end if;
    if new.request_status = 'active' then new.service_started_at = coalesce(new.service_started_at, now()); end if;
    if new.request_status = 'completed' then new.service_completed_at = coalesce(new.service_completed_at, now()); end if;
  end if;
  return new;
end;
$$;

drop trigger if exists care_requests_status_audit on public.care_requests;
create trigger care_requests_status_audit before update on public.care_requests
for each row execute function public.log_care_request_status_change();

create or replace view public.admin_operations_summary as
select
  count(*) filter (where cr.created_at::date = current_date) as today_requests,
  count(*) filter (where cr.request_status in ('waiting','reviewing','matching')) as pending_requests,
  count(*) filter (where cr.request_status = 'active') as active_services,
  count(*) filter (where cr.request_status = 'completed') as completed_services,
  count(*) filter (where cr.is_vip = true) as vip_requests,
  coalesce((select count(*) from public.caregivers c where c.status = 'waiting'), 0) as pending_caregivers,
  coalesce((select count(*) from public.payments p where p.payment_status in ('ready','pending')), 0) as pending_payments,
  coalesce((select sum(p.amount) from public.payments p where p.payment_status = 'paid' and p.created_at::date = current_date), 0) as today_revenue,
  coalesce((select sum(p.amount) from public.payments p where p.payment_status = 'paid' and date_trunc('month', p.created_at) = date_trunc('month', now())), 0) as month_revenue
from public.care_requests cr;

alter table public.notification_outbox enable row level security;
alter table public.service_events enable row level security;

drop policy if exists notification_outbox_admin_all on public.notification_outbox;
create policy notification_outbox_admin_all on public.notification_outbox for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists notification_outbox_own_select on public.notification_outbox;
create policy notification_outbox_own_select on public.notification_outbox for select to authenticated
using (user_id = auth.uid());

drop policy if exists service_events_admin_all on public.service_events;
create policy service_events_admin_all on public.service_events for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Queue in-app/SMS/Kakao/email notifications from application code by inserting rows here.
-- External delivery requires provider credentials in Vercel; the dispatch API handles that separately.
