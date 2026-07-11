-- =========================================================
-- AlcoholDex — Supabase schema
-- Paste this whole file into the Supabase SQL Editor and Run.
-- =========================================================

-- One row per (user, bottle) logged.
create table public.alcoholdex_logs (
  user_id   uuid not null references auth.users (id) on delete cascade,
  bottle_id text not null,
  logged_at timestamptz not null default now(),
  primary key (user_id, bottle_id)
);

-- Row Level Security: users can only ever touch their own rows.
alter table public.alcoholdex_logs enable row level security;

create policy "read own logs"   on public.alcoholdex_logs for select using (auth.uid() = user_id);
create policy "insert own logs" on public.alcoholdex_logs for insert with check (auth.uid() = user_id);
create policy "delete own logs" on public.alcoholdex_logs for delete using (auth.uid() = user_id);

-- ===== v3 (applied 2026-07-09 via migration alcoholdex_v3_ratings_friends_rarity) =====
-- ratings: alter table alcoholdex_logs add column rating smallint check (rating between 1 and 5);
-- alcoholdex_profiles (user_id PK, handle, friend_code unique 6-char) — RLS: all authed read, own write
-- alcoholdex_friends (user_id, friend_user_id) — RLS: own rows only
-- fn alcoholdex_leaderboard(leg_ids text[]) SECURITY DEFINER → circle counts (self + friends)
-- fn alcoholdex_add_friend(code) SECURITY DEFINER → resolves code, inserts friendship (one-way follow)
-- fn alcoholdex_rarity() SECURITY DEFINER → per-bottle holder counts + total collectors
