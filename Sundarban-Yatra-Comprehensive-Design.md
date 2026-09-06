# Sundarban Yatra — Comprehensive Design MD + Implementation Guide

> **Purpose:** This document is the single design and implementation specification for transforming the existing travel website into **Sundarban Yatra**, a Sundarban-focused travel discovery, travel-guide and tour lead-generation platform.
>
> **Visual reference:** The supplied reference image should guide the overall visual language: large photography, premium editorial spacing, rounded cards, clean navigation, strong hero, trust sections, destination/package cards and prominent conversion CTAs. The content, information architecture and business model must remain specifically focused on the Sundarbans.

---

# 1. Product Vision

## Product

**Sundarban Yatra**

## Positioning

A trustworthy, visually premium travel website dedicated to helping people:

1. discover the Sundarbans,
2. understand how to plan a trip,
3. explore destinations and activities,
4. choose a suitable tour,
5. contact the business easily,
6. submit an enquiry and convert into a booking.

## Core business model

The website is **not** a generic travel marketplace.

It is:

> **Travel publication + destination guide + tour showcase + enquiry/lead-generation engine**

The desired visitor journey is:

```text
Google Search
    ↓
Travel Guide / Article
    ↓
Destination / Activity
    ↓
Tour Package
    ↓
Get Quote / WhatsApp / Call
    ↓
Lead
    ↓
Sales Follow-up
    ↓
Booking
```

For direct traffic:

```text
Homepage
    ↓
Popular Tours
    ↓
Tour Detail
    ↓
Get Quote
    ↓
WhatsApp / Phone
```

---

# 2. Design Reference Interpretation

The uploaded visual reference has several useful characteristics that should be retained:

- large, immersive hero image
- clean white background
- compact navigation
- rounded cards
- large typography
- clear CTA hierarchy
- visual destination cards
- trust/value proposition section
- traveller stories/reviews
- final conversion block
- elegant footer
- generous whitespace

Sundarban Yatra should **not** copy its generic travel concepts such as:

- Flights
- Hotels
- Restaurants
- global destination search
- generic international tourism categories

Instead, translate the same design language into:

- Sundarban Tours
- Destinations
- Safari
- Things To Do
- Travel Guides
- Places To Visit
- Resorts & Stay
- How To Reach
- Plan Your Trip

The final site must feel like a specialized Sundarban brand, not a re-skinned global travel website.

---

# 3. Brand System

## 3.1 Brand Name

**Sundarban Yatra**

Suggested descriptors:

> Explore. Experience. Understand the Sundarbans.

or:

> Your trusted guide to planning a Sundarban journey.

or:

> Discover the Sundarbans with thoughtful tours and practical travel guidance.

---

# 4. Brand Personality

The visual and editorial personality should communicate:

- Natural
- Trustworthy
- Local
- Calm
- Premium
- Helpful
- Adventurous
- Practical

Avoid:

- excessive luxury styling
- overly bright travel-marketplace visuals
- generic stock-travel aesthetics
- fake reviews
- fake price guarantees
- aggressive sales language
- excessive gradients
- excessive motion
- unnecessary booking-engine complexity

---

# 5. Visual Design System

## 5.1 Color Strategy

Use a nature-inspired palette.

Recommended semantic tokens:

```css
:root {
  --color-bg: #F7F6F1;
  --color-surface: #FFFFFF;
  --color-surface-soft: #EFF4EE;

  --color-text: #17211B;
  --color-text-muted: #66716A;

  --color-primary: #185C43;
  --color-primary-dark: #0F4532;
  --color-primary-soft: #DDEBE3;

  --color-accent: #D59B43;
  --color-accent-soft: #F5E7CC;

  --color-border: #E5E8E4;

  --color-success: #24734C;
  --color-danger: #B54747;
}
```

The exact values can be tuned during implementation.

### Visual proportion

Use roughly:

```text
75% neutral / white
20% green / natural tones
5% accent
```

The goal is a clean editorial interface with nature-inspired accents.

---

# 6. Typography

Use one modern, highly readable sans-serif family throughout the product.

Recommended hierarchy:

```css
.hero-title {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
  font-weight: 700;
}

.h1 {
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 1.05;
}

.h2 {
  font-size: clamp(1.75rem, 3vw, 2.6rem);
  line-height: 1.1;
}

.h3 {
  font-size: 1.35rem;
  line-height: 1.25;
}

.body-lg {
  font-size: 1.125rem;
  line-height: 1.65;
}

.body {
  font-size: 1rem;
  line-height: 1.7;
}

.meta {
  font-size: 0.8125rem;
  line-height: 1.4;
}
```

Rules:

- strong visual hierarchy
- short headings
- generous line spacing
- readable article width
- never use typography as decoration at the expense of readability

---

# 7. Layout Tokens

```css
:root {
  --container: 1240px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;

  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-pill: 999px;
}
```

Desktop content width:

```text
1200–1280px
```

Mobile horizontal padding:

```text
20px
```

Desktop horizontal padding:

```text
32px
```

---

# 8. Global Header

## Desktop

Recommended structure:

```text
[Logo]

Tours
Destinations
Travel Guides
Things To Do
Safari
About

                       WhatsApp
                       Plan Your Trip
```

Primary CTA:

**Plan Your Trip**

Secondary utility:

**WhatsApp**

Do not overload the header.

## Mobile

```text
[Logo]     [WhatsApp] [Menu]
```

The menu should contain:

- Home
- Sundarban Tours
- Destinations
- Travel Guides
- Things To Do
- Sundarban Safari
- About
- Contact
- Plan Your Trip

## Sticky mobile CTA

At the bottom:

```text
┌─────────────────────────────────────────┐
│  WhatsApp      Call       Get Quote      │
└─────────────────────────────────────────┘
```

This is one of the most important conversion features.

---

# 9. Global Component Rules

Create reusable primitives before building individual pages.

Suggested component hierarchy:

```text
components/
  ui/
    Button
    Input
    Select
    Badge
    Card
    Modal
    Drawer
    Skeleton
    Accordion

  layout/
    SiteHeader
    MobileMenu
    SiteFooter
    PageContainer
    Section
    SectionHeader
    Breadcrumbs

  travel/
    TourCard
    DestinationCard
    PlaceCard
    ActivityCard
    GuideCard
    ReviewCard
    TrustFeature

  conversion/
    LeadForm
    QuoteCta
    WhatsAppButton
    PhoneButton
    TripPlannerCard
    StickyMobileCta
```

Avoid one-off styling whenever a pattern will appear more than once.

---

# 10. Homepage

## Homepage structure

```text
Header
  ↓
Hero
  ↓
Trip Planner
  ↓
Popular Tours
  ↓
Why Choose Us
  ↓
Explore Sundarban
  ↓
Things To Do
  ↓
Safari Feature
  ↓
Travel Guides
  ↓
Latest Articles
  ↓
Traveller Stories
  ↓
FAQ
  ↓
Final CTA
  ↓
Footer
```

---

# 11. Hero Section

The hero should use a strong Sundarban image.

Suggested imagery:

- river channel through mangroves
- wooden/engine boat
- mangrove canopy
- wildlife/nature environment
- sunrise or sunset over waterways
- authentic local travel moment

Never use a generic mountain, European village or tropical beach image for the Sundarban hero.

## Hero copy

Recommended:

### Eyebrow

`Sundarban Travel • Tours • Guides`

### Heading

> **Plan Your Sundarban Journey with Confidence**

### Supporting text

> Discover mangrove waterways, wildlife, villages and memorable boat journeys with practical guides and thoughtfully planned Sundarban tours.

### Buttons

```text
[ Explore Sundarban Tours ]
[ WhatsApp Us ]
```

### Optional trust line

```text
Local guidance  •  Flexible itineraries  •  Easy enquiry
```

---

# 12. Trip Planner Card

The supplied reference uses a booking/search widget.

For Sundarban Yatra, replace it with a **Trip Planning / Enquiry Card**.

## Fields

```text
Travel Date
Travellers
Number of Days
Starting Location
Interested In
```

CTA:

**Get Tour Options**

This does not behave as fake real-time inventory.

It starts the enquiry process.

## UX

Desktop:

```text
┌──────────────────────────────────────────────────────────┐
│ Plan Your Trip                                           │
│                                                          │
│ Date      Travellers    Days    Starting Point          │
│ [____]    [________]    [__]    [____________]          │
│                                                          │
│ Interested in: [ Tour / Safari / Custom Trip ]           │
│                                                          │
│                         [ Get Tour Options ]             │
└──────────────────────────────────────────────────────────┘
```

Mobile: stack all fields vertically.

---

# 13. Popular Tours

Heading:

> **Sundarban Tours Made for Your Trip**

Description:

> Choose a ready-made itinerary or tell us what kind of Sundarban experience you are looking for.

Cards:

### 1 Day Sundarban Tour

### 2 Days / 1 Night Sundarban Tour

### 3 Days / 2 Nights Sundarban Tour

### Custom Sundarban Tour

## Tour card

```text
┌─────────────────────────┐
│                         │
│       Cover Image       │
│                         │
├─────────────────────────┤
│ Popular / Duration      │
│                         │
│ Sundarban 2D / 1N       │
│ Short description...    │
│                         │
│ 2 Days • 1 Night        │
│ Starting from ...       │
│                         │
│ [ View Tour ]           │
└─────────────────────────┘
```

Only show a price when the business can actually maintain current pricing.

---

# 14. Why Choose Us

Use a section inspired by the reference trust block.

Heading:

> **Why Travellers Choose Sundarban Yatra**

Four features:

## Trusted Local Guidance

Helpful destination knowledge and practical trip-planning support.

## Thoughtful Itineraries

Trips designed around realistic travel times and destination experiences.

## Clear Communication

Easy access to the team through WhatsApp, phone and enquiry forms.

## Planning Support

Guidance for route, timing, stay and tour selection.

Do not invent:

- years of experience
- certification
- awards
- review count
- price guarantees

unless those facts are real.

---

# 15. Destination Section

Heading:

> **Explore the Sundarbans**

Destination cards:

- Sundarban
- Gosaba
- Godkhali
- Pakhiralay
- Sajnekhali
- Jharkhali

Each card:

```text
Image
Destination
Short description
Explore →
```

Use 3-column desktop grid.

Tablet: 2 columns.

Mobile: 1 column or horizontal scrolling carousel.

---

# 16. Things To Do

Heading:

> **Things To Do in the Sundarbans**

Suggested categories:

- Sundarban Safari
- Boat Journey
- Wildlife Watching
- Mangrove Exploration
- Birdwatching
- Village Experience
- River Sunrise / Sunset
- Local Food Experience

Avoid absolute wildlife claims.

Preferred wording:

> Wildlife sightings depend on natural conditions, season and luck.

---

# 17. Safari Feature Section

This should be a visually dominant feature block.

Layout:

```text
┌────────────────────────┬─────────────────────────┐
│                        │                         │
│      LARGE IMAGE       │  Sundarban Safari      │
│                        │                         │
│                        │  What to expect...     │
│                        │                         │
│                        │ [ Explore Safari ]      │
│                        │ [ Read Safari Guide ]   │
└────────────────────────┴─────────────────────────┘
```

Purpose:

- explain safari
- educate visitor
- connect to tours
- create commercial intent

---

# 18. Travel Guide Section

The blog is a major organic-growth engine.

Heading:

> **Plan Your Sundarban Trip Better**

Feature guide cards:

- How to Reach Sundarban
- Best Time to Visit Sundarban
- Sundarban Tour Cost
- Sundarban Itinerary
- Sundarban Safari Guide
- Places to Visit in Sundarban

Card structure:

```text
Category
Title
Description
Updated date
Reading time
Read Guide →
```

---

# 19. Latest Articles

Heading:

> **Latest from the Sundarban Travel Guide**

3 or 4 article cards.

Use:

- consistent image ratios
- category
- title
- summary
- updated/published date
- reading time

Do not make every card look like a sales ad.

---

# 20. Traveller Stories / Reviews

Only show genuine content.

Recommended layout:

```text
┌────────────────────────────────────────┐
│ Stories from the Journey               │
│                                        │
│ ┌──────────────────┐ ┌────────────────┐│
│ │ Large Review     │ │ Small Review   ││
│ │                  │ │                ││
│ │ Real story       │ │ Real story     ││
│ └──────────────────┘ └────────────────┘│
└────────────────────────────────────────┘
```

If real reviews are not available, replace the section with:

> **Questions Travellers Ask Before They Go**

Never fabricate testimonials.

---

# 21. FAQ

Homepage FAQ should answer high-intent questions such as:

- How do I reach the Sundarbans?
- How many days are enough for a Sundarban trip?
- What is usually included in a tour?
- What should I carry?
- Which season is suitable for visiting?
- How does a boat safari work?
- Can I request a custom itinerary?

FAQ content must be fact-checked and editable through admin.

---

# 22. Final CTA

Large, calm conversion section.

### Heading

> **Ready to Plan Your Sundarban Trip?**

### Text

> Tell us your travel date, group size and preferred experience. We will help you choose the right Sundarban tour.

Buttons:

```text
[ Get a Tour Quote ]
[ WhatsApp Us ]
```

Optional phone:

```text
Prefer a call? +91 XXXXXXXXXX
```

---

# 23. Footer

Desktop:

```text
Sundarban Yatra

Explore
  Sundarban Tours
  Destinations
  Safari
  Things To Do

Plan
  How to Reach
  Best Time to Visit
  Tour Cost
  Travel Tips
  FAQs

Company
  About
  Contact
  Privacy
  Terms

Contact
  Phone
  WhatsApp
  Email
```

Bottom:

```text
© Sundarban Yatra
Privacy Policy • Terms • Disclaimer
```

---

# 24. Tour Listing Page

Route:

```text
/tours
```

## Page header

### H1

> Sundarban Tour Packages

Supporting copy:

> Explore short trips, overnight itineraries and custom Sundarban journeys designed around different travel needs.

## Filters

Keep them simple:

- Duration
- Starting point
- Tour type
- Best for

Do not build an Expedia-like filter system.

## Layout

Desktop:

```text
3 cards per row
```

Tablet:

```text
2 cards per row
```

Mobile:

```text
1 card per row
```

## Bottom content

After tour cards:

- how to choose a tour
- what's generally included
- planning tips
- FAQs
- final CTA

---

# 25. Tour Detail Page

Example:

```text
/tours/sundarban-2-days-1-night
```

## Above fold

```text
Breadcrumb
Tour category
H1
Duration / Start point / Best for
Hero gallery
Price note if verified
[ Get a Quote ]
[ WhatsApp This Tour ]
```

## Main sections

1. Overview
2. Highlights
3. Day-by-day itinerary
4. Inclusions
5. Exclusions
6. Meeting point
7. Transport
8. Stay / accommodation
9. Best for
10. FAQs
11. Related guides
12. Related destinations
13. Enquiry form

---

# 26. Tour Sticky Enquiry Card

Desktop right column:

```text
┌────────────────────────────┐
│ Plan This Tour             │
│                            │
│ Travel Date                │
│ [____________]             │
│                            │
│ Travellers                 │
│ [____________]             │
│                            │
│ Phone / WhatsApp           │
│ [____________]             │
│                            │
│ [ Get a Quote ]            │
│                            │
│ [ WhatsApp ]               │
└────────────────────────────┘
```

On mobile, convert to sticky bottom CTA.

---

# 27. Destination Pages

Routes:

```text
/destinations/sundarban
/destinations/gosaba
/destinations/godkhali
/destinations/pakhiralay
/destinations/sajnekhali
/destinations/jharkhali
```

## Destination structure

```text
Breadcrumbs
Hero
Overview
Quick Facts
How to Reach
Best Time
Things to Do
Places Nearby
Related Tours
Related Guides
FAQs
Plan Your Trip
```

## Last updated

For changing information:

```text
Last updated: [date]
```

This creates a clear editorial maintenance mechanism.

---

# 28. Place / Attraction Pages

Use a separate structured content type for places that are not full destinations.

Possible types:

- Attraction
- Safari Point
- Village
- Wildlife Area
- Viewpoint
- Landmark
- Other

Page structure:

```text
Hero
Overview
Why Visit
What to Expect
How to Reach
Best Time
Related Tours
Nearby Destinations
FAQ
CTA
```

---

# 29. Things To Do Pages

Route:

```text
/things-to-do
```

Examples:

```text
/things-to-do/sundarban-safari
/things-to-do/boat-journey
/things-to-do/birdwatching
```

Each page should answer:

- What is it?
- Why do travellers do it?
- What does it involve?
- How long does it typically take?
- What should visitors know?
- Which tours include it?

---

# 30. Travel Guide Landing Page

Route:

```text
/guides
```

Hero:

> Sundarban Travel Guides

Subheading:

> Practical information to help you plan a better Sundarban trip.

Topic navigation:

```text
Planning
Tours
Safari
Destinations
Budget
How to Reach
Accommodation
Travel Tips
```

Feature one cornerstone guide.

Below:

- latest guides
- popular guides
- destination guides
- tour-planning guides
- related tours

---

# 31. Article Detail Page

Existing article URLs should be preserved when practical.

Example:

```text
/articles/how-to-reach-sundarban
```

or the current repository route format.

## Above fold

```text
Breadcrumb
Category
H1
Summary
Author
Updated date
Reading time
Hero image
```

## Desktop layout

```text
┌───────────────────────────────┬────────────────────┐
│                               │ Table of Contents  │
│       MAIN ARTICLE            │                    │
│                               │ Related Tour       │
│                               │                    │
│                               │ WhatsApp           │
│                               │                    │
└───────────────────────────────┴────────────────────┘
```

## Article ending

```text
Key Takeaways
Related Guides
Related Destinations
Related Tours
FAQ
Plan Your Trip CTA
```

---

# 32. Editorial Content Rules

Every article should have a clear intent.

Example:

```text
Search intent
↓
Question/problem
↓
Useful answer
↓
Supporting details
↓
Related destination
↓
Relevant tour
↓
CTA
```

Avoid turning editorial articles into long advertisements.

---

# 33. Internal Linking Strategy

The site should have an intentional content graph.

```text
Article
  ↓
Destination
  ↓
Tour
  ↓
Lead Form
```

Example:

```text
How to Reach Sundarban
       ↓
Sundarban Destination
       ↓
2D / 1N Tour
       ↓
Get a Quote
```

Another:

```text
Sundarban Safari Guide
       ↓
Safari Activity
       ↓
Safari Tour
       ↓
WhatsApp
```

---

# 34. Lead Generation

Lead generation is a core product feature.

## Main lead form fields

```text
Name
Phone / WhatsApp
Email
Travel Date
Number of Travellers
Number of Days
Starting Location
Interested Tour
Message
```

No account registration.

No unnecessary personal information.

## Contextual CTA labels

Use:

```text
Get a Quote
Plan My Trip
Ask About This Tour
Get Tour Options
WhatsApp About This Tour
```

Avoid:

```text
Submit
```

where a more descriptive CTA is possible.

---

# 35. Lead Success State

After form submission:

```text
✓ Enquiry Received

Thanks — your trip enquiry has been received.

Our team can help you with the next steps.

[ Continue on WhatsApp ]

or

[ Call Us ]
```

Preserve a useful contextual message in WhatsApp.

Example:

```text
Hello Sundarban Yatra,
I am interested in the Sundarban 2 Days / 1 Night Tour.

Travel date:
Travellers:
Starting location:
```

---

# 36. WhatsApp System

WhatsApp should be centralized in configuration.

Example:

```ts
export const businessConfig = {
  phone: "+91XXXXXXXXXX",
  whatsapp: "91XXXXXXXXXX",
  email: "hello@example.com",
};
```

Create a utility:

```ts
export function buildWhatsAppUrl(message: string) {
  const number = businessConfig.whatsapp;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
```

Example:

```tsx
<a
  href={buildWhatsAppUrl(
    "Hello Sundarban Yatra, I am interested in the 2 Days / 1 Night Sundarban Tour."
  )}
  target="_blank"
  rel="noopener noreferrer"
>
  WhatsApp About This Tour
</a>
```

Every WhatsApp click should optionally emit:

```text
whatsapp_click
```

---

# 37. Phone System

Never hardcode phone numbers in individual components.

Use:

```ts
export const businessConfig = {
  phone: "+91XXXXXXXXXX",
};
```

Phone CTA:

```tsx
<a href={`tel:${businessConfig.phone}`}>
  Call Us
</a>
```

Track:

```text
phone_click
```

---

# 38. Lead Data Model

Recommended:

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  name text not null,
  phone text not null,
  whatsapp text,
  email text,
  travel_date date,
  travellers integer,
  duration integer,
  starting_location text,
  tour_package_id uuid,
  destination_id uuid,
  message text,
  source text,
  landing_page text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  status text not null default 'NEW',
  assigned_to uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Status:

```text
NEW
CONTACTED
QUALIFIED
QUOTED
BOOKED
LOST
CLOSED
```

---

# 39. Destination Data Model

Recommended:

```sql
create table destinations (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  name text not null,
  slug text not null,
  type text,
  parent_id uuid,
  short_description text,
  description text,
  latitude numeric,
  longitude numeric,
  hero_image text,
  best_time text,
  how_to_reach text,
  travel_tips text,
  featured boolean not null default false,
  status text not null default 'DRAFT',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

# 40. Places Data Model

```sql
create table places (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  destination_id uuid,
  name text not null,
  slug text not null,
  type text not null,
  short_description text,
  description text,
  latitude numeric,
  longitude numeric,
  image text,
  featured boolean not null default false,
  status text not null default 'DRAFT',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Possible type values:

```text
ATTRACTION
SAFARI
VILLAGE
VIEWPOINT
WILDLIFE
LANDMARK
OTHER
```

---

# 41. Tour Package Data Model

```sql
create table tour_packages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  title text not null,
  slug text not null,
  short_description text,
  description text,
  duration_days integer,
  duration_nights integer,
  starting_price numeric,
  price_note text,
  destination_id uuid,
  cover_image text,
  gallery jsonb,
  inclusions jsonb,
  exclusions jsonb,
  meeting_point text,
  transport_details text,
  best_for text,
  status text not null default 'DRAFT',
  featured boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

# 42. Tour Itinerary Model

```sql
create table tour_itinerary_items (
  id uuid primary key default gen_random_uuid(),
  tour_package_id uuid not null,
  day_number integer not null,
  title text not null,
  description text,
  activities jsonb,
  meals jsonb,
  accommodation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

# 43. Article Relationships

Articles should connect to structured entities.

Potential relations:

```text
article_destinations
article_tours
article_places
```

Example:

```sql
create table article_tours (
  article_id uuid not null,
  tour_package_id uuid not null,
  primary key (article_id, tour_package_id)
);
```

This enables:

```text
Guide → Related Tour
Destination → Related Guide
Tour → Related Guide
Place → Related Tour
```

---

# 44. FAQ Model

Use a reusable FAQ system.

Suggested fields:

```text
id
site_id
question
answer
sort_order
status
```

Optional relation fields or relation tables:

```text
destination_id
tour_package_id
article_id
place_id
```

The admin should be able to attach FAQs to multiple content types.

---

# 45. API Design

The existing architecture should be extended rather than replaced.

Recommended routers:

```text
tourRouter
destinationRouter
placeRouter
leadRouter
travelRouter
```

Potential procedures:

```text
tour.list
tour.get
tour.create
tour.update
tour.delete

destination.list
destination.get
destination.create
destination.update

place.list
place.get
place.create
place.update

lead.create
lead.list
lead.get
lead.updateStatus
lead.addNote
lead.assign
```

---

# 46. Public vs Protected Procedures

Public:

```text
tour.list
tour.get
destination.list
destination.get
place.list
place.get
article.public
lead.create
```

Protected/admin:

```text
tour.create
tour.update
tour.delete
destination.create
destination.update
place.create
place.update
lead.list
lead.get
lead.updateStatus
lead.addNote
lead.assign
```

Never expose:

```text
lead.list
lead.get
lead.notes
lead.customer data
```

to public callers.

---

# 47. Example tRPC Lead Router

Adapt naming/types to the existing project's conventions.

```ts
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";

const leadInput = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(7).max(30),
  whatsapp: z.string().max(30).optional(),
  email: z.string().email().max(200).optional(),
  travelDate: z.coerce.date().optional(),
  travellers: z.number().int().min(1).max(100).optional(),
  duration: z.number().int().min(1).max(60).optional(),
  startingLocation: z.string().max(150).optional(),
  tourPackageId: z.string().uuid().optional(),
  destinationId: z.string().uuid().optional(),
  message: z.string().max(3000).optional(),
  source: z.string().max(100).optional(),
  landingPage: z.string().max(500).optional(),
  referrer: z.string().max(1000).optional(),
  utmSource: z.string().max(150).optional(),
  utmMedium: z.string().max(150).optional(),
  utmCampaign: z.string().max(150).optional(),
  utmContent: z.string().max(150).optional(),
});

export const leadRouter = router({
  create: publicProcedure
    .input(leadInput)
    .mutation(async ({ ctx, input }) => {
      // 1. Apply rate limiting.
      // 2. Sanitize free-text fields using project utilities.
      // 3. Resolve site/tenant context from the request.
      // 4. Insert only allowed fields.
      // 5. Return a safe success response.

      const lead = await ctx.db.lead.create({
        data: {
          ...input,
          siteId: ctx.siteId,
          status: "NEW",
        },
      });

      return {
        success: true,
        id: lead.id,
      };
    }),

  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Always scope to the authenticated user's site/tenant.
      return ctx.db.lead.findMany({
        where: {
          siteId: ctx.siteId,
          status: input.status,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
});
```

The exact database/client syntax should match the existing repository.

---

# 48. Example Lead Form

```tsx
"use client";

import { useState } from "react";

export function LeadForm({
  tourId,
  tourTitle,
}: {
  tourId?: string;
  tourTitle?: string;
}) {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const payload = {
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      travelDate: String(form.get("travelDate") ?? ""),
      travellers: Number(form.get("travellers") ?? 0),
      duration: Number(form.get("duration") ?? 0),
      startingLocation: String(form.get("startingLocation") ?? ""),
      tourPackageId: tourId,
      message: String(form.get("message") ?? ""),
    };

    // Replace with the project's existing tRPC mutation hook.
    await submitLead(payload);

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border p-6">
        <h3 className="text-xl font-semibold">
          Enquiry received
        </h3>

        <p className="mt-2 text-muted">
          Thank you. Our team can help you plan your Sundarban trip.
        </p>

        <a
          href={buildWhatsAppUrl(
            `Hello Sundarban Yatra, I am interested in ${tourTitle ?? "a Sundarban tour"}.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex rounded-full px-5 py-3"
        >
          Continue on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="name"
        required
        maxLength={100}
        placeholder="Your name"
      />

      <input
        name="phone"
        required
        maxLength={30}
        placeholder="Phone / WhatsApp"
      />

      <input
        name="email"
        type="email"
        maxLength={200}
        placeholder="Email"
      />

      <input
        name="travelDate"
        type="date"
      />

      <input
        name="travellers"
        type="number"
        min={1}
        max={100}
        placeholder="Number of travellers"
      />

      <input
        name="duration"
        type="number"
        min={1}
        max={60}
        placeholder="Number of days"
      />

      <input
        name="startingLocation"
        maxLength={150}
        placeholder="Starting location"
      />

      <textarea
        name="message"
        maxLength={3000}
        placeholder="Tell us about your trip"
      />

      <button type="submit">
        Get a Tour Quote
      </button>
    </form>
  );
}
```

---

# 49. Example Tour Card

```tsx
type TourCardProps = {
  title: string;
  slug: string;
  image: string;
  duration: string;
  summary?: string;
  priceLabel?: string;
  featured?: boolean;
};

export function TourCard({
  title,
  slug,
  image,
  duration,
  summary,
  priceLabel,
  featured,
}: TourCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
      <a href={`/tours/${slug}`} aria-label={`View ${title}`}>
        <div className="relative aspect-[3/2] overflow-hidden">
          <img
            src={image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          {featured && (
            <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs">
              Featured
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="text-sm text-muted">
            {duration}
          </div>

          <h3 className="mt-2 text-xl font-semibold">
            {title}
          </h3>

          {summary && (
            <p className="mt-2 line-clamp-2 text-sm text-muted">
              {summary}
            </p>
          )}

          {priceLabel && (
            <div className="mt-4 font-semibold">
              {priceLabel}
            </div>
          )}

          <div className="mt-5 text-sm font-semibold">
            View Tour →
          </div>
        </div>
      </a>
    </article>
  );
}
```

---

# 50. Example Design Tokens in Tailwind

If Tailwind is already used, map the design system into the existing configuration rather than adding another styling system.

Example:

```ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#185C43",
          600: "#0F4532",
        },
        accent: {
          500: "#D59B43",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          soft: "#EFF4EE",
        },
      },
      borderRadius: {
        card: "20px",
        hero: "28px",
      },
      maxWidth: {
        content: "1240px",
      },
    },
  },
};
```

Only add configuration that matches the project's current CSS architecture.

---

# 51. Image Rules

Photography is one of the largest differentiators.

## Image priorities

1. Authentic Sundarban landscapes
2. Boats and waterways
3. Mangrove forests
4. wildlife/nature
5. local communities
6. travellers experiencing the destination
7. accommodations
8. food/culture

## Image ratios

Hero:

```text
16:9+
```

Tour cards:

```text
3:2
```

Destination cards:

```text
4:3
```

Article hero:

```text
16:9
```

## Image performance

Use:

- responsive image sizes
- modern image formats supported by the existing stack
- width/height or aspect ratio to prevent layout shift
- lazy loading below the fold
- eager loading only for critical hero imagery

---

# 52. Responsive Design

## Mobile

Priorities:

- one-column layout
- large touch targets
- clear CTA
- sticky conversion bar
- simple forms
- compact hero
- accessible navigation

## Tablet

- 2-column card grids
- compact navigation
- balanced spacing

## Desktop

- 3-column card grids
- wide hero
- editorial split layouts
- side enquiry cards
- large photography

---

# 53. Mobile Hero

Do not simply shrink the desktop hero.

Mobile composition:

```text
┌───────────────────────┐
│     Sundarban Image   │
│                       │
│ Travel • Tours •      │
│ Guides                │
│                       │
│ Plan Your Sundarban   │
│ Journey with          │
│ Confidence            │
│                       │
│ [ Explore Tours ]     │
│ [ WhatsApp ]          │
└───────────────────────┘
```

The image must remain visible and the CTA must stay above the fold where practical.

---

# 54. Accessibility

Target WCAG 2.2 AA principles.

Required:

- semantic HTML
- proper heading hierarchy
- visible focus states
- keyboard navigation
- form labels
- accessible error messages
- alt text where meaningful
- decorative imagery ignored by screen readers
- sufficient contrast
- minimum usable touch target
- reduced motion
- accessible menu/drawer behavior

Example:

```tsx
<button
  type="button"
  aria-expanded={open}
  aria-controls="mobile-menu"
>
  Menu
</button>
```

---

# 55. Motion

Use subtle motion only.

Allowed:

```text
hover image scale
button feedback
fade-in
small card lift
drawer transition
```

Avoid:

```text
scroll hijacking
large parallax
long entrance animations
autoplay video with sound
```

Respect:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# 56. SEO Architecture

Indexable:

```text
Tours
Destinations
Places
Guides
Published Articles
```

Every page should support:

- title
- meta description
- canonical
- OpenGraph
- social image
- breadcrumbs
- useful body content
- internal links

---

# 57. Target Topic Clusters

## Cluster: Sundarban Tour

- Sundarban Tour
- Sundarban Tour Package
- Sundarban Tour from Kolkata
- Sundarban 2 Days 1 Night
- Sundarban 3 Days 2 Nights
- Sundarban Tour Cost
- Sundarban Itinerary

## Cluster: Travel Guide

- How to Reach Sundarban
- Best Time to Visit Sundarban
- Sundarban Safari Guide
- Sundarban Travel Tips
- Places to Visit in Sundarban
- Things to Do in Sundarban
- Sundarban Accommodation / Resorts

The content must serve search intent naturally.

---

# 58. Structured Data

Potential schema types:

```text
Article
BreadcrumbList
FAQPage
TouristDestination
TouristAttraction
```

Only add schema where the content actually qualifies.

Never fabricate:

```text
reviewCount
rating
availability
price
award
certification
```

---

# 59. Sitemap

The sitemap should include published:

```text
Tours
Destinations
Places
Guides
Articles
```

Exclude:

```text
Drafts
Admin
API
Private CRM
Internal search result pages
```

---

# 60. Breadcrumbs

Example:

```text
Home
  /
Tours
  /
Sundarban 2 Days / 1 Night
```

Destination:

```text
Home
  /
Destinations
  /
Gosaba
```

Guide:

```text
Home
  /
Travel Guides
  /
How to Reach Sundarban
```

---

# 61. Analytics

Recommended events:

```text
tour_view
destination_view
guide_view
lead_form_view
lead_form_start
lead_submit
whatsapp_click
phone_click
tour_cta_click
guide_tour_cta_click
```

Attribution:

```text
utm_source
utm_medium
utm_campaign
utm_content
landing_page
referrer
```

Do not send unnecessary personal data to analytics.

---

# 62. Example Analytics Helper

```ts
export function trackEvent(
  name: string,
  properties: Record<string, unknown> = {}
) {
  if (typeof window === "undefined") return;

  // Adapt this call to the project's existing analytics provider.
  window.dispatchEvent(
    new CustomEvent("analytics:event", {
      detail: {
        name,
        properties,
      },
    })
  );
}
```

Example:

```tsx
<button
  onClick={() =>
    trackEvent("tour_cta_click", {
      tourId,
      source: "homepage",
    })
  }
>
  Explore Tour
</button>
```

---

# 63. Lead Attribution

At first visit, capture:

```text
utm_source
utm_medium
utm_campaign
utm_content
landing_page
referrer
```

Persist non-sensitive attribution information for the eventual lead submission.

Example:

```ts
type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  landingPage?: string;
  referrer?: string;
};
```

---

# 64. Admin Information Architecture

Reuse the existing admin/editorial studio.

Recommended:

```text
Dashboard

Content
  Articles
  Categories
  Media
  Authors

Travel
  Tours
  Destinations
  Places
  FAQs

Leads
  All Leads
  New
  Contacted
  Qualified
  Quoted
  Booked
  Lost
  Closed
```

Do not create a second CMS.

---

# 65. Admin Tour Editor

Sections:

```text
Basic Information
Commercial
Media
Itinerary
Travel Information
FAQs
SEO
Publishing
```

### Basic

```text
Title
Slug
Short Description
Description
Destination
Duration
Featured
```

### Commercial

```text
Starting Price
Price Note
Inclusions
Exclusions
```

### Media

```text
Cover
Gallery
```

### Itinerary

Repeatable blocks:

```text
Day
Title
Description
Activities
Meals
Accommodation
```

### Travel

```text
Meeting Point
Transport
Best For
```

### SEO

```text
SEO Title
Meta Description
Canonical
Social Image
```

---

# 66. Admin Destination Editor

Fields:

```text
Name
Slug
Parent Destination
Type
Summary
Description
Coordinates
Hero Image
Best Time
How to Reach
Travel Tips
Featured
Status
SEO Title
SEO Description
```

Relationships:

```text
Articles
Tours
Places
FAQs
```

---

# 67. Admin Lead CRM

## Dashboard metrics

```text
New Leads Today
Open Leads
Qualified Leads
Quoted Leads
Booked Leads
```

## Table

```text
Name
Phone
Travel Date
Travellers
Tour
Source
Status
Created
```

## Lead detail

### Contact

```text
Name
Phone
WhatsApp
Email
```

### Trip

```text
Travel Date
Travellers
Duration
Starting Location
Tour
Destination
Message
```

### Acquisition

```text
Source
Landing Page
Referrer
UTM Source
UTM Medium
UTM Campaign
UTM Content
```

### Sales

```text
Status
Assigned To
Notes
```

Actions:

```text
Call
WhatsApp
Change Status
Assign
Add Note
```

---

# 68. Lead Security

Public lead creation must:

- rate-limit
- validate input
- sanitize text
- enforce maximum lengths
- reject malformed identifiers
- protect against spam
- avoid returning internal database errors
- never return other lead records

Admin lead access must enforce:

- authentication
- authorization
- site/tenant isolation

Existing security utilities should be reused.

---

# 69. Example Zod Validation

```ts
const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  whatsapp: z.string().trim().max(30).optional(),
  email: z.string().trim().email().max(200).optional(),
  travellers: z.coerce.number().int().min(1).max(100).optional(),
  duration: z.coerce.number().int().min(1).max(60).optional(),
  startingLocation: z.string().trim().max(150).optional(),
  message: z.string().trim().max(3000).optional(),
});
```

Free-text sanitization should still use the repository's existing sanitization layer.

---

# 70. Example Security Test

Adapt to the project's test framework.

```ts
it("does not allow a user to read another site's leads", async () => {
  const lead = await createLead({
    siteId: siteA.id,
    name: "Test User",
    phone: "9999999999",
  });

  const caller = createAuthenticatedCaller({
    user: siteBUser,
    siteId: siteB.id,
  });

  await expect(
    caller.lead.get({ id: lead.id })
  ).rejects.toThrow();
});
```

Add equivalent tests for:

- unauthorized lead list
- unauthorized lead update
- cross-site destination access
- cross-site tour access
- invalid public lead input
- rate limiting
- mass-assignment attempts

---

# 71. Empty and Error States

## Empty tours

> No tours match these filters.

Button:

```text
Clear Filters
```

## Lead error

> We couldn't send your enquiry. Please try again or contact us on WhatsApp.

Do not show stack traces or raw server errors.

## Empty articles

> New travel guides are coming soon.

Only use this state when truly necessary.

---

# 72. Performance Strategy

Prioritize:

1. hero image optimization
2. server-rendered SEO content where appropriate
3. lazy-loaded below-fold images
4. minimal client JavaScript
5. lightweight components
6. caching for read-heavy travel content

Avoid introducing as Phase 1 blockers:

- full hotel booking engines
- external flight search
- complex maps
- real-time weather
- large personalization systems

Lat/long can be stored now for future map functionality.

---

# 73. Content Freshness

Travel information can change.

For potentially volatile information, use editable structured fields and display:

```text
Last updated: [DATE]
```

Examples of volatile information:

- permits
- entry rules
- schedules
- transport availability
- operating hours
- pricing
- booking conditions

Never hardcode a volatile claim across many components.

---

# 74. No Fake Information Policy

Do not fabricate:

- tour availability
- discounts
- review counts
- ratings
- wildlife sightings
- travel permits
- government rules
- prices
- hotel guarantees
- certifications
- awards

When a fact is unknown, make it configurable or state that it needs verification.

---

# 75. URL Architecture

Preferred:

```text
/
/tours
/tours/sundarban-1-day-tour
/tours/sundarban-2-days-1-night
/tours/sundarban-3-days-2-nights
/tours/custom-sundarban-tour

/destinations
/destinations/sundarban
/destinations/gosaba
/destinations/godkhali
/destinations/pakhiralay
/destinations/sajnekhali
/destinations/jharkhali

/things-to-do
/things-to-do/sundarban-safari

/guides
/guides/how-to-reach-sundarban
/guides/best-time-to-visit-sundarban
/guides/sundarban-tour-cost

/articles/[existing-slug]

/contact
/plan-your-trip
```

Existing URLs should be preserved where feasible.

If a URL changes:

```text
301 permanent redirect
```

---

# 76. Homepage Wireframe

```text
┌──────────────────────────────────────────────────────────┐
│ LOGO    Tours  Destinations  Guides  Things To Do       │
│                                      WhatsApp Plan Trip  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                  HERO IMAGE / VIDEO                      │
│                                                          │
│              Sundarban Travel • Tours                   │
│                                                          │
│          Plan Your Sundarban Journey                    │
│                 with Confidence                          │
│                                                          │
│   Practical guides + thoughtful tours + local support   │
│                                                          │
│        [ Explore Tours ]    [ WhatsApp ]                │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Plan Your Trip                                    │   │
│ │ Date | Travellers | Days | Start | Interest      │   │
│ │                          [ Get Tour Options ]     │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│              SUNDARBAN TOUR PACKAGES                     │
│                                                          │
│  [1 Day]   [2D/1N]   [3D/2N]   [Custom]               │
│                                                          │
├──────────────────────────────────────────────────────────┤
│             WHY TRAVELLERS CHOOSE US                    │
│        Guidance | Itineraries | Support | Planning      │
├──────────────────────────────────────────────────────────┤
│                 EXPLORE THE SUNDARBANS                  │
│      [Gosaba] [Godkhali] [Pakhiralay] [Sajnekhali]     │
├──────────────────────────────────────────────────────────┤
│                    THINGS TO DO                          │
│      [Safari] [Boat] [Wildlife] [Village] [Birds]     │
├──────────────────────────────────────────────────────────┤
│                 SUNDARBAN SAFARI                         │
│        IMAGE                         CONTENT            │
├──────────────────────────────────────────────────────────┤
│                 TRAVEL GUIDES                            │
│       [Featured]       [Guide]       [Guide]           │
├──────────────────────────────────────────────────────────┤
│                 LATEST ARTICLES                          │
│       [Article]         [Article]       [Article]        │
├──────────────────────────────────────────────────────────┤
│               TRAVELLER STORIES                         │
├──────────────────────────────────────────────────────────┤
│                        FAQ                               │
├──────────────────────────────────────────────────────────┤
│             READY TO PLAN YOUR TRIP?                    │
│        [ Get a Tour Quote ] [ WhatsApp Us ]             │
├──────────────────────────────────────────────────────────┤
│                         FOOTER                           │
└──────────────────────────────────────────────────────────┘
```

---

# 77. Mobile Wireframe

```text
┌──────────────────────┐
│ Logo    WA      Menu │
├──────────────────────┤
│ Hero                 │
│ Heading              │
│ CTA                  │
│ Plan Trip             │
├──────────────────────┤
│ Popular Tours        │
│ horizontal cards     │
├──────────────────────┤
│ Why Choose Us        │
├──────────────────────┤
│ Destinations         │
├──────────────────────┤
│ Things To Do         │
├──────────────────────┤
│ Safari               │
├──────────────────────┤
│ Guides               │
├──────────────────────┤
│ Articles             │
├──────────────────────┤
│ FAQ                  │
├──────────────────────┤
│ Final CTA            │
├──────────────────────┤
│ Footer               │
├──────────────────────┤
│ WhatsApp | Call |    │
│ Get Quote            │
└──────────────────────┘
```

---

# 78. Component Inventory

## Global

```text
SiteHeader
MobileMenu
StickyMobileCta
SiteFooter
Breadcrumbs
SectionHeader
PageContainer
PrimaryButton
SecondaryButton
```

## Homepage

```text
TravelHero
TripPlannerCard
TourShowcase
WhyChooseUs
DestinationGrid
ThingsToDoGrid
SafariFeature
GuideShowcase
LatestArticles
TravellerStories
FaqSection
FinalCta
```

## Tours

```text
TourCard
TourGrid
TourFilters
TourHero
TourGallery
TourItinerary
TourInclusions
TourExclusions
TourEnquiryCard
RelatedTours
```

## Destinations

```text
DestinationCard
DestinationGrid
DestinationHero
DestinationQuickFacts
NearbyPlaces
RelatedDestinations
```

## Guides

```text
GuideCard
GuideGrid
ArticleHeader
ArticleContent
ArticleSidebar
TableOfContents
RelatedGuides
```

## Conversion

```text
LeadForm
LeadSuccess
WhatsAppButton
PhoneButton
QuoteCta
TripPlannerCard
```

---

# 79. Example Hero Component

```tsx
export function TravelHero() {
  return (
    <section className="relative overflow-hidden rounded-[28px]">
      <img
        src="/images/sundarban-hero.jpg"
        alt="Boat travelling through the Sundarbans mangrove waterways"
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />

      <div className="absolute inset-0 bg-black/35" />

      <div className="relative mx-auto flex min-h-[640px] max-w-6xl items-center px-5 py-24 text-white">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.14em]">
            Sundarban Travel • Tours • Guides
          </p>

          <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
            Plan Your Sundarban Journey with Confidence
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-white/90 md:text-xl">
            Discover mangrove waterways, wildlife, villages and memorable
            boat journeys with practical guides and thoughtfully planned tours.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/tours"
              className="rounded-full bg-white px-6 py-3 font-semibold text-black"
            >
              Explore Sundarban Tours
            </a>

            <a
              href={buildWhatsAppUrl(
                "Hello Sundarban Yatra, I would like help planning a Sundarban trip."
              )}
              className="rounded-full border border-white/70 px-6 py-3 font-semibold"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

# 80. Example Page Metadata

Adapt to the framework used in the existing repository.

```ts
export const metadata = {
  title: "Sundarban Tours & Travel Guide | Sundarban Yatra",
  description:
    "Explore Sundarban tours, travel guides, safari information, destinations and practical trip-planning help.",
  alternates: {
    canonical: "https://example.com/",
  },
  openGraph: {
    title: "Sundarban Yatra",
    description:
      "Plan your Sundarban journey with practical guides and thoughtfully planned tours.",
    images: [
      {
        url: "/images/sundarban-og.jpg",
        width: 1200,
        height: 630,
        alt: "Sundarban Yatra",
      },
    ],
  },
};
```

Do not hardcode the domain if the application already has canonical/site configuration.

---

# 81. Example Breadcrumb Schema

```ts
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Tours",
      item: "/tours",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Sundarban 2 Days / 1 Night Tour",
    },
  ],
};
```

---

# 82. Example FAQ Schema

Only render this when the page visibly contains the same FAQ content.

```ts
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};
```

---

# 83. Search / Discovery

Global search should prioritize:

```text
Tours
Destinations
Guides
Places
Articles
```

Result:

```text
[Type]
Title
Summary
Image

Explore →
```

No flight or hotel inventory search is required.

---

# 84. Conversion Rules

Every important page must provide a natural next step.

| Page | Primary CTA | Secondary CTA |
|---|---|---|
| Homepage | Explore Tours | WhatsApp |
| Tours | View Tour | Get Quote |
| Tour Detail | Get a Quote | WhatsApp |
| Destination | Plan Your Trip | Explore Tours |
| Guide | Plan Your Trip | WhatsApp |
| Article | Get Tour Quote | Related Guide |
| Safari | Explore Safari Tours | WhatsApp |
| Contact | Send Enquiry | Call |
| Plan Trip | Submit Enquiry | WhatsApp |

---

# 85. Performance Acceptance Criteria

Target:

- fast first render on mobile
- minimal layout shift
- optimized images
- lightweight JS
- no unnecessary API calls
- no large blocking third-party scripts

Recommended priorities:

```text
1. Hero image
2. Critical CSS/layout
3. Main content
4. Secondary images
5. Analytics/third-party integrations
```

---

# 86. Testing Strategy

Add tests for:

## API

```text
tour.list
tour.get
destination.list
destination.get
lead.create
lead validation
lead authorization
lead tenant isolation
```

## Website

```text
homepage
tour listing
tour detail
destination page
guide page
article page
lead form
404
metadata
canonical
breadcrumbs
```

## Security

```text
unauthorized lead list
cross-site access
invalid input
mass assignment
spam/rate-limit behavior
```

## SEO

```text
sitemap
robots
metadata
structured data
canonical
published-only indexing
```

---

# 87. CI / Quality

Do not weaken existing CI.

Before merging:

```bash
typecheck
lint
test
build
```

Also validate:

```text
mobile layout
desktop layout
keyboard navigation
lead submission
WhatsApp URL
phone link
sitemap
robots
canonical
structured data
```

---

# 88. Repository Implementation Principle

The existing repository already has a substantial content/editorial architecture.

Therefore:

> **Extend the existing system. Do not replace it.**

Preserve:

- authentication
- roles and permissions
- site/tenant isolation
- editorial workflow
- content sanitization
- media upload
- article system
- SEO infrastructure
- AI security controls
- existing tests
- deployment configuration
- current database architecture where practical

Do not:

- create a second CMS
- create a second authentication system
- bypass publishing workflow
- delete existing data
- weaken security
- duplicate media logic

---

# 89. Existing Content Safety

Before making changes:

1. inspect current routes,
2. inspect current article URLs,
3. inspect database schema/migrations,
4. inspect current admin architecture,
5. inspect SEO utilities,
6. inspect existing content and media,
7. inspect deployment/environment configuration.

Do not silently delete developer content or historical articles.

If old content should eventually be archived, create an explicit migration/content policy rather than destructive deletion.

---

# 90. Centralized Business Configuration

Create one source of truth.

Example:

```ts
export const businessConfig = {
  brandName: "Sundarban Yatra",
  phone: "+91XXXXXXXXXX",
  whatsapp: "91XXXXXXXXXX",
  email: "hello@example.com",
  defaultLocation: "West Bengal, India",
  social: {
    instagram: "",
    facebook: "",
    youtube: "",
  },
};
```

Do not scatter these values throughout the application.

---

# 91. Environment Variables

Example:

```env
NEXT_PUBLIC_SITE_NAME=Sundarban Yatra
NEXT_PUBLIC_SITE_URL=https://example.com
NEXT_PUBLIC_BUSINESS_PHONE=+91XXXXXXXXXX
NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX
NEXT_PUBLIC_BUSINESS_EMAIL=hello@example.com
```

Use server-only environment variables for secrets.

Never expose:

```text
database credentials
service keys
private API keys
admin tokens
```

---

# 92. Phased Implementation

## Phase 1 — Foundation

Implement:

- brand identity
- site navigation
- design tokens
- homepage
- travel-specific content architecture
- centralized contact config
- SEO defaults

## Phase 2 — Travel CMS

Implement:

- tours
- destinations
- places
- itineraries
- FAQs
- admin interfaces

## Phase 3 — Lead Generation

Implement:

- leads schema
- public lead endpoint
- lead form
- WhatsApp
- phone CTA
- attribution
- lead CRM

## Phase 4 — SEO

Implement:

- destination routes
- tour routes
- guide routes
- internal linking
- breadcrumbs
- structured data
- sitemap

## Phase 5 — QA / Performance

Implement:

- mobile refinement
- accessibility
- image optimization
- analytics QA
- security tests
- production verification

---

# 93. Suggested Git Commit Sequence

Use small, reviewable commits.

```text
feat(brand): rebrand public site as Sundarban Yatra

feat(travel): add destinations content model

feat(travel): add tour package model and itinerary support

feat(admin): add travel content management

feat(leads): add lead generation model and API

feat(leads): add public trip enquiry form

feat(leads): add WhatsApp and phone conversion tracking

feat(admin): add lead CRM

feat(seo): add travel metadata and structured content

feat(frontend): build Sundarban homepage

feat(frontend): add tour and destination pages

test(travel): add route and security coverage

perf(frontend): optimize travel images and rendering
```

---

# 94. Definition of Done

The redesign is complete when:

## Brand

- site is visibly branded as Sundarban Yatra
- no unrelated global travel branding remains

## Homepage

- hero
- tours
- trust
- destinations
- activities
- safari
- guides
- articles
- reviews/trust
- FAQ
- final CTA
- footer

## Tours

- listing page
- detail page
- itinerary
- enquiry
- related content

## Destinations

- listing
- detail
- related tours
- related guides
- FAQs

## Guides

- listing
- article detail
- related tours
- related destinations
- CTA

## Leads

- public form
- validation
- rate limiting
- CRM
- statuses
- notes
- assignment
- attribution

## Conversion

- WhatsApp
- phone
- quote CTA
- mobile sticky CTA

## SEO

- metadata
- canonical
- sitemap
- robots
- breadcrumbs
- structured data where appropriate
- internal linking

## Security

- public/private separation
- tenant isolation
- authorization
- input validation
- safe errors
- security tests

## Performance

- optimized images
- mobile-first
- low unnecessary JS
- good loading behavior

---

# 95. Final Design Principle

The final website should feel like:

> **A beautiful, trustworthy local travel publication that helps people understand the Sundarbans and then makes it extremely easy to book the right trip.**

Not:

> A generic travel booking marketplace.

The product loop is:

```text
DISCOVER
   ↓
LEARN
   ↓
EXPLORE
   ↓
CHOOSE A TOUR
   ↓
ASK / WHATSAPP / CALL
   ↓
ENQUIRE
   ↓
BOOK
```

The visual experience should follow the supplied reference's premium editorial feel, while the information architecture, imagery, content and conversion system remain unmistakably **Sundarban Yatra**.

---

# 96. One-Sentence Product Test

For every major design or engineering decision, ask:

> **Does this help someone discover, understand, trust or enquire about a Sundarban trip?**

If not, it probably does not belong in Phase 1.
