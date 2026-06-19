-- Cron: sync IPTV channels every day at 4am UTC
-- This calls the Edge Function sync-channels
select cron.schedule(
  'sync-iptv-channels',
  '0 4 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sync-channels',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Cron: sync sports events every 30 minutes
select cron.schedule(
  'sync-sports-events',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sync-sports',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Cron: delete finished sports events every hour
select cron.schedule(
  'cleanup-sports-events',
  '0 * * * *',
  $$
  delete from public.sports_events
  where ends_at is not null and ends_at < now() - interval '2 hours';
  $$
);
