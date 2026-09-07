# Sundarban Yatra - Complete Project Analysis

## Project Overview

**Sundarban Yatra** is a specialized travel discovery, destination guide, and tour lead-generation platform focused exclusively on the Sundarbans (mangrove forests in Bangladesh/India). The platform combines a travel publication with practical tour planning and enquiry/lead-generation capabilities.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      MONOREPO (pnpm)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Website App  │  │   API Server  │  │   Admin App  │     │
│  │   (Next.js)   │  │   (Next.js)   │  │   (Next.js)  │     │
│  │   Port 3000   │  │   Port 4000   │  │   Port 3100  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│                    ┌──────┴──────┐                         │
│                    │  Supabase    │                         │
│                    │  (Database)  │                         │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Application Breakdown

### 1. Website App (`apps/website`)
**Purpose:** Public-facing frontend for Sundarban Yatra

**Key Technologies:**
- Next.js 15 (App Router)
- Tailwind CSS 4
- tRPC (client-side)
- Radix UI components
- Framer Motion (animations)
- Lucide React (icons)

**Key Pages & Components:**

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `page.tsx` → `HomeView.tsx` | Homepage with hero, trip planner, tours, destinations |
| `/tours` | `tours/page.tsx` | Tour listing page |
| `/tours/[slug]` | `tours/[slug]/page.tsx` → `TourDetail.tsx` | Individual tour details |
| `/hire` | `hire/page.tsx` → `HireView.tsx` | Enquiry/quote page |
| `/articles/[slug]` | `articles/[slug]/page.tsx` → `ArticleView.tsx` | Blog articles |
| `/authors/[authorId]` | Author profile page | Author details |
| `/topics/[slug]` | Topic/category listing | Filtered content |
| `/tags/[slug]` | Tag-based listing | Tag filtering |
| `/archive` | Archive by date | Historical content |
| `/archive/[year]` | Year-specific archive | Year-filtered content |

**Core Components:**

| Component | Purpose |
|-----------|---------|
| `TourCard.tsx` | Card display for tour packages |
| `TourDetail.tsx` | Full tour page with itinerary, gallery, enquiry |
| `TripPlannerCard.tsx` | Homepage trip planning widget |
| `LeadForm.tsx` | Enquiry submission form |
| `Faq.tsx` | Accordion FAQ component |
| `StickyMobileCta.tsx` | Mobile conversion sticky bar |
| `SectionHeader.tsx` | Reusable section headers |
| `DestinationCard.tsx` | Destination place cards |
| `ActivityCard.tsx` | Activity/experience cards |

**Data Sources:**
- Static data: `travel-data.ts` (tours, destinations, activities, FAQs)
- Dynamic content: tRPC API → Supabase (articles, categories, authors)

---

### 2. API Server (`apps/api`)
**Purpose:** Backend API and business logic layer

**Key Technologies:**
- Next.js API routes
- tRPC (routers)
- Supabase (PostgreSQL + Auth + Storage)
- JWT (JOSE library)
- Sanitize HTML
- Express (for additional endpoints)

**API Routers:**

| Router | Purpose |
|--------|---------|
| `blogRouter` | Public content queries, lead submission, comments |
| `studioRouter` | Admin content management |
| `aiRouter` | AI writing assistance (outline, improve, meta, summarize) |
| `agentRouter` | AI agent threads and actions |
| `llmRouter` | LLM task execution |
| `distributionRouter` | Social media distribution (dev.to, Bluesky, Mastodon, FB, IG) |

**Key Endpoints:**
```
/api/trpc/blog.list        - Article listing with filters
/api/trpc/blog.bySlug     - Single article retrieval
/api/trpc/blog.categories - Category listing
/api/trpc/blog.sections   - Homepage sections
/api/trpc/blog.submitLead - Lead form submission
/api/trpc/blog.subscribe  - Newsletter subscription
/api/trpc/auth.*          - Authentication
/api/trpc/studio.*         - Admin CRUD operations
/api/trpc/distribution.*   - Social posting
```

**Database Tables (Supabase):**
- `posts` - Articles/blog posts
- `profiles` - User profiles
- `categories` - Content categories
- `tags` - Content tags
- `site_pages` - Static pages
- `site_sections` - Homepage sections
- `leads` - Enquiry submissions
- `subscribers` - Newsletter subscribers
- `comments` - Article comments
- `analytics_events` - User engagement tracking
- `agent_threads` - AI conversation threads
- `agent_messages` - AI conversation messages
- `agent_actions` - AI-proposed actions
- `distribution_queue` - Social posting queue

---

### 3. Admin App (`apps/admin`)
**Purpose:** Content management system (CMS) for Sundarban Yatra

**Key Technologies:**
- Next.js 15
- TipTap (rich text editor)
- TanStack Query (data fetching)
- tRPC (API communication)
- Radix UI
- Zustand (state management)
- DnD Kit (drag-and-drop)

**Features:**
- Post editor with TipTap
- Category and tag management
- Media library
- Homepage section builder
- Site settings management
- User/role management
- AI writing assistant integration
- Distribution queue management

---

## Design System

### Brand Colors (Sundarban Yatra)

```css
:root {
  --color-bg: #F7F6F1;              /* Warm off-white */
  --color-surface: #FFFFFF;          /* Card backgrounds */
  --color-surface-soft: #EFF4EE;     /* Soft green tint */
  --color-text: #17211B;            /* Primary text */
  --color-text-muted: #66716A;      /* Secondary text */
  --color-primary: #185C43;          /* Deep forest green */
  --color-primary-dark: #0F4532;      /* Darker green (CTA) */
  --color-primary-soft: #DDEBE3;      /* Light green tint */
  --color-accent: #D59B43;           /* Warm gold accent */
  --color-accent-soft: #F5E7CC;      /* Light gold tint */
  --color-border: #E5E8E4;           /* Subtle borders */
  --color-success: #24734C;          /* Success states */
  --color-danger: #B54747;            /* Error/danger states */
}
```

### Typography
- **Display Font:** Inter (variable weight)
- **Mono Font:** DM Mono (code)

### Layout Tokens
```css
--container: 1240px;      /* Max content width */
--radius-sm: 10px;
--radius-md: 14px;
--radius-lg: 20px;
--radius-xl: 28px;
```

---

## Tour Products

### Tour Packages

| Tour | Duration | Description |
|------|----------|-------------|
| 1 Day Sundarban Tour | 1 Day | Creek cruise, Sajnekhali watchtower, village walk |
| 2 Days / 1 Night | 2D/1N | Safari, Dobanki canopy walk, riverside stay |
| 3 Days / 2 Nights | 3D/2N | Deep exploration, Jharkhali, Gosaba, unhurried pace |
| Custom Tour | Flexible | Private itinerary for groups, photographers, special interests |

### Key Destinations
- Sundarban (core area)
- Gosaba (Hamilton bungalow, markets)
- Godkhali (gateway jetty)
- Pakhiralay (stay village)
- Sajnekhali (watchtower, museum)
- Jharkhali (butterfly park, rescue centre)

---

## Conversion Flow

```
Visitor Journey:
1. Landing → Homepage / Tour page
2. Interest → Tour Detail / Trip Planner
3. Action → Call / WhatsApp / Enquiry Form
4. Capture → Lead stored in Supabase
5. Follow-up → Manual sales response
```

**Primary CTAs:**
- Phone: +91 98765 43210
- WhatsApp: Pre-filled message with tour details
- Enquiry Form: Name, phone, date, travellers, message

---

## Recent Changes (Git Status)

### Modified Files (Tracked)
- **Website:** `HomeView.tsx`, `ArticleView.tsx`, `HireView.tsx`, `ListingPage.tsx`
- **API:** `apiTokens.ts`, `blogRouter.ts`, `agentRouter.ts`
- **Admin:** `StudioDeveloper.tsx`, `StudioResearch.tsx`
- **Components:** `TourCard.tsx`, `TourDetail.tsx`, `TripPlannerCard.tsx`, `Faq.tsx`
- **Styling:** `globals.css` (new), `index.css`

### Deleted Files
- `AdsManager.tsx` (advertising component)
- `ads.ts` (advertising logic)
- `server.js`, `start_vite.sh` (old dev scripts)
- `run_dev.sh` (old runner)
- `codereportgloballogo.png` (old branding)
- `template.json` (old template)

### New Untracked Files
- `apps/website/app/tours/` (tours directory)
- `apps/website/src/components/conversion/` (conversion components)
- `apps/website/src/components/travel/` (travel-specific components)
- `apps/website/src/lib/business.ts` (business configuration)
- `apps/website/src/lib/travel-data.ts` (tour data)

---

## Dependencies Summary

### Shared Dependencies
- `@supabase/supabase-js` - Database and auth
- `@trpc/server`, `@trpc/client`, `@trpc/react-query` - Type-safe API
- `zod` - Schema validation
- `superjson` - JSON serialization
- `lucide-react` - Icons
- Radix UI components - Accessible primitives

### Website-Specific
- `next` 15 - React framework
- `framer-motion` - Animations
- `tailwindcss` - Styling
- `recharts` - Charts (admin)
- `@tiptap/*` - Rich text (admin)

### API-Specific
- `jose` - JWT handling
- `sanitize-html` - HTML sanitization
- `cookie` - Cookie parsing

---

## Environment Variables

### Required for Website
```
NEXT_PUBLIC_SITE_URL=https://sundarbanyatra.in
```

### Required for API
```
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
```

### Optional (AI/Distribution)
```
OPENAI_API_KEY=
DEVTO_API_KEY=
BLUESKY_HANDLE=
BLUESKY_APP_PASSWORD=
MASTODON_INSTANCE=
MASTODON_TOKEN=
FACEBOOK_PAGE_ID=
FACEBOOK_PAGE_ACCESS_TOKEN=
INSTAGRAM_ACCESS_TOKEN=
```

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Start all apps in dev mode
pnpm dev

# Start individual apps
pnpm --filter @fieldnote/website dev    # Port 3000
pnpm --filter @fieldnote/api dev         # Port 4000
pnpm --filter @fieldnote/admin dev       # Port 3100

# Build for production
pnpm build

# Run tests
pnpm test
```

---

## Key Features Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Tour listings | ✅ Complete | 4 tour packages with details |
| Trip planner | ✅ Complete | WhatsApp integration |
| Lead capture | ✅ Complete | Form + WhatsApp pre-fill |
| Article CMS | ✅ Complete | Supabase-backed |
| Admin editor | ✅ Complete | TipTap integration |
| AI assistance | ✅ Complete | Outline, improve, meta, summarize |
| Social distribution | ✅ Complete | dev.to, Bluesky, Mastodon, FB, IG |
| SEO optimization | ✅ Complete | Meta tags, OG images, sitemap |
| Mobile responsive | ✅ Complete | Sticky mobile CTA |
| Analytics tracking | ✅ Complete | Page views, scroll depth, events |

---

## Areas for Improvement

1. **Price transparency** - Add actual pricing (currently notes only)
2. **Booking integration** - No actual payment/booking flow
3. **Reviews section** - Currently placeholder (FAQ as substitute)
4. **Image optimization** - Could add more image CDN integration
5. **Caching strategy** - Could improve ISR for tour pages
6. **Testing coverage** - Need more unit/integration tests
7. **Accessibility** - Audit for WCAG compliance
8. **Performance** - Lighthouse optimization pass