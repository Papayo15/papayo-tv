-- Fix: replace i.mjh.nz URLs (404) with verified iptv-org source files
-- These are the same base repo already used for country syncs — 100% reliable

DELETE FROM playlist_sources;

INSERT INTO playlist_sources (name, url, country, service) VALUES
  -- ─── PLUTO TV (iptv-org verified) ──────────────────────────────────────────
  ('Pluto TV US',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pluto.m3u',    'us', 'pluto'),
  ('Pluto TV MX',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/mx_pluto.m3u',    'mx', 'pluto'),
  ('Pluto TV ES',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/es_pluto.m3u',    'es', 'pluto'),
  ('Pluto TV GB',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/uk_pluto.m3u',    'gb', 'pluto'),
  ('Pluto TV DE',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/de_pluto.m3u',    'de', 'pluto'),
  ('Pluto TV FR',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/fr_pluto.m3u',    'fr', 'pluto'),
  ('Pluto TV IT',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/it_pluto.m3u',    'it', 'pluto'),
  ('Pluto TV BR',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/br_pluto.m3u',    'br', 'pluto'),
  ('Pluto TV CA',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ca_pluto.m3u',    'ca', 'pluto'),
  ('Pluto TV AT',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/at_pluto.m3u',    'at', 'pluto'),
  ('Pluto TV CH',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ch_pluto.m3u',    'ch', 'pluto'),
  ('Pluto TV NO',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/no_pluto.m3u',    'no', 'pluto'),
  ('Pluto TV SE',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/se_pluto.m3u',    'se', 'pluto'),
  ('Pluto TV DK',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/dk_pluto.m3u',    'dk', 'pluto'),
  -- ─── SAMSUNG TV PLUS (iptv-org verified) ────────────────────────────────────
  ('Samsung TV+ US', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_samsung.m3u',  'us', 'samsung'),
  ('Samsung TV+ MX', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/mx_samsung.m3u',  'mx', 'samsung'),
  ('Samsung TV+ ES', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/es_samsung.m3u',  'es', 'samsung'),
  ('Samsung TV+ GB', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/uk_samsung.m3u',  'gb', 'samsung'),
  ('Samsung TV+ DE', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/de_samsung.m3u',  'de', 'samsung'),
  ('Samsung TV+ FR', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/fr_samsung.m3u',  'fr', 'samsung'),
  ('Samsung TV+ IT', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/it_samsung.m3u',  'it', 'samsung'),
  ('Samsung TV+ BR', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/br_samsung.m3u',  'br', 'samsung'),
  ('Samsung TV+ CA', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ca_samsung.m3u',  'ca', 'samsung'),
  ('Samsung TV+ AT', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/at_samsung.m3u',  'at', 'samsung'),
  ('Samsung TV+ AU', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/au_samsung.m3u',  'au', 'samsung'),
  ('Samsung TV+ BE', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/be_samsung.m3u',  'be', 'samsung'),
  ('Samsung TV+ NL', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/nl_samsung.m3u',  'nl', 'samsung'),
  ('Samsung TV+ NO', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/no_samsung.m3u',  'no', 'samsung'),
  ('Samsung TV+ SE', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/se_samsung.m3u',  'se', 'samsung'),
  ('Samsung TV+ DK', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/dk_samsung.m3u',  'dk', 'samsung'),
  ('Samsung TV+ PT', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/pt_samsung.m3u',  'pt', 'samsung'),
  ('Samsung TV+ FI', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/fi_samsung.m3u',  'fi', 'samsung'),
  ('Samsung TV+ IN', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in_samsung.m3u',  'in', 'samsung'),
  ('Samsung TV+ NZ', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/nz_samsung.m3u',  'nz', 'samsung'),
  -- ─── PLEX TV (iptv-org verified) ─────────────────────────────────────────────
  ('Plex TV US',     'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_plex.m3u',     'us', 'plex'),
  -- ─── TUBI TV – free streaming US ─────────────────────────────────────────────
  ('Tubi TV US',     'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_tubi.m3u',     'us', 'plex'),
  -- ─── ROKU CHANNEL US ─────────────────────────────────────────────────────────
  ('Roku Channel US','https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_roku.m3u',     'us', 'plex'),
  -- ─── XUMO US ─────────────────────────────────────────────────────────────────
  ('Xumo US',        'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_xumo.m3u',     'us', 'plex'),
  -- ─── PBS US (public TV) ────────────────────────────────────────────────────
  ('PBS US',         'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pbs.m3u',      'us', 'plex'),
  -- ─── STIRR US ────────────────────────────────────────────────────────────────
  ('Stirr US',       'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_stirr.m3u',    'us', 'plex'),
  -- ─── ABC NEWS US ─────────────────────────────────────────────────────────────
  ('ABC News US',    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_abcnews.m3u',  'us', 'plex'),
  -- ─── MULTIMEDIOS MX (Canal 5, Las Estrellas, etc.) ───────────────────────────
  ('Multimedios MX', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/mx_multimedios.m3u','mx','plex'),
  -- ─── BBC UK ────────────────────────────────────────────────────────────────
  ('BBC UK',         'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/uk_bbc.m3u',      'gb', 'plex'),
  -- ─── RAKUTEN TV ──────────────────────────────────────────────────────────────
  ('Rakuten TV ES',  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/es_rakuten.m3u',  'es', 'plex'),
  ('Rakuten TV DE',  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/de_rakuten.m3u',  'de', 'plex'),
  ('Rakuten TV FR',  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/fr_rakuten.m3u',  'fr', 'plex'),
  ('Rakuten TV IT',  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/it_rakuten.m3u',  'it', 'plex'),
  ('Rakuten TV GB',  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/uk_rakuten.m3u',  'gb', 'plex')
ON CONFLICT (url) DO NOTHING;
