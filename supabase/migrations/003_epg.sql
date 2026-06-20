-- Add tvg_id to channels for EPG matching
alter table public.channels add column if not exists tvg_id text;
create index if not exists idx_channels_tvg_id on public.channels(tvg_id);
create index if not exists idx_channels_name_lower on public.channels(lower(name));

-- EPG programs table
create table if not exists public.epg_programs (
  id uuid default gen_random_uuid() primary key,
  tvg_id text not null,
  title text not null,
  description text,
  thumbnail text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists idx_epg_tvg_start on public.epg_programs(tvg_id, start_time);
create index if not exists idx_epg_start_end on public.epg_programs(start_time, end_time);

alter table public.epg_programs enable row level security;
create policy "Anyone can read EPG" on public.epg_programs for select using (true);
create policy "Service role can manage EPG" on public.epg_programs for all using (auth.role() = 'service_role');
