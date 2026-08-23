-- DM automation for FB/IG: comment keyword -> DM with button (admin-managed link) + follow gate
create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  platform text not null check (platform in ('facebook','instagram')),
  post_id text not null,
  post_title text not null default '',
  keyword text not null,
  dm_template text not null,
  button_text text not null default 'Read Full Guide',
  button_url text not null,
  follow_required boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, platform, post_id, keyword)
);
create index if not exists automations_site_platform_idx on public.automations(site_id, platform, is_active);
alter table public.automations enable row level security;
create policy "Allow service role all automations" on public.automations for all using (true) with check (true);

-- Rate limit / dedup log for private replies (1 per user per 24h, 750/hour)
create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  comment_id text not null,
  commenter_id text not null,
  platform text not null,
  status text not null default 'queued' check (status in ('queued','sent','skipped','failed')),
  error text,
  created_at timestamptz not null default now(),
  unique (automation_id, comment_id)
);
create index if not exists automation_logs_commenter_time_idx on public.automation_logs(commenter_id, created_at desc);
alter table public.automation_logs enable row level security;
create policy "Allow service role all logs" on public.automation_logs for all using (true) with check (true);
