-- Jovia — third plan "Unlimited".
-- Run once in the Supabase SQL editor, after 0002_subscriptions.sql.
alter table public.subscriptions drop constraint if exists subscriptions_tier_check;
alter table public.subscriptions
  add constraint subscriptions_tier_check check (tier in ('free', 'premium', 'unlimited'));
