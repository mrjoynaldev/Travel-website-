-- Allow Facebook Page and Instagram channels in distribution queue (was devto/bluesky/mastodon only).
alter table public.distribution_queue drop constraint if exists distribution_queue_channel_check;
alter table public.distribution_queue add constraint distribution_queue_channel_check check (channel in ('devto', 'bluesky', 'mastodon', 'facebook', 'instagram'));
