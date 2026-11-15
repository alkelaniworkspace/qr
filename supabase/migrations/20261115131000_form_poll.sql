-- Public poll results (only for forms that opt in with settings.showResults).
create function public.form_poll_results(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(k, counts), '{}'::jsonb)
  from (
    select a.key as k, jsonb_object_agg(a.val, a.n) as counts
    from (
      select e.key, coalesce(x.v, e.value #>> '{}') as val, count(*) as n
      from public.forms f
      join public.form_responses r on r.form_id = f.id
      cross join lateral jsonb_each(r.answers) e
      left join lateral jsonb_array_elements_text(case when jsonb_typeof(e.value) = 'array' then e.value else '[]'::jsonb end) x(v) on true
      where f.slug = p_slug and coalesce((f.settings ->> 'showResults')::boolean, false)
        and (jsonb_typeof(e.value) = 'string' or jsonb_typeof(e.value) = 'array')
      group by e.key, coalesce(x.v, e.value #>> '{}')
    ) a
    where a.val is not null
    group by a.key
  ) t;
$$;
revoke execute on function public.form_poll_results from public;
grant execute on function public.form_poll_results to anon, authenticated, service_role;
