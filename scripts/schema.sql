-- ============================================================
-- Tour Pilot — Schema update: roles & visibility
-- Paste in Supabase SQL Editor → Run
-- ============================================================

-- 1. Update profiles table
alter table profiles add column if not exists username text unique;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists band text;
alter table profiles add column if not exists bio text;

-- 2. Tour members
create table if not exists tour_members (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid references tours(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('admin', 'artist', 'crew')) default 'artist',
  created_at timestamptz default now(),
  unique(tour_id, user_id)
);

-- 3. Ticket visibility (allowlist — empty = everyone sees it)
create table if not exists ticket_visibility (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  unique(document_id, user_id)
);

-- 4. Schedule visibility (allowlist — empty = everyone sees it)
create table if not exists schedule_visibility (
  id uuid primary key default gen_random_uuid(),
  schedule_item_id uuid references schedule_items(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  unique(schedule_item_id, user_id)
);

-- 5. RLS — permissive (app controls logic)
alter table tour_members enable row level security;
alter table ticket_visibility enable row level security;
alter table schedule_visibility enable row level security;

drop policy if exists "allow all tour_members" on tour_members;
drop policy if exists "allow all ticket_visibility" on ticket_visibility;
drop policy if exists "allow all schedule_visibility" on schedule_visibility;

create policy "allow all tour_members" on tour_members for all using (true) with check (true);
create policy "allow all ticket_visibility" on ticket_visibility for all using (true) with check (true);
create policy "allow all schedule_visibility" on schedule_visibility for all using (true) with check (true);
