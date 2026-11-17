-- Forms 2.0: closing date and response cap from settings are enforced on submit.
create or replace function public.submit_form_response(p_slug text, p_answers jsonb, p_meta jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_form public.forms%rowtype;
  v_limit integer;
  v_month integer;
  v_close timestamptz;
  v_max integer;
begin
  select * into v_form from public.forms where slug = p_slug for update;
  if not found then return 'NOT_FOUND'; end if;
  if v_form.status <> 'open' then return 'CLOSED'; end if;
  begin v_close := nullif(v_form.settings ->> 'closeAt', '')::timestamptz; exception when others then v_close := null; end;
  if v_close is not null and v_close < now() then return 'CLOSED'; end if;
  v_max := nullif(v_form.settings ->> 'maxResponses', '')::integer;
  if v_max is not null and v_form.response_count >= v_max then return 'FULL'; end if;
  if jsonb_typeof(p_answers) <> 'object' or pg_column_size(p_answers) > 60000 then return 'INVALID'; end if;
  select public.plan_response_limit(coalesce(public.effective_plan(v_form.user_id), 'free')) into v_limit;
  if v_limit is not null then
    select count(*) into v_month from public.form_responses where form_id in (select id from public.forms where user_id = v_form.user_id) and created_at >= date_trunc('month', now());
    if v_month >= v_limit then return 'LIMIT'; end if;
  end if;
  if (select count(*) from public.form_responses where form_id = v_form.id and created_at > now() - interval '1 minute') > 60 then return 'RATE_LIMIT'; end if;
  insert into public.form_responses (form_id, answers, meta) values (v_form.id, p_answers, coalesce(p_meta, '{}'::jsonb));
  update public.forms set response_count = response_count + 1 where id = v_form.id;
  return 'OK';
end;
$$;

-- Owner e-mail for "send me every response" (server only).
create function public.form_owner_email(p_slug text)
returns text language sql stable security definer set search_path = '' as $$
  select u.email::text from public.forms f join auth.users u on u.id = f.user_id where f.slug = p_slug;
$$;
revoke execute on function public.form_owner_email(text) from public, anon, authenticated;
grant execute on function public.form_owner_email(text) to service_role;
