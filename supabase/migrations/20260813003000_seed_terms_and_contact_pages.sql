-- These are configurable editorial templates, not jurisdiction-specific legal advice.
insert into public.site_pages (
  organization_id, site_id, author_id, page_type, title, slug, content_json, rendered_html, meta_title, meta_description, status, published_at
)
select
  s.organization_id,
  s.id,
  null,
  'terms',
  'Terms of use',
  'terms',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Using this publication"}]},{"type":"paragraph","content":[{"type":"text","text":"This is a configurable terms-of-use template. Before relying on it, review and replace it with terms appropriate to your organization, audience, and jurisdiction."}]}]}'::jsonb,
  '<h2>Using this publication</h2><p>This is a configurable terms-of-use template. Before relying on it, review and replace it with terms appropriate to your organization, audience, and jurisdiction.</p>',
  'Terms of use',
  'The terms that govern use of this publication.',
  'published',
  now()
from public.sites s
on conflict (site_id, page_type) do nothing;

insert into public.site_pages (
  organization_id, site_id, author_id, page_type, title, slug, content_json, rendered_html, meta_title, meta_description, status, published_at
)
select
  s.organization_id,
  s.id,
  null,
  'contact',
  'Contact',
  'contact',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Get in touch"}]},{"type":"paragraph","content":[{"type":"text","text":"Use the contact information configured by this publication to send an editorial, partnership, or general inquiry."}]}]}'::jsonb,
  '<h2>Get in touch</h2><p>Use the contact information configured by this publication to send an editorial, partnership, or general inquiry.</p>',
  'Contact',
  'Contact this publication.',
  'published',
  now()
from public.sites s
on conflict (site_id, page_type) do nothing;
