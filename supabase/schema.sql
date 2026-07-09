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
