-- API access tokens for programmatic (CLI / headless) publication management.
-- Only the SHA-256 hash of a token is stored; the full token is shown exactly
-- once at creation time and can never be recovered afterward.

create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  token_hash text not null unique,
  token_prefix text not null,
  scopes text[] not null default '{read,write}'::text[],
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists api_tokens_scope_idx on public.api_tokens(organization_id, site_id, revoked_at);
create index if not exists api_tokens_hash_idx on public.api_tokens(token_hash);

alter table public.api_tokens enable row level security;

comment on table public.api_tokens is 'Scoped, revocable API access tokens for CLI/headless management. Tokens are hashed; privileges inherit the owning profile''s role.';
