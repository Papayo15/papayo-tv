-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_cron;

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Channels (populated by sync cron, never parsed live)
create table public.channels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  url text not null unique,
  logo text,
  country text not null default 'other',
  category text not null default 'other',
  language text,
  is_active boolean not null default true,
  last_synced_at timestamptz default now()
);
alter table public.channels enable row level security;
create policy "Anyone can read active channels" on public.channels for select using (is_active = true);
create policy "Service role can manage channels" on public.channels for all using (auth.role() = 'service_role');
create index idx_channels_country on public.channels(country);
create index idx_channels_category on public.channels(category);

-- VOD Sources (admin manually adds video URLs linked to TMDB IDs)
create table public.vod_sources (
  id uuid primary key default uuid_generate_v4(),
  tmdb_id integer not null,
  content_type text not null check (content_type in ('movie', 'series')),
  stream_url text not null,
  quality text default 'HD',
  added_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(tmdb_id, content_type)
);
alter table public.vod_sources enable row level security;
create policy "Anyone can read vod_sources" on public.vod_sources for select using (true);
create policy "Admins can manage vod_sources" on public.vod_sources for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Sports events (auto-managed by cron: creates when upcoming, deletes when finished)
create table public.sports_events (
  id text primary key,
  name text not null,
  sport text not null,
  league text not null,
  home_team text,
  away_team text,
  channel_url text,
  channel_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  poster_url text,
  is_live boolean not null default false,
  source text not null default 'thesportsdb',
  created_at timestamptz not null default now()
);
alter table public.sports_events enable row level security;
create policy "Anyone can read sports events" on public.sports_events for select using (true);
create policy "Service role can manage sports events" on public.sports_events for all using (auth.role() = 'service_role');
create index idx_sports_events_starts_at on public.sports_events(starts_at);
create index idx_sports_events_is_live on public.sports_events(is_live);

-- Custom playlists (admin/user M3U playlists)
create table public.playlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.playlists enable row level security;
create policy "Users manage own playlists" on public.playlists for all using (auth.uid() = user_id);

-- Favorites
create table public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content_type text not null check (content_type in ('channel', 'movie', 'series', 'sports')),
  content_id text not null,
  created_at timestamptz not null default now(),
  unique(user_id, content_type, content_id)
);
alter table public.favorites enable row level security;
create policy "Users manage own favorites" on public.favorites for all using (auth.uid() = user_id);

-- Watch history
create table public.watch_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content_type text not null check (content_type in ('channel', 'movie', 'series')),
  content_id text not null,
  watched_at timestamptz not null default now()
);
alter table public.watch_history enable row level security;
create policy "Users manage own history" on public.watch_history for all using (auth.uid() = user_id);
create index idx_watch_history_user on public.watch_history(user_id, watched_at desc);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
