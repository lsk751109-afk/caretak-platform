-- CareTak CMS tables and RLS policies
-- Run once in Supabase SQL Editor after admin policies are installed.

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  link_url text,
  image_url text,
  is_active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notices enable row level security;
alter table public.faqs enable row level security;
alter table public.site_banners enable row level security;

drop policy if exists "notices_public_select" on public.notices;
create policy "notices_public_select" on public.notices
for select using (is_published or public.is_admin());

drop policy if exists "notices_admin_all" on public.notices;
create policy "notices_admin_all" on public.notices
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "faqs_public_select" on public.faqs;
create policy "faqs_public_select" on public.faqs
for select using (is_published or public.is_admin());

drop policy if exists "faqs_admin_all" on public.faqs;
create policy "faqs_admin_all" on public.faqs
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "banners_public_select" on public.site_banners;
create policy "banners_public_select" on public.site_banners
for select using (
  is_active
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
  or public.is_admin()
);

drop policy if exists "banners_admin_all" on public.site_banners;
create policy "banners_admin_all" on public.site_banners
for all to authenticated using (public.is_admin()) with check (public.is_admin());
