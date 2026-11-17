-- One user for the admin detail page.
create function public.admin_user(p_user uuid)
returns table (
  id uuid, email text, full_name text, role text, provider text, created_at timestamptz, last_sign_in_at timestamptz, email_confirmed boolean,
  plan text, effective_plan text, plan_until timestamptz, plan_source text, plan_note text, suspended_at timestamptz, suspended_reason text,
  codes bigint, dynamic_codes bigint, scans bigint
) language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return query
  select u.id, u.email::text, p.full_name, p.role, coalesce(u.raw_app_meta_data ->> 'provider', 'email'), u.created_at, u.last_sign_in_at,
    u.email_confirmed_at is not null, p.plan, coalesce(public.effective_plan(u.id), 'free'), p.plan_until, p.plan_source, p.plan_note,
    p.suspended_at, p.suspended_reason,
    (select count(*) from public.qr_codes c where c.user_id = u.id and c.deleted_at is null),
    (select count(*) from public.qr_codes c where c.user_id = u.id and c.deleted_at is null and c.mode = 'dynamic'),
    (select coalesce(sum(c.scan_count), 0) from public.qr_codes c where c.user_id = u.id)::bigint
  from auth.users u join public.profiles p on p.id = u.id
  where u.id = p_user;
end;
$$;
revoke execute on function public.admin_user(uuid) from public, anon;
grant execute on function public.admin_user(uuid) to authenticated;
