-- Allow code-copy engagement events (ArticleView tracks .gravity-code copy clicks).

alter table public.analytics_events drop constraint if exists analytics_events_event_type_check;

alter table public.analytics_events add constraint analytics_events_event_type_check
  check (event_type = any (array[
    'page_view'::text,
    'article_view'::text,
    'scroll_depth'::text,
    'reading_complete'::text,
    'code_copy'::text,
    'comment_submitted'::text,
    'subscription_created'::text
  ]));
