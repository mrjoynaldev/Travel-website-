-- Blueprint core extensions: capabilities, settings, scheduled-content readiness,
-- richer SEO metadata, and media metadata. These additions preserve the existing
-- four-state editorial workflow; scheduled time is an attribute, not a fifth state.

create table if not exists public.capabilities (
  id uuid primary key default gen_random_uuid(),
  capability_key text not null unique check (capability_key ~ '^[a-z]+(\.[a-z_]+)+$'),
  scope text not null check (scope in ('platform', 'organization', 'site', 'content')),
  description text not null,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

create table if not exists public.site_role_capabilities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  role public.app_role not null,
  capability_id uuid not null references public.capabilities(id) on delete cascade,
  allowed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, role, capability_id)
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null unique references public.sites(id) on delete cascade,
  navigation jsonb not null default '[]'::jsonb,
  default_locale text not null default 'en',
  timezone text not null default 'UTC',
  seo_defaults jsonb not null default '{}'::jsonb,
  feature_flags jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts add column if not exists content_type text not null default 'post' check (content_type in ('post', 'page'));
alter table public.posts add column if not exists scheduled_at timestamptz;
alter table public.posts add column if not exists schedule_cron_task_uid varchar(65);
alter table public.posts add column if not exists deleted_at timestamptz;
alter table public.posts add column if not exists seo_json jsonb not null default '{}'::jsonb;
alter table public.posts add column if not exists slug_history jsonb not null default '[]'::jsonb;

alter table public.media_assets add column if not exists credit text;
alter table public.media_assets add column if not exists license text;
alter table public.media_assets add column if not exists processing_status text not null default 'ready' check (processing_status in ('ready', 'pending', 'failed'));
alter table public.media_assets add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists posts_scheduled_idx on public.posts(site_id, scheduled_at) where scheduled_at is not null and deleted_at is null;
create index if not exists posts_content_type_idx on public.posts(site_id, content_type, status, published_at desc);
create index if not exists posts_schedule_task_idx on public.posts(schedule_cron_task_uid) where schedule_cron_task_uid is not null;
create index if not exists site_role_capabilities_scope_idx on public.site_role_capabilities(site_id, role, capability_id);

insert into public.capabilities (capability_key, scope, description, risk_level) values
  ('content.read', 'content', 'Read content within an authorized site.', 'low'),
  ('content.create', 'content', 'Create site content.', 'low'),
  ('content.edit_own', 'content', 'Edit authored content.', 'medium'),
  ('content.edit_any', 'content', 'Edit any site content.', 'medium'),
  ('content.publish', 'content', 'Publish or archive content.', 'high'),
  ('content.schedule', 'content', 'Schedule content publication.', 'high'),
  ('content.restore', 'content', 'Restore revisions.', 'medium'),
  ('media.upload', 'site', 'Upload and manage site media.', 'medium'),
  ('taxonomy.manage', 'site', 'Manage categories and tags.', 'medium'),
  ('comments.moderate', 'site', 'Moderate reader comments.', 'medium'),
  ('analytics.read', 'site', 'View site analytics.', 'low'),
  ('users.manage', 'site', 'Manage team memberships.', 'high'),
  ('roles.manage', 'site', 'Change team roles and capability policy.', 'high'),
  ('settings.manage', 'site', 'Manage publication settings.', 'high'),
  ('audit.read', 'site', 'Read audit events.', 'low'),
  ('ai.use', 'site', 'Use embedded AI editorial features.', 'low')
on conflict (capability_key) do nothing;

insert into public.site_settings (organization_id, site_id)
select organization_id, id from public.sites
on conflict (site_id) do nothing;

drop trigger if exists site_role_capabilities_touch_updated_at on public.site_role_capabilities;
create trigger site_role_capabilities_touch_updated_at before update on public.site_role_capabilities for each row execute procedure public.touch_updated_at();
drop trigger if exists site_settings_touch_updated_at on public.site_settings;
create trigger site_settings_touch_updated_at before update on public.site_settings for each row execute procedure public.touch_updated_at();

alter table public.capabilities enable row level security;
alter table public.site_role_capabilities enable row level security;
alter table public.site_settings enable row level security;

comment on table public.capabilities is 'Declarative capability catalog. Server domain services remain the enforcement point.';
comment on table public.site_role_capabilities is 'Per-site role capability policy overrides; high-risk changes must be audited.';
comment on table public.site_settings is 'Tenant-scoped publication settings and feature controls.';
