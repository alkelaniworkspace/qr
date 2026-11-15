-- Forms: owners build forms in the dashboard, anyone with the link can answer.

create table public.forms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[A-Za-z0-9_-]{4,64}$'),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  fields jsonb not null default '[]'::jsonb check (jsonb_typeof(fields) = 'array' and pg_column_size(fields) < 200000),
  settings jsonb not null default '{}'::jsonb check (pg_column_size(settings) < 20000),
  status text not null default 'open' check (status in ('open', 'closed')),
  response_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index forms_user_idx on public.forms (user_id, created_at desc);
alter table public.forms enable row level security;

create policy "forms: read own" on public.forms for select to authenticated using (user_id = (select auth.uid()));
create policy "forms: insert own" on public.forms for insert to authenticated with check (user_id = (select auth.uid()));
create policy "forms: update own" on public.forms for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "forms: delete own" on public.forms for delete to authenticated using (user_id = (select auth.uid()));
revoke insert, update on public.forms from authenticated, anon;
grant insert (slug, title, description, fields, settings, status) on public.forms to authenticated;
grant update (title, description, fields, settings, status) on public.forms to authenticated;

create trigger forms_touch before update on public.forms for each row execute function public.touch_updated_at();

-- Form limits per plan. Keep in sync with src/lib/plans.ts (null = unlimited)
create function public.plan_form_limit(p_plan text)
returns integer language sql immutable set search_path = '' as $$
  select case p_plan when 'free' then 1 when 'start' then 3 else null end;
$$;
create function public.plan_response_limit(p_plan text)
returns integer language sql immutable set search_path = '' as $$
  select case p_plan when 'free' then 100 when 'start' then 1000 else null end;
$$;

create function public.enforce_form_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_limit integer;
begin
  select public.plan_form_limit(coalesce(plan, 'free')) into v_limit from public.profiles where id = new.user_id;
  if v_limit is not null and (select count(*) from public.forms where user_id = new.user_id) >= v_limit then
    raise exception 'FORM_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger forms_limit before insert on public.forms for each row execute function public.enforce_form_limit();

create table public.form_responses (
  id bigint generated always as identity primary key,
  form_id uuid not null references public.forms (id) on delete cascade,
  created_at timestamptz not null default now(),
  answers jsonb not null check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) < 60000),
  meta jsonb not null default '{}'::jsonb
);
create index form_responses_form_idx on public.form_responses (form_id, created_at desc);
alter table public.form_responses enable row level security;
create policy "responses: read own forms" on public.form_responses for select to authenticated
  using (exists (select 1 from public.forms f where f.id = form_responses.form_id and f.user_id = (select auth.uid())));
create policy "responses: delete own forms" on public.form_responses for delete to authenticated
  using (exists (select 1 from public.forms f where f.id = form_responses.form_id and f.user_id = (select auth.uid())));
revoke insert, update on public.form_responses from authenticated, anon;

-- Public: what a visitor needs to render the form.
create function public.public_form(p_slug text)
returns table (slug text, title text, description text, fields jsonb, settings jsonb, status text, branding boolean)
language sql stable security definer set search_path = '' as $$
  select f.slug, f.title, f.description, f.fields, f.settings, f.status, coalesce(p.plan, 'free') = 'free'
  from public.forms f left join public.profiles p on p.id = f.user_id
  where f.slug = p_slug;
$$;

-- Public: submit answers. Checks status and the owner's monthly response limit.
create function public.submit_form_response(p_slug text, p_answers jsonb, p_meta jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_form public.forms%rowtype;
  v_limit integer;
  v_month integer;
begin
  select * into v_form from public.forms where slug = p_slug;
  if not found then return 'NOT_FOUND'; end if;
  if v_form.status <> 'open' then return 'CLOSED'; end if;
  if jsonb_typeof(p_answers) <> 'object' or pg_column_size(p_answers) > 60000 then return 'INVALID'; end if;
  select public.plan_response_limit(coalesce(plan, 'free')) into v_limit from public.profiles where id = v_form.user_id;
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

revoke execute on function public.public_form, public.submit_form_response, public.enforce_form_limit from public;
grant execute on function public.public_form, public.submit_form_response to anon, authenticated, service_role;
