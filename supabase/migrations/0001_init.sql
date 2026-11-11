-- TAAI — initial schema.
-- Run once in the Supabase SQL editor (see SETUP.md).
-- Every table has row level security. A signed-in person can only reach rows whose
-- user_id is their own. Operational tables have no policies at all, so only the
-- server (secret key) can read or write them.

-- ---------------------------------------------------------------- account
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  age_group text,
  language text not null default 'en',
  currency text not null default 'CHF',
  default_travelers int not null default 1 check (default_travelers between 1 and 20),
  personalization_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('privacy_policy', 'personalization')),
  granted boolean not null,
  policy_version text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------ preferences
create table public.travel_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  interests text[] not null default '{}',
  hobbies text[] not null default '{}',
  favourite_destinations text[] not null default '{}',
  holiday_types text[] not null default '{}',
  climates text[] not null default '{}',
  travel_seasons text[] not null default '{}',
  budget_level text check (budget_level in ('budget', 'mid', 'luxury')),
  hotel_category text,
  landscape text check (landscape in ('beach', 'mountains', 'city', 'any')),
  pace text check (pace in ('relaxed', 'balanced', 'active')),
  culture_interest boolean,
  culinary_interests text[] not null default '{}',
  family_activities text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- Children are stored as an age group with interests. No names, no birth dates.
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  age_group text not null,
  interests text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ trips
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  destination text not null,
  start_date date,
  end_date date,
  travelers int not null default 1,
  currency text not null default 'CHF',
  budget_total numeric,
  summary text,
  input jsonb not null default '{}',
  budget_breakdown jsonb not null default '{}',
  status text not null default 'saved' check (status in ('draft', 'saved', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  day_number int not null,
  day_date date,
  theme text,
  transit_notes text,
  unique (trip_id, day_number)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null references public.trip_days (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  slot text not null check (slot in ('morning', 'afternoon', 'evening', 'restaurant')),
  position int not null default 0,
  name text not null,
  category text,
  description text,
  duration_minutes int,
  cost numeric,
  price_type text not null default 'estimated' check (price_type in ('actual', 'estimated')),
  verified boolean not null default false,
  source text not null default 'ai',
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create table public.trip_versions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, trip_id)
);

-- --------------------------------------------------------------- feedback
create table public.activity_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_id uuid references public.activities (id) on delete set null,
  activity_name text not null,
  category text,
  rating text not null check (rating in ('like', 'dislike', 'visited', 'must_do', 'not_interested')),
  created_at timestamptz not null default now()
);

create table public.visited_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  destination text,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------- AI memory
create table public.memory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  statement text not null check (char_length(statement) <= 200),
  category text,
  source text not null check (source in ('feedback', 'planning', 'user')),
  weight real not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------- operations (server only, no policies)
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now()
);

create table public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  event text not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  target text,
  created_at timestamptz not null default now()
);

create table public.content_reports (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  trip_id uuid references public.trips (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- indexes
create index on public.consents (user_id, created_at desc);
create index on public.family_members (user_id);
create index on public.trips (user_id, created_at desc);
create index on public.trip_days (trip_id);
create index on public.trip_days (user_id);
create index on public.activities (trip_day_id);
create index on public.activities (user_id);
create index on public.trip_versions (trip_id, created_at desc);
create index on public.trip_versions (user_id);
create index on public.activity_feedback (user_id, created_at desc);
create index on public.visited_places (user_id);
create index on public.memory_items (user_id) where active;
create index on public.ai_usage (user_id, created_at desc);
create index on public.usage_events (created_at desc);
create index on public.profiles (last_seen_at);

-- ------------------------------------------------------ row level security
do $$
declare
  t text;
  owned text[] := array[
    'profiles', 'travel_preferences', 'family_members', 'trips', 'trip_days', 'activities',
    'trip_versions', 'favorites', 'activity_feedback', 'visited_places', 'memory_items'
  ];
  server_only text[] := array['ai_usage', 'usage_events', 'admin_audit_log'];
begin
  foreach t in array owned loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows: select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "own rows: insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "own rows: update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "own rows: delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;

  foreach t in array server_only loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- Consent history is append-only for the person it belongs to.
alter table public.consents enable row level security;
create policy "own rows: select" on public.consents
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rows: insert" on public.consents
  for insert to authenticated with check ((select auth.uid()) = user_id);
revoke all on public.consents from anon, authenticated;
grant select, insert on public.consents to authenticated;

-- People can file a report about AI content and see their own reports; only the server reads all.
alter table public.content_reports enable row level security;
create policy "own rows: select" on public.content_reports
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rows: insert" on public.content_reports
  for insert to authenticated with check ((select auth.uid()) = user_id);
revoke all on public.content_reports from anon, authenticated;
grant select, insert on public.content_reports to authenticated;

-- Profiles are created by the trigger below and removed with the account, never by the client.
revoke insert, delete on public.profiles from authenticated;
drop policy "own rows: insert" on public.profiles;
drop policy "own rows: delete" on public.profiles;

-- ---------------------------------------------------------------- triggers
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger travel_preferences_updated before update on public.travel_preferences
  for each row execute function public.set_updated_at();
create trigger trips_updated before update on public.trips
  for each row execute function public.set_updated_at();
create trigger memory_items_updated before update on public.memory_items
  for each row execute function public.set_updated_at();

-- A profile and the privacy-policy consent are created together with every new account.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(nullif(left(new.raw_user_meta_data ->> 'display_name', 60), ''),
             split_part(new.email, '@', 1))
  );
  insert into public.consents (user_id, kind, granted, policy_version)
  values (new.id, 'privacy_policy', true,
          coalesce(new.raw_user_meta_data ->> 'privacy_version', 'unknown'));
  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- The server (secret key) may use every table.
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
