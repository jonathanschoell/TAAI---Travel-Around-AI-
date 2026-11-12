-- Jovia — home location for Swiss features (departure airport, school holidays).
-- Run once in the Supabase SQL editor, after 0002_subscriptions.sql.
-- Only the canton and a free-text place are stored. Precise device location is never saved.

alter table public.profiles
  add column if not exists home_canton text check (home_canton ~ '^[A-Z]{2}$'),
  add column if not exists home_place text check (char_length(home_place) <= 80);
