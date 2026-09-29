-- Circle Panda Water Break / Giveaway foundation
create table if not exists public.water_break_events (
  id uuid primary key default gen_random_uuid(),
  break_number int not null check (break_number between 1 and 20),
  event_type text not null,
  enabled boolean not null default true,
  sort_order int not null default 0,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (break_number, event_type)
);

create table if not exists public.giveaway_challenges (
  id uuid primary key default gen_random_uuid(),
  slot int not null check (slot between 1 and 4),
  title text not null,
  description text not null default '',
  button_text text not null default 'Start',
  action_type text not null check (action_type in ('survey','offer','action','video')),
  action_url text not null default '',
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (slot)
);

create table if not exists public.giveaway_entries (
  id uuid primary key default gen_random_uuid(),
  giveaway_id uuid,
  user_id uuid,
  contact_method text not null check (contact_method in ('whatsapp','sms','email')),
  contact_value text not null,
  answers jsonb not null default '{}'::jsonb,
  challenge_progress jsonb not null default '{}'::jsonb,
  qualified boolean not null default false,
  created_at timestamptz not null default now(),
  qualified_at timestamptz
);

create index if not exists giveaway_entries_user_idx on public.giveaway_entries(user_id);
create index if not exists giveaway_entries_qualified_idx on public.giveaway_entries(qualified);

alter table public.water_break_events enable row level security;
alter table public.giveaway_challenges enable row level security;
alter table public.giveaway_entries enable row level security;

-- Challenge configuration can be read by the app.
create policy if not exists "giveaway challenges readable"
on public.giveaway_challenges for select using (true);

-- Event configuration can be read by the app.
create policy if not exists "water break events readable"
on public.water_break_events for select using (true);

-- Entries must be written through a trusted server-side function/edge endpoint.
-- Do not add a public insert policy; this prevents client-side qualification forgery.
