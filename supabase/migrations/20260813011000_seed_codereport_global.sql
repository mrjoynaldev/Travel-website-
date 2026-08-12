-- CodeReport Global site identity, developer-AI taxonomy, homepage sections,
-- and legal-page content. Legal copy is a configurable editorial template,
-- not jurisdiction-specific legal advice.

with canonical as (
  select id, organization_id from public.sites where status = 'active' order by created_at asc limit 1
)

-- 1. Canonical site identity -----------------------------------------------
update public.sites
set name = 'CodeReport Global',
    slug = 'codereport-global',
    description = 'Developer-first AI news, analysis, and practical guides for people who build and ship software.'
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
  '[{"label":"Latest","path":"/"},{"label":"AI News","path":"/topics/ai-news"},{"label":"Guides","path":"/topics/guides"},{"label":"Tools","path":"/topics/tools-apps"},{"label":"Archive","path":"/archive"},{"label":"About","path":"/about"}]'::jsonb,
  'en', 'UTC',
  '{"metaDescription":"Developer-first AI news, analysis, and practical guides."}'::jsonb,
  '{"sectionsEnabled":true,"commentsEnabled":true}'::jsonb,
  '{"tagline":"Developer-first AI news, analysis, and practical guides.","logoUrl":"/logo.png","logoAlt":"CodeReport Global logo","faviconUrl":"/favicon.png","defaultOgImageUrl":"/logo.png","primaryColor":"#1b563f","accentColor":"#e4a741"}'::jsonb,
  '[{"label":"About","path":"/about"},{"label":"Privacy policy","path":"/privacy"},{"label":"Terms of use","path":"/terms"},{"label":"Contact","path":"/contact"}]'::jsonb,
  '{"name":"CodeReport Global editorial"}'::jsonb
from canonical c
on conflict (site_id) do update set
  navigation = excluded.navigation,
  seo_defaults = excluded.seo_defaults,
  feature_flags = excluded.feature_flags,
  brand = excluded.brand,
  footer_links = excluded.footer_links,
  contact = excluded.contact;

-- 3. Developer-AI taxonomy --------------------------------------------------
with canonical as (
  select id, organization_id from public.sites where status = 'active' order by created_at asc limit 1
)
insert into public.categories (organization_id, site_id, name, slug, description)
select c.organization_id, c.id, v.name, v.slug, v.description
from (values
  ('AI News', 'ai-news', 'The latest announcements, launches, and product moves across the AI landscape.'),
  ('Machine Learning', 'machine-learning', 'Concepts, techniques, and the state of the art in machine learning.'),
  ('Tools & Apps', 'tools-apps', 'Hands-on looks at AI-powered developer tools and applications.'),
  ('Research', 'research', 'Papers, benchmarks, and findings worth your attention.'),
  ('Guides', 'guides', 'Step-by-step tutorials and practical walkthroughs for builders.'),
  ('Industry', 'industry', 'Funding, business strategy, and the companies shaping AI.'),
  ('Opinion', 'opinion', 'Analysis and perspective from builders and practitioners.'),
  ('Coding', 'coding', 'AI-assisted development, prompt engineering, and engineering practice.')
) as v(name, slug, description)
cross join canonical c
on conflict (site_id, slug) do nothing;

with canonical as (
  select id, organization_id from public.sites where status = 'active' order by created_at asc limit 1
)
insert into public.tags (organization_id, site_id, name, slug)
select c.organization_id, c.id, v.name, v.slug
from (values
  ('OpenAI', 'openai'), ('ChatGPT', 'chatgpt'), ('Claude', 'claude'), ('Gemini', 'gemini'),
  ('LLM', 'llm'), ('AI agents', 'ai-agents'), ('Machine Learning', 'machine-learning'),
  ('Deep Learning', 'deep-learning'), ('Python', 'python'), ('TypeScript', 'typescript'),
  ('Developer tools', 'developer-tools'), ('Automation', 'automation'),
  ('Generative AI', 'generative-ai'), ('Prompt engineering', 'prompt-engineering'),
  ('Ethics', 'ethics'), ('Robotics', 'robotics')
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
  ('Latest headlines', 'latest', NULL, 'The newest stories across the developer AI beat.', 0),
  ('AI News', 'category', 'ai-news', 'Announcements, launches, and the big moves.', 1),
  ('Tools & Apps', 'category', 'tools-apps', 'What to actually try this week.', 2),
  ('Guides & Tutorials', 'category', 'guides', 'Practical walkthroughs for builders.', 3),
  ('From the research desk', 'category', 'research', 'Papers and benchmarks worth your attention.', 4)
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
    rendered_html = '<h2>Your privacy matters</h2><p>CodeReport Global is a developer-focused publication about artificial intelligence. This policy explains what we collect, why we collect it, and the choices you have. We keep things simple and collect only what we need.</p><h3>Information we collect</h3><p><strong>You provide it.</strong> When you subscribe to our newsletter, submit a comment, or contact us, we store the details you give us: typically your email address, display name, and the content of your message.</p><p><strong>We collect it automatically.</strong> We may record anonymous usage signals such as page views, reading progress, and referral sources to understand what is useful to readers. These are aggregated and do not identify you personally.</p><h3>How we use your information</h3><ul><li>To deliver the newsletter and other content you request.</li><li>To moderate comments and keep the conversation respectful.</li><li>To measure readership and improve the publication.</li><li>To respond to enquiries.</li></ul><p>We do not sell your personal information, and we do not use your data to build advertising profiles.</p><h3>Cookies and local storage</h3><p>We use a minimal amount of browser storage to remember preferences, maintain your session, and attribute anonymous analytics events. No third-party advertising trackers are used.</p><h3>Analytics</h3><p>Anonymous analytics events (page views, scroll depth, reading completion) are collected to help us understand what readers value. You are never personally identified in these reports.</p><h3>Third parties</h3><p>We rely on hosted providers for infrastructure, database, authentication, email delivery, and analytics. Each provider processes data under its own terms and only for the purposes of operating this publication.</p><h3>Data retention</h3><p>We retain subscription and comment records for as long as they are needed to provide the service. You may request deletion of your data at any time.</p><h3>Your rights</h3><p>Depending on your jurisdiction, you may have the right to access, correct, export, or delete your personal information, and to object to or restrict certain processing. Contact us and we will respond within a reasonable time.</p><h3>Children</h3><p>This publication is intended for a general audience and does not knowingly collect information from children.</p><h3>Changes to this policy</h3><p>We may update this policy as the service evolves. Material changes will be noted on this page, and continued use of the publication after changes are posted constitutes acceptance of the revised policy.</p><h3>Contact</h3><p>Questions about this policy? Reach out through the contact page and we will be glad to help.</p>',
    meta_title = 'Privacy policy',
    meta_description = 'How CodeReport Global collects, uses, and protects your information.'
where site_id = (select id from canonical) and page_type = 'privacy';

with canonical as (
  select id from public.sites where status = 'active' order by created_at asc limit 1
)
update public.site_pages
set title = 'Terms of use',
    rendered_html = '<h2>Using CodeReport Global</h2><p>These terms govern your use of the CodeReport Global publication. By accessing the site you agree to them.</p><h3>Content</h3><p>Articles are provided for general information and commentary. We strive for accuracy but do not warrant that content is error-free or suitable for your specific situation. Nothing here is professional, legal, financial, or investment advice.</p><h3>Comments</h3><p>Comments are moderated. We may remove content that is abusive, spammy, unlawful, or off-topic, and we may suspend accounts that repeatedly violate these rules.</p><h3>Intellectual property</h3><p>Original articles are our work or our contributors'' work. You may share excerpts with attribution. Do not republish full articles without permission.</p><h3>Third-party links</h3><p>Articles may link to external websites. We are not responsible for their content or practices.</p><h3>Limitation of liability</h3><p>To the fullest extent permitted by law, CodeReport Global is not liable for any indirect, incidental, or consequential damages arising from your use of the site.</p><h3>Changes</h3><p>We may update these terms from time to time. Continued use after changes constitutes acceptance.</p><h3>Contact</h3><p>Questions about these terms? Use the contact page.</p>',
    meta_title = 'Terms of use',
    meta_description = 'The terms that govern use of the CodeReport Global publication.'
where site_id = (select id from canonical) and page_type = 'terms';

with canonical as (
  select id from public.sites where status = 'active' order by created_at asc limit 1
)
update public.site_pages
set title = 'Contact',
    rendered_html = '<h2>Get in touch</h2><p>Have a tip, a correction, a partnership idea, or a question about the publication? We would love to hear from you.</p><h3>Editorial</h3><p>Story ideas and corrections should come with sources where possible.</p><h3>Press and partnerships</h3><p>For product launches, research, and sponsorship enquiries, include context about your company and the opportunity.</p><p>Use the contact information configured by this publication to reach the team.</p>',
    meta_title = 'Contact',
    meta_description = 'Contact the CodeReport Global editorial team.'
where site_id = (select id from canonical) and page_type = 'contact';

with canonical as (
  select id, organization_id from public.sites where status = 'active' order by created_at asc limit 1
)
insert into public.site_pages (organization_id, site_id, author_id, page_type, title, slug, content_json, rendered_html, meta_title, meta_description, status, published_at)
select
  c.organization_id, c.id, null, 'custom', 'About CodeReport Global', 'about',
  '{"type":"doc","content":[]}'::jsonb,
  '<h2>Who we are</h2><p>CodeReport Global is a developer-first publication covering artificial intelligence: the news, the tools, the research, and the practical craft of building with AI.</p><p>We write for engineers, founders, and curious practitioners. Our coverage is structured and source-driven, and we keep a healthy skepticism about hype.</p><h3>What you will find here</h3><ul><li><strong>AI News</strong> — announcements and launches, filtered for signal.</li><li><strong>Guides</strong> — step-by-step tutorials for builders.</li><li><strong>Tools &amp; Apps</strong> — what is worth trying this week.</li><li><strong>Research</strong> — papers and benchmarks, translated for engineers.</li><li><strong>Opinion</strong> — perspective from people doing the work.</li></ul><h3>How we work</h3><p>Every article passes through an editorial review before publication. Corrections are handled transparently, and we link to primary sources wherever possible.</p><p>Questions or tips? Head to the contact page.</p>',
  'About CodeReport Global',
  'What CodeReport Global is and how we cover the AI landscape.',
  'published', now()
from canonical c
on conflict (site_id, page_type) do nothing;
