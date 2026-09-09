-- Customer video reviews + food menu gallery, managed from the Studio and
-- rendered on the public site (CMS-first with empty fallback when unpublished).

create table if not exists public.video_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  customer_name text not null,
  tour_slug text not null default '',
  video_url text not null,
  thumbnail_url text,
  quote text not null default '',
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.food_menu_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  description text not null default '',
  price_note text not null default '',
  image_url text,
  category text not null default '',
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists video_reviews_site_status_sort_idx on public.video_reviews(site_id, status, sort_order);
create index if not exists food_menu_items_site_status_sort_idx on public.food_menu_items(site_id, status, sort_order);

alter table public.video_reviews enable row level security;
alter table public.food_menu_items enable row level security;

-- Content is public and read over the server API (service role bypasses RLS);
-- allow broad select so existing service-role flows and any client reads work.
-- Guards keep re-runs safe.
drop policy if exists "Allow read video_reviews" on public.video_reviews;
drop policy if exists "Allow read food_menu_items" on public.food_menu_items;
create policy "Allow read video_reviews" on public.video_reviews for select using (true);
create policy "Allow read food_menu_items" on public.food_menu_items for select using (true);
