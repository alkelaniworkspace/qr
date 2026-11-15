-- Guest codes: dynamic codes without an account.
-- The owner proves ownership with a secret edit token (only its SHA-256 is stored).
-- The slug inside the printed code never changes; content, style and even the type can.

create extension if not exists pgcrypto with schema extensions;

alter table public.qr_codes alter column user_id drop not null;
alter table public.qr_codes add column edit_token_hash text;
alter table public.qr_codes add constraint qr_codes_owner_check
  check (user_id is not null or edit_token_hash is not null);
alter table public.qr_codes add constraint qr_codes_content_size
  check (pg_column_size(content) < 400000 and pg_column_size(style) < 200000);
create index qr_codes_guest_created_idx on public.qr_codes (created_at) where user_id is null;
revoke select (edit_token_hash) on public.qr_codes from authenticated, anon;

-- Plan limits only apply to accounts.
create or replace function public.enforce_dynamic_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_plan text;
  v_limit integer;
  v_count integer;
begin
  if new.mode <> 'dynamic' or new.user_id is null then
    return new;
  end if;
  select plan into v_plan from public.profiles where id = new.user_id;
  v_limit := public.plan_dynamic_limit(coalesce(v_plan, 'free'));
  select count(*) into v_count from public.qr_codes where user_id = new.user_id and mode = 'dynamic';
  if v_limit is not null and v_count >= v_limit then
    raise exception 'PLAN_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create function public.token_hash(p_token text)
returns text language sql immutable set search_path = '' as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;
revoke execute on function public.token_hash from public, anon, authenticated;

-- What a scanner needs, nothing more. Works with the publishable key.
create function public.public_code(p_slug text)
returns table (id uuid, slug text, name text, type text, mode text, status text, content jsonb)
language sql stable security definer set search_path = '' as $$
  select c.id, c.slug, c.name, c.type, c.mode, c.status, c.content
  from public.qr_codes c
  where c.slug = p_slug and c.mode = 'dynamic';
$$;

create function public.create_guest_code(p_slug text, p_token text, p_name text, p_type text, p_content jsonb, p_style jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if char_length(coalesce(p_token, '')) < 32 then
    raise exception 'BAD_TOKEN' using errcode = 'P0001';
  end if;
  -- crude global brake against scripted abuse
  if (select count(*) from public.qr_codes where user_id is null and created_at > now() - interval '1 minute') > 120 then
    raise exception 'RATE_LIMIT' using errcode = 'P0001';
  end if;
  insert into public.qr_codes (user_id, name, slug, type, mode, content, style, edit_token_hash)
  values (null, p_name, p_slug, p_type, 'dynamic', p_content, p_style, public.token_hash(p_token))
  returning qr_codes.id into v_id;
  return v_id;
end;
$$;

create function public.get_guest_code(p_slug text, p_token text)
returns table (id uuid, slug text, name text, type text, content jsonb, style jsonb, scan_count integer, last_scanned_at timestamptz, created_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, c.slug, c.name, c.type, c.content, c.style, c.scan_count, c.last_scanned_at, c.created_at, c.updated_at
  from public.qr_codes c
  where c.slug = p_slug and c.user_id is null and c.edit_token_hash = public.token_hash(p_token);
$$;

create function public.update_guest_code(p_slug text, p_token text, p_name text, p_type text, p_content jsonb, p_style jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.qr_codes
  set name = p_name, type = p_type, content = p_content, style = p_style
  where slug = p_slug and user_id is null and edit_token_hash = public.token_hash(p_token);
  return found;
end;
$$;

revoke execute on function public.public_code, public.create_guest_code, public.get_guest_code, public.update_guest_code from public;
grant execute on function public.public_code to anon, authenticated, service_role;
grant execute on function public.create_guest_code, public.get_guest_code, public.update_guest_code to anon, authenticated, service_role;

-- Images for menus and pages uploaded by guests: public read, insert only under g/<random>/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 3145728, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "images: guests upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = 'g');
