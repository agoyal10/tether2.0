create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.connections(id) on delete cascade not null,
  type text not null check (type in ('weekly', 'monthly')),
  period_key text not null, -- e.g. "2026-W13" or "2026-03"
  content text not null,
  created_at timestamptz default now()
);

-- Only one insight per connection per period
create unique index if not exists ai_insights_unique on public.ai_insights (connection_id, type, period_key);

alter table public.ai_insights enable row level security;

create policy "Users can read own connection insights"
  on public.ai_insights for select
  using (
    connection_id in (
      select id from public.connections
      where user_a_id = auth.uid() or user_b_id = auth.uid()
    )
  );
