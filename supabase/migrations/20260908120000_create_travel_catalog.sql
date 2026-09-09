-- Travel catalogue: bring the hardcoded public tour product into the database so
-- the Studio can manage tours and FAQs without touching source code. The public
-- site reads these tables first and falls back to static data when empty.
-- NOTE: destinations already has a legacy table with a different schema, so it is
-- intentionally left out of this migration.

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  slug text not null,
  title text not null,
  duration text not null default '',
  days integer not null default 1,
  category text not null default '',
  summary text not null default '',
  image_url text,
  featured boolean not null default false,
  price_note text,
  best_for text,
  -- Rich detail payload: overview[], highlights[], gallery[], itinerary[{day,title,desc}],
  -- inclusions[], exclusions[], startPoint, meetingPoint, transport, stay.
  detail jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tours_site_status_sort_idx on public.tours(site_id, status, sort_order);
create index if not exists faqs_site_status_sort_idx on public.faqs(site_id, status, sort_order);

alter table public.tours enable row level security;
alter table public.faqs enable row level security;

-- Content is public and read over the server API (service role bypasses RLS);
-- allow broad select so existing service-role flows and any client reads work.
-- Guards keep re-runs safe when the tables were created by an earlier rollout.
drop policy if exists "Allow read tours" on public.tours;
drop policy if exists "Allow read faqs" on public.faqs;
create policy "Allow read tours" on public.tours for select using (true);
create policy "Allow read faqs" on public.faqs for select using (true);
