-- Relax editorial workflow: allow archive from any status, publish from draft/review,
-- and unpublish (published → draft) for admins/editors.

create or replace function public.enforce_post_workflow()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status <> old.status then
    if not (
      (old.status = 'draft' and new.status in ('review', 'published', 'archived')) or
      (old.status = 'review' and new.status in ('draft', 'published', 'archived')) or
      (old.status = 'published' and new.status in ('draft', 'archived')) or
      (old.status = 'archived' and new.status = 'draft')
    ) then
      raise exception 'Invalid editorial workflow transition from % to %', old.status, new.status;
    end if;

    if new.status = 'review' then
      new.submitted_at = now();
    elsif new.status = 'published' then
      new.published_at = coalesce(new.published_at, now());
    elsif new.status = 'archived' then
      new.archived_at = now();
    end if;
  end if;
  return new;
end;
$$;

comment on function public.enforce_post_workflow() is 'Relaxed workflow: draft↔review↔published↔archived with full flexibility for admins/editors.';
