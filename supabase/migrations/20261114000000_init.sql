-- Scanwerk: initial schema
-- Tables: profiles, qr_codes, scans. Storage bucket: assets.
-- Every table has RLS. Scans are only written by the server (service role).

-- ─────────────────────────────── profiles ───────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'business', 'agency')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Users may change their name, never their plan.
revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Limit of dynamic codes per plan (null = unlimited). Keep in sync with src/lib/plans.ts
create function public.plan_dynamic_limit(p_plan text)
returns integer language sql immutable as $$
  select case p_plan
    when 'free' then 1
    when 'starter' then 10
    when 'business' then 100
    when 'agency' then 1000
    else 1
  end;
$$;

-- ─────────────────────────────── qr_codes ───────────────────────────────
create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[A-Za-z0-9_-]{4,64}$'),
  type text not null,
  mode text not null check (mode in ('dynamic', 'static')),
  content jsonb not null default '{}'::jsonb,
  style jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'paused')),
  scan_count integer not null default 0,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index qr_codes_user_created_idx on public.qr_codes (user_id, created_at desc);

alter table public.qr_codes enable row level security;

create policy "codes: read own" on public.qr_codes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "codes: insert own" on public.qr_codes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "codes: update own" on public.qr_codes
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "codes: delete own" on public.qr_codes
  for delete to authenticated using (user_id = (select auth.uid()));

-- The slug is printed on paper: it can never change. Counters are server-only.
revoke insert, update on public.qr_codes from authenticated, anon;
grant insert (name, slug, type, mode, content, style, status) on public.qr_codes to authenticated;
grant update (name, content, style, status) on public.qr_codes to authenticated;

create function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger qr_codes_touch before update on public.qr_codes
  for each row execute function public.touch_updated_at();

-- Enforce the plan's dynamic code limit in the database, not only in the UI.
create function public.enforce_dynamic_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_plan text;
  v_limit integer;
  v_count integer;
begin
  if new.mode <> 'dynamic' then
    return new;
  end if;
  select plan into v_plan from public.profiles where id = new.user_id;
  v_limit := public.plan_dynamic_limit(coalesce(v_plan, 'free'));
  select count(*) into v_count from public.qr_codes where user_id = new.user_id and mode = 'dynamic';
  if v_limit is not null and v_count >= v_limit then
    raise exception 'PLAN_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger qr_codes_limit before insert on public.qr_codes
  for each row execute function public.enforce_dynamic_limit();

-- ───────────────────────────────── scans ────────────────────────────────
-- Privacy by design: no IP addresses, no cookies. visitor_hash is a daily
-- salted hash, so a visitor cannot be followed across days.
create table public.scans (
  id bigint generated always as identity primary key,
  code_id uuid not null references public.qr_codes (id) on delete cascade,
  scanned_at timestamptz not null default now(),
  country text,
  city text,
  device text,
  os text,
  browser text,
  language text,
  visitor_hash text,
  is_unique boolean not null default false
);

create index scans_code_time_idx on public.scans (code_id, scanned_at desc);

alter table public.scans enable row level security;

create policy "scans: read own codes" on public.scans
  for select to authenticated using (
    exists (select 1 from public.qr_codes c where c.id = scans.code_id and c.user_id = (select auth.uid()))
  );

revoke insert, update, delete on public.scans from authenticated, anon;

create function public.record_scan(
  p_code_id uuid,
  p_country text,
  p_city text,
  p_device text,
  p_os text,
  p_browser text,
  p_language text,
  p_visitor_hash text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_unique boolean;
begin
  select not exists (
    select 1 from public.scans
    where code_id = p_code_id and visitor_hash = p_visitor_hash
      and scanned_at > now() - interval '24 hours'
  ) into v_unique;

  insert into public.scans (code_id, country, city, device, os, browser, language, visitor_hash, is_unique)
  values (p_code_id, p_country, p_city, p_device, p_os, p_browser, p_language, p_visitor_hash, v_unique);

  update public.qr_codes
  set scan_count = scan_count + 1, last_scanned_at = now()
  where id = p_code_id;
end;
$$;

revoke execute on function public.record_scan from public, anon, authenticated;
grant execute on function public.record_scan to service_role;

-- ─────────────────────────────── analytics ──────────────────────────────
-- Runs with the caller's rights, so RLS limits it to the user's own codes.
create function public.code_stats(p_code_id uuid, p_days integer default 30)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with s as (
    select * from public.scans
    where code_id = p_code_id and scanned_at > now() - make_interval(days => p_days)
  ),
  days as (
    select generate_series((now() - make_interval(days => p_days - 1))::date, now()::date, interval '1 day')::date as d
  )
  select jsonb_build_object(
    'total', (select count(*) from s),
    'unique', (select count(*) from s where is_unique),
    'series', (
      select coalesce(jsonb_agg(jsonb_build_object('date', d, 'scans', coalesce(c.n, 0)) order by d), '[]'::jsonb)
      from days left join (select scanned_at::date as day, count(*) n from s group by 1) c on c.day = days.d
    ),
    'devices', (select coalesce(jsonb_agg(x order by (x->>'n')::int desc), '[]'::jsonb) from (select jsonb_build_object('label', coalesce(device, 'Unbekannt'), 'n', count(*)) x from s group by device) t),
    'os', (select coalesce(jsonb_agg(x order by (x->>'n')::int desc), '[]'::jsonb) from (select jsonb_build_object('label', coalesce(os, 'Unbekannt'), 'n', count(*)) x from s group by os) t),
    'countries', (select coalesce(jsonb_agg(x order by (x->>'n')::int desc), '[]'::jsonb) from (select jsonb_build_object('label', coalesce(country, '–'), 'n', count(*)) x from s group by country order by count(*) desc limit 10) t),
    'cities', (select coalesce(jsonb_agg(x order by (x->>'n')::int desc), '[]'::jsonb) from (select jsonb_build_object('label', coalesce(city, '–'), 'n', count(*)) x from s group by city order by count(*) desc limit 10) t),
    'hours', (select coalesce(jsonb_agg(jsonb_build_object('hour', h, 'n', coalesce(c.n, 0)) order by h), '[]'::jsonb)
              from generate_series(0, 23) h left join (select extract(hour from scanned_at at time zone 'Europe/Berlin')::int hr, count(*) n from s group by 1) c on c.hr = h)
  );
$$;

create function public.dashboard_summary()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'codes', (select count(*) from public.qr_codes),
    'dynamic', (select count(*) from public.qr_codes where mode = 'dynamic'),
    'scans_total', (select coalesce(sum(scan_count), 0) from public.qr_codes),
    'scans_7d', (select count(*) from public.scans where scanned_at > now() - interval '7 days'),
    'scans_prev_7d', (select count(*) from public.scans where scanned_at between now() - interval '14 days' and now() - interval '7 days'),
    'scans_today', (select count(*) from public.scans where scanned_at >= date_trunc('day', now() at time zone 'Europe/Berlin') at time zone 'Europe/Berlin'),
    'series', (
      select coalesce(jsonb_agg(coalesce(c.n, 0) order by d.d), '[]'::jsonb)
      from generate_series((now() - interval '13 days')::date, now()::date, interval '1 day') as d(d)
      left join (select scanned_at::date as day, count(*) n from public.scans where scanned_at > now() - interval '14 days' group by 1) c on c.day = d.d::date
    )
  );
$$;

grant execute on function public.code_stats(uuid, integer) to authenticated;
grant execute on function public.dashboard_summary() to authenticated;

-- ──────────────────────────────── storage ───────────────────────────────
-- Public bucket for PDFs and images shown on hosted pages. Files live under <user_id>/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assets', 'assets', true, 20971520, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "assets: upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "assets: update own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "assets: delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
