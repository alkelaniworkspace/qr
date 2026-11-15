-- New limits: Free 1, Start 15, Pro 50, Business 150 (more on request).
-- Keep in sync with src/lib/plans.ts. Existing codes above a limit keep working;
-- the limit only blocks creating new dynamic codes.
create or replace function public.plan_dynamic_limit(p_plan text)
returns integer language sql immutable set search_path = '' as $$
  select case p_plan
    when 'free' then 1
    when 'start' then 15
    when 'pro' then 50
    when 'business' then 150
    else 1
  end;
$$;
