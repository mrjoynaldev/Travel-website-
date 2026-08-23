-- Keep DM automation Instagram-only per request (cut Facebook from automation, distribution Facebook Page still live)
alter table public.automations drop constraint if exists automations_platform_check;
alter table public.automations add constraint automations_platform_check check (platform = 'instagram');
