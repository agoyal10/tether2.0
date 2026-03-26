-- ============================================================
-- TETHER — Database Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────
-- Extends Supabase auth.users with profile data
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text        not null,
  avatar_url   text,
  invite_code  text        unique not null,  -- 6-char alphanumeric, generated on signup
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── CONNECTIONS ─────────────────────────────────────────────
-- A couple is represented by one row (bidirectional bond)
create table public.connections (
  id           uuid primary key default gen_random_uuid(),
  user_a_id    uuid not null references public.profiles(id) on delete cascade,
  user_b_id    uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending',   -- pending | active | blocked
  created_at   timestamptz not null default now(),
  constraint   unique_pair unique (user_a_id, user_b_id),
  constraint   no_self_connect check (user_a_id <> user_b_id)
);

-- Helper: get the connected partner for a given user
create or replace function public.get_partner_id(p_user uuid)
returns uuid language sql stable security definer as $$
  select case
    when user_a_id = p_user then user_b_id
    else user_a_id
  end
  from public.connections
  where (user_a_id = p_user or user_b_id = p_user)
    and status = 'active'
  limit 1;
$$;

-- ─── MOOD LOGS ───────────────────────────────────────────────
create type public.mood_level as enum (
  -- sweet
  'thriving',    -- 🚀
  'good',        -- 😊
  'okay',        -- ☁️
  'low',         -- 🌧️
  'struggling',  -- 🌊
  'katakni',     -- 😤
  -- naughty
  'soaked',      -- 💦
  'burning',     -- 🥵
  'heated',      -- 🔥
  'frisky',      -- 💋
  'naughty',     -- 😈
  -- love
  'smitten',     -- 🥰
  'adoring',     -- 💕
  'connected',   -- 💞
  'longing',     -- 💭
  'tender'       -- 🌸
);

create table public.mood_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  mood         mood_level  not null,
  note         text,                         -- optional short note (max 280 chars)
  is_resolved  boolean     not null default false,
  created_at   timestamptz not null default now()
);

-- ─── MESSAGES ────────────────────────────────────────────────
create table public.messages (
  id           uuid primary key default gen_random_uuid(),
  mood_log_id  uuid        not null references public.mood_logs(id) on delete cascade,
  sender_id    uuid        not null references public.profiles(id) on delete cascade,
  content      text        not null,
  created_at   timestamptz not null default now()
);

-- ─── PUSH SUBSCRIPTIONS ──────────────────────────────────────
create table public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  endpoint     text        not null unique,
  p256dh       text        not null,
  auth         text        not null,
  created_at   timestamptz not null default now()
);

-- ─── ROW-LEVEL SECURITY ──────────────────────────────────────
alter table public.profiles           enable row level security;
alter table public.connections        enable row level security;
alter table public.mood_logs          enable row level security;
alter table public.messages           enable row level security;
alter table public.push_subscriptions enable row level security;

-- Profiles: users see themselves + their partner + invite code lookup for connecting
create policy "profiles_self"    on public.profiles for all using (auth.uid() = id);
create policy "profiles_partner" on public.profiles for select
  using (id = public.get_partner_id(auth.uid()));
-- Any authenticated user can look up a profile by invite code (needed to connect couples)
create policy "profiles_invite_lookup" on public.profiles for select
  using (auth.uid() is not null);

-- Connections: both parties can read their own connection
create policy "connections_own" on public.connections for all
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- Mood logs: author + partner can read; only author can insert/update
create policy "moodlogs_insert" on public.mood_logs for insert with check (auth.uid() = user_id);
create policy "moodlogs_select" on public.mood_logs for select
  using (auth.uid() = user_id or auth.uid() = public.get_partner_id(user_id));
create policy "moodlogs_update" on public.mood_logs for update using (auth.uid() = user_id);

-- Messages: both partners can read; only sender can insert
create policy "messages_select" on public.messages for select
  using (
    exists (
      select 1 from public.mood_logs ml
      where ml.id = mood_log_id
        and (ml.user_id = auth.uid() or ml.user_id = public.get_partner_id(auth.uid()))
    )
  );

create policy "messages_insert" on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.mood_logs ml
      where ml.id = mood_log_id
        and (ml.user_id = auth.uid() or ml.user_id = public.get_partner_id(auth.uid()))
    )
  );

-- Push subscriptions: users manage their own only
create policy "push_own" on public.push_subscriptions for all using (auth.uid() = user_id);

-- ─── REALTIME ────────────────────────────────────────────────
-- Enable Supabase Realtime on the tables that need live updates
alter publication supabase_realtime add table public.mood_logs;
alter publication supabase_realtime add table public.messages;
