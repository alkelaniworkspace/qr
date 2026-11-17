-- Profile photo (public URL in the assets bucket under the user's folder).
alter table public.profiles add column avatar_url text check (avatar_url is null or length(avatar_url) < 500);
grant update (avatar_url) on public.profiles to authenticated;
