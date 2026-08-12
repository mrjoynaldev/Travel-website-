-- Enterprise Blog Platform: foundational tenant-scoped schema.
-- Canonical rich editor content is stored as JSONB; rendered HTML is derived.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('admin', 'editor', 'author');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.post_status as enum ('draft', 'review', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.comment_status as enum ('pending', 'approved', 'rejected', 'deleted');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.delivery_status as enum ('pending', 'sent', 'failed', 'suppressed');
exception when duplicate_object then null;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  custom_domain text unique,
  theme_settings jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  external_auth_id text not null unique,
  display_name text not null,
  email text,
  bio text,
  avatar_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, site_id, profile_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  storage_key text not null unique,
  url text not null,
  filename text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  width integer check (width is null or width >= 0),
  height integer check (height is null or height >= 0),
  alt_text text,
  caption text,
  folder text not null default 'library',
  tags text[] not null default '{}'::text[],
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  reviewer_id uuid references public.profiles(id),
  title text not null check (char_length(trim(title)) between 1 and 180),
  slug text not null,
  excerpt text,
  content_json jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  rendered_html text not null default '',
  featured_media_id uuid references public.media_assets(id) on delete set null,
  status public.post_status not null default 'draft',
  featured boolean not null default false,
  meta_title text,
  meta_description text,
  canonical_url text,
  og_image_url text,
  submitted_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);

create table if not exists public.post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  editor_id uuid not null references public.profiles(id),
  revision_number integer not null check (revision_number > 0),
  title text not null,
  content_json jsonb not null,
  rendered_html text not null,
  summary text,
  created_at timestamptz not null default now(),
  unique (post_id, revision_number)
);

create table if not exists public.post_categories (
  post_id uuid not null references public.posts(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (post_id, category_id)
);

create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  author_name text not null check (char_length(trim(author_name)) between 1 and 120),
  author_email text not null,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  status public.comment_status not null default 'pending',
  moderation_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  email text not null,
  status text not null default 'active' check (status in ('active', 'unsubscribed', 'suppressed')),
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, email)
);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  recipient_email text not null,
  recipient_role public.app_role,
  event_type text not null check (event_type in ('review_submitted', 'post_approved', 'post_rejected', 'post_published')),
  subject text not null,
  body_text text not null,
  status public.delivery_status not null default 'pending',
  provider_message_id text,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  event_type text not null check (event_type in ('page_view', 'article_view', 'scroll_depth', 'reading_complete', 'comment_submitted', 'subscription_created')),
  session_hash text,
  referrer_host text,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sites_organization_id_idx on public.sites(organization_id);
create index if not exists memberships_profile_id_idx on public.memberships(profile_id);
create index if not exists memberships_scope_idx on public.memberships(organization_id, site_id, role);
create index if not exists posts_public_list_idx on public.posts(site_id, status, featured desc, published_at desc);
create index if not exists posts_author_idx on public.posts(author_id, status, updated_at desc);
create index if not exists posts_search_idx on public.posts using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '')));
create index if not exists post_revisions_post_idx on public.post_revisions(post_id, revision_number desc);
create index if not exists media_assets_site_idx on public.media_assets(site_id, folder, created_at desc);
create index if not exists comments_queue_idx on public.comments(site_id, status, created_at asc);
create index if not exists comments_post_idx on public.comments(post_id, status, created_at asc);
create index if not exists subscribers_site_status_idx on public.subscribers(site_id, status);
create index if not exists notification_outbox_pending_idx on public.notification_outbox(status, created_at asc);
create index if not exists analytics_event_summary_idx on public.analytics_events(site_id, event_type, occurred_at desc);
create index if not exists analytics_event_post_idx on public.analytics_events(post_id, occurred_at desc);
create index if not exists audit_events_resource_idx on public.audit_events(resource_type, resource_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.enforce_post_workflow()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status <> old.status then
    if not (
      (old.status = 'draft' and new.status in ('review', 'archived')) or
      (old.status = 'review' and new.status in ('draft', 'published', 'archived')) or
      (old.status = 'published' and new.status = 'archived') or
      (old.status = 'archived' and new.status = 'draft')
    ) then
      raise exception 'Invalid editorial workflow transition from % to %', old.status, new.status;
    end if;

    if new.status = 'review' then
      new.submitted_at = now();
    elsif new.status = 'published' then
      new.published_at = coalesce(new.published_at, now());
    elsif new.status = 'archived' then
      new.archived_at = now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_touch_updated_at on public.organizations;
create trigger organizations_touch_updated_at before update on public.organizations for each row execute procedure public.touch_updated_at();
drop trigger if exists sites_touch_updated_at on public.sites;
create trigger sites_touch_updated_at before update on public.sites for each row execute procedure public.touch_updated_at();
drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute procedure public.touch_updated_at();
drop trigger if exists memberships_touch_updated_at on public.memberships;
create trigger memberships_touch_updated_at before update on public.memberships for each row execute procedure public.touch_updated_at();
drop trigger if exists categories_touch_updated_at on public.categories;
create trigger categories_touch_updated_at before update on public.categories for each row execute procedure public.touch_updated_at();
drop trigger if exists tags_touch_updated_at on public.tags;
create trigger tags_touch_updated_at before update on public.tags for each row execute procedure public.touch_updated_at();
drop trigger if exists media_assets_touch_updated_at on public.media_assets;
create trigger media_assets_touch_updated_at before update on public.media_assets for each row execute procedure public.touch_updated_at();
drop trigger if exists posts_enforce_workflow on public.posts;
create trigger posts_enforce_workflow before update on public.posts for each row execute procedure public.enforce_post_workflow();
drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at before update on public.posts for each row execute procedure public.touch_updated_at();
drop trigger if exists comments_touch_updated_at on public.comments;
create trigger comments_touch_updated_at before update on public.comments for each row execute procedure public.touch_updated_at();
drop trigger if exists subscribers_touch_updated_at on public.subscribers;
create trigger subscribers_touch_updated_at before update on public.subscribers for each row execute procedure public.touch_updated_at();
drop trigger if exists notification_outbox_touch_updated_at on public.notification_outbox;
create trigger notification_outbox_touch_updated_at before update on public.notification_outbox for each row execute procedure public.touch_updated_at();

alter table public.organizations enable row level security;
alter table public.sites enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.media_assets enable row level security;
alter table public.posts enable row level security;
alter table public.post_revisions enable row level security;
alter table public.post_categories enable row level security;
alter table public.post_tags enable row level security;
alter table public.comments enable row level security;
alter table public.subscribers enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.analytics_events enable row level security;
alter table public.audit_events enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.posts, public.categories, public.tags, public.post_categories, public.post_tags, public.comments to anon, authenticated;

drop policy if exists "public can read published posts" on public.posts;
create policy "public can read published posts" on public.posts
  for select to anon, authenticated using (status = 'published');
drop policy if exists "public can read categories" on public.categories;
create policy "public can read categories" on public.categories
  for select to anon, authenticated using (true);
drop policy if exists "public can read tags" on public.tags;
create policy "public can read tags" on public.tags
  for select to anon, authenticated using (true);
drop policy if exists "public can read published post categories" on public.post_categories;
create policy "public can read published post categories" on public.post_categories
  for select to anon, authenticated using (exists (select 1 from public.posts p where p.id = post_id and p.status = 'published'));
drop policy if exists "public can read published post tags" on public.post_tags;
create policy "public can read published post tags" on public.post_tags
  for select to anon, authenticated using (exists (select 1 from public.posts p where p.id = post_id and p.status = 'published'));
drop policy if exists "public can read approved comments" on public.comments;
create policy "public can read approved comments" on public.comments
  for select to anon, authenticated using (status = 'approved');

comment on table public.posts is 'Tenant-scoped posts. content_json is canonical editor data; rendered_html is derived and sanitized.';
comment on table public.notification_outbox is 'Auditable provider-neutral notification queue. Delivery must occur through a configured server-side email adapter.';
comment on function public.enforce_post_workflow() is 'Restricts transitions to the exact editorial states: draft, review, published, archived.';
