# Fieldnote Production Handover

**Prepared by:** Manus AI  
**Status:** Verified pre-publication build

## Release Summary

Fieldnote is a general-purpose, database-backed publication platform with a public reader experience, an editorial Studio, governed AI assistance, S3-backed media management, public legal pages, search and discovery routes, feed endpoints, and server-rendered SEO metadata. Editorial state is constrained to **draft → review → published → archived**, and publication timestamps are protected at the database boundary.

The public site now exposes configurable **Privacy policy**, **Terms of use**, and **Contact** pages. They are seeded as clearly labelled templates for owner review, linked in the shared footer, added to the sitemap, and surfaced beside newsletter and comment data-collection flows. Their copy and metadata are manageable from the Studio without source-code edits.

> The seeded legal-page copy is a configurable operational template, not legal advice. An authorized owner should replace it with policy text appropriate to the organization, audience, and jurisdictions in which it operates.

| Area | Delivered capability | Administrator entry point |
|---|---|---|
| Public publication | Homepage, articles, authors, topics, tags, archives, search, comments, subscriptions, RSS, sitemap, robots | Public site |
| Publication identity | Name, description, tagline, logo/brand media, navigation, footer links, contact details | `/studio/brand` |
| Public legal pages | Privacy, terms, contact, and additional custom pages with editable metadata and publishing status | `/studio/pages` |
| Editorial operations | Rich-text editor, revisions, autosave, preview, taxonomy, workflow transitions, media library, moderation, analytics, export | `/studio` |
| AI assistance | Server-side writing suggestions and a permissioned agent workspace with proposal, approval, execution, and audit records | `/studio/agent` |
| Governance | Roles, capability-policy viewer, audit log, immutable first-publication timestamp, moderation and notification outbox | `/studio/team`, `/studio/capabilities`, `/studio/audit` |

## Required Production Configuration

The platform already receives its database, authentication, and storage credentials from the managed project environment. User sign-in is self-hosted: a public `/login` page signs in with Supabase email/password, and the server issues a signed session cookie after validating the token against Supabase. First access to the Studio auto-provisions the signer's profile, workspace, publication, and admin membership. AI and email providers are configurable in two ways: **stored in the database and managed from Studio** (recommended for runtime control) or **via environment variables** (fallback for a single default provider). The remaining deployment settings are limited to the values below.

| Variable | Required for | Guidance |
|---|---|---|
| `CANONICAL_ORIGIN` | Canonical URLs, Open Graph metadata, sitemap, `robots.txt`, and RSS | Set to the final HTTPS public origin, without a trailing slash; for example, `https://journal.example.com`. |
| `SITE_NAME` | Fallback identity for feeds and metadata | Optional when a publication name is stored in Studio; set a sensible fallback for resilience. |
| `OPENAI_API_KEY` | Fallback AI provider (any OpenAI-compatible model) | Optional when providers are configured in **Studio → AI Providers**; used automatically when no task is routed to a stored provider. |
| `OPENAI_BASE_URL` | Fallback AI base URL | Optional; defaults to `https://api.openai.com/v1`. Also lets you point at a self-hosted OpenAI-compatible gateway or Nvidia NIM (for example `https://integrate.api.nvidia.com/v1`). |
| `OPENAI_MODEL` | Fallback AI model | Optional; when unset the provider's default model is used. |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | User authentication (email/password) and browser API access | Managed Supabase project URL and publishable (anon) key. Exposed to the browser by design. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase admin access (session validation, user provisioning) | Server-only; keep out of browser bundles. Not required in local dev when the admin API is available. |
| `JWT_SECRET` | Session cookie signing | Random high-entropy value, kept server-only. |
| `RESEND_API_KEY` | Notification email delivery via Resend | Use **either** Resend **or** Gmail. Add only after connecting an approved Resend account. |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | Notification email delivery via the Gmail API | Required together. Create a Google Cloud project, enable the Gmail API, and mint an OAuth refresh token for a single sender address (one-time consent flow). Free quota is typically 500 messages/day. |
| `EMAIL_FROM` | Sender identity for notification email | For Resend use a verified sender address/domain; for Gmail use the Gmail address that owns the refresh token. |

The email adapter intentionally retains records in the notification outbox when provider configuration is absent. This prevents simulated delivery claims and gives administrators a reviewable operational queue. Configure email secrets through the project’s secure settings interface; do not add them to repository files or browser-side configuration.

## Multi-provider AI routing

Open **Studio → AI Providers** (`/studio/ai`). Connect any provider — OpenAI, Anthropic, Google Gemini, Nvidia NIM, or a custom OpenAI-compatible endpoint — by supplying a display name and API key. The platform immediately calls that provider's model catalog, so all available models are listed automatically. The key is stored server-side and is only ever returned to the browser in masked form.

Each editorial task (article outline, editorial suggestions, SEO meta copy, executive summary, and publication-agent chat) can be routed to any discovered model. Test a provider before saving a routing, then save per task. When no task is routed, the server falls back to the `OPENAI_API_KEY`/`OPENAI_BASE_URL` environment configuration so editor assistance and the agent keep working in a single-provider setup.

## Deployment Procedure

First, configure the managed environment in this order: set `CANONICAL_ORIGIN` to the final HTTPS address; review the publication identity and legal-page content in Studio; connect an AI provider in **Studio → AI Providers** (or set `OPENAI_API_KEY` as a fallback); then add email credentials — `RESEND_API_KEY` and `EMAIL_FROM`, **or** the Gmail OAuth variables (`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`) and `EMAIL_FROM` — only if verified outbound notification delivery is needed. Do not place any of these values in source files, client-side variables, or committed `.env` files.

For a local production smoke test, run the following commands from the project root after managed environment values are available:

```bash
pnpm build
NODE_ENV=production CANONICAL_ORIGIN=https://journal.example.com pnpm start
```

The managed project uses its configured deployment service rather than an external hosting workflow. After creating a verified checkpoint, open the project management interface, confirm the production environment configuration, and select **Publish**. The latest checkpoint enables that control. Set or bind the desired domain in the project’s domain settings, then update `CANONICAL_ORIGIN` to that final domain and republish if it changes.

## Administrator Operating Procedures

### Configure the publication

After signing in as a publication administrator, open **Studio → Brand** (`/studio/brand`). Update the publication name, description, tagline, logo media, navigation, footer links, social defaults, and contact information. The public header and footer, Studio header, document metadata, RSS metadata, and legal-page navigation read these stored values.

Open **Studio → Public pages** (`/studio/pages`) to review the seeded privacy, terms, and contact templates before launch. Each page supports an editable title, slug, content, SEO metadata, and published status. Keep the `privacy`, `terms`, and `contact` slugs stable unless public links are updated deliberately.

### Run the editorial workflow

Authors create drafts in **Studio → Posts** and use the editor’s structured content tools, media picker, source modes, revisions, autosave, and protected preview. The permitted state sequence is enforced by the server and database: submit a draft for **review**, approve it to **published**, and later move it to **archived** where appropriate. Use **Studio → Moderation** to approve, reject, or delete reader comments.

### Use the governed AI agent

The agent in **Studio → AI Agent** (`/studio/agent`) can analyze publication data and prepare bounded action proposals such as draft creation, taxonomy creation, site-tagline updates, publication, and archival. It does not execute an action merely because it proposes one. Every high-impact action requires a separate administrator approval, and the request, approval or rejection, execution, and failure state are retained in the audit trail.

> The agent has operational reach only through typed, server-side, role-checked actions. It never receives direct database credentials, storage credentials, or arbitrary browser-side authority.

## Verification Record

The final production bundle was built successfully and checked with TypeScript. The full suite passed with **12 test files and 19 tests**, including public-route server rendering, workflow/audit QA, agent approval boundaries, multi-provider LLM routing, public-page safety, Supabase configuration, immutable publication timestamps, and the rendered Studio identity test.

| Final production endpoint check | Result |
|---|---|
| `/` | HTTP 200 |
| `/privacy` | HTTP 200; server-rendered title, canonical URL, and privacy body confirmed |
| `/terms` and `/contact` | HTTP 200; seeded public content confirmed |
| `/rss.xml` and `/sitemap.xml` | HTTP 200; sitemap includes privacy, terms, and contact URLs |
| `/articles/not-a-real-post` | HTTP 404 with `noindex` and reader-facing not-found body |

The detailed requirement audit, architecture overview, and QA acceptance record remain in `docs/blueprint-audit.md`, `docs/architecture.md`, and `docs/qa-acceptance-report.md`.

## Remaining Owner-Dependent Follow-Up

The application is ready for final administrator configuration and publishing. Two actions require the owner’s real service setup or authenticated session and therefore were intentionally not simulated:

| Follow-up | Why it remains owner-dependent |
|---|---|
| Email delivery verification | Requires a valid provider key and a verified sender domain/address. The outbox is implemented and test-covered, but no email is claimed as delivered without those credentials. |
| Browser-session Studio acceptance run | Requires a real administrator sign-in to exercise the visible Studio interface under the owner’s authenticated account. Server-side lifecycle QA has already verified the underlying protected workflows. |

Before publishing, set `CANONICAL_ORIGIN`, review and replace legal templates, configure the desired brand identity, and add verified email credentials if outbound notifications are needed. Create or review a project checkpoint, then use the **Publish** control in the management interface to make the configured site public.
