-- Fuentes de playlists M3U externas (Pluto TV, Samsung TV Plus, Plex, custom)
CREATE TABLE IF NOT EXISTS playlist_sources (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  url            text NOT NULL UNIQUE,
  country        text NOT NULL DEFAULT 'int',
  service        text NOT NULL DEFAULT 'custom', -- 'pluto' | 'samsung' | 'plex' | 'iptv-org' | 'custom'
  is_active      boolean DEFAULT true,
  last_synced_at timestamptz,
  channel_count  integer DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE playlist_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read playlist_sources"
  ON playlist_sources FOR SELECT USING (true);

CREATE POLICY "Service role all playlist_sources"
  ON playlist_sources FOR ALL USING (auth.role() = 'service_role');

-- Pre-populate with free streaming services (legal, ad-supported)
INSERT INTO playlist_sources (name, url, country, service) VALUES
  -- ─── Pluto TV ───────────────────────────────────────────────────────────────
  ('Pluto TV US',   'https://i.mjh.nz/PlutoTV/us.m3u8',  'us', 'pluto'),
  ('Pluto TV ES',   'https://i.mjh.nz/PlutoTV/es.m3u8',  'es', 'pluto'),
  ('Pluto TV MX',   'https://i.mjh.nz/PlutoTV/mx.m3u8',  'mx', 'pluto'),
  ('Pluto TV AR',   'https://i.mjh.nz/PlutoTV/ar.m3u8',  'ar', 'pluto'),
  ('Pluto TV CO',   'https://i.mjh.nz/PlutoTV/co.m3u8',  'co', 'pluto'),
  ('Pluto TV DE',   'https://i.mjh.nz/PlutoTV/de.m3u8',  'de', 'pluto'),
  ('Pluto TV GB',   'https://i.mjh.nz/PlutoTV/gb.m3u8',  'gb', 'pluto'),
  ('Pluto TV FR',   'https://i.mjh.nz/PlutoTV/fr.m3u8',  'fr', 'pluto'),
  ('Pluto TV IT',   'https://i.mjh.nz/PlutoTV/it.m3u8',  'it', 'pluto'),
  ('Pluto TV CA',   'https://i.mjh.nz/PlutoTV/ca.m3u8',  'ca', 'pluto'),
  ('Pluto TV BR',   'https://i.mjh.nz/PlutoTV/br.m3u8',  'br', 'pluto'),
  -- ─── Samsung TV Plus ────────────────────────────────────────────────────────
  ('Samsung TV+ US','https://i.mjh.nz/SamsungTVPlus/us.m3u8','us','samsung'),
  ('Samsung TV+ ES','https://i.mjh.nz/SamsungTVPlus/es.m3u8','es','samsung'),
  ('Samsung TV+ DE','https://i.mjh.nz/SamsungTVPlus/de.m3u8','de','samsung'),
  ('Samsung TV+ GB','https://i.mjh.nz/SamsungTVPlus/gb.m3u8','gb','samsung'),
  ('Samsung TV+ FR','https://i.mjh.nz/SamsungTVPlus/fr.m3u8','fr','samsung'),
  ('Samsung TV+ IT','https://i.mjh.nz/SamsungTVPlus/it.m3u8','it','samsung'),
  ('Samsung TV+ AU','https://i.mjh.nz/SamsungTVPlus/au.m3u8','au','samsung'),
  ('Samsung TV+ CA','https://i.mjh.nz/SamsungTVPlus/ca.m3u8','ca','samsung'),
  -- ─── Plex TV ────────────────────────────────────────────────────────────────
  ('Plex TV US',    'https://i.mjh.nz/Plex/us.m3u8',     'us', 'plex'),
  ('Plex TV ES',    'https://i.mjh.nz/Plex/es.m3u8',     'es', 'plex'),
  ('Plex TV DE',    'https://i.mjh.nz/Plex/de.m3u8',     'de', 'plex'),
  ('Plex TV GB',    'https://i.mjh.nz/Plex/gb.m3u8',     'gb', 'plex'),
  ('Plex TV FR',    'https://i.mjh.nz/Plex/fr.m3u8',     'fr', 'plex'),
  ('Plex TV CA',    'https://i.mjh.nz/Plex/ca.m3u8',     'ca', 'plex'),
  ('Plex TV AU',    'https://i.mjh.nz/Plex/au.m3u8',     'au', 'plex')
ON CONFLICT (url) DO NOTHING;
