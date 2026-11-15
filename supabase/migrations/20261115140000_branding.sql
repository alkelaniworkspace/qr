-- Hosted pages show "Erstellt mit Qlick" unless the owner pays.
drop function public.public_code(text);
create function public.public_code(p_slug text)
returns table (id uuid, slug text, name text, type text, mode text, status text, content jsonb, branding boolean)
language sql stable security definer set search_path = '' as $$
  select c.id, c.slug, c.name, c.type, c.mode, c.status, c.content, coalesce(p.plan, 'free') = 'free'
  from public.qr_codes c left join public.profiles p on p.id = c.user_id
  where c.slug = p_slug and c.mode = 'dynamic';
$$;
revoke execute on function public.public_code from public;
grant execute on function public.public_code to anon, authenticated, service_role;
