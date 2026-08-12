-- The first publication moment is historical record, not editable editorial metadata.
create or replace function public.prevent_published_at_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.published_at is not null and new.published_at is distinct from old.published_at then
    raise exception 'published_at is immutable after first publication';
  end if;
  return new;
end;
$$;

drop trigger if exists posts_prevent_published_at_mutation on public.posts;
create trigger posts_prevent_published_at_mutation
before update on public.posts
for each row execute procedure public.prevent_published_at_mutation();

comment on function public.prevent_published_at_mutation() is 'Prevents modification of a post first-published timestamp after it has been set.';
