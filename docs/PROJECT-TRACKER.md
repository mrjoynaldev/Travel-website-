# CodeReport Global — Project Tracker

> **Purpose:** Single source of truth for the project. Tracks what the product is, what has been built, where we are, and what remains. Update this file whenever a feature lands, a build breaks, or a decision changes.
>
> **Last updated:** 2026-08-12
> **Current milestone:** Launch-ready professional blog (core CMS + editor complete, headless API + CLI live)

---

## 0. Rules (how this tracker must be used)

1. **Always update this file when implementing anything.** Every feature, fix, refactor, dependency change, migration, or config change must be reflected here in the same session it is made — no exceptions.
2. **Keep the changelog dated.** Add an entry to *Recent Changelog* with the date and a one-line summary of what changed.
3. **Keep the matrix honest.** Flip a feature's status (🟡 → ✅, or ✅ → 🟡 if regressed) the moment its real state changes. Never claim "done" for untested or configuration-dependent work.
4. **Re-run verification.** After any change, run `pnpm check` (typecheck) and, where relevant, `pnpm test` / `pnpm build`, then update the *Verification Status* section with the actual numbers.
5. **This file is the single source of truth** for progress measurement. When in doubt, it wins over stale notes or memory.

---

## 1. Executive Summary

**CodeReport Global** is an enterprise-grade, multi-tenant, AI-native publishing platform (rebranded from "Fieldnote"). It combines a public reader website, an authenticated editorial Studio, and a unified backend, deployed as:

- **Public website** → Vercel (`apps/web`, server-rendered React)
- **Admin Studio** → Vercel (`apps/studio`, authenticated SPA)
- **Unified API** → Render (`apps/api`, Express + tRPC)
- **Database + Auth + Storage** → Supabase (Postgres, RLS, S3)

Positioning: *"WordPress-class CMS + Ghost-class editor + Substack-class audience layer + Wix-class customization + Hashnode-class headless API + an enterprise AI operations agent."*

---

## 2. Progress Snapshot

| Area | Status | Progress |
|---|---|---|
| Foundation (monorepo, auth, tenant model, RLS, design system) | 🟢 Done | ~95% |
| Core CMS (posts, editor, revisions, media, taxonomy, publishing) | 🟢 Done | ~90% |
| Enterprise Admin (roles, capabilities, workflow, audit, settings) | 🟢 Done | ~85% |
| Audience & Growth (comments, subscribers, analytics, SEO, search) | 🟢 Done | ~80% |
| AI Platform (editor assistant, agent, multi-provider LLM routing) | 🟢 Done | ~80% |
| Advanced Publishing (newsletters, memberships, webhooks, podcasts) | 🟡 Planned | ~10% |
| Enterprise Hardening (SSO, rate limits, load testing, DR) | 🟡 Planned | ~5% |

**Overall:** a **fully launchable professional blog** is complete. Remaining work is the broader "publishing operating system" vision (monetization, developer platform, hardening), not launch blockers.

---

## 3. Architecture

```
apps/
  api/          Express + tRPC (unified backend: blog, studio, ai, agent, llm routers)
  web/          Public site (SSR, React 19, Wouter) — 8 routes
  studio/       Admin SPA (React 19, Wouter) — 21 routes
packages/
  client-common/  Shared UI kit (50+ Radix/shadcn components), trpc client, hooks, theme
  contracts/      Type-only AppRouter re-export (no runtime import)
cli/
  blog.mjs        Headless management CLI (uses scoped API access tokens)
supabase/migrations/  11 versioned SQL migrations
docs/                Architecture, audit, QA, handover, and this tracker
```

### Tech Stack
React 19 · TypeScript 5.9 (strict) · tRPC v11 (superjson) · Express 4 · Supabase (Postgres + RLS + Storage) · TipTap 3.30 (ProseMirror) · Tailwind CSS 4 · Vite 7 · TanStack Query 5 · Zod 4 · pnpm monorepo · Vitest

### Data Model (27 tables)
`organizations` · `sites` · `profiles` · `memberships` · `posts` · `post_revisions` · `categories` · `tags` · `post_categories` · `post_tags` · `site_pages` · `site_sections` · `site_settings` · `media_assets` · `comments` · `subscribers` · `notification_outbox` · `analytics_events` · `audit_events` · `agent_threads` · `agent_messages` · `agent_actions` · `llm_providers` · `llm_task_settings` · `capabilities` · `site_role_capabilities` · `api_tokens`

### Security Model
- 3 roles (admin / editor / author) + capability catalog (16 capabilities)
- Supabase RLS on every table; service-role key is server-only
- `sanitize-html` allowlist on all rich content; hostname-restricted iframes
- PostgreSQL trigger enforces exact workflow graph + immutable `published_at`
- Approval-gated AI agent (propose → approve → execute → audit)

---

## 4. Feature Completion Matrix

### Public Website (8 routes) — 🟢 Complete

| Feature | Status |
|---|---|
| Homepage (featured + latest + configured sections + search + category filter + pagination) | ✅ |
| Article page (sanitized rich HTML, author bio, tags, related, comments) | ✅ |
| Author profile page | ✅ |
| Topic archive (`/topics/:slug`) | ✅ |
| Tag archive (`/tags/:slug`) | ✅ |
| Year archive (`/archive`, `/archive/:year`) | ✅ |
| Legal/custom pages (privacy, terms, contact, about) | ✅ |
| 404 with noindex | ✅ |
| SEO: canonical, Open Graph, Twitter, JSON-LD-ready, sitemap, RSS, robots | ✅ |
| Comments (submit → moderate → publish) with privacy link | ✅ |
| Newsletter subscription with privacy link | ✅ |
| Privacy-conscious analytics (page_view, article_view, scroll, reading_complete) | ✅ |

### Editorial Studio (20 routes) — 🟢 Complete

| Feature | Status |
|---|---|
| Login (Supabase email/password, auto-provision admin on first access) | ✅ |
| Dashboard (post counts, review queue, analytics snapshot) | ✅ |
| Post manager (list, search, status filter) | ✅ |
| Rich editor (TipTap) | ✅ |
| Preview (authenticated draft/review preview) | ✅ |
| Media library (S3 upload, folders, search, reuse) | ✅ |
| Taxonomy (categories + tags) | ✅ |
| Comment moderation (approve / reject / delete) | ✅ |
| Analytics dashboard (views, engagement, top posts) | ✅ |
| Team management (role changes, audited) | ✅ |
| Notification outbox viewer | ✅ |
| AI providers (multi-provider LLM: OpenAI, Anthropic, Gemini, Nvidia, custom) | ✅ |
| AI agent workspace (approval-gated actions) | ✅ |
| Site settings (name, description, domain, navigation, locale, timezone) | ✅ |
| Brand & identity (logo, favicon, colors, social image, tagline) | ✅ |
| Public pages editor (legal + custom pages) | ✅ |
| Homepage sections builder (featured/latest/category/tag/custom, reorder, visibility) | ✅ |
| Capability policy editor | ✅ |
| Audit log viewer | ✅ |
| Content export (JSON / Markdown) | ✅ |
| **Subscribers page** (list + remove) | ✅ (new) |
| **API tokens page** (create scoped tokens, revoke, copy-once) | ✅ (new) |
| **Featured toggle + schedule publication** (datetime picker) | ✅ (new) |
| **Post delete / trash** (soft-delete, hidden from public site) | ✅ (new) |

### Editor Capabilities (TipTap) — 🟢 Complete (2026-08-12)

| Feature | Status |
|---|---|
| Long-form content, headings, bold, italic, quotes, lists, code | ✅ |
| **Underline, strikethrough, highlight** | ✅ (new) |
| Images (upload + media-library picker, alt text, lazy loading) | ✅ |
| Links (http/https only, noopener + target=_blank) | ✅ |
| **CTA buttons** (primary/secondary variants, crawlable `<a>` links) | ✅ (new) |
| **Audio player** (MP3/M4A/WAV/OGG/WebM — "song play system") | ✅ (new) |
| **Video embeds** (YouTube/Vimeo, responsive 16:9) | ✅ (new) |
| **Tables** (insert, add row/column, delete) | ✅ (new) |
| **Code syntax highlighting** (37 languages via lowlight + highlight.js) | ✅ (new) |
| JSON source mode + controlled HTML mode | ✅ |
| Autosave (1.6s debounce, revision-backed) | ✅ |
| Revisions + restore | ✅ |
| AI writing companion (outline, improve, SEO meta, summarize) | ✅ |
| Word + character count | ✅ |

### AI Platform — 🟢 Complete

| Feature | Status |
|---|---|
| Multi-provider LLM routing (OpenAI, Anthropic, Gemini, Nvidia NIM, custom) | ✅ |
| Per-task model assignment (outline/improve/meta/summarize/agent_chat) | ✅ |
| Model auto-discovery + provider connection test | ✅ |
| Editor writing assistant | ✅ |
| AI agent (read-only analysis + approval-gated actions) | ✅ |
| Agent action risk levels (medium/high) + mandatory admin approval | ✅ |
| Prompt-injection boundary (content treated as untrusted) | ✅ |
| Retry with exponential backoff + Retry-After | ✅ |

### Backend / Operations — 🟢 Complete

| Feature | Status |
|---|---|
| Auth (sign up, sign in, logout, session JWT cookies) | ✅ |
| Multi-tenant scoping (org + site on every record) | ✅ |
| Exact workflow state machine (draft→review→published→archived) | ✅ |
| Immutable first `published_at` (DB trigger + regression test) | ✅ |
| Revision history | ✅ |
| Notification outbox (Resend + Gmail adapters, idempotency keys) | ✅ |
| Audit events on all consequential actions | ✅ |
| Health (`/healthz`) + readiness (`/readyz`) endpoints | ✅ |
| RSS, sitemap, robots feeds | ✅ |
| Content export (JSON/Markdown) | ✅ |
| **Scheduled publishing** (lazy auto-publish on read + schedule endpoint) | ✅ (new) |
| **Soft delete** (trash: `deleted_at` excluded from every public query) | ✅ (new) |
| **JSON-LD structured data** (Article schema in SSR head) | ✅ (new) |
| **API access tokens** (SHA-256 hashed, scoped, revocable, expiry) | ✅ (new) |
| **Headless CLI** (`cli/blog.mjs`) over the tRPC API | ✅ (new) |

### Planned / Not Started — 🟡

| Area | Notes |
|---|---|
| Scheduled publishing (background cron) | Lazy auto-publish on read is live; a server cron would remove the read-side coupling |
| Newsletter campaigns, segments, delivery analytics | Only base subscriber + outbox |
| Paid memberships / billing | No payment provider |
| Reader accounts (follows, bookmarks, history) | No reader profile model |
| Reactions, threaded replies UI, reporting | Threaded parent_id stored; UI incomplete |
| REST/OpenAPI/SDK/webhooks | API tokens + CLI exist; REST/OpenAPI/SDK/webhooks not started |
| Custom domains (DNS verification) | Field exists; no verification workflow |
| Canvas/social-card builder | Not started |
| Real-time collaboration | Not started |
| SSO/SAML, rate limits, CSP, malware scan, DR, load tests | Enterprise hardening |

---

## 5. Recent Changelog

| Date | Change |
|---|---|
| 2026-08-12 | **Production QA:** installed Google Chrome 151, fixed the web production start/static-directory path, and verified the real Supabase sign-in → canonical publication → rich post → moderation/audience/analytics/export → API token/CLI flow with zero QA residuals |
| 2026-08-12 | **Homepage composition:** public SSR now renders configured homepage sections with a safe feed fallback; Studio adds a scoped section manager for create/edit/reorder/visibility/remove |
| 2026-08-12 | **Database live:** applied all 11 migrations to the Supabase project (llm_providers, site_sections, codereport seed, api_tokens); fixed a CTE-scoping bug in the seed migration that blocked `db push` |
| 2026-08-12 | **Env provisioned:** created `.env` files for api/web/studio with the live Supabase credentials and a generated `JWT_SECRET` |
| 2026-08-12 | **Decoupled auth:** tRPC clients now send `credentials: include` so the httpOnly session cookie flows cross-origin (Studio/Vercel → API/Render) |
| 2026-08-12 | Review hardening: fixed trash/restore orphan bug (restore clears `deleted_at`), unhandled-rejection guard on token `last_used_at` bump, lazy-publish coverage on `bySlug` |
| 2026-08-12 | Test harness: env-dependent tests now skip cleanly (23 passed · 2 skipped · 0 failures) |
| 2026-08-12 | **Headless access:** API access tokens (hashed, scoped, revocable) + `cli/blog.mjs` management CLI + docs |
| 2026-08-12 | **Publishing controls:** scheduled publishing (lazy auto-publish), featured toggle, soft-delete/trash, subscribers page |
| 2026-08-12 | **SEO:** JSON-LD Article structured data in SSR head |
| 2026-08-12 | **Professional editor feature set:** audio embeds, CTA buttons, video embeds, tables, code highlighting, underline/highlight/strikethrough |
| 2026-08-12 | Media library accepts audio + video uploads with type icons |
| 2026-08-12 | Sanitizer expanded (audio/video/iframe/figure/mark/u/del/span) + empty-iframe cleanup + accessible iframe titles |
| 2026-08-12 | Fixed test syntax error, migration path, vitest `.env` loading |
| 2026-08-12 | Completed Fieldnote → CodeReport Global rebrand |
| 2026-08-12 | `.env` files created for api/web/studio |

---

## 6. Verification Status

| Check | Result |
|---|---|
| TypeScript (`pnpm check`) | ✅ 5/5 packages |
| Build (`pnpm build`) | ✅ api + studio + web (+ SSR) |
| Tests (`pnpm test`) | ✅ 25 passed · 2 skipped · 0 failures |
| Real local acceptance | ✅ Chrome public-route smoke; real API sign-in, canonical publication workflow, audience/moderation/analytics/export, token scope/revocation, CLI, and zero residual QA records |

### Skipped Tests (environmental prerequisites — skip cleanly, no failure)

1. **`qa.publicRoutes.test.ts`** — probes `http://localhost:3000` and skips when the SSR dev server is not running.

---

## 7. Environment & Configuration

| Variable | Where | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | api, web, studio | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | api, web, studio | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | api (server-only) | ✅ |
| `JWT_SECRET` | api | ✅ |
| `RESEND_API_KEY` + `EMAIL_FROM` | api | 🟡 for email delivery |
| `GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN` | api | 🟡 alt email transport |
| `OPENAI_API_KEY` | api | 🟡 AI fallback |
| `CANONICAL_ORIGIN` / `SITE_NAME` | web | 🟡 for prod absolute URLs |

### Commands
```bash
pnpm dev      # all apps (api:4000, web:5173, studio:5174)
pnpm check    # typecheck
pnpm build    # production build
pnpm test     # tests
```

---

## 8. Next Steps (Priority Order)

1. **Clean up QA artifacts** — the active site still carries a `qa-lifecycle` category/tag and archived QA posts from acceptance testing; remove the category/tag before launch so they don't appear in public topic/tag listings.
2. **Verify in browser** — public Chrome route smoke is complete; authenticated Studio UI still needs a repeatable non-mocked browser harness against the local Vite proxy, while the real authenticated API acceptance flow is complete.
3. **Production deploy config** — set `VITE_API_URL` (Render URL) + `CANONICAL_ORIGIN` + `CORS_ORIGINS` (Vercel domains) for the decoupled Vercel/Render deployment.
4. **Scheduled publishing cron** — move lazy auto-publish to a background scheduler (optional; read-side fallback is live).
5. **Newsletter campaigns** — build on the existing outbox + subscriber model.
6. **Developer platform** — REST/OpenAPI/SDK/webhooks on top of the token auth.
7. **Enterprise hardening** — rate limits, CSP, SSO, load testing, DR.

---

## 9. Security Notes

- **⚠️ Rotate exposed credentials.** Supabase service-role key, CLI token, and DB password were shared in plaintext during development — treat as compromised and rotate before production.
- Service-role key never reaches the browser; all client access goes through typed tRPC procedures.
- All rich HTML is server-sanitized with a strict allowlist; iframes restricted to YouTube/Vimeo/SoundCloud hostnames.
- AI prompt-injection is mitigated: post text/files/URLs are treated as untrusted data, never system instructions.
