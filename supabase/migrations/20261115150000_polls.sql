-- Polls: a dynamic code of type 'poll' collects one vote per device.
-- Votes are written only through cast_vote (service role, called by the app
-- with a salted device hash). Nobody can insert, change or delete votes directly.

create table public.poll_votes (
  id bigint generated always as identity primary key,
  code_id uuid not null references public.qr_codes (id) on delete cascade,
  choices smallint[] not null check (cardinality(choices) between 1 and 12),
  voter_hash text not null check (char_length(voter_hash) between 16 and 64),
  created_at timestamptz not null default now(),
  unique (code_id, voter_hash)
);
create index poll_votes_code_time_idx on public.poll_votes (code_id, created_at desc);

alter table public.poll_votes enable row level security;

create policy "poll votes: read own codes" on public.poll_votes for select to authenticated
  using (exists (select 1 from public.qr_codes c where c.id = poll_votes.code_id and c.user_id = (select auth.uid())));

revoke insert, update, delete, truncate on public.poll_votes from anon, authenticated;

-- Cast a vote. Returns OK | ALREADY | CLOSED | INVALID | NOT_FOUND | RATE_LIMIT.
create function public.cast_vote(p_slug text, p_choices smallint[], p_voter_hash text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_code public.qr_codes%rowtype;
  v_options integer;
  v_closes text;
  v_rows integer;
begin
  select * into v_code from public.qr_codes where slug = p_slug and type = 'poll' and mode = 'dynamic';
  if not found then return 'NOT_FOUND'; end if;
  if v_code.status <> 'active' then return 'CLOSED'; end if;

  v_closes := nullif(v_code.content ->> 'closesAt', '');
  if v_closes is not null then
    begin
      -- the studio stores local time without offset (datetime-local); the market is DACH
      if now() > (case when v_closes ~ '(Z|[+-][0-9]{2}:?[0-9]{2})$' then v_closes::timestamptz
                       else v_closes::timestamp at time zone 'Europe/Berlin' end) then return 'CLOSED'; end if;
    exception when others then null; -- unparsable date: treat as open
    end;
  end if;

  v_options := coalesce(jsonb_array_length(v_code.content -> 'options'), 0);
  if p_choices is null or cardinality(p_choices) = 0 or cardinality(p_choices) > v_options then return 'INVALID'; end if;
  if coalesce((v_code.content ->> 'multiple')::boolean, false) is false and cardinality(p_choices) <> 1 then return 'INVALID'; end if;
  if exists (select 1 from unnest(p_choices) c where c < 0 or c >= v_options) then return 'INVALID'; end if;
  if (select count(distinct c) from unnest(p_choices) c) <> cardinality(p_choices) then return 'INVALID'; end if;
  if p_voter_hash is null or char_length(p_voter_hash) < 16 then return 'INVALID'; end if;

  if (select count(*) from public.poll_votes where code_id = v_code.id and created_at > now() - interval '1 minute') > 300 then
    return 'RATE_LIMIT';
  end if;

  insert into public.poll_votes (code_id, choices, voter_hash)
  values (v_code.id, p_choices, p_voter_hash)
  on conflict (code_id, voter_hash) do nothing;
  get diagnostics v_rows = row_count;
  return case when v_rows = 1 then 'OK' else 'ALREADY' end;
end;
$$;

-- Tally. Visible to everyone when the poll shows results publicly, otherwise
-- only to the owner (signed in) or the holder of the guest edit token.
-- Returns null when the caller may not see the numbers.
create function public.poll_results(p_slug text, p_token text default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_code public.qr_codes%rowtype;
  v_options integer;
  v_mode text;
  v_allowed boolean;
  v_counts jsonb;
  v_total integer;
begin
  select * into v_code from public.qr_codes where slug = p_slug and type = 'poll';
  if not found then return null; end if;
  v_mode := coalesce(v_code.content ->> 'results', 'after');
  v_allowed := v_mode <> 'never'
    or (v_code.user_id is not null and v_code.user_id = (select auth.uid()))
    or (p_token is not null and v_code.edit_token_hash is not null and v_code.edit_token_hash = public.token_hash(p_token));
  if not v_allowed then return null; end if;

  v_options := coalesce(jsonb_array_length(v_code.content -> 'options'), 0);
  select count(*) into v_total from public.poll_votes where code_id = v_code.id;
  select coalesce(jsonb_agg(coalesce(t.n, 0) order by g.i), '[]'::jsonb) into v_counts
  from generate_series(0, greatest(v_options - 1, -1)) g(i)
  left join (
    select c as i, count(*) as n from public.poll_votes, unnest(choices) c where code_id = v_code.id group by c
  ) t on t.i = g.i;
  return jsonb_build_object('total', v_total, 'counts', v_counts);
end;
$$;

revoke execute on function public.cast_vote from public, anon, authenticated;
grant execute on function public.cast_vote to service_role;
revoke execute on function public.poll_results from public;
grant execute on function public.poll_results to anon, authenticated, service_role;
