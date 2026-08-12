# Fieldnote Repository Structure

Fieldnote uses a **two-surface frontend with one unified backend**. The public publication and authenticated Studio are separated by source ownership so public-reader work does not become entangled with editorial operations. Both surfaces use the same typed server contracts, tenant scoping, authorization rules, data model, storage adapter, and audit system.

```text
enterprise-blog-platform/
├── client/src/
│   ├── public-site/
│   │   ├── pages/          # Reader routes: home, articles, authors, archives, legal pages
│   │   └── components/     # Reader shell, article cards, article metadata
│   ├── admin-site/
│   │   ├── pages/          # Authenticated Studio, editor, preview, brand/pages, AI agent
│   │   └── components/     # Dashboard layout, rich editor, Studio assistant UI
│   ├── components/ui/      # Shared UI primitives used by both surfaces
│   ├── shared/             # Cross-surface developer/demo modules
│   ├── App.tsx             # Route composition across the two frontend surfaces
│   └── ssr/                # Public route data prefetch and metadata support
├── server/
│   ├── routers/            # One typed API surface: public blog, Studio, agent, AI
│   ├── blog.ts             # Shared publication domain rules and authorization helpers
│   ├── email.ts            # Notification provider adapter
│   ├── publicFeeds.ts      # RSS, sitemap, and robots endpoints
│   ├── storage.ts          # Centralized media-storage adapter
│   └── _core/              # HTTP, authentication, tRPC, SSR, managed platform integration
├── supabase/migrations/    # Versioned PostgreSQL schema and seed migrations
├── docs/                   # Architecture, audit, QA, operating, and organization documentation
└── docs/source-blueprint/enterprise-blog-platform-blueprint.md
```

## Frontend Boundaries

The **public site** owns routes that visitors and search engines can reach: the homepage, published articles, authors, topics, tags, archive pages, and configurable legal or contact pages. These components are eligible for server-side rendering and use the public content procedures only.

The **admin site** owns routes under `/studio`. It contains the authenticated editorial workspace, post editor, protected preview, media management, moderation, analytics, team management, site configuration, public-page administration, and the approval-gated agent workspace. It is intentionally client-only in server rendering to avoid browser-storage dependencies and is guarded by the established role and capability checks.

Shared UI primitives remain under `client/src/components/ui`, avoiding duplicated controls or inconsistent accessibility behavior. The root `App.tsx` is the small composition layer that declares both route families; it does not contain business logic.

## Unified Backend

The backend is **not split into separate public and admin services**. One Express and tRPC server owns all stateful operations, which keeps tenant filtering, role checks, workflow enforcement, auditing, media access, notification handling, and transactions consistent. The separation occurs at procedure boundaries: public router procedures expose only published reader data and data-collection endpoints, while Studio and agent routers require authenticated membership and apply their more restrictive capabilities.

| Backend area | Responsibility | Consumers |
|---|---|---|
| `server/routers/blogRouter.ts` | Published content, discovery, comments, subscriptions, site identity, public pages | Public site and SSR prefetch |
| `server/routers/studioRouter.ts` | Editorial content, workflow, media, moderation, analytics, team, settings, export | Admin site |
| `server/routers/agentRouter.ts` | Approved agent proposals, conversations, execution audits | Admin site |
| `server/blog.ts` | Shared domain operations, actors, sanitization, audit, notifications | All privileged router procedures |
| `server/_core/` | Unified HTTP, authentication, SSR, storage, and platform infrastructure | All routes and services |

## Blueprint Source

The supplied blueprint is preserved at `docs/source-blueprint/enterprise-blog-platform-blueprint.md`. It is deliberately copied inside the repository so a complete source archive contains both the implementation and its original requirements.
