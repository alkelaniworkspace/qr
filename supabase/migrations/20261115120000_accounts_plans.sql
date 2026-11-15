-- New plan ids (free/start/pro/business) and claiming guest codes into an account.

alter table public.profiles drop constraint if exists profiles_plan_check;
update public.profiles set plan = 'start' where plan = 'starter';
update public.profiles set plan = 'business' where plan = 'agency';
alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'start', 'pro', 'business'));

-- Keep in sync with src/lib/plans.ts (null = unlimited)
create or replace function public.plan_dynamic_limit(p_plan text)
returns integer language sql immutable set search_path = '' as $$
  select case p_plan
    when 'free' then 3
    when 'start' then 15
    when 'pro' then 100
    when 'business' then null
    else 3
  end;
$$;

-- A signed-in user takes over a guest code by proving the edit token.
create function public.claim_guest_code(p_slug text, p_token text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'NOT_SIGNED_IN' using errcode = 'P0001';
  end if;
  update public.qr_codes
  set user_id = v_uid
  where slug = p_slug and user_id is null and edit_token_hash = public.token_hash(p_token);
  return found;
end;
$$;

revoke execute on function public.claim_guest_code from public, anon;
grant execute on function public.claim_guest_code to authenticated;
