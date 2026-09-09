-- Leads enrichment: the public /hire form captures phone-first trip details
-- (phone, travel date, travellers, target tour) rather than an email, so the
-- pipeline needs structured columns and a nullable email instead of a text blob.

alter table public.leads
  add column if not exists phone text,
  add column if not exists travel_date text,
  add column if not exists travellers text,
  add column if not exists tour_slug text;

-- The enquiry form collects phone + WhatsApp number; email is optional and
-- international travellers may omit it, so relax the previous not-null rule.
alter table public.leads
  alter column email drop not null;

-- Help the pipeline view order and filter by status quickly.
create index if not exists leads_site_status_idx
  on public.leads(site_id, status, created_at desc);
