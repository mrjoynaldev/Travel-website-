-- Homepage sections: admins compose the public homepage from ordered,
-- type-based sections (featured, latest, category, tag, custom).
-- Custom sections carry sanitized HTML so teams can add banners or copy.

create table if not exists public.site_sections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  section_type text not null check (section_type in ('featured', 'latest', 'category', 'tag', 'custom')),
  category_id uuid references public.categories(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  subtitle text,
  content_json jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  rendered_html text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_sections_source_exclusive check (
    (section_type = 'category' and category_id is not null and tag_id is null) or
    (section_type = 'tag' and tag_id is not null and category_id is null) or
    (section_type in ('featured', 'latest', 'custom') and category_id is null and tag_id is null)
  )
);

create index if not exists site_sections_public_idx on public.site_sections(site_id, is_visible, sort_order);
create index if not exists site_sections_type_idx on public.site_sections(site_id, section_type);

drop trigger if exists site_sections_touch_updated_at on public.site_sections;
create trigger site_sections_touch_updated_at before update on public.site_sections for each row execute procedure public.touch_updated_at();

alter table public.site_sections enable row level security;

-- Server-only access (service credential): no anon/authenticated policies.
-- The tRPC layer renders sections with hydrated posts for the public site.

comment on table public.site_sections is 'Ordered homepage sections configured by publication admins. Feed sections hydrate published posts server-side; custom sections render sanitized HTML.';
