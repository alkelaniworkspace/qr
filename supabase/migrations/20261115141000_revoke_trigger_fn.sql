-- Trigger functions are not part of the public API.
revoke execute on function public.enforce_form_limit() from public, anon, authenticated;
