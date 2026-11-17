-- Admin area, gifted plans, suspended accounts, archive and trash for codes.

-- ─────────────────────────────── profiles ───────────────────────────────
alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'admin')),
  add column plan_until timestamptz,
  add column plan_source text not null default 'free' check (plan_source in ('free', 'paid', 'gift')),
  add column plan_note text,
  add column suspended_at timestamptz,
  add column suspended_reason text;

-- Emails that become admins automatically (the owner's account).
create table public.admin_emails (email text primary key);
alter table public.admin_emails enable row level security;
insert into public.admin_emails (email) values ('info@qlickqr.com');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    case when exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email)) then 'admin' else 'user' end
  );
  return new;
end;
$$;

update public.profiles p set role = 'admin'
from auth.users u where u.id = p.id and lower(u.email) in (select lower(email) from public.admin_emails);

create function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' and suspended_at is null from public.profiles where id = auth.uid()), false);
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- The plan that counts right now: a gift or paid plan falls back to free after plan_until.
create function public.effective_plan(p_user uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case when p.plan_until is not null and p.plan_until < now() then 'free' else p.plan end
  from public.profiles p where p.id = p_user;
$$;
revoke execute on function public.effective_plan(uuid) from public, anon, authenticated;

-- ─────────────────────────────── qr_codes ───────────────────────────────
alter table public.qr_codes
  add column archived_at timestamptz,
  add column deleted_at timestamptz,
  add column locked_at timestamptz,
  add column locked_reason text;

create index qr_codes_deleted_idx on public.qr_codes (deleted_at) where deleted_at is not null;

-- Owners may archive and move codes to the trash (RLS keeps it to their own rows).
grant update (archived_at, deleted_at) on public.qr_codes to authenticated;

-- A code locked by an admin cannot be switched back on by its owner.
create function public.guard_code_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.locked_at is not null and not public.is_admin() then
    if new.status is distinct from old.status then
      raise exception 'CODE_LOCKED' using errcode = 'P0001';
    end if;
  end if;
  -- restoring from the trash counts against the plan again
  if old.deleted_at is not null and new.deleted_at is null and new.mode = 'dynamic' and new.user_id is not null and not public.is_admin() then
    if (select count(*) from public.qr_codes where user_id = new.user_id and mode = 'dynamic' and deleted_at is null) >= coalesce(public.plan_dynamic_limit(coalesce(public.effective_plan(new.user_id), 'free')), 2147483647) then
      raise exception 'PLAN_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_code_update() from public, anon, authenticated;
create trigger qr_codes_guard before update on public.qr_codes
  for each row execute function public.guard_code_update();

-- Plan limit: effective plan, trash does not count, suspended accounts cannot create.
create or replace function public.enforce_dynamic_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_limit integer;
  v_count integer;
begin
  if new.user_id is not null and exists (select 1 from public.profiles where id = new.user_id and suspended_at is not null) then
    raise exception 'ACCOUNT_SUSPENDED' using errcode = 'P0001';
  end if;
  if new.mode <> 'dynamic' or new.user_id is null then
    return new;
  end if;
  v_limit := public.plan_dynamic_limit(coalesce(public.effective_plan(new.user_id), 'free'));
  select count(*) into v_count from public.qr_codes where user_id = new.user_id and mode = 'dynamic' and deleted_at is null;
  if v_limit is not null and v_count >= v_limit then
    raise exception 'PLAN_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- What a scanner sees: deleted codes are gone, locked codes and suspended owners read as paused.
drop function public.public_code(text);
create function public.public_code(p_slug text)
returns table (id uuid, slug text, name text, type text, mode text, status text, content jsonb, branding boolean)
language sql stable security definer set search_path = '' as $$
  select c.id, c.slug, c.name, c.type, c.mode,
    case when c.locked_at is not null or p.suspended_at is not null then 'paused' else c.status end,
    c.content,
    coalesce(public.effective_plan(c.user_id), 'free') = 'free'
  from public.qr_codes c left join public.profiles p on p.id = c.user_id
  where c.slug = p_slug and c.mode = 'dynamic' and c.deleted_at is null;
$$;
revoke execute on function public.public_code from public;
grant execute on function public.public_code to anon, authenticated, service_role;

-- The dashboard summary ignores the trash.
create or replace function public.dashboard_summary()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'codes', (select count(*) from public.qr_codes where deleted_at is null),
    'dynamic', (select count(*) from public.qr_codes where mode = 'dynamic' and deleted_at is null),
    'scans_total', (select coalesce(sum(scan_count), 0) from public.qr_codes where deleted_at is null),
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

-- ──────────────────────────────── audit ─────────────────────────────────
create table public.admin_audit (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_user uuid,
  target_code uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_time_idx on public.admin_audit (created_at desc);
alter table public.admin_audit enable row level security;
create policy "audit: admins read" on public.admin_audit for select to authenticated using (public.is_admin());
revoke insert, update, delete on public.admin_audit from authenticated, anon;

create function public.audit(p_action text, p_user uuid, p_code uuid, p_details jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.admin_audit (admin_id, action, target_user, target_code, details) values (auth.uid(), p_action, p_user, p_code, coalesce(p_details, '{}'::jsonb));
$$;
revoke execute on function public.audit(text, uuid, uuid, jsonb) from public, anon, authenticated;

create function public.require_admin()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = '42501';
  end if;
end;
$$;
revoke execute on function public.require_admin() from public, anon, authenticated;

-- ───────────────────────────── admin: read ──────────────────────────────
create function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return jsonb_build_object(
    'users', (select count(*) from auth.users),
    'users_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'users_30d', (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'active_7d', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
    'suspended', (select count(*) from public.profiles where suspended_at is not null),
    'gifts', (select count(*) from public.profiles where plan_source = 'gift' and plan <> 'free' and (plan_until is null or plan_until > now())),
    'plans', (select coalesce(jsonb_object_agg(pl, n), '{}'::jsonb) from (select coalesce(public.effective_plan(id), 'free') pl, count(*) n from public.profiles group by 1) t),
    'codes', (select count(*) from public.qr_codes where deleted_at is null),
    'codes_dynamic', (select count(*) from public.qr_codes where deleted_at is null and mode = 'dynamic'),
    'codes_guest', (select count(*) from public.qr_codes where deleted_at is null and user_id is null),
    'codes_trash', (select count(*) from public.qr_codes where deleted_at is not null),
    'codes_paused', (select count(*) from public.qr_codes where deleted_at is null and (status = 'paused' or locked_at is not null)),
    'scans_total', (select coalesce(sum(scan_count), 0) from public.qr_codes),
    'scans_7d', (select count(*) from public.scans where scanned_at > now() - interval '7 days'),
    'scans_today', (select count(*) from public.scans where scanned_at >= date_trunc('day', now() at time zone 'Europe/Berlin') at time zone 'Europe/Berlin'),
    'signups_series', (
      select coalesce(jsonb_agg(coalesce(c.n, 0) order by d.d), '[]'::jsonb)
      from generate_series((now() - interval '29 days')::date, now()::date, interval '1 day') as d(d)
      left join (select created_at::date as day, count(*) n from auth.users where created_at > now() - interval '30 days' group by 1) c on c.day = d.d::date
    ),
    'scans_series', (
      select coalesce(jsonb_agg(coalesce(c.n, 0) order by d.d), '[]'::jsonb)
      from generate_series((now() - interval '29 days')::date, now()::date, interval '1 day') as d(d)
      left join (select scanned_at::date as day, count(*) n from public.scans where scanned_at > now() - interval '30 days' group by 1) c on c.day = d.d::date
    ),
    'types', (select coalesce(jsonb_agg(jsonb_build_object('type', type, 'n', n) order by n desc), '[]'::jsonb) from (select type, count(*) n from public.qr_codes where deleted_at is null group by type) t)
  );
end;
$$;

create function public.admin_users(p_search text default '', p_filter text default 'all', p_limit integer default 50, p_offset integer default 0)
returns table (
  id uuid, email text, full_name text, role text, provider text, created_at timestamptz, last_sign_in_at timestamptz, email_confirmed boolean,
  plan text, effective_plan text, plan_until timestamptz, plan_source text, plan_note text, suspended_at timestamptz, suspended_reason text,
  codes bigint, dynamic_codes bigint, scans bigint, total bigint
) language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return query
  with base as (
    select u.id, u.email::text, p.full_name, p.role, coalesce(u.raw_app_meta_data ->> 'provider', 'email') provider,
      u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null email_confirmed,
      p.plan, coalesce(public.effective_plan(u.id), 'free') eplan, p.plan_until, p.plan_source, p.plan_note, p.suspended_at, p.suspended_reason
    from auth.users u join public.profiles p on p.id = u.id
    where (coalesce(p_search, '') = '' or u.email ilike '%' || p_search || '%' or p.full_name ilike '%' || p_search || '%')
  ), filtered as (
    select * from base b where case p_filter
      when 'paid' then b.plan_source = 'paid'
      when 'gift' then b.plan_source = 'gift' and b.eplan <> 'free'
      when 'free' then b.eplan = 'free'
      when 'suspended' then b.suspended_at is not null
      when 'admin' then b.role = 'admin'
      else true end
  )
  select f.id, f.email, f.full_name, f.role, f.provider, f.created_at, f.last_sign_in_at, f.email_confirmed,
    f.plan, f.eplan, f.plan_until, f.plan_source, f.plan_note, f.suspended_at, f.suspended_reason,
    (select count(*) from public.qr_codes c where c.user_id = f.id and c.deleted_at is null),
    (select count(*) from public.qr_codes c where c.user_id = f.id and c.deleted_at is null and c.mode = 'dynamic'),
    (select coalesce(sum(c.scan_count), 0) from public.qr_codes c where c.user_id = f.id)::bigint,
    count(*) over ()
  from filtered f
  order by f.created_at desc
  limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0);
end;
$$;

create function public.admin_codes(p_search text default '', p_filter text default 'all', p_user uuid default null, p_limit integer default 50, p_offset integer default 0)
returns table (
  id uuid, slug text, name text, type text, mode text, status text, user_id uuid, owner_email text,
  scan_count integer, last_scanned_at timestamptz, created_at timestamptz, updated_at timestamptz,
  archived_at timestamptz, deleted_at timestamptz, locked_at timestamptz, locked_reason text, total bigint
) language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return query
  select c.id, c.slug, c.name, c.type, c.mode, c.status, c.user_id, u.email::text,
    c.scan_count, c.last_scanned_at, c.created_at, c.updated_at, c.archived_at, c.deleted_at, c.locked_at, c.locked_reason,
    count(*) over ()
  from public.qr_codes c left join auth.users u on u.id = c.user_id
  where (p_user is null or c.user_id = p_user)
    and (coalesce(p_search, '') = '' or c.name ilike '%' || p_search || '%' or c.slug ilike '%' || p_search || '%' or u.email ilike '%' || p_search || '%')
    and case p_filter
      when 'trash' then c.deleted_at is not null
      when 'archived' then c.deleted_at is null and c.archived_at is not null
      when 'paused' then c.deleted_at is null and (c.status = 'paused' or c.locked_at is not null)
      when 'locked' then c.locked_at is not null
      when 'guest' then c.deleted_at is null and c.user_id is null
      when 'dynamic' then c.deleted_at is null and c.mode = 'dynamic'
      else c.deleted_at is null end
  order by coalesce(c.deleted_at, c.created_at) desc
  limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0);
end;
$$;

create function public.admin_audit_log(p_limit integer default 100)
returns table (id bigint, created_at timestamptz, action text, admin_email text, target_email text, target_code text, details jsonb)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return query
  select a.id, a.created_at, a.action, au.email::text, tu.email::text, c.name, a.details
  from public.admin_audit a
  left join auth.users au on au.id = a.admin_id
  left join auth.users tu on tu.id = a.target_user
  left join public.qr_codes c on c.id = a.target_code
  order by a.created_at desc limit least(greatest(p_limit, 1), 500);
end;
$$;

-- ──────────────────────────── admin: actions ────────────────────────────
create function public.admin_set_plan(p_user uuid, p_plan text, p_until timestamptz, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin();
  if p_plan not in ('free', 'start', 'pro', 'business') then
    raise exception 'BAD_PLAN' using errcode = 'P0001';
  end if;
  update public.profiles
  set plan = p_plan,
      plan_until = case when p_plan = 'free' then null else p_until end,
      plan_source = case when p_plan = 'free' then 'free' else 'gift' end,
      plan_note = nullif(trim(coalesce(p_note, '')), '')
  where id = p_user;
  perform public.audit(case when p_plan = 'free' then 'plan.reset' else 'plan.gift' end, p_user, null,
    jsonb_build_object('plan', p_plan, 'until', p_until, 'note', p_note));
end;
$$;

create function public.admin_suspend_user(p_user uuid, p_suspend boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin();
  if p_user = auth.uid() then
    raise exception 'NOT_SELF' using errcode = 'P0001';
  end if;
  update public.profiles
  set suspended_at = case when p_suspend then now() else null end,
      suspended_reason = case when p_suspend then nullif(trim(coalesce(p_reason, '')), '') else null end
  where id = p_user;
  perform public.audit(case when p_suspend then 'user.suspend' else 'user.unsuspend' end, p_user, null, jsonb_build_object('reason', p_reason));
end;
$$;

create function public.admin_set_role(p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin();
  if p_role not in ('user', 'admin') then
    raise exception 'BAD_ROLE' using errcode = 'P0001';
  end if;
  if p_user = auth.uid() and p_role <> 'admin' then
    raise exception 'NOT_SELF' using errcode = 'P0001';
  end if;
  update public.profiles set role = p_role where id = p_user;
  perform public.audit('user.role', p_user, null, jsonb_build_object('role', p_role));
end;
$$;

create function public.admin_code_action(p_code uuid, p_action text, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
begin
  perform public.require_admin();
  select user_id into v_user from public.qr_codes where id = p_code;
  case p_action
    when 'pause' then update public.qr_codes set status = 'paused' where id = p_code;
    when 'resume' then update public.qr_codes set status = 'active' where id = p_code;
    when 'lock' then update public.qr_codes set locked_at = now(), locked_reason = nullif(trim(coalesce(p_reason, '')), '') where id = p_code;
    when 'unlock' then update public.qr_codes set locked_at = null, locked_reason = null where id = p_code;
    when 'archive' then update public.qr_codes set archived_at = now() where id = p_code;
    when 'unarchive' then update public.qr_codes set archived_at = null where id = p_code;
    when 'trash' then update public.qr_codes set deleted_at = now() where id = p_code;
    when 'restore' then update public.qr_codes set deleted_at = null where id = p_code;
    when 'purge' then delete from public.qr_codes where id = p_code and deleted_at is not null;
    else raise exception 'BAD_ACTION' using errcode = 'P0001';
  end case;
  perform public.audit('code.' || p_action, v_user, case when p_action = 'purge' then null else p_code end, jsonb_build_object('reason', p_reason, 'code', p_code));
end;
$$;

revoke execute on function public.admin_overview(), public.admin_users(text, text, integer, integer), public.admin_codes(text, text, uuid, integer, integer),
  public.admin_audit_log(integer), public.admin_set_plan(uuid, text, timestamptz, text), public.admin_suspend_user(uuid, boolean, text),
  public.admin_set_role(uuid, text), public.admin_code_action(uuid, text, text) from public, anon;
grant execute on function public.admin_overview(), public.admin_users(text, text, integer, integer), public.admin_codes(text, text, uuid, integer, integer),
  public.admin_audit_log(integer), public.admin_set_plan(uuid, text, timestamptz, text), public.admin_suspend_user(uuid, boolean, text),
  public.admin_set_role(uuid, text), public.admin_code_action(uuid, text, text) to authenticated;

-- ───────────────────────── trash: empty after 30 days ───────────────────
create function public.purge_trash()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  n integer;
begin
  delete from public.qr_codes where deleted_at < now() - interval '30 days';
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.purge_trash() from public, anon, authenticated;

do $do$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('purge-qr-trash', '17 3 * * *', 'select public.purge_trash()');
  end if;
end
$do$;
