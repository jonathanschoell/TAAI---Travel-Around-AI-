-- Jovia — plan tiers (free / premium).
-- Run once in the Supabase SQL editor, after 0001_init.sql.
-- A person can read their own row. Only the server (secret key) can create or change it,
-- so nobody can upgrade themselves.

create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'premium')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'past_due')),
  source text not null default 'manual' check (source in ('manual', 'stripe', 'app_store', 'play_store')),
  current_period_end timestamptz,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
create policy "own rows: select" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;

create trigger subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();
