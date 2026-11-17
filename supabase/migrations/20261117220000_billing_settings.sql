-- Subscriptions (Stripe) and account settings.
alter table public.profiles
  add column stripe_customer_id text unique,
  add column subscription_id text,
  add column subscription_status text,
  add column billing_interval text check (billing_interval is null or billing_interval in ('month', 'year')),
  add column current_period_end timestamptz,
  add column cancel_at_period_end boolean not null default false,
  add column notify_product boolean not null default true,
  add column notify_reports boolean not null default true;

-- Users may change their own e-mail preferences; billing fields are written by the server only.
grant update (notify_product, notify_reports) on public.profiles to authenticated;
