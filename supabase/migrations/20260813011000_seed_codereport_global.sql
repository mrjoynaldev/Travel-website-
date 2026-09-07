-- Sundarban Yatra site identity, travel taxonomy, homepage sections,
-- and legal-page content. Legal copy is a configurable editorial template,
-- not jurisdiction-specific legal advice.

with canonical as (
  select id, organization_id from public.sites where status = 'active' order by created_at asc limit 1
)

-- 1. Canonical site identity -----------------------------------------------
update public.sites
set name = 'Sundarban Yatra',
    slug = 'sundarban-yatra',
    description = 'Your trusted guide to planning a Sundarban journey — tours, safari, destinations and practical travel guides.'
where id = (select id from canonical);

-- Pause duplicate/test sites so only the canonical publication is served.
with canonical as (
  select id from public.sites where status = 'active' order by created_at asc limit 1
)
update public.sites
set status = 'paused'
where status = 'active'
  and id <> (select id from canonical);

-- 2. Site settings (brand, navigation, footer, contact, SEO) ---------------
with canonical as (
  select id, organization_id from public.sites where status = 'active' order by created_at asc limit 1
)
insert into public.site_settings (
  organization_id, site_id, navigation, default_locale, timezone,
  seo_defaults, feature_flags, brand, footer_links, contact
)
select
  c.organization_id, c.id,
  '[{"label":"Tours","path":"/#tours"},{"label":"Destinations","path":"/#destinations"},{"label":"Travel Guides","path":"/#guides"},{"label":"Things To Do","path":"/#things-to-do"},{"label":"Safari","path":"/#safari"},{"label":"About","path":"/#about"}]'::jsonb,
  'en', 'Asia/Kolkata',
  '{"metaDescription":"Sundarban tours, safari, destinations and practical trip-planning guides."}'::jsonb,
  '{"sectionsEnabled":true,"commentsEnabled":true}'::jsonb,
  '{"tagline":"Explore. Experience. Understand the Sundarbans.","logoUrl":"/logo.png","logoAlt":"Sundarban Yatra logo","faviconUrl":"/favicon.png","defaultOgImageUrl":"/og-default.png","primaryColor":"#185c43","accentColor":"#d59b43"}'::jsonb,
  '[{"label":"About","path":"/about"},{"label":"Privacy policy","path":"/privacy"},{"label":"Terms of use","path":"/terms"},{"label":"Contact","path":"/contact"}]'::jsonb,
  '{"name":"Sundarban Yatra editorial","email":"hello@sundarbanyatra.in","phone":"+919876543210","whatsapp":"919876543210"}'::jsonb
from canonical c
on conflict (site_id) do update set
  navigation = excluded.navigation,
  seo_defaults = excluded.seo_defaults,
  feature_flags = excluded.feature_flags,
  brand = excluded.brand,
  footer_links = excluded.footer_links,
  contact = excluded.contact;

-- 3. Sundarban travel taxonomy ------------------------------------------------
with canonical as (
  select id, organization_id from public.sites where status = 'active' order by created_at asc limit 1
)
insert into public.categories (organization_id, site_id, name, slug, description)
select c.organization_id, c.id, v.name, v.slug, v.description
from (values
  ('Safari', 'safari', 'Boat safaris, permits, watchtowers and honest wildlife odds.'),
  ('How to Reach', 'how-to-reach', 'Routes from Kolkata, meeting points, transfers and timings.'),
  ('Best Time', 'best-time', 'Seasons, weather and crowds, month by month.'),
  ('Tour Cost', 'cost', 'What drives quotes, inclusions and honest pricing.'),
  ('Itineraries', 'itinerary', '1-day, 2-day and 3-day plans that respect travel times.'),
  ('Places to Visit', 'places', 'Destinations, villages, watchtowers and stays.')
) as v(name, slug, description)
cross join canonical c
on conflict (site_id, slug) do nothing;

with canonical as (
  select id, organization_id from public.sites where status = 'active' order by created_at asc limit 1
)
insert into public.tags (organization_id, site_id, name, slug)
select c.organization_id, c.id, v.name, v.slug
from (values
  ('Sundarban', 'sundarban'), ('Safari', 'safari'), ('Boat safari', 'boat-safari'),
  ('Birdwatching', 'birdwatching'), ('Gosaba', 'gosaba'), ('Godkhali', 'godkhali'),
  ('Pakhiralay', 'pakhiralay'), ('Sajnekhali', 'sajnekhali'), ('Dobanki', 'dobanki'),
  ('Jharkhali', 'jharkhali'), ('Kolkata', 'kolkata'), ('Family trip', 'family-trip'),
  ('Photography', 'photography'), ('Winter', 'winter'), ('Monsoon', 'monsoon'),
  ('Honeymoon', 'honeymoon')
) as v(name, slug)
cross join canonical c
on conflict (site_id, slug) do nothing;

-- 4. Homepage sections (seeded once per site) ------------------------------
with canonical as (
  select id, organization_id from public.sites where status = 'active' order by created_at asc limit 1
)
insert into public.site_sections (organization_id, site_id, title, section_type, category_id, tag_id, subtitle, sort_order, is_visible)
select
  c.organization_id, c.id, s.title, s.section_type, cat.id, null, s.subtitle, s.sort_order, true
from (values
  ('Latest guides', 'latest', NULL, 'The newest Sundarban travel guides.', 0),
  ('Safari guides', 'category', 'safari', 'Permits, towers and honest odds.', 1),
  ('How to reach', 'category', 'how-to-reach', 'Routes, meeting points and timings.', 2),
  ('Costs & itineraries', 'category', 'cost', 'Honest pricing and day-wise plans.', 3),
  ('Places to visit', 'category', 'places', 'Destinations worth your time.', 4)
) as s(title, section_type, category_slug, subtitle, sort_order)
cross join canonical c
left join public.categories cat on cat.site_id = c.id and cat.slug = s.category_slug
where not exists (select 1 from public.site_sections where site_id = c.id);

-- 5. Legal & about pages ----------------------------------------------------
with canonical as (
  select id from public.sites where status = 'active' order by created_at asc limit 1
)
update public.site_pages
set title = 'Privacy policy',
    rendered_html = '<h2>Your privacy matters</h2><p>Sundarban Yatra is a travel publication and tour-planning guide for the Sundarbans. This policy explains what we collect, why we collect it, and the choices you have. We keep things simple and collect only what we need.</p><h3>Information we collect</h3><p><strong>You provide it.</strong> When you subscribe to our newsletter, submit a comment, or contact us, we store the details you give us: typically your email address, display name, and the content of your message.</p><p><strong>We collect it automatically.</strong> We may record anonymous usage signals such as page views, reading progress, and referral sources to understand what is useful to readers. These are aggregated and do not identify you personally.</p><h3>How we use your information</h3><ul><li>To deliver the newsletter and other content you request.</li><li>To moderate comments and keep the conversation respectful.</li><li>To measure readership and improve the publication.</li><li>To respond to enquiries.</li></ul><p>We do not sell your personal information, and we do not use your data to build advertising profiles.</p><h3>Cookies and local storage</h3><p>We use a minimal amount of browser storage to remember preferences, maintain your session, and attribute anonymous analytics events. No third-party advertising trackers are used.</p><h3>Analytics</h3><p>Anonymous analytics events (page views, scroll depth, reading completion) are collected to help us understand what readers value. You are never personally identified in these reports.</p><h3>Third parties</h3><p>We rely on hosted providers for infrastructure, database, authentication, email delivery, and analytics. Each provider processes data under its own terms and only for the purposes of operating this publication.</p><h3>Data retention</h3><p>We retain subscription and comment records for as long as they are needed to provide the service. You may request deletion of your data at any time.</p><h3>Your rights</h3><p>Depending on your jurisdiction, you may have the right to access, correct, export, or delete your personal information, and to object to or restrict certain processing. Contact us and we will respond within a reasonable time.</p><h3>Children</h3><p>This publication is intended for a general audience and does not knowingly collect information from children.</p><h3>Changes to this policy</h3><p>We may update this policy as the service evolves. Material changes will be noted on this page, and continued use of the publication after changes are posted constitutes acceptance of the revised policy.</p><h3>Contact</h3><p>Questions about this policy? Reach out through the contact page and we will be glad to help.</p>',
    meta_title = 'Privacy policy',
    meta_description = 'How Sundarban Yatra collects, uses, and protects your information.'
where site_id = (select id from canonical) and page_type = 'privacy';

with canonical as (
  select id from public.sites where status = 'active' order by created_at asc limit 1
)
update public.site_pages
set title = 'Terms of use',
    rendered_html = '<h2>Using Sundarban Yatra</h2><p>These terms govern your use of the Sundarban Yatra publication. By accessing the site you agree to them.</p><h3>Content</h3><p>Articles are provided for general information and commentary. We strive for accuracy but do not warrant that content is error-free or suitable for your specific situation. Nothing here is professional, legal, financial, or investment advice.</p><h3>Comments</h3><p>Comments are moderated. We may remove content that is abusive, spammy, unlawful, or off-topic, and we may suspend accounts that repeatedly violate these rules.</p><h3>Intellectual property</h3><p>Original articles are our work or our contributors'' work. You may share excerpts with attribution. Do not republish full articles without permission.</p><h3>Third-party links</h3><p>Articles may link to external websites. We are not responsible for their content or practices.</p><h3>Limitation of liability</h3><p>To the fullest extent permitted by law, Sundarban Yatra is not liable for any indirect, incidental, or consequential damages arising from your use of the site.</p><h3>Changes</h3><p>We may update these terms from time to time. Continued use after changes constitutes acceptance.</p><h3>Contact</h3><p>Questions about these terms? Use the contact page.</p>',
    meta_title = 'Terms of use',
    meta_description = 'The terms that govern use of the Sundarban Yatra publication.'
where site_id = (select id from canonical) and page_type = 'terms';

with canonical as (
  select id from public.sites where status = 'active' order by created_at asc limit 1
)
update public.site_pages
set title = 'Contact',
    rendered_html = '<h2>Get in touch</h2><p>Planning a trip, or spotted something to correct in a guide? The fastest way to reach us is a call or WhatsApp message during working hours (Mon–Sat, 9am–7pm IST).</p><h3>Trip enquiries</h3><p>Share your travel dates, group size and starting city — we reply with suitable tour options and a clear written quote.</p><h3>Corrections</h3><p>Guide corrections should mention the page and what changed, with a source where possible.</p><p>International travellers can also use the enquiry form and we reply by email.</p>',
    meta_title = 'Contact',
    meta_description = 'Contact the Sundarban Yatra team — call, WhatsApp or enquiry form.'
where site_id = (select id from canonical) and page_type = 'contact';

with canonical as (
  select id, organization_id from public.sites where status = 'active' order by created_at asc limit 1
)
insert into public.site_pages (organization_id, site_id, author_id, page_type, title, slug, content_json, rendered_html, meta_title, meta_description, status, published_at)
select
  c.organization_id, c.id, null, 'custom', 'About Sundarban Yatra', 'about',
  '{"type":"doc","content":[]}'::jsonb,
  '<h2>Who we are</h2><p>Sundarban Yatra is a travel publication and tour-planning guide dedicated to the Sundarbans — its mangrove waterways, wildlife, villages and boat journeys.</p><p>We write for travellers planning a real trip: Indian families, couples, photographers and international visitors. Our coverage is practical and honest, and we never invent sightings, prices or reviews.</p><h3>What you will find here</h3><ul><li><strong>Tours</strong> — 1-day, overnight and custom itineraries with clear inclusions.</li><li><strong>Destinations</strong> — Gosaba, Godkhali, Pakhiralay, Sajnekhali, Jharkhali and more.</li><li><strong>Safari</strong> — permits, watchtowers and honest wildlife odds.</li><li><strong>Travel guides</strong> — routes, costs, seasons and itineraries.</li></ul><h3>How we work</h3><p>Every guide passes through an editorial review before publication. Corrections are handled transparently, and we link to primary sources wherever possible.</p><p>Planning a trip? Call or WhatsApp us — or use the enquiry form.</p>',
  'About Sundarban Yatra',
  'What Sundarban Yatra is and how we cover the Sundarbans.',
  'published', now()
from canonical c
on conflict (site_id, page_type) do nothing;
