-- Legal copy is a configurable publication template, not jurisdiction-specific legal advice.
alter table public.site_pages alter column author_id drop not null;

insert into public.site_pages (
  organization_id, site_id, author_id, page_type, title, slug, content_json, rendered_html, meta_title, meta_description, status, published_at
)
select
  s.organization_id,
  s.id,
  null,
  'privacy',
  'Privacy policy',
  'privacy',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Your privacy matters"}]},{"type":"paragraph","content":[{"type":"text","text":"This publication collects information you choose to provide, such as subscription and comment details, to operate the service and communicate with you. Review and replace this template with privacy terms appropriate to your organization and jurisdiction before relying on it."}]}]}'::jsonb,
  '<h2>Your privacy matters</h2><p>This publication collects information you choose to provide, such as subscription and comment details, to operate the service and communicate with you. Review and replace this template with privacy terms appropriate to your organization and jurisdiction before relying on it.</p>',
  'Privacy policy',
  'How this publication handles information you choose to provide.',
  'published',
  now()
from public.sites s
on conflict (site_id, page_type) do nothing;
