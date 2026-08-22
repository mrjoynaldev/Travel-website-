import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { assertRole, getActor, recordAudit } from "../blog";
import { getSupabase } from "../supabase";
import { protectedProcedure, router } from "../_core/trpc";

const CHANNELS = ["devto", "bluesky", "mastodon"] as const;
export const MAX_DAILY_POSTS = 3;

type Actor = Awaited<ReturnType<typeof getActor>>;

async function actorFor(ctx: any) {
  return getActor({ openId: ctx.user.openId, name: ctx.user.name, email: ctx.user.email });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `${name} is not configured on the server yet.` });
  return value;
}

const BROWSER_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36";

async function postedCountToday(siteId: string): Promise<number> {
  const midnight = new Date();
  midnight.setUTCHours(0, 0, 0, 0);
  const { count, error } = await getSupabase()
    .from("distribution_queue")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("status", "posted")
    .gte("posted_at", midnight.toISOString());
  if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not check the daily distribution cap." });
  return count ?? 0;
}

async function postDevto(bodyMarkdown: string): Promise<string> {
  const apiKey = requireEnv("DEVTO_API_KEY");
  const response = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", "User-Agent": BROWSER_UA },
    body: JSON.stringify({ article: { body_markdown: bodyMarkdown } }),
  });
  const data = (await response.json().catch(() => ({}))) as any;
  if (!response.ok) throw new TRPCError({ code: "BAD_GATEWAY", message: `dev.to rejected the post (${response.status}): ${data?.error ?? "unknown error"}` });
  return data.url as string;
}

async function flipDevtoDraft(articleId: string): Promise<string> {
  const apiKey = requireEnv("DEVTO_API_KEY");
  const response = await fetch(`https://dev.to/api/articles/${articleId}`, {
    method: "PUT",
    headers: { "api-key": apiKey, "Content-Type": "application/json", "User-Agent": BROWSER_UA },
    body: JSON.stringify({ article: { published: true } }),
  });
  const data = (await response.json().catch(() => ({}))) as any;
  if (!response.ok) throw new TRPCError({ code: "BAD_GATEWAY", message: `dev.to refused to publish draft ${articleId} (${response.status})` });
  return data.url as string;
}

async function postBluesky(text: string): Promise<string> {
  const handle = requireEnv("BLUESKY_HANDLE");
  const password = requireEnv("BLUESKY_APP_PASSWORD");
  const sessionResponse = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: handle, password }),
  });
  const session = (await sessionResponse.json().catch(() => ({}))) as any;
  if (!sessionResponse.ok || !session.accessJwt) throw new TRPCError({ code: "BAD_GATEWAY", message: `Bluesky login failed (${sessionResponse.status}).` });
  const postResponse = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessJwt}` },
    body: JSON.stringify({
      repo: session.did,
      collection: "app.bsky.feed.post",
      record: { $type: "app.bsky.feed.post", text, createdAt: new Date().toISOString() },
    }),
  });
  const record = (await postResponse.json().catch(() => ({}))) as any;
  if (!postResponse.ok || !record.uri) throw new TRPCError({ code: "BAD_GATEWAY", message: `Bluesky post failed (${postResponse.status}).` });
  const [did, , rkey] = record.uri.replace("at://", "").split("/");
  return `https://bsky.app/profile/${session.handle ?? did}/post/${rkey}`;
}

async function postMastodon(text: string): Promise<string> {
  const instance = (process.env.MASTODON_INSTANCE || "mastodon.social").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const token = requireEnv("MASTODON_TOKEN");
  const response = await fetch(`https://${instance}/api/v1/statuses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: text.slice(0, 500), visibility: "public" }),
  });
  const data = (await response.json().catch(() => ({}))) as any;
  if (!response.ok || !data.url) throw new TRPCError({ code: "BAD_GATEWAY", message: `Mastodon post failed (${response.status}).` });
  return data.url as string;
}

async function dispatch(row: any): Promise<{ url?: string }> {
  if (row.channel === "devto") {
    const bodyMarkdown = row.payload?.bodyMarkdown;
    if (!bodyMarkdown) throw new Error("devto payload is missing bodyMarkdown");
    return { url: await postDevto(String(bodyMarkdown)) };
  }
  if (row.channel === "bluesky") {
    const text = row.payload?.text;
    if (!text) throw new Error("bluesky payload is missing text");
    return { url: await postBluesky(String(text)) };
  }
  if (row.channel === "mastodon") {
    const text = row.payload?.text;
    if (!text) throw new Error("mastodon payload is missing text");
    return { url: await postMastodon(String(text)) };
  }
  throw new Error(`Unknown channel ${row.channel}`);
}

export const distributionRouter = router({
  enqueue: protectedProcedure
    .input(z.object({
      slug: z.string().trim().min(1).max(200),
      items: z.array(z.object({
        channel: z.enum(CHANNELS),
        payload: z.record(z.string(), z.any()).default({}),
      })).min(1).max(10),
      postId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin", "editor"]);
      const db = getSupabase();
      const rows = input.items.map(item => ({
        organization_id: actor.organizationId,
        site_id: actor.siteId,
        post_id: input.postId ?? null,
        slug: input.slug,
        channel: item.channel,
        payload: item.payload,
        status: "pending",
      }));
      const { data, error } = await db.from("distribution_queue").upsert(rows, { onConflict: "site_id,slug,channel" }).select("id, slug, channel, status");
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: "Could not enqueue the distribution items." });
      await recordAudit(actor, "distribution.enqueued", "post", input.slug, { channels: input.items.map(i => i.channel) });
      return data ?? [];
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const actor = await actorFor(ctx);
    assertRole(actor, ["admin", "editor"]);
    const { data, error } = await getSupabase()
      .from("distribution_queue")
      .select("*")
      .eq("site_id", actor.siteId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load the distribution queue." });
    return { items: data ?? [], postedToday: await postedCountToday(actor.siteId), dailyCap: MAX_DAILY_POSTS };
  }),

  approve: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin", "editor"]);
      const db = getSupabase();
      const { data: row } = await db.from("distribution_queue").select("*").eq("id", input.id).eq("site_id", actor.siteId).maybeSingle();
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Queue item not found." });
      if (row.status === "posted") return row;
      const postedToday = await postedCountToday(actor.siteId);
      if (postedToday >= MAX_DAILY_POSTS) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Daily cap reached: ${postedToday}/${MAX_DAILY_POSTS} posts already sent today. The cap resets at 00:00 UTC.` });
      }
      await db.from("distribution_queue").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", row.id);
      try {
        const { url } = await dispatch(row);
        const { data: updated } = await db.from("distribution_queue").update({ status: "posted", posted_url: url, posted_at: new Date().toISOString(), error: null, updated_at: new Date().toISOString() }).eq("id", row.id).select("*").single();
        await recordAudit(actor, "distribution.posted", "post", row.slug, { channel: row.channel, url });
        return updated;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await db.from("distribution_queue").update({ status: "failed", error: message.slice(0, 500), updated_at: new Date().toISOString() }).eq("id", row.id);
        throw new TRPCError({ code: "BAD_GATEWAY", message });
      }
    }),

  skip: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin", "editor"]);
      const { data, error } = await getSupabase()
        .from("distribution_queue")
        .update({ status: "skipped", updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("site_id", actor.siteId)
        .in("status", ["pending", "failed"])
        .select("*")
        .maybeSingle();
      if (error || !data) throw new TRPCError({ code: "NOT_FOUND", message: "Queue item not found or already handled." });
      return data;
    }),

  reset: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin", "editor"]);
      const { data, error } = await getSupabase()
        .from("distribution_queue")
        .update({ status: "pending", error: null, posted_url: null, posted_at: null, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("site_id", actor.siteId)
        .in("status", ["failed", "skipped"])
        .select("*")
        .maybeSingle();
      if (error || !data) throw new TRPCError({ code: "NOT_FOUND", message: "Queue item not found or not resettable." });
      return data;
    }),

  flipDraft: protectedProcedure
    .input(z.object({ articleId: z.string().trim().min(1), slug: z.string().trim().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin", "editor"]);
      const postedToday = await postedCountToday(actor.siteId);
      if (postedToday >= MAX_DAILY_POSTS) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Daily cap reached (${postedToday}/${MAX_DAILY_POSTS}).` });
      }
      let url: string;
      try {
        url = await flipDevtoDraft(input.articleId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new TRPCError({ code: "BAD_GATEWAY", message });
      }
      const db = getSupabase();
      await db.from("distribution_queue")
        .update({ status: "posted", posted_url: url, posted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("site_id", actor.siteId)
        .eq("slug", input.slug)
        .eq("channel", "devto")
        .in("status", ["pending", "approved", "failed"]);
      await recordAudit(actor, "distribution.devto_flipped", "post", input.slug, { url });
      return { url };
    }),
});
