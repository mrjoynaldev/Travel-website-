# Enterprise AI-Native Blogging & Publishing Platform

**Blueprint + Product Requirements + Architecture + Master Build Prompt**  
**Research date:** 2026-08-12  
**Target stack:** Vercel + Next.js, Render, Supabase/Postgres, object storage, Redis-compatible queue, AI provider abstraction

---

## 1. Executive Brief

Build an enterprise-grade, multi-tenant publishing platform that combines the strongest publishing, editing, SEO, audience, analytics, monetization, collaboration, automation, and developer capabilities found across modern products such as WordPress, Blogger, Ghost, Substack, Wix, Medium, and Hashnode — but with an AI-native administration layer that can operate the platform through natural-language instructions.

The product should behave like a **headless publishing operating system** rather than a basic blog CMS.

Core surfaces:

1. **Public Website / Reader Experience** — fast, SEO-first, responsive, accessible, customizable.
2. **Author / Creator Studio** — writing, editing, media, SEO, scheduling, analytics, audience and monetization.
3. **Enterprise Admin Console** — tenants, users, roles, workflows, moderation, security, billing, integrations, system operations.
4. **AI Admin Agent** — conversational interface with safe tool calling that can inspect and manage the platform, prepare content, modify settings, analyze analytics, process files, and execute approved actions.
5. **Developer / API Layer** — REST, webhooks, typed SDK, headless rendering, import/export and extension points.

The system must support both a simple solo blog and a large editorial organization with multiple sites, teams, workflows, content types, domains, and permission boundaries.

---

## 2. Product Principles

### 2.1 Editor-first
The editor is the center of the platform. Every publishing action should be reachable from the content model, editor, API, automation layer, and AI agent.

### 2.2 API-first / headless-ready
Every important feature must have a server-side API. The public website is a consumer of the content API, not a special hard-coded publishing path.

### 2.3 Multi-tenant by design
Tenant/site/workspace boundaries are first-class. Never bolt multi-tenancy on later.

### 2.4 AI with permissions, not unrestricted automation
The AI agent is powerful but must operate through explicit tools, authorization checks, audit logs, confirmation levels, limits, and irreversible-action safeguards.

### 2.5 Data ownership and portability
Users can export posts, pages, media metadata, taxonomies, authors, settings, subscribers, analytics summaries and structured content.

### 2.6 Progressive complexity
A beginner sees a clean interface; professionals can open advanced panels for HTML, CSS, JSON, code, structured metadata, automation and API controls.

### 2.7 Performance by default
Public publishing should be cache-friendly, CDN-first, image-optimized, and designed for Core Web Vitals.

### 2.8 Observable and recoverable
Every consequential action should be traceable, retryable where safe, and reversible where technically possible.

---

## 3. Competitive Feature Benchmark

### WordPress-derived capabilities

Use as inspiration:

- Role/capability system
- Multi-site / multi-project thinking
- Block editor
- Block patterns / reusable structures
- Revisions and autosaves
- Categories and tags
- Media library
- Pages vs posts
- Scheduled publishing
- Custom post/content types
- Plugin/extension architecture
- REST API
- Theme/customization system

WordPress currently documents roles such as Super Admin, Administrator, Editor, Author, Contributor and Subscriber, with granular capabilities; its block system includes reusable patterns; and its revisions system provides revision history and autosaves. citehttps://wordpress.org/documentation/article/roles-and-capabilities/https://wordpress.org/documentation/article/block-pattern/https://wordpress.org/documentation/article/revisions/

### Blogger-derived capabilities

- Simple blog/site management
- Author/admin roles
- Reader permissions
- Template/theme controls
- Easy publishing flow
- Google ecosystem compatibility

Blogger supports multiple authors/admins/readers with administrative control over authors and blog settings. citehttps://support.google.com/blogger/answer/42673?hl=en

### Ghost-derived capabilities

- Excellent writing experience
- Rich content cards
- Images, galleries, video, audio, embeds, code/HTML-like content
- Newsletters
- Memberships
- Paid tiers
- Comments/community
- Content API
- Headless architecture
- Analytics

Ghost's editor supports cards for images, Markdown, HTML, galleries, bookmarks, email content, calls to action, audio, video, files, products and embeds; Ghost exposes a cacheable Content API for posts, pages, tags, authors, tiers and settings. citehttps://ghost.org/help/cards/https://ghost.org/docs/content-api/

### Substack-derived capabilities

- Posts
- Email newsletters
- Podcasts
- Video
- Live content
- Paid subscriptions
- Recommendations/discovery
- Referrals
- Sections
- Audience ownership/export
- Custom domains
- Email analytics

Substack combines publishing, newsletters, podcasts, video, live streams, community/discovery, subscriptions, referrals, custom domains and publication analytics in one product. citehttps://substack.com/features

### Wix-derived capabilities

- Visual site customization
- Featured posts
- Blog analytics
- Search performance
- Traffic-source analytics
- Flexible layouts

Wix documents blog analytics for views, visitors, engagement, search performance and traffic sources, and supports explicitly featured posts. citehttps://support.wix.com/en/article/wix-blog-about-your-blog-analyticshttps://support.wix.com/en/article/wix-blog-featuring-posts-in-wix-blog

### Medium-derived capabilities

- Simple reading experience
- Story publishing
- Import/migration workflows
- Canonical URLs for imported material

Medium's import workflow can backdate imported stories and add a canonical URL to the original source. citehttps://help.medium.com/hc/en-us/articles/214550207-Importing-a-post-to-Medium

### Hashnode-derived capabilities

- Custom domains
- GraphQL/API access
- Headless mode
- AI-assisted writing
- Webhooks
- GitHub backup
- Markdown import
- Scheduled publishing
- Multiple publications

Hashnode's 2026 Pro release documents custom domains, GraphQL, headless mode, AI assistance, webhooks, GitHub backup, Markdown import, scheduled publishing and multiple blogs/publications. citehttps://hashnode.com/changelog/2026-06-11-introducing-hashnode-pro

---

## 4. Primary User Types

### Reader
- Browse/search content
- Follow authors
- Subscribe to newsletter
- React/comment/share
- Save/bookmark
- Manage privacy preferences
- Purchase membership or subscription

### Guest Author
- Draft content
- Upload approved assets
- Submit for review
- See assigned feedback

### Author
- Create/edit/publish own content according to permissions
- Manage profile
- View analytics
- Schedule posts
- Manage media

### Editor
- Edit other authors' content
- Review submissions
- Manage categories/tags
- Approve content
- Schedule/publish

### Publisher / Managing Editor
- Manage editorial calendar
- Workflows
- Assignments
- Approvals
- Team permissions
- Publication settings

### Marketing Manager
- SEO
- Newsletter
- Audience segments
- Campaigns
- Social integrations
- Conversion analytics

### Analyst
- Dashboards
- Reports
- Cohorts
- Content performance
- Search analytics

### Moderator
- Comments
- Reports
- Abuse/spam
- User restrictions

### Site Admin
- Site branding
- Domains
- Theme configuration
- Integrations
- Taxonomies
- Custom content types

### Enterprise Admin / Super Admin
- Tenants/workspaces
- Identity/SSO
- Roles/policies
- Billing
- Global moderation
- Audit logs
- Feature flags
- System health
- AI policies
- Security controls

---

## 5. Public Website Feature Set

### Discovery

- Home page
- Latest posts
- Trending posts
- Featured posts
- Recommended posts
- Topic pages
- Tag pages
- Author pages
- Publication pages
- Search
- Search suggestions
- Search filters
- Related content
- Popular content
- Series/collections
- Reading lists
- Archive by date

### Content rendering

Support:

- Rich text
- Headings
- Paragraphs
- Quotes
- Lists
- Tables
- Images
- Galleries
- Videos
- Audio
- Podcasts
- Embedded posts
- Social embeds
- Maps
- Iframes with allowlisted providers
- Buttons
- Callouts
- Accordions/toggles
- Tabs
- Code blocks
- Syntax highlighting
- Inline code
- Math/LaTeX
- Mermaid diagrams
- Charts
- Downloadable files
- Product cards
- CTAs
- Newsletter forms
- Membership gates
- Custom HTML
- Custom CSS where permitted
- Shortcodes/components
- Custom blocks
- Interactive canvas/visual components

### Reader account

- Profile
- Avatar
- Preferences
- Followed topics
- Followed authors
- Bookmarks
- Reading history
- Notifications
- Newsletter subscriptions
- Paid memberships
- Billing history
- Comment history
- Data export
- Delete account

### Social features

- Likes/reactions
- Comments
- Threaded replies
- Mentions
- User profiles
- Follow authors
- Share links
- Social share cards
- Report content
- Block/mute

### Accessibility

- Keyboard navigation
- Focus states
- Screen-reader-friendly semantics
- Skip links
- Accessible forms
- Captions/transcripts
- Alt text requirements
- Reduced motion support
- Color-contrast compliance
- Semantic heading structure

---

## 6. Author / Creator Studio

### Dashboard

- Content performance snapshot
- Drafts
- Scheduled posts
- Tasks
- Editorial calendar
- Pending approvals
- Audience growth
- Newsletter metrics
- Revenue metrics
- AI assistant
- Recent activity

### Content management

- All posts
- Drafts
- Scheduled
- Published
- Archived
- Trash
- Pages
- Stories/short posts
- Newsletters
- Podcasts
- Videos
- Collections
- Series
- Custom content types

### Advanced editor

Use a structured document model such as Tiptap/ProseMirror, Lexical, or an equivalent extensible editor.

Editor requirements:

- Block-based architecture
- Slash commands
- Drag and drop blocks
- Nested blocks
- Columns
- Tables
- Callouts
- Media blocks
- Embeds
- Code blocks
- Markdown input/output
- Raw HTML mode
- Source/JSON mode
- Custom block insertion
- Reusable blocks/patterns
- Templates
- AI actions
- Comments/annotations
- Inline collaboration
- Track changes
- Find/replace
- Word count
- Reading time
- Link management
- Paste cleanup
- Image compression
- Responsive previews
- Desktop/tablet/mobile preview
- Email preview
- Social preview
- Accessibility checks
- SEO checks
- Version history
- Restore revision
- Autosave
- Conflict handling

### HTML / source mode

Provide a controlled advanced mode allowing an authorized user to:

- Inspect the structured document JSON
- Edit sanitized HTML
- Inspect generated HTML
- Insert approved custom elements
- Edit metadata
- Inspect JSON-LD
- Edit advanced CSS variables
- Add page-level scripts only when explicitly permitted

Never render arbitrary untrusted HTML or scripts without sanitization/isolation.

### Canvas / visual editing

Support a visual canvas for:

- Hero sections
- Social images
- Infographics
- Article diagrams
- Thumbnail generation
- Ad creative
- Custom promotional cards

Recommended implementation:

- Canvas editor abstraction
- Layer model
- Shapes/text/images
- Guides/grid/snap
- Resize/crop
- Templates
- Brand kit
- Export PNG/JPEG/WebP/SVG/PDF where safe
- Version history
- Reusable templates

Potential libraries: Fabric.js, Konva, tldraw, Excalidraw or equivalent; select one based on the specific canvas use case.

---

## 7. Media Library

### File types

- Images
- Video
- Audio
- PDFs
- Documents
- Fonts where permitted
- ZIP/archive where permitted
- SVG
- Source/code files

### Media operations

- Upload
- Resumable upload
- Drag and drop
- Bulk upload
- Rename
- Replace
- Crop
- Resize
- Compress
- Convert formats
- Generate thumbnails
- Folders/collections
- Tags
- Alt text
- Caption
- Credit/license metadata
- EXIF stripping
- Duplicate detection
- Virus/malware scanning hook
- Access controls
- Signed URLs
- Download logs
- Usage locations

Supabase Storage provides resumable uploads, S3 compatibility, CDN delivery, image transformations and fine-grained access control, making it a suitable foundation for the media layer. citehttps://supabase.com/docs/guides/storage

---

## 8. SEO Suite

### Technical SEO

- Canonical URLs
- Meta title
- Meta description
- Robots directives
- XML sitemap
- Image sitemap
- RSS/Atom feeds
- Breadcrumbs
- Open Graph
- Twitter/X cards
- JSON-LD
- Article schema
- Author schema
- Organization schema
- FAQ schema where appropriate
- Website schema
- SearchAction schema where appropriate
- Hreflang
- Pagination metadata where relevant
- 301 redirects
- 410/404 management
- Custom slug
- Slug history
- Automatic redirect from previous slug

### SEO assistant

AI should analyze:

- Search intent
- Title quality
- Meta description
- Keyword/topic coverage
- Internal links
- External references
- Heading structure
- Readability
- Image alt text
- Schema validity
- Potential duplicate content
- Canonical issues
- Content freshness

Never promise ranking outcomes.

---

## 9. Editorial Workflow

Configurable workflows:

- Idea
- Brief
- Research
- Draft
- AI draft
- Human review
- SEO review
- Legal review
- Brand review
- Scheduled
- Published
- Updated
- Archived

Features:

- Assignment
- Due dates
- Review queues
- Approval gates
- Revision requests
- Inline comments
- Mentions
- Change history
- Editorial calendar
- Content briefs
- Templates
- Saved workflow presets
- SLA tracking
- Notifications

---

## 10. AI Admin Agent

The AI agent is a first-class product feature, not a chat widget.

### Agent abilities

The agent should be able to:

- Search the site's content
- Search uploaded files
- Read documents and PDFs
- Summarize source materials
- Build content briefs
- Generate post drafts
- Rewrite existing posts
- Generate titles
- Generate outlines
- Generate metadata
- Generate tags/categories
- Generate internal-link suggestions
- Find outdated content
- Find duplicate/near-duplicate content
- Analyze performance
- Explain analytics
- Prepare editorial calendars
- Create scheduled posts
- Update settings
- Create categories/tags
- Manage media metadata
- Moderate comments
- Detect suspicious/spam activity
- Draft newsletters
- Prepare social snippets
- Generate structured data
- Run site audits
- Create reports
- Export content
- Initiate imports
- Compare versions
- Create tasks for team members
- Answer platform questions using uploaded knowledge

### File ingestion

Users/admins can send the agent:

- PDF
- DOCX
- TXT
- Markdown
- CSV
- JSON
- HTML
- URLs
- Images
- Audio transcripts
- Video transcripts

The agent should extract content and create a temporary or persistent knowledge source, subject to permissions.

### Agent modes

1. **Ask mode** — read-only answers.
2. **Draft mode** — prepares changes but does not publish.
3. **Assisted action mode** — can perform low-risk changes automatically.
4. **Approval mode** — prepares high-impact actions for confirmation.
5. **Autopilot mode** — only for explicitly approved workflows with strict policy constraints.

### Action-risk matrix

Low risk:

- Read analytics
- Search content
- Generate a draft
- Suggest tags
- Suggest SEO metadata

Medium risk:

- Edit a draft
- Schedule content
- Change taxonomy
- Update media metadata

High risk:

- Publish content
- Delete content
- Change roles
- Modify authentication/security
- Change billing
- Delete users/files
- Change domains
- Run migrations

High-risk actions should require explicit confirmation unless a narrowly scoped policy explicitly allows automation.

### Agent tool architecture

The model never receives direct database credentials.

Instead:

`LLM -> Agent Runtime -> Tool Router -> AuthZ/Policy -> Domain Service -> Database/API`

Every tool call should generate:

- actor ID
- tenant ID
- site ID
- tool name
- arguments hash / sanitized arguments
- authorization result
- confirmation state
- execution result
- latency
- token/cost metadata
- correlation ID
- timestamp

### Agent memory

Use separate scopes:

- Session memory
- User preferences
- Site knowledge
- Organization knowledge
- Uploaded document knowledge
- Content-specific context

Never mix tenant data.

---

## 11. Search & Knowledge Layer

### Search

Support:

- Full-text search
- Prefix/autocomplete
- Fuzzy matching
- Filters
- Sorting
- Author filters
- Topic filters
- Date filters
- Content type filters
- Access-level filters
- Semantic search

Recommended architecture:

- Postgres FTS for baseline search
- Optional pgvector semantic retrieval
- Dedicated search engine adapter later if scale requires it

### RAG / knowledge

Pipeline:

`Upload -> virus/security checks -> extract -> normalize -> chunk -> embed -> store -> index -> ACL metadata`

Every retrieved chunk must carry:

- tenant ID
- site ID
- source ID
- visibility
- owner
- classification
- retention policy

Retrieval must enforce the same access controls as normal data access.

---

## 12. Audience & Membership

### Audience

- Subscribers
- Members
- Free/paid tiers
- Segments
- Tags
- Custom fields
- Engagement score
- Consent status
- Communication preferences
- Import/export

### Newsletter

- Campaign creation
- Rich editor
- Templates
- Sender profiles
- Reply-to
- Preview
- Test send
- Scheduling
- Delayed send
- Segments
- A/B testing
- Open/click analytics
- Unsubscribe tracking
- Bounce handling
- Suppression list
- Webhook events

Ghost provides memberships, paid tiers, welcome emails, recommendations, embeddable signup forms and member management; Substack combines newsletter/publishing and paid subscription workflows. citehttps://ghost.org/help/topic/memberships/https://substack.com/features

### Monetization

Optional modules:

- Paid memberships
- Donations/tips
- Sponsorships
- Premium posts
- Paywalls
- Affiliate link management
- Product cards
- Ads
- Revenue reporting

Use a payment provider adapter such as Stripe; never hard-code payments into the content model.

---

## 13. Comments & Moderation

- Threaded comments
- Reactions
- Mentions
- Pinned comments
- Moderator notes
- Report reasons
- Spam scoring
- Link abuse detection
- Rate limits
- Profanity/abuse classifiers
- Shadow restrictions
- Block/mute
- IP/device signals where legally appropriate
- Moderation queue
- Bulk moderation
- Audit trail

AI moderation should be advisory by default, with policy-controlled automated actions.

---

## 14. Analytics

### Public metrics

- Page views
- Unique visitors
- Sessions
- Traffic source
- Referrer
- Search impressions if integrated
- Search clicks if integrated
- Reading time
- Scroll depth
- Engagement
- Shares
- Comments
- Saves
- Subscription conversion
- Revenue

### Editorial metrics

- Posts published
- Publishing frequency
- Time from draft to publish
- Approval time
- Author output
- Revision count
- Content decay
- Content freshness

### AI metrics

- Agent calls
- Tool calls
- Success/failure rate
- Human approval rate
- Estimated AI cost
- Token usage
- Latency
- Prompt/version identifier
- Safety blocks

### Dashboard capabilities

- Date range
- Compare periods
- Filters
- Saved reports
- Export CSV/JSON
- Scheduled reports
- Executive dashboards

Wix's blog analytics demonstrate the value of time-series views, visitors, engagement, search performance and traffic-source reporting. citehttps://support.wix.com/en/article/wix-blog-about-your-blog-analytics

---

## 15. Admin Console Information Architecture

### Global

- Overview
- Global search
- Notifications
- Tasks
- AI Agent
- Activity feed
- Help/Docs

### Content

- Posts
- Pages
- Drafts
- Scheduled
- Published
- Revisions
- Media
- Categories
- Tags
- Authors
- Custom content types
- Templates
- Patterns

### Publishing

- Editorial calendar
- Workflow
- Review queue
- Approvals
- Newsletter
- Podcasts
- Video
- Collections

### Audience

- Users
- Members
- Subscribers
- Segments
- Comments
- Moderation

### Growth

- SEO
- Analytics
- Search performance
- Campaigns
- Referrals
- Recommendations

### Design

- Themes
- Site editor
- Navigation
- Widgets/blocks
- Brand kit
- Fonts
- Custom CSS
- Custom code

### Platform

- Sites
- Domains
- Organizations
- Teams
- Roles
- Policies
- API keys
- Webhooks
- Integrations
- Feature flags
- Billing
- Audit log
- Security
- System health

---

## 16. Advanced Site Builder

Provide two levels:

### Standard builder

- Theme templates
- Header/footer
- Navigation
- Homepage
- Archives
- Article page
- Author page
- Search page
- 404
- Global styles
- Typography
- Colors
- Layout presets

### Pro builder

- Visual drag/drop
- Grid/flex layout controls
- Responsive breakpoints
- Component library
- Reusable components
- Template inheritance
- Data bindings
- Conditional visibility
- Dynamic routes
- CSS variables
- Custom CSS
- Custom HTML
- Custom JS (sandboxed/approved)
- Design tokens
- Preview by device
- Page performance inspection

---

## 17. Custom Domains & Multi-Site

Support:

- Platform domain
- Custom subdomain
- Custom apex domain
- TLS
- DNS validation
- www/apex canonicalization
- Redirect management
- Domain status
- Verification
- Per-site branding
- Per-site themes
- Per-site analytics
- Per-site navigation
- Per-site content rules
- Shared organization assets

A single organization should be able to own multiple publications/sites while maintaining shared users and centralized policy.

---

## 18. Developer Platform

### API

Provide:

- REST API
- Optional GraphQL layer
- Public content API
- Admin API
- Webhook API
- OpenAPI spec
- Typed SDK
- API versioning
- API keys
- OAuth where appropriate
- Pagination
- Cursor pagination for high-volume endpoints
- Rate limiting
- Idempotency keys

Ghost is a useful reference for separating a public, read-oriented Content API from administration APIs; Hashnode is a useful reference for GraphQL, headless mode and webhooks. citehttps://ghost.org/docs/content-api/https://hashnode.com/changelog/2026-06-11-introducing-hashnode-pro

### Webhooks

Events:

- post.created
- post.updated
- post.published
- post.unpublished
- post.deleted
- page.published
- media.uploaded
- comment.created
- user.created
- member.created
- subscription.created
- subscription.updated
- workflow.completed
- domain.verified
- agent.action.completed

Include signatures, retries, replay, delivery logs and dead-letter handling.

### Import/export

Import from:

- WordPress XML
- Blogger export
- Medium URLs
- Markdown
- HTML
- CSV
- JSON
- RSS/Atom

Export to:

- JSON
- Markdown + frontmatter
- HTML
- RSS/Atom
- Media archive
- Full site snapshot

---

## 19. Recommended Technical Architecture

```text
                         INTERNET
                            |
             +--------------+---------------+
             |                              |
        Public Web                    Admin/Studio Web
        Next.js/Vercel                Next.js/Vercel
             |                              |
             +--------------+---------------+
                            |
                     API / BFF Gateway
                            |
                   Render Web Service
                            |
        +-------------------+--------------------+
        |                   |                    |
   Content Service    Admin Service       Agent Service
        |                   |                    |
        +-----------+-------+--------------------+
                    |
             Domain Services
                    |
      +-------------+---------------------------+
      |             |             |              |
   Supabase      Queue/Cache   AI Providers   Integrations
   Postgres      Render KV     OpenAI/etc      Stripe/email/etc
   Auth          /Valkey
   Storage
   Realtime
   pgvector
      |
   Object storage / Media
```

### Frontend

Recommended:

- Next.js
- TypeScript
- React
- Server Components where beneficial
- Client Components only where interactivity requires them
- Tailwind CSS or equivalent design system
- Accessible component library
- Route-level authorization
- Streaming for AI UX where supported

Vercel's CDN can cache public pages, API responses and static assets globally, with ISR and cache-control available for dynamic content that can be cached. citehttps://vercel.com/docs/caching/cdn-cache

### Backend on Render

Use separate services where appropriate:

1. Public/API web service
2. Admin/API service if separation becomes useful
3. Agent service
4. Background worker
5. Cron/scheduler
6. Optional workflow service

Render currently supports web services, static sites, private services, background workers, cron jobs and workflows; its background worker pattern is appropriate for asynchronous work and its Key Value service is Redis-compatible for queues/caching. citehttps://render.com/docs/service-typeshttps://render.com/docs/background-workershttps://render.com/docs/key-value

### Database

Supabase Postgres should be the system of record.

Primary schemas should be logically separated:

- auth
- platform
- tenants
- sites
- users
- content
- media
- editorial
- audience
- commerce
- analytics
- ai
- integrations
- audit

Supabase Auth integrates with Postgres, and RLS provides granular authorization directly in the database. Service-role credentials must never be exposed to the browser. citehttps://supabase.com/docs/guides/auth/architecturehttps://supabase.com/docs/guides/database/postgres/row-level-security

### Realtime

Use Supabase Realtime for:

- Collaborative status
- Live notifications
- Chat/agent streaming metadata
- Moderation queue refresh
- Presence indicators
- Editor collaboration signals

Supabase Realtime uses a globally distributed WebSocket architecture. citehttps://supabase.com/docs/guides/realtime/architecture

### Async jobs

Use a queue for:

- Image processing
- Video/audio processing
- Email delivery
- Analytics aggregation
- Sitemap generation
- Search indexing
- Embedding generation
- AI batch work
- Import/export
- Webhook delivery
- Scheduled publishing

Render documents background workers specifically for processing media, reports and third-party/AI workloads, while Render Key Value can back job queues and caches. citehttps://render.com/docs/background-workershttps://render.com/docs/key-value

---

## 20. Core Data Model

### Tenant / Organization

- id
- name
- slug
- plan
- status
- created_at
- billing_customer_id

### Site / Publication

- id
- tenant_id
- name
- slug
- custom_domain
- theme_id
- default_locale
- timezone
- branding
- settings
- status

### User

- id
- auth_user_id
- profile
- status
- locale
- preferences

### Membership / Role

- user_id
- tenant_id
- site_id nullable
- role_id
- policy overrides

### Role

- id
- scope
- name
- capabilities

### Content item

- id
- tenant_id
- site_id
- type
- title
- slug
- status
- author_id
- content_json
- rendered_html
- excerpt
- featured_media_id
- canonical_url
- seo_metadata
- published_at
- scheduled_at
- created_at
- updated_at

### Revision

- id
- content_id
- version
- snapshot_json
- editor_user_id
- reason
- created_at

### Taxonomy

- id
- site_id
- type
- name
- slug
- description

### Content taxonomy relation

- content_id
- taxonomy_id

### Media

- id
- tenant_id
- site_id
- storage_path
- mime_type
- size
- width
- height
- alt_text
- caption
- metadata
- processing_status

### Workflow

- id
- site_id
- name
- states
- transitions
- automation_rules

### Comment

- id
- site_id
- content_id
- user_id
- parent_id
- body
- status
- moderation_score

### Subscription

- id
- tenant_id
- user_id
- site_id
- tier_id
- provider
- external_id
- status

### Analytics event

- id
- site_id
- anonymous/session/user identifiers as permitted
- event_type
- content_id
- properties
- occurred_at

### Agent thread

- id
- tenant_id
- site_id
- user_id
- title
- status

### Agent message

- id
- thread_id
- role
- content
- attachments
- created_at

### Agent tool call

- id
- thread_id
- tool_name
- input
- output
- approval_state
- result_state
- created_at

### Audit event

- id
- tenant_id
- site_id
- actor_type
- actor_id
- action
- resource_type
- resource_id
- metadata
- ip_hash/appropriate audit signal
- created_at

---

## 21. Authorization Model

Use a hybrid model:

1. RBAC for normal role assignment.
2. Capability permissions for fine-grained actions.
3. Scope-aware permissions: platform, tenant, site, content.
4. Attribute/resource checks for sensitive records.
5. Postgres RLS as defense-in-depth.

Example capabilities:

```text
content.read
content.create
content.edit_own
content.edit_any
content.publish
content.schedule
content.delete
content.restore
content.manage_revisions
media.upload
media.delete
seo.manage
analytics.read
users.manage
roles.manage
billing.manage
settings.manage
integrations.manage
ai.use
ai.execute_low_risk
ai.execute_high_risk
```

---

## 22. Security Requirements

### Authentication

- Email/password
- Magic link
- OAuth providers
- MFA
- Passkeys where supported
- Session management
- Device/session list
- Recovery flows
- SSO/SAML for enterprise tier

### Security

- TLS everywhere
- Secure cookies
- CSRF defenses where applicable
- CORS policy
- CSP
- HSTS
- XSS prevention
- SQL injection prevention
- SSRF protection
- Upload validation
- MIME sniffing defenses
- File sandboxing
- Malware scanning hook
- Rate limiting
- Abuse prevention
- Secrets manager / environment secrets
- Encryption at rest via managed infrastructure
- PII minimization
- Data retention controls
- Audit logs
- IP allowlist for enterprise admin if needed

### AI-specific security

Protect against:

- Prompt injection from posts/files/web pages
- Data exfiltration
- Cross-tenant retrieval
- Tool abuse
- Privilege escalation
- Unsafe code execution
- Secret leakage
- Malicious attachments

Never trust content retrieved from the internet as system instructions.

---

## 23. Observability

Implement:

- Structured logs
- Correlation IDs
- Request tracing
- Error tracking
- Metrics
- Queue metrics
- AI metrics
- Database query monitoring
- Audit logs
- Alerting
- Health endpoints
- Readiness endpoints

Render health checks can be used to verify new instances before traffic is routed to them, supporting safer deployments. citehttps://render.com/docs/health-checks

---

## 24. Performance Strategy

### Public pages

- Static/ISR where possible
- Vercel CDN
- Cache-control
- Stale-while-revalidate where appropriate
- Image resizing
- Responsive images
- WebP/AVIF where supported
- Lazy loading below the fold
- Minimal client JS
- Streaming where useful

### Backend

- Cursor pagination
- Database indexes
- Avoid N+1 queries
- Query budgets
- Caching for hot reads
- Queue long-running tasks
- Batch writes
- Background analytics aggregation

### Editor

- Debounced autosave
- Local optimistic state
- Offline recovery draft
- Large-document virtualization where needed

---

## 25. Caching & Invalidation

Define explicit cache layers:

- Browser cache
- Vercel CDN
- Application cache / Redis-compatible KV
- Database query cache where justified

Invalidate on:

- publish
- unpublish
- update
- delete
- theme change
- SEO metadata change
- navigation change

Avoid cache invalidation through database triggers unless there is a clear operational reason; prefer explicit domain events.

---

## 26. API Conventions

Every API should provide:

```text
GET    /v1/sites
GET    /v1/sites/:siteId/posts
POST   /v1/sites/:siteId/posts
GET    /v1/posts/:id
PATCH  /v1/posts/:id
DELETE /v1/posts/:id
POST   /v1/posts/:id/publish
POST   /v1/posts/:id/schedule
POST   /v1/posts/:id/revisions/:revisionId/restore
POST   /v1/media
GET    /v1/search
POST   /v1/agent/threads
POST   /v1/agent/threads/:id/messages
POST   /v1/webhooks/test
GET    /v1/audit-events
```

Use consistent:

- IDs
- timestamps
- pagination
- errors
- validation
- permissions
- idempotency
- request IDs

---

## 27. AI Tool Catalog

Example tools:

```text
search_posts
search_pages
search_media
search_users
search_comments
read_post
read_revision
read_analytics
read_site_settings
read_theme
read_knowledge_source
create_draft
update_draft
create_outline
generate_seo_metadata
suggest_internal_links
create_taxonomy
update_media_metadata
schedule_post
prepare_publish
publish_post
unpublish_post
restore_revision
moderate_comment
create_campaign
create_newsletter_draft
create_report
export_content
import_content
create_task
assign_task
update_site_setting
create_webhook
```

Each tool must define:

- schema
- permission
- risk level
- confirmation policy
- idempotency strategy
- timeout
- retries
- audit behavior

---

## 28. Agent Conversation UX

Example request:

> “I uploaded a PDF called `research.pdf`. Read it, extract the important points, create a 1800-word tutorial about the topic, add 5 SEO-friendly title options, suggest images, link it to three existing articles, and save it as a draft. Do not publish.”

Expected workflow:

1. Confirm file ownership/access.
2. Parse the PDF.
3. Create a knowledge source.
4. Extract claims and facts.
5. Generate outline.
6. Search existing content.
7. Suggest internal links.
8. Generate draft.
9. Run SEO/accessibility checks.
10. Save draft.
11. Produce a concise action report.

Example high-risk request:

> “Delete all posts older than five years.”

Expected response behavior:

- Determine scope.
- Show count.
- Show exact deletion policy.
- Refuse to execute without explicit confirmation.
- Offer archive instead if supported.

---

## 29. Content Model Requirements

Use structured JSON as the canonical editor format.

Example:

```json
{
  "type": "doc",
  "version": 1,
  "content": [
    {
      "type": "heading",
      "attrs": {"level": 1},
      "content": [{"type": "text", "text": "Example title"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Example body."}]
    }
  ]
}
```

Store generated/rendered HTML as a derived representation, not the only source of truth.

Benefits:

- Multiple output formats
- Safe rendering
- Structured search
- AI transformations
- Editor portability
- Version diffs
- API consistency

---

## 30. Design System

Build a reusable design system with:

- Tokens
- Typography scale
- Spacing scale
- Radii
- Shadows
- Motion tokens
- Forms
- Dialogs
- Drawers
- Toasts
- Data tables
- Command palette
- Tabs
- Breadcrumbs
- Dropdowns
- Tooltips
- Skeletons
- Empty states
- Error states
- Confirmation dialogs
- Responsive layouts

Admin experience should feel like a serious SaaS control center rather than a generic dashboard template.

---

## 31. UX Requirements

### Global command palette

Support commands such as:

- New post
- Search content
- Open media
- Open analytics
- Ask AI
- Go to site settings
- Switch workspace
- Switch site
- Publish selected draft

### Keyboard shortcuts

- New post
- Save
- Publish
- Preview
- Search
- Command palette
- Insert block
- Focus editor
- Toggle source mode

### Mobile

Admin should be responsive, but the desktop experience remains the primary editing environment.

Public web must be mobile-first.

---

## 32. Billing & Plans

Support feature flags / entitlements for:

- Sites
- Storage
- Monthly page views
- AI tokens/credits
- Team seats
- Custom domains
- Newsletter sends
- Automation runs
- API rate limits
- Advanced analytics
- SSO
- Audit retention
- White label

Keep billing logic separate from content logic.

---

## 33. Multi-Tenant Database Policy

Every tenant-owned table should have a `tenant_id`.

Every site-owned table should have a `site_id` where relevant.

RLS policy pattern should verify:

```text
authenticated user
  -> membership in tenant
  -> membership in site
  -> requested capability
  -> row ownership / policy
```

RLS must be enabled on all browser-exposed tables; Supabase explicitly recommends RLS for exposed schemas and warns that service keys can bypass RLS and must not be exposed to customers. citehttps://supabase.com/docs/guides/database/postgres/row-level-security

---

## 34. Deployment Topology

### Vercel

- Public web
- Admin web
- CDN caching
- Preview deployments
- Production deployments

### Render

- API web service
- Agent runtime
- Background worker
- Scheduler/cron
- Optional private services

### Supabase

- Postgres
- Auth
- Storage
- Realtime
- Edge Functions when suitable
- pgvector / vector data where suitable

Supabase Edge Functions are globally distributed TypeScript functions designed for webhooks, API endpoints and real-time/server-side processing. citehttps://supabase.com/docs/guides/functionshttps://supabase.com/docs/guides/functions/architecture

### DNS

- `www.example.com` -> public frontend
- `admin.example.com` -> admin frontend
- `api.example.com` -> Render API
- `assets.example.com` -> media/domain strategy

For tenant sites, use domain routing/middleware and a site resolver rather than deploying one frontend per site.

---

## 35. Repository Structure

```text
/apps
  /web
  /admin
  /api
  /agent

/packages
  /ui
  /editor
  /content-schema
  /auth
  /config
  /api-client
  /types
  /seo
  /analytics
  /ai-tools
  /security

/workers
  /media
  /emails
  /analytics
  /search-index
  /imports
  /webhooks

/supabase
  /migrations
  /seed
  /functions

/docs
  /architecture
  /api
  /security
  /ai
  /runbooks

/tests
  /unit
  /integration
  /e2e
  /security
  /load
```

Prefer a monorepo with strict package boundaries.

---

## 36. Testing Strategy

### Unit

- Domain logic
- Permissions
- Content transforms
- SEO rules
- Agent policies

### Integration

- Database
- Auth
- Storage
- Queue
- Email
- Payment providers
- AI providers

### E2E

- Signup
- Site creation
- Authoring
- Review
- Publish
- Comments
- Newsletter
- Subscription
- Admin workflows
- AI tool actions
- Import/export

### Security

- Authorization bypass
- RLS violations
- Tenant isolation
- XSS payloads
- HTML sanitization
- SSRF
- Prompt injection
- File upload abuse
- Rate-limit enforcement

### Load

- Public page traffic
- Search
- Publishing spikes
- Media ingestion
- Analytics ingestion
- AI tool concurrency

---

## 37. Disaster Recovery

Define RPO/RTO targets by plan.

Must support:

- Database backups
- Point-in-time recovery where available
- Media redundancy
- Export jobs
- Audit log retention
- Queue retry/dead-letter
- Recovery runbooks
- Restore testing

---

## 38. Feature Flag Framework

Every major enterprise capability should be controllable via feature flags.

Examples:

```text
editor.canvas
editor.raw_html
editor.source_json
ai.agent
ai.autopilot
ai.web_research
analytics.advanced
newsletter.enabled
billing.enabled
sso.enabled
multi_site.enabled
custom_domains.enabled
headless_api.enabled
```

Use flags for staged rollouts, not permanent hidden branches.

---

## 39. Non-Functional Requirements

The platform should target:

- Strong tenant isolation
- 99.9%+ availability objective depending on plan
- Horizontally scalable backend services
- Fast public content delivery
- Graceful degradation if an AI provider fails
- Graceful degradation if analytics are delayed
- Idempotent async processing
- Safe retries
- Full auditability of privileged actions
- Accessible UI
- Mobile-responsive public site
- Observable production operations

Do not invent unsupported SLA claims. Tie contractual SLAs to the actual hosting/provider plan selected.

---

## 40. Build Phases

### Phase 0 — Foundation

- Monorepo
- CI/CD
- Design system
- Auth
- Tenant/site model
- Database conventions
- RLS
- API conventions
- Logging
- Error handling

### Phase 1 — Core CMS

- Posts/pages
- Structured editor
- Drafts
- Autosave
- Revisions
- Media
- Categories/tags
- Publishing
- Scheduling
- Public renderer

### Phase 2 — Enterprise Admin

- Users
- Roles
- Capabilities
- Workflow
- Audit logs
- Settings
- Site builder
- Domains

### Phase 3 — Audience & Growth

- Accounts
- Comments
- Newsletter
- Subscribers
- Analytics
- SEO
- Search

### Phase 4 — AI Platform

- Agent UI
- Tool router
- File ingestion
- RAG
- Drafting
- SEO assistant
- Analytics assistant
- Approval flows
- Agent audit logs

### Phase 5 — Advanced Publishing

- Podcasts
- Video
- Memberships
- Paid content
- Social distribution
- Automation
- Headless APIs
- Webhooks

### Phase 6 — Enterprise Hardening

- SSO
- Advanced audit
- Security controls
- Rate limits
- Load testing
- DR testing
- Compliance documentation
- White-label capabilities

---

# 41. Master Build Prompt

Use the following as the principal prompt for an AI coding agent.

```text
You are the lead architect, product engineer, security engineer, UX engineer, DevOps engineer, and AI-agent engineer responsible for building an enterprise-grade, multi-tenant, AI-native blogging and publishing platform.

PRODUCT GOAL
Build a modern publishing operating system that combines the strongest capabilities of WordPress, Blogger, Ghost, Substack, Wix, Medium and Hashnode while adding an AI administrator that can understand natural-language instructions, analyze uploaded files, research the site's knowledge, prepare content, manage workflows, analyze analytics, and execute authorized platform actions through safe typed tools.

PRIMARY STACK
- Next.js + React + TypeScript for public web and admin web
- Vercel for frontend deployment, CDN and public page caching
- Render for API services, AI/agent runtime, background workers and scheduled jobs
- Supabase Postgres as the source-of-truth database
- Supabase Auth for authentication
- Supabase Storage for media/files
- Supabase Realtime for live status/notifications/collaboration where suitable
- pgvector or equivalent vector storage for retrieval
- Render Key Value / Valkey-compatible queue/cache for asynchronous jobs
- Provider abstractions for email, payments, search, AI models, analytics and social integrations

ARCHITECTURAL RULES
1. Build multi-tenancy from day one.
2. Every tenant-owned record must be tenant-scoped.
3. Every site-owned record must be site-scoped where applicable.
4. Use RBAC + granular capabilities + resource-level authorization.
5. Use Supabase RLS as defense-in-depth.
6. Never expose privileged/service credentials to the browser.
7. Public rendering must be cache-friendly and CDN-first.
8. Store structured editor JSON as canonical content; treat HTML as a derived representation.
9. Long-running tasks must leave the HTTP request path and become async jobs.
10. AI must use typed tools with explicit permission and risk metadata.
11. High-impact AI actions require explicit confirmation unless a narrowly-scoped policy allows automatic execution.
12. Every privileged AI and admin action must be audited.
13. Design integrations behind adapters so vendors can be swapped.
14. Prefer reversible operations and soft delete where appropriate.
15. Do not create fake placeholders where a real feature is expected.
16. Keep core domain logic framework-independent where practical.
17. Write tests as features are implemented, not after everything is finished.

USER SURFACES
Build all of these:

A. PUBLIC WEB
- Homepage
- Article pages
- Static pages
- Categories
- Tags
- Topics
- Authors
- Search
- Archive
- Collections/series
- Reading lists
- Comments
- Profiles
- Membership pages
- Newsletter signup
- Responsive layout
- Accessibility
- SEO metadata
- Structured data
- RSS/Atom
- Sitemap
- Robots
- Social sharing

B. AUTHOR STUDIO
- Dashboard
- Post/page manager
- Advanced block editor
- Markdown support
- Raw HTML mode
- Source JSON mode
- Reusable blocks/patterns
- Templates
- Media library
- SEO panel
- Accessibility checks
- Autosave
- Revisions
- Diff/restore
- Scheduling
- Preview
- Device preview
- Editorial workflow
- Tasks/comments
- Analytics
- Newsletter creation
- Audience management

C. ENTERPRISE ADMIN
- Organizations/tenants
- Sites/publications
- Users
- Teams
- Roles
- Capabilities
- Security policy
- Content moderation
- Site settings
- Themes
- Visual site builder
- Navigation builder
- Custom domains
- Integrations
- API keys
- Webhooks
- Billing/entitlements
- Analytics
- Audit log
- Feature flags
- System health
- AI policy controls

D. AI ADMIN AGENT
- Chat interface
- File attachments
- URL/source ingestion
- Search site content
- Search site knowledge
- Analyze analytics
- Draft content
- Rewrite content
- Generate outlines
- Generate SEO metadata
- Suggest links
- Create taxonomies
- Manage media metadata
- Prepare/schedule/publish content
- Moderate comments
- Build reports
- Perform site audits
- Manage selected settings
- Create tasks
- Import/export content

EDITOR REQUIREMENTS
Implement an extensible structured editor using Tiptap/ProseMirror, Lexical, or equivalent.

Required blocks/features:
- Paragraph
- Headings
- Lists
- Quotes
- Code
- Code blocks
- Tables
- Images
- Galleries
- Video
- Audio
- Files
- Embeds
- Buttons
- Callouts
- Accordions
- Toggles
- Tabs
- Columns
- Dividers
- HTML/custom block
- Math
- Mermaid/diagram block
- Social embeds
- Newsletter/signup block
- Membership/paywall block
- Product/CTA block

Required editor functionality:
- Slash commands
- Drag/drop
- Keyboard shortcuts
- Copy/paste cleanup
- Markdown import/export
- Raw HTML mode
- Structured JSON source mode
- Reusable patterns
- Templates
- Inline comments
- Track changes
- Find/replace
- Word count
- Reading time
- Link manager
- Autosave
- Revision history
- Restore
- Preview
- Responsive preview
- AI actions

CANVAS EDITOR
Build a dedicated visual canvas subsystem for social cards, article graphics, diagrams and promotional assets.
It must support layers, text, shapes, images, alignment, snap/grid, resize/crop, templates, brand assets, export and history.
Choose Fabric.js, Konva, tldraw, Excalidraw or another appropriate library based on the implementation requirements.

MEDIA
Implement uploads for images, videos, audio, PDFs and common documents.
Support resumable/bulk upload, folders, tags, metadata, alt text, captions, image optimization, transformations, access control, signed URLs, usage references, duplicate detection and processing state.

SEO
Implement canonical URLs, titles, meta descriptions, Open Graph, social cards, JSON-LD, breadcrumbs, sitemaps, robots rules, redirects, slug history, automatic redirect handling, hreflang support and structured SEO diagnostics.

SEARCH
Implement full-text search first, then semantic search/RAG using vector retrieval. Filters must respect tenant, site, content visibility and user permissions.

AUDIENCE
Implement readers, members, subscribers, segments, consent, communication preferences, comments, reactions, follows, bookmarks and optional paid tiers.

NEWSLETTER
Implement campaign creation, templates, previews, test sends, scheduling, segments, unsubscribe flow, suppression handling, delivery events, open/click metrics and provider adapters.

ANALYTICS
Track page views, sessions, referrers, traffic sources, reading time, scroll depth, engagement, shares, comments, subscriptions and content performance. Provide dashboards, filters, comparisons, exports and scheduled reports.

WORKFLOW
Implement configurable states such as Idea, Brief, Draft, Review, SEO Review, Legal Review, Approved, Scheduled, Published, Archived.
Allow tasks, assignments, due dates, comments, approvals and revision requests.

ROLES/CAPABILITIES
Implement at least:
- Super Admin
- Organization Admin
- Site Admin
- Publisher
- Editor
- Author
- Contributor
- Reviewer
- Analyst
- Moderator
- Subscriber/Member

But implement capabilities independently of roles so new roles can be created.

AI ARCHITECTURE
Use:
LLM -> Agent Runtime -> Tool Router -> Policy/Authorization -> Domain Service -> Database/API

Do not let the LLM directly query arbitrary SQL or call privileged APIs.
All agent operations must use typed tools.

Each tool needs:
- name
- description
- input schema
- output schema
- required capability
- scope requirement
- risk level
- confirmation requirement
- timeout
- retry strategy
- idempotency strategy
- audit policy

AI RISK LEVELS
LOW: search, read, summarize, generate draft, suggest metadata
MEDIUM: edit draft, schedule, alter taxonomy, change metadata
HIGH: publish, delete, role changes, domain changes, security/billing changes

High-risk actions require explicit confirmation.

AI FILE WORKFLOW
Upload -> security validation -> content extraction -> normalization -> chunking -> metadata -> embeddings -> ACL-aware retrieval.

Treat uploaded content and fetched web pages as untrusted data. Never follow instructions embedded inside retrieved documents as system instructions.

AGENT MEMORY
Use separate memory scopes:
- session
- user
- site
- organization
- document/knowledge source

Never allow cross-tenant retrieval.

DATA MODEL
Create normalized relational models for:
- organizations
- sites
- users
- memberships
- roles
- capabilities
- posts/content items
- revisions
- taxonomies
- media
- workflows
- workflow states
- tasks
- comments
- members/subscribers
- newsletter campaigns
- subscriptions
- analytics events
- agent threads/messages/tool calls
- knowledge sources/chunks
- integrations
- webhooks
- audit events
- feature flags
- domains

DATABASE
- Use migrations.
- Use indexes deliberately.
- Use foreign keys.
- Use unique constraints.
- Use tenant-scoped RLS.
- Avoid overusing JSONB when relational structure is appropriate.
- Use JSONB for flexible settings and structured editor content.
- Maintain created_at and updated_at consistently.
- Add soft-delete fields where recovery is useful.

API
Create versioned APIs.
Use consistent response/error shapes.
Use cursor pagination where needed.
Validate all input.
Enforce permissions in the service/domain layer and again at the database boundary where appropriate.
Support idempotency keys for mutation endpoints that can be retried.

WEBHOOKS
Support signed webhook deliveries, retries, replay, delivery history and dead-letter state.

ASYNC JOBS
Move these to workers:
- media processing
- image transforms
- video/audio jobs
- emails
- analytics aggregation
- sitemap generation
- search indexing
- embeddings
- imports/exports
- AI batch tasks
- webhooks
- scheduled publishing

CACHING
Use Vercel CDN for public content.
Use explicit cache tags/keys and invalidation on publish/update/delete/theme/settings changes.
Use server/cache layers only where they measurably improve performance.

SECURITY
Implement:
- MFA-ready auth
- secure sessions
- authorization checks
- RLS
- XSS-safe rendering
- HTML sanitization
- SSRF protections
- safe upload validation
- rate limiting
- CSP
- secure cookies
- CSRF defenses where applicable
- audit logging
- secrets isolation
- tenant isolation
- prompt-injection defense
- tool allowlisting
- high-risk confirmations

RAW HTML
Provide raw HTML only to authorized users. Sanitize by default. If advanced custom scripting is supported, isolate it from core admin and public platform security boundaries.

THEME / SITE BUILDER
Build standard and advanced modes.
Standard: templates, typography, colors, navigation, layout, headers/footers.
Advanced: drag/drop components, responsive breakpoints, dynamic data bindings, reusable components, custom CSS variables, approved custom HTML/JS, templates and page conditions.

MULTI-SITE
One organization can own multiple sites/publications.
Each site has its own content, theme, domain, settings and analytics while users and policies may be shared at the organization level.

CUSTOM DOMAINS
Implement domain verification, SSL status, apex/www behavior, canonicalization, per-site configuration and domain health.

IMPORT/EXPORT
Support WordPress XML, Blogger exports, Medium URLs, Markdown + frontmatter, HTML, RSS/Atom, JSON and full structured export.
For imports, preserve original publication dates and canonical/source metadata where appropriate.

DEVELOPER PLATFORM
Provide REST API, OpenAPI spec, typed client, API keys, webhooks and headless-friendly content endpoints.
Keep public read APIs separate from privileged admin APIs.

OBSERVABILITY
Use structured logs, request IDs, tracing/correlation IDs, metrics, error tracking, job metrics, health/readiness endpoints and audit logs.

TESTING
Write unit, integration, E2E, security and load tests.
Do not mark a feature complete until its critical behavior is tested.

QUALITY BAR
The UI should feel like a premium enterprise product.
Do not use a generic dashboard template without adapting the information architecture.
Do not use placeholder charts for production functionality.
Do not fake backend behavior.
Do not hard-code tenant IDs, user IDs, roles or permissions.
Do not put secrets in client code.
Do not bypass authorization in the name of convenience.

DEVELOPMENT METHOD
1. Start by creating the repository structure, shared types and database migrations.
2. Define domain models and authorization boundaries before feature implementation.
3. Build the public web and author studio on top of real APIs.
4. Build the admin console using the same domain services.
5. Build the agent after the underlying APIs/tools exist.
6. Add async workers and search/indexing.
7. Add analytics and audience.
8. Add advanced publishing and monetization.
9. Add enterprise security capabilities.
10. Add observability, load tests and deployment hardening.

DELIVERY RULE
For every implemented feature provide:
- database changes if needed
- API endpoint(s)
- authorization policy
- UI
- loading state
- empty state
- error state
- success state
- audit behavior where relevant
- unit tests
- integration tests if applicable
- E2E coverage for critical flows
- documentation update

Do not merely describe code. Implement it.
When a dependency or integration is uncertain, create an adapter/interface and clearly document the provider-specific implementation point.

DEFINITION OF DONE
The system is complete only when a real user can:
- create an organization
- create a publication/site
- invite team members
- create roles and permissions
- create a post
- edit it in the rich block editor
- upload media
- use HTML/source modes safely
- save revisions and autosaves
- run SEO checks
- submit through workflow
- approve/schedule/publish
- see it rendered on the public site
- search for it
- comment on it
- subscribe to it
- view analytics
- manage media
- configure a domain
- call the API
- receive a webhook
- ask the AI agent about the site
- upload a source document to the AI agent
- ask the agent to create a draft from that source
- inspect the agent's proposed actions
- approve safe high-impact actions
- see every privileged action in the audit log

Build for extensibility, security, correctness, performance and maintainability rather than only for a visual demo.
```

---

## 42. Initial Acceptance Test Checklist

### Public publishing

- [ ] Homepage renders from real database content
- [ ] Article URLs are stable and canonical
- [ ] Sitemap is generated
- [ ] RSS works
- [ ] Social metadata is correct
- [ ] Images are optimized
- [ ] 404/redirect handling works

### Authoring

- [ ] Block editor works
- [ ] Autosave works
- [ ] Revisions work
- [ ] Restore works
- [ ] HTML mode is sanitized
- [ ] Media works
- [ ] Scheduling works

### Administration

- [ ] Roles/capabilities work
- [ ] Tenant isolation tested
- [ ] Audit log captures privileged changes
- [ ] Settings are scoped properly

### AI

- [ ] Agent can read authorized content
- [ ] Agent can read authorized files
- [ ] Agent can generate a draft
- [ ] Agent cannot access another tenant
- [ ] Agent cannot publish without the required authorization
- [ ] Tool calls are audited
- [ ] Prompt injection tests exist

### Platform

- [ ] Background jobs retry safely
- [ ] Webhooks retry safely
- [ ] Deploy health checks work
- [ ] Production secrets are isolated
- [ ] Backups/recovery procedure is documented

---

## 43. Research References

Primary/current sources consulted for this blueprint:

- WordPress Roles and Capabilities: https://wordpress.org/documentation/article/roles-and-capabilities/
- WordPress Block Editor: https://wordpress.org/documentation/article/wordpress-block-editor/
- WordPress Block Patterns: https://wordpress.org/documentation/article/block-pattern/
- WordPress Revisions: https://wordpress.org/documentation/article/revisions/
- Blogger permissions: https://support.google.com/blogger/answer/42673?hl=en
- Ghost editor cards: https://ghost.org/help/cards/
- Ghost Content API: https://ghost.org/docs/content-api/
- Ghost memberships: https://ghost.org/help/topic/memberships/
- Ghost member management: https://ghost.org/help/member-management/
- Substack features: https://substack.com/features
- Medium import: https://help.medium.com/hc/en-us/articles/214550207-Importing-a-post-to-Medium
- Wix Blog analytics: https://support.wix.com/en/article/wix-blog-about-your-blog-analytics
- Hashnode Pro features: https://hashnode.com/changelog/2026-06-11-introducing-hashnode-pro
- Vercel CDN cache: https://vercel.com/docs/caching/cdn-cache
- Render service types: https://render.com/docs/service-types
- Render background workers: https://render.com/docs/background-workers
- Render Key Value: https://render.com/docs/key-value
- Render deployments: https://render.com/docs/deploys
- Render health checks: https://render.com/docs/health-checks
- Supabase architecture: https://supabase.com/docs/guides/getting-started/architecture
- Supabase Auth architecture: https://supabase.com/docs/guides/auth/architecture
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Realtime architecture: https://supabase.com/docs/guides/realtime/architecture
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

---

## 44. Final Product Positioning

The correct mental model is:

> **“WordPress-class CMS + Ghost-class editor + Substack-class audience layer + Wix-class visual customization + Hashnode-class headless/API capabilities + an enterprise AI operations agent.”**

The architecture should therefore avoid being tied to a single frontend, a single AI provider, a single email vendor, a single payment processor or a single search backend.

The most important long-term architectural decision is to keep the **content model, permission model, workflow engine and domain services independent from the UI**. That enables the same platform to power the public website, admin panel, mobile clients, API consumers, automation workflows and the AI agent.
