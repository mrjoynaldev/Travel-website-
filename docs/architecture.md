# Fieldnote Enterprise Blog Platform — Architecture Notes

## Operating model

Fieldnote is a tenant-scoped publication platform. Every editorial object is associated with an **organization** and a **site**, and all privileged procedures resolve the signed-in contributor to an organization/site membership before accessing content. The public surface exposes only `published` posts; editorial routes are authenticated and scoped to the contributor’s membership.

| Layer | Implementation | Responsibility |
|---|---|---|
| Public web | React, Wouter, server rendering | Homepage discovery, articles, author pages, subscriber capture, comment submission, SEO and feeds |
| Editorial studio | React, typed tRPC procedures | WYSIWYG writing, protected previews, workflow transitions, moderation, taxonomy, media, analytics, team roles |
| Domain API | Express and tRPC | Input validation, authorization, content sanitization, audit events, outbox creation, reporting queries |
| Content database | Supabase PostgreSQL | Tenant-scoped relational records, RLS policies, exact workflow trigger, immutable first-publication timestamp |
| Object storage | Platform S3 helpers | Validated image/document upload, durable delivery URLs, reusable media metadata |
| AI assistance | Server-only language-model helper | Embedded outline, revision, summary, and SEO-copy assistance |
| Notifications | Provider-neutral outbox plus Resend adapter | Auditable review, decision, and publication notification records; dispatch after provider setup |

## Authorization and editorial workflow

The platform has three editorial roles. **Authors** can create and edit their own content and move their own drafts between `draft` and `review`. **Editors** can review, return, publish, archive, moderate comments, and maintain taxonomy. **Admins** have editor capabilities plus membership-role management. Every allowed workflow transition is enforced twice: by the tRPC domain service and by the PostgreSQL trigger.

> The only valid post states are **draft**, **review**, **published**, and **archived**. The first `published_at` value is protected by a database trigger and cannot later be altered.

## Security and content integrity

Privileged Supabase credentials are server-only. Client applications access business data exclusively through typed tRPC endpoints, never through a service-role Supabase client. Rich text is sanitized on the server before persistence and only allows a strict HTML subset with safe URL schemes. Consequential actions write audit records, and email delivery operates through a persisted notification outbox with provider idempotency keys.

## SEO, feeds, and publication operations

Public homepage, article, and author routes are server-rendered with dehydrated query data. Article metadata is derived from editorial fields and emitted in raw HTML as canonical, Open Graph, Twitter, and article-time tags. `robots.txt`, `sitemap.xml`, and `rss.xml` are generated from real published content. Production must set `CANONICAL_ORIGIN` and `SITE_NAME` before launch so those generated absolute URLs are authoritative.

## Launch configuration and roadmap

Before public launch, configure a verified Resend sender (`EMAIL_FROM`) and API key (`RESEND_API_KEY`) to move notifications from the outbox into real email delivery. Configure `CANONICAL_ORIGIN` to the final HTTPS domain and keep `SITE_NAME` consistent with the publication name. The current team-management UI manages contributors after their first sign-in; invitation workflows, multiple publication selection, advanced editorial assignments, consent-management pages, and a dedicated background outbox worker are planned extensions for a larger multi-team deployment.
