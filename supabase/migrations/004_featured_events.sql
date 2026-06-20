create table if not exists public.featured_events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  banner_url text,
  color text default '#dc2626',
  is_active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.event_channels (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.featured_events(id) on delete cascade,
  name text not null,
  url text not null,
  logo text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.featured_events enable row level security;
alter table public.event_channels enable row level security;

create policy "Anyone can read active events" on public.featured_events for select using (is_active = true);
create policy "Anyone can read event channels" on public.event_channels for select using (true);
create policy "Service role manages events" on public.featured_events for all using (auth.role() = 'service_role');
create policy "Service role manages event channels" on public.event_channels for all using (auth.role() = 'service_role');
