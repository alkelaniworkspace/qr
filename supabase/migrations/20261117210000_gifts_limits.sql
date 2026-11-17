-- Per-account code limit and gifts by e-mail (also for people without an account yet).

-- code_limit: null = plan default, -1 = unlimited, n >= 0 = exactly n dynamic codes.
alter table public.profiles add column code_limit integer check (code_limit is null or code_limit >= -1);

-- Dynamic-code limit that counts right now for a user (null = unlimited).
create function public.dynamic_limit(p_user uuid)
returns integer language sql stable security definer set search_path = '' as $$
  select case
    when p.code_limit = -1 then null
    when p.code_limit is not null then p.code_limit
    else public.plan_dynamic_limit(coalesce(public.effective_plan(p.id), 'free'))
  end
  from public.profiles p where p.id = p_user;
$$;
revoke execute on function public.dynamic_limit(uuid) from public, anon;
grant execute on function public.dynamic_limit(uuid) to authenticated;

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
  v_limit := public.dynamic_limit(new.user_id);
  select count(*) into v_count from public.qr_codes where user_id = new.user_id and mode = 'dynamic' and deleted_at is null;
  if v_limit is not null and v_count >= v_limit then
    raise exception 'PLAN_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create or replace function public.guard_code_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.locked_at is not null and not public.is_admin() then
    if new.status is distinct from old.status then
      raise exception 'CODE_LOCKED' using errcode = 'P0001';
    end if;
  end if;
  if old.deleted_at is not null and new.deleted_at is null and new.mode = 'dynamic' and new.user_id is not null and not public.is_admin() then
    if (select count(*) from public.qr_codes where user_id = new.user_id and mode = 'dynamic' and deleted_at is null) >= coalesce(public.dynamic_limit(new.user_id), 2147483647) then
      raise exception 'PLAN_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

-- ─────────────────────────────── gifts ───────────────────────────────
-- A gift for an e-mail address. Applied at once if the account exists, otherwise on sign-up.
create table public.plan_grants (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  plan text not null check (plan in ('start', 'pro', 'business')),
  months integer check (months is null or months > 0),   -- counted from the day it is applied
  until timestamptz,                                      -- or a fixed end date; both null = unlimited
  code_limit integer check (code_limit is null or code_limit >= -1),
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  claimed_by uuid references auth.users (id) on delete set null,
  claimed_at timestamptz,
  revoked_at timestamptz
);
create index plan_grants_email_idx on public.plan_grants (lower(email)) where claimed_at is null and revoked_at is null;
alter table public.plan_grants enable row level security;

create function public.apply_grant(p_grant uuid, p_user uuid)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare
  g public.plan_grants;
  v_until timestamptz;
begin
  select * into g from public.plan_grants where id = p_grant;
  v_until := coalesce(g.until, case when g.months is not null then now() + make_interval(months => g.months) end);
  update public.profiles
  set plan = g.plan, plan_until = v_until, plan_source = 'gift', plan_note = g.note,
      code_limit = coalesce(g.code_limit, code_limit)
  where id = p_user;
  update public.plan_grants set claimed_by = p_user, claimed_at = now() where id = p_grant;
  return v_until;
end;
$$;
revoke execute on function public.apply_grant(uuid, uuid) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_grant uuid;
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    case when exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email)) then 'admin' else 'user' end
  );
  select id into v_grant from public.plan_grants
  where lower(email) = lower(new.email) and claimed_at is null and revoked_at is null
  order by created_at desc limit 1;
  if v_grant is not null then
    perform public.apply_grant(v_grant, new.id);
  end if;
  return new;
end;
$$;

-- Admin: gift a plan to an e-mail address. Returns whether it was applied or is waiting for sign-up.
create function public.admin_gift_email(p_email text, p_plan text, p_months integer, p_until timestamptz, p_code_limit integer, p_note text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_user uuid;
  v_grant uuid;
  v_until timestamptz;
begin
  perform public.require_admin();
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'BAD_EMAIL' using errcode = 'P0001';
  end if;
  if p_plan not in ('start', 'pro', 'business') then
    raise exception 'BAD_PLAN' using errcode = 'P0001';
  end if;
  -- older open gifts for the same address are replaced
  update public.plan_grants set revoked_at = now() where lower(email) = v_email and claimed_at is null and revoked_at is null;
  insert into public.plan_grants (email, plan, months, until, code_limit, note, created_by)
  values (v_email, p_plan, p_months, p_until, p_code_limit, nullif(trim(coalesce(p_note, '')), ''), auth.uid())
  returning id into v_grant;
  select id into v_user from auth.users where lower(email) = v_email;
  if v_user is not null then
    v_until := public.apply_grant(v_grant, v_user);
  else
    v_until := coalesce(p_until, case when p_months is not null then now() + make_interval(months => p_months) end);
  end if;
  perform public.audit('plan.gift_email', v_user, null,
    jsonb_build_object('email', v_email, 'plan', p_plan, 'months', p_months, 'until', p_until, 'limit', p_code_limit, 'note', p_note, 'pending', v_user is null));
  return jsonb_build_object('status', case when v_user is null then 'pending' else 'applied' end, 'user_id', v_user, 'until', v_until, 'grant', v_grant);
end;
$$;

create function public.admin_grants()
returns table (id uuid, email text, plan text, months integer, until timestamptz, code_limit integer, note text, created_at timestamptz, admin_email text)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return query
  select g.id, g.email, g.plan, g.months, g.until, g.code_limit, g.note, g.created_at, u.email::text
  from public.plan_grants g left join auth.users u on u.id = g.created_by
  where g.claimed_at is null and g.revoked_at is null
  order by g.created_at desc;
end;
$$;

create function public.admin_revoke_grant(p_grant uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text;
begin
  perform public.require_admin();
  update public.plan_grants set revoked_at = now() where id = p_grant and claimed_at is null returning email into v_email;
  perform public.audit('plan.grant_revoke', null, null, jsonb_build_object('email', v_email));
end;
$$;

-- Admin: custom limit for one account (null = plan default, -1 = unlimited).
create function public.admin_set_limit(p_user uuid, p_limit integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin();
  if p_limit is not null and p_limit < -1 then
    raise exception 'BAD_LIMIT' using errcode = 'P0001';
  end if;
  update public.profiles set code_limit = p_limit where id = p_user;
  perform public.audit('user.limit', p_user, null, jsonb_build_object('limit', p_limit));
end;
$$;

-- admin_user now also returns the limit fields.
drop function public.admin_user(uuid);
create function public.admin_user(p_user uuid)
returns table (
  id uuid, email text, full_name text, role text, provider text, created_at timestamptz, last_sign_in_at timestamptz, email_confirmed boolean,
  plan text, effective_plan text, plan_until timestamptz, plan_source text, plan_note text, suspended_at timestamptz, suspended_reason text,
  codes bigint, dynamic_codes bigint, scans bigint, code_limit integer, dynamic_limit integer
) language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return query
  select u.id, u.email::text, p.full_name, p.role, coalesce(u.raw_app_meta_data ->> 'provider', 'email'), u.created_at, u.last_sign_in_at,
    u.email_confirmed_at is not null, p.plan, coalesce(public.effective_plan(u.id), 'free'), p.plan_until, p.plan_source, p.plan_note,
    p.suspended_at, p.suspended_reason,
    (select count(*) from public.qr_codes c where c.user_id = u.id and c.deleted_at is null),
    (select count(*) from public.qr_codes c where c.user_id = u.id and c.deleted_at is null and c.mode = 'dynamic'),
    (select coalesce(sum(c.scan_count), 0) from public.qr_codes c where c.user_id = u.id)::bigint,
    p.code_limit, public.dynamic_limit(u.id)
  from auth.users u join public.profiles p on p.id = u.id
  where u.id = p_user;
end;
$$;

revoke execute on function public.admin_gift_email(text, text, integer, timestamptz, integer, text), public.admin_grants(),
  public.admin_revoke_grant(uuid), public.admin_set_limit(uuid, integer), public.admin_user(uuid) from public, anon;
grant execute on function public.admin_gift_email(text, text, integer, timestamptz, integer, text), public.admin_grants(),
  public.admin_revoke_grant(uuid), public.admin_set_limit(uuid, integer), public.admin_user(uuid) to authenticated;
