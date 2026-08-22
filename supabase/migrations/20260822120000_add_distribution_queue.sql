-- Distribution queue for the syndication engine (POST-WRITING-SKILL.md §9).
-- One row per (post, channel) placement. Rows enter as 'pending' when a share
-- kit is pushed, move to 'approved' on Studio approval, and to 'posted' /
-- 'failed' after the channel adapter runs. The global daily cap is enforced in
-- the API layer (max 3 posted rows per site per UTC day) — not by discipline.

create table if not exists public.distribution_queue (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  slug text not null,
  channel text not null check (channel in ('devto', 'bluesky', 'mastodon')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'posted', 'skipped', 'failed')),
  posted_url text,
  error text,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug, channel)
);

create index if not exists distribution_queue_site_status_idx
  on public.distribution_queue(site_id, status, coalesce(posted_at, created_at));

alter table public.distribution_queue enable row level security;

comment on table public.distribution_queue is 'Syndication placements per post/channel with approve-then-post flow and audit trail. Cap enforcement lives in the distribution router.';
