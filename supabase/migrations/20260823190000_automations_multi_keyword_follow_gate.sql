-- Support multiple keywords + any-comment trigger for DM automation
alter table public.automations drop constraint if exists automations_platform_check;
alter table public.automations add constraint automations_platform_check check (platform = 'instagram');
-- Allow comma-separated keywords and any_comment flag (empty keyword = any comment)
alter table public.automations add column if not exists keywords text not null default '';
alter table public.automations add column if not exists any_comment boolean not null default false;
-- Backfill keywords from existing keyword column
update public.automations set keywords = keyword where keywords = '';
-- Keep keyword column for backward compat, but use keywords going forward
