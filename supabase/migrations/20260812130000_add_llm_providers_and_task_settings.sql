-- Multi-provider LLM configuration. API keys are stored server-side only and
-- are never returned to the browser by any procedure.

do $$ begin
  create type public.llm_provider_type as enum ('openai', 'anthropic', 'gemini', 'nvidia', 'custom');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.llm_task as enum ('outline', 'improve', 'meta', 'summarize', 'agent_chat');
exception when duplicate_object then null;
end $$;

create table if not exists public.llm_providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  provider_type public.llm_provider_type not null,
  name text not null check (char_length(trim(name)) between 1 and 80),
  base_url text check (base_url is null or char_length(trim(base_url)) between 1 and 2048),
  api_key text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, name)
);

create table if not exists public.llm_task_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  task public.llm_task not null,
  provider_id uuid not null references public.llm_providers(id) on delete cascade,
  model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, task)
);

create index if not exists llm_providers_site_idx on public.llm_providers(site_id, is_active);
create index if not exists llm_task_settings_site_idx on public.llm_task_settings(site_id, task);

alter table public.llm_providers enable row level security;
alter table public.llm_task_settings enable row level security;

-- No public RLS policies: these tables are reachable only through the server's
-- service credential, which keeps provider API keys out of any client-visible path.

comment on table public.llm_providers is 'Server-side LLM provider credentials. api_key is never exposed to the browser; procedures return a masked form.';
comment on table public.llm_task_settings is 'Per-task model routing: which provider model handles outline, improve, meta, summarize, and agent_chat tasks.';
