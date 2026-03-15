-- Run this in your Supabase SQL editor

create table if not exists plans (
  id uuid primary key,
  title text not null default 'תכנית חדשה',
  budget jsonb not null default '{}',
  events jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security (open for now, add auth policies later)
alter table plans enable row level security;

create policy "Allow all for now"
  on plans
  for all
  using (true)
  with check (true);
