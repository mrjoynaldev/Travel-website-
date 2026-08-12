-- General-purpose public-site configuration and legal-page foundation.

alter table public.site_settings add column if not exists brand jsonb not null default '{}'::jsonb;
alter table public.site_settings add column if not exists footer_links jsonb not null default '[]'::jsonb;
alter table public.site_settings add column if not exists contact jsonb not null default '{}'::jsonb;

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  page_type text not null check (page_type in ('privacy', 'terms', 'contact', 'custom')),
  title text not null check (char_length(trim(title)) between 1 and 180),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  content_json jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  rendered_html text not null default '',
  meta_title text,
  meta_description text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug),
  unique (site_id, page_type)
);

create index if not exists site_pages_public_idx on public.site_pages(site_id, status, slug);
create index if not exists site_pages_type_idx on public.site_pages(site_id, page_type);

drop trigger if exists site_pages_touch_updated_at on public.site_pages;
create trigger site_pages_touch_updated_at before update on public.site_pages for each row execute procedure public.touch_updated_at();

create or replace function public.set_site_page_published_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'published' and old.status <> 'published' then
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists site_pages_set_published_at on public.site_pages;
create trigger site_pages_set_published_at before update on public.site_pages for each row execute procedure public.set_site_page_published_at();

alter table public.site_pages enable row level security;
grant select on public.site_pages to anon, authenticated;
drop policy if exists "public can read published site pages" on public.site_pages;
create policy "public can read published site pages" on public.site_pages for select to anon, authenticated using (status = 'published');

comment on table public.site_pages is 'Tenant-scoped public pages including configurable privacy, terms, contact, and custom pages. Content JSON is canonical; HTML is derived and sanitized.';
