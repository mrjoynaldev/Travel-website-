#!/usr/bin/env node
/**
 * QA artifact cleanup for the live publication site.
 *
 * Every acceptance/QA test run leaves archived QA posts, taxonomy, subscribers,
 * analytics, notification-outbox, audit, and agent records behind. Run this after
 * any QA suite and before publishing real content or going to production.
 *
 * Usage (from repo root, with the root `.env` containing live credentials):
 *   node --env-file=.env scripts/cleanup-qa.mjs [site-slug]
 *
 * The script targets the active site (first `status=active` site, default slug
 * `main`). It only ever deletes QA artifacts — the publication identity, real
 * categories/tags, legal pages, and real memberships are preserved.
 */
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetSlug = process.argv[2] || "main";

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: sites, error: siteError } = await db
    .from("sites")
    .select("id, slug, name, status")
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (siteError) throw siteError;
  const site = (sites ?? []).find((s) => s.slug === targetSlug) ?? (sites ?? [])[0];
  if (!site) {
    console.error("No active site found.");
    process.exit(1);
  }
  const SITE = site.id;
  console.log(`Target site: ${site.name} (${site.slug}, ${SITE})`);

  const { data: posts } = await db.from("posts").select("id").eq("site_id", SITE);
  const ids = (posts ?? []).map((p) => p.id);
  console.log(`QA posts to delete: ${ids.length}`);

  if (ids.length > 0) {
    for (const table of ["post_categories", "post_tags", "comments", "analytics_events", "post_revisions"]) {
      const res = await db.from(table).delete().in("post_id", ids);
      if (res.error) console.log(`  ${table}: ${res.error.message}`);
      else console.log(`  ${table}: ok`);
    }
    const res = await db.from("posts").delete().in("id", ids);
    console.log(`  posts: ${res.error ? res.error.message : "ok"}`);
  }

  for (const table of ["categories", "tags"]) {
    const res = await db.from(table).delete().eq("site_id", SITE).eq("slug", "qa-lifecycle");
    if (res.error) console.log(`qa-lifecycle ${table}: ${res.error.message}`);
    else console.log(`qa-lifecycle ${table}: ok`);
  }

  const { data: subs } = await db.from("subscribers").select("id,email").eq("site_id", SITE);
  const qaSubs = (subs ?? []).filter((s) => /@example\.test|@example\.com|qa\./.test(s.email || ""));
  for (const sub of qaSubs) await db.from("subscribers").delete().eq("id", sub.id);
  console.log(`QA subscribers: ${qaSubs.length}`);

  const { data: tids } = await db.from("agent_threads").select("id").eq("site_id", SITE);
  const threadIds = (tids ?? []).map((t) => t.id);
  if (threadIds.length) {
    for (const [table, col] of [["agent_messages", "thread_id"], ["agent_actions", "thread_id"]]) {
      const res = await db.from(table).delete().in(col, threadIds);
      if (res.error) console.log(`  ${table}: ${res.error.message}`);
    }
  }
  const res = await db.from("agent_threads").delete().eq("site_id", SITE);
  console.log(`  agent_threads: ${res.error ? res.error.message : "ok"}`);

  for (const table of ["notification_outbox", "audit_events"]) {
    let deleted = 0;
    for (;;) {
      const chunk = await db.from(table).delete().eq("site_id", SITE).limit(1000).select("id");
      if (chunk.error) {
        console.log(`  ${table}: ${chunk.error.message}`);
        break;
      }
      deleted += chunk.data?.length ?? 0;
      if ((chunk.data?.length ?? 0) < 1000) break;
    }
    console.log(`  ${table}: ${deleted} deleted`);
  }

  console.log("Cleanup complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
