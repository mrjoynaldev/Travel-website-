create table if not exists public.agent_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New agent conversation',
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.agent_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  thread_id uuid not null references public.agent_threads(id) on delete cascade,
  requested_by_profile_id uuid not null references public.profiles(id),
  approved_by_profile_id uuid references public.profiles(id),
  action_type text not null check (action_type in ('create_draft', 'create_category', 'update_site_tagline', 'publish_post', 'archive_post')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected', 'executed', 'failed')),
  result jsonb,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  executed_at timestamptz
);

create index if not exists agent_threads_scope_idx on public.agent_threads(organization_id, site_id, profile_id, updated_at desc);
create index if not exists agent_actions_scope_idx on public.agent_actions(organization_id, site_id, status, created_at desc);
create index if not exists agent_messages_thread_idx on public.agent_messages(thread_id, created_at);

drop trigger if exists agent_threads_touch_updated_at on public.agent_threads;
create trigger agent_threads_touch_updated_at before update on public.agent_threads for each row execute procedure public.touch_updated_at();

alter table public.agent_threads enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_actions enable row level security;
comment on table public.agent_actions is 'AI operation proposals and approved executions. Models never access secrets, raw SQL, or privileged provider credentials.';
