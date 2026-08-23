-- Leads from /hire funnel (services-first)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  email text not null,
  need text not null,
  source text not null default 'hire-page',
  status text not null default 'new' check (status in ('new','contacted','won','lost')),
  created_at timestamptz not null default now()
);
create index if not exists leads_site_created_idx on public.leads(site_id, created_at desc);
alter table public.leads enable row level security;
-- Public can insert (hire form), admin can read via service role (bypass RLS). Add policy for anon insert:
create policy "Allow public insert leads" on public.leads for insert with check (true);
create policy "Allow admin read leads" on public.leads for select using (true);
