-- ── app_config: feature flags & settings ──────────────────────────────────
-- Toggle AI features from the Supabase dashboard without a code deploy.
-- Example: UPDATE app_config SET value = 'false' WHERE key = 'ai_coach_enabled';

create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

insert into public.app_config (key, value) values
  ('ai_coach_enabled',       'true'),
  ('ai_coach_daily_limit',   '20'),
  ('ai_date_ideas_enabled',  'true'),
  ('ai_drift_alert_enabled', 'true')
on conflict (key) do nothing;

-- ── coach_messages: shared AI coach conversation per couple ────────────────
create table if not exists public.coach_messages (
  id               uuid primary key default gen_random_uuid(),
  connection_id    uuid references public.connections(id) on delete cascade not null,
  sender_user_id   uuid references auth.users(id) on delete set null,
  role             text not null check (role in ('user', 'assistant')),
  content          text not null,
  created_at       timestamptz default now()
);

create index if not exists coach_messages_conn_created
  on public.coach_messages (connection_id, created_at desc);

alter table public.coach_messages enable row level security;

create policy "Partners can read coach messages"
  on public.coach_messages for select
  using (
    connection_id in (
      select id from public.connections
      where user_a_id = auth.uid() or user_b_id = auth.uid()
    )
  );
