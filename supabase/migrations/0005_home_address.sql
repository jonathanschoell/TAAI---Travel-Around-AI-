-- Optional street address, used only to find public transport connections from the door.
-- It is never sent to the AI.
alter table public.profiles add column if not exists home_address text;
alter table public.profiles drop constraint if exists profiles_home_address_length;
alter table public.profiles add constraint profiles_home_address_length check (home_address is null or char_length(home_address) <= 160);
