-- Event registrations (RSVP) for dynamic event codes.
-- Guests register with name + email; a confirmation link (double opt-in)
-- marks them as attending. The public page only ever sees counts.

create table public.event_rsvps (
  id bigint generated always as identity primary key,
  code_id uuid not null references public.qr_codes (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 80),
  email text not null check (char_length(email) between 3 and 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  guests smallint not null default 1 check (guests between 1 and 10),
  token_hash text not null check (char_length(token_hash) between 32 and 128),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (code_id, email)
);
create index event_rsvps_code_idx on public.event_rsvps (code_id, created_at desc);
create index event_rsvps_token_idx on public.event_rsvps (token_hash);

alter table public.event_rsvps enable row level security;
create policy "rsvps: read own codes" on public.event_rsvps for select to authenticated
  using (exists (select 1 from public.qr_codes c where c.id = event_rsvps.code_id and c.user_id = (select auth.uid())));
create policy "rsvps: delete own codes" on public.event_rsvps for delete to authenticated
  using (exists (select 1 from public.qr_codes c where c.id = event_rsvps.code_id and c.user_id = (select auth.uid())));
revoke insert, update, truncate on public.event_rsvps from anon, authenticated;

-- Register (or re-send for an unconfirmed address). Server only.
-- Returns OK | CONFIRMED (already attending) | FULL | CLOSED | NOT_FOUND | RATE_LIMIT.
create function public.rsvp_register(p_slug text, p_name text, p_email text, p_guests smallint, p_token_hash text, p_auto_confirm boolean)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_code public.qr_codes%rowtype;
  v_cap integer;
  v_taken integer;
  v_existing public.event_rsvps%rowtype;
  v_email text := lower(trim(p_email));
begin
  select * into v_code from public.qr_codes where slug = p_slug and type = 'event' and mode = 'dynamic';
  if not found then return 'NOT_FOUND'; end if;
  if v_code.status <> 'active' or coalesce((v_code.content ->> 'rsvp')::boolean, false) is false then return 'CLOSED'; end if;
  begin
    if nullif(v_code.content ->> 'start', '') is not null and now() > (v_code.content ->> 'start')::timestamp at time zone 'Europe/Berlin' then return 'CLOSED'; end if;
  exception when others then null;
  end;
  if (select count(*) from public.event_rsvps where code_id = v_code.id and created_at > now() - interval '1 minute') > 60 then return 'RATE_LIMIT'; end if;

  select * into v_existing from public.event_rsvps where code_id = v_code.id and email = v_email;
  if found and v_existing.confirmed_at is not null then return 'CONFIRMED'; end if;

  v_cap := nullif(v_code.content ->> 'capacity', '')::integer;
  if v_cap is not null and v_cap > 0 then
    select coalesce(sum(guests), 0) into v_taken from public.event_rsvps where code_id = v_code.id and confirmed_at is not null;
    if v_taken + greatest(1, least(10, coalesce(p_guests, 1))) > v_cap then return 'FULL'; end if;
  end if;

  insert into public.event_rsvps (code_id, name, email, guests, token_hash, confirmed_at)
  values (v_code.id, left(coalesce(trim(p_name), ''), 80), v_email, greatest(1, least(10, coalesce(p_guests, 1))), p_token_hash, case when p_auto_confirm then now() end)
  on conflict (code_id, email) do update
    set name = excluded.name, guests = excluded.guests, token_hash = excluded.token_hash, confirmed_at = coalesce(public.event_rsvps.confirmed_at, excluded.confirmed_at);
  return 'OK';
end;
$$;

-- Confirm by token. Server only. Returns the code slug, or null.
create function public.rsvp_confirm(p_token_hash text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_slug text;
begin
  update public.event_rsvps r set confirmed_at = coalesce(r.confirmed_at, now())
  from public.qr_codes c
  where r.token_hash = p_token_hash and c.id = r.code_id
  returning c.slug into v_slug;
  return v_slug;
end;
$$;

-- Public counts (only when the organiser shows them). Never names or emails.
create function public.rsvp_stats(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when coalesce((c.content ->> 'showCount')::boolean, true) then
    jsonb_build_object(
      'attending', coalesce((select sum(guests) from public.event_rsvps r where r.code_id = c.id and r.confirmed_at is not null), 0),
      'capacity', nullif(c.content ->> 'capacity', '')::integer
    ) end
  from public.qr_codes c where c.slug = p_slug and c.type = 'event';
$$;

-- Organiser list: signed-in owner, or the guest edit-token holder.
create function public.rsvp_list(p_slug text, p_token text default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_code public.qr_codes%rowtype;
begin
  select * into v_code from public.qr_codes where slug = p_slug and type = 'event';
  if not found then return null; end if;
  if not ((v_code.user_id is not null and v_code.user_id = (select auth.uid()))
       or (p_token is not null and v_code.edit_token_hash is not null and v_code.edit_token_hash = public.token_hash(p_token))) then
    return null;
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('name', name, 'email', email, 'guests', guests, 'confirmed', confirmed_at is not null, 'at', created_at) order by created_at desc)
                   from public.event_rsvps where code_id = v_code.id), '[]'::jsonb);
end;
$$;

revoke execute on function public.rsvp_register, public.rsvp_confirm from public, anon, authenticated;
grant execute on function public.rsvp_register, public.rsvp_confirm to service_role;
revoke execute on function public.rsvp_stats, public.rsvp_list from public;
grant execute on function public.rsvp_stats, public.rsvp_list to anon, authenticated, service_role;
