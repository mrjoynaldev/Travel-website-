import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { assertRole, getActor, recordAudit } from "../blog";
import { getSupabase } from "../supabase";
import { optimizedSocialImage } from "../lib/social-image";
import { protectedProcedure, router } from "../_core/trpc";

const CHANNELS = ["devto", "bluesky", "mastodon", "facebook", "instagram"] as const;
export const MAX_DAILY_POSTS = parseInt(process.env.DISTRIBUTION_DAILY_CAP || process.env.MAX_DAILY_POSTS || "0", 10); // 0 = no limit (auto post) — set env to e.g. 10 to cap

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
  // Publish teaser immediately — front matter published:false is ignored, JSON published:true controls state per https://developers.forem.com/api/v0
  const publishedBody = bodyMarkdown.replace(/^published:\s*false/m, "published: true");
  const response = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", "User-Agent": BROWSER_UA },
    body: JSON.stringify({ article: { body_markdown: publishedBody, published: true } }),
  });
  const data = (await response.json().catch(() => ({}))) as any;
  if (!response.ok) throw new TRPCError({ code: "BAD_GATEWAY", message: `dev.to rejected the post (${response.status}): ${data?.error ?? "unknown error"}` });
  return data.url as string;
}

async function flipDevtoDraft(articleId: string, slug?: string, siteId?: string): Promise<string> {
  const apiKey = requireEnv("DEVTO_API_KEY");
  // Official doc: front matter beats JSON on update (developers.forem.com/api/v0 + forem/forem#front-matter-beats-API).
  // A draft created with front matter `published:false` ignores `{published:true}` alone — must resend full body_markdown with front matter `published:true`.
  // Try fast path first; if front matter blocks it we fall back to rebuilding teaser body from our DB.
  const fast = await fetch(`https://dev.to/api/articles/${articleId}`, {
    method: "PUT",
    headers: { "api-key": apiKey, "Content-Type": "application/json", "User-Agent": BROWSER_UA },
    body: JSON.stringify({ article: { published: true } }),
  });
  const fastData = (await fast.json().catch(() => ({}))) as any;
  if (fast.ok && fastData.published) return fastData.url as string;

  // Fallback: rebuild teaser body_markdown from canonical post (teaser drives traffic, not full copy)
  if (slug && siteId) {
    const db = getSupabase();
    const { data: post } = await db
      .from("posts")
      .select("title, slug, excerpt, meta_description, rendered_html, og_image_url, featured_media_id, tags:post_tags(tag:tags(name,slug))")
      .eq("site_id", siteId)
      .eq("slug", slug)
      .maybeSingle();
    // Also fetch featured media url if needed
    let cover: string | undefined;
    if (post) {
      const rawCover = (post as any).og_image_url as string | null;
      if (rawCover) cover = optimizedSocialImage(rawCover) || rawCover;
      else if ((post as any).featured_media_id) {
        const { data: media } = await db.from("media").select("url").eq("id", (post as any).featured_media_id).maybeSingle();
        if (media?.url) cover = optimizedSocialImage(media.url) || media.url;
      }
      const title = String((post as any).title || slug).trim();
      const summary = String((post as any).meta_description || (post as any).excerpt || "").slice(0, 140) || title.slice(0, 130);
      const siteOrigin = (process.env.CANONICAL_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatri.com").replace(/\/+$/, "");
      const url = `${siteOrigin}/articles/${(post as any).slug}`;
      const tagList = ((post as any).tags as any[] | null)?.map((r: any) => String(r.tag?.name || "").toLowerCase().replace(/[^a-z0-9]/g, "")).filter((t: string) => t.length >= 3) ?? [];
      const tags = [...new Set([...tagList, "ai", "webdev", "programming", "news"])].slice(0, 4);
      const text = String((post as any).rendered_html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 600);
      const teaser = `${summary}\n\n> Originally published at **Sundarban Yatri** — read the full guide at **${url}**.\n\n${text}…\n\n👉 **Read the full article:** ${url}`;
      const bodyMarkdown = `---\ntitle: ${title.replace(/\n/g, " ")}\npublished: true\ndescription: ${summary.replace(/\n/g, " ")}\ntags: ${tags.join(", ")}\ncanonical_url: ${url}${cover ? `\ncover_image: ${cover}` : ""}\n---\n\n${teaser}\n\n---\n*Canonical: ${url}*\n`;
      const retry = await fetch(`https://dev.to/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "api-key": apiKey, "Content-Type": "application/json", "User-Agent": BROWSER_UA },
        body: JSON.stringify({ article: { body_markdown: bodyMarkdown, published: true } }),
      });
      const retryData = (await retry.json().catch(() => ({}))) as any;
      if (retry.ok) return retryData.url as string;
      throw new TRPCError({ code: "BAD_GATEWAY", message: `dev.to publish retry failed (${retry.status}): ${retryData?.error ?? "unknown"}` });
    }
  }
  if (fast.ok) return fastData.url as string;
  throw new TRPCError({ code: "BAD_GATEWAY", message: `dev.to refused to publish draft ${articleId} (${fast.status})` });
}

// Bluesky renders links/hashtags only when the record carries rich-text facets
// with UTF-8 byte offsets — plain text stays dead-grey forever.
function detectBlueskyFacets(text: string): any[] {
  const facets: any[] = [];
  const encoder = new TextEncoder();
  const byteLength = (value: string) => encoder.encode(value).length;
  const pushFacet = (charStart: number, charEnd: number, feature: Record<string, unknown>) => {
    const segment = text.slice(charStart, charEnd);
    if (!segment) return;
    const byteStart = byteLength(text.slice(0, charStart));
    facets.push({ index: { byteStart, byteEnd: byteStart + byteLength(segment) }, features: [feature] });
  };
  for (const match of text.matchAll(/https?:\/\/\S+/g)) {
    let url = match[0];
    let end = match.index! + url.length;
    url = url.replace(/[.,;:!?)\]}'"]+$/, "");
    end -= match[0].length - url.length;
    if (!/^https?:\/\//.test(url)) continue;
    pushFacet(match.index!, end, { $type: "app.bsky.richtext.facet#link", uri: url });
  }
  for (const match of text.matchAll(/(^|[\s(])#([\p{L}\p{N}_]{1,64})/gu)) {
    const hashOffset = match[0].indexOf("#");
    const start = match.index! + hashOffset;
    pushFacet(start, start + 1 + match[2].length, { $type: "app.bsky.richtext.facet#tag", tag: match[2].toLowerCase() });
  }
  return facets.sort((a, b) => a.index.byteStart - b.index.byteStart);
}

async function fetchBlueskyLinkCard(url: string, auth: string): Promise<any | undefined> {
  try {
    const page = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
    if (!page.ok) return undefined;
    const html = await page.text();
    const decodeHtml = (s: string) =>
      s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
    const meta = (prop: string) => {
      const forward = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)`, "i");
      const backward = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
      const raw = html.match(forward)?.[1] ?? html.match(backward)?.[1];
      return raw ? decodeHtml(raw) : undefined;
    };
    const title = (meta("og:title") || "").trim().slice(0, 200);
    const description = (meta("og:description") || "").trim().slice(0, 300);
    if (!title) return undefined;
    const imageUrl = meta("og:image");
    const optimized = optimizedSocialImage(imageUrl);
    let thumb: any;
    if (optimized && /^https?:\/\//.test(optimized)) {
      const imageResponse = await fetch(optimized, { signal: AbortSignal.timeout(8000) });
      if (imageResponse.ok) {
        const bytes = Buffer.from(await imageResponse.arrayBuffer());
        if (bytes.length > 0 && bytes.length <= 900_000) {
          const upload = await fetch("https://bsky.social/xrpc/com.atproto.repo.uploadBlob", {
            method: "POST",
            headers: { Authorization: auth, "Content-Type": imageResponse.headers.get("content-type") || "image/jpeg" },
            body: bytes,
          });
          const uploaded = (await upload.json().catch(() => ({}))) as any;
          if (upload.ok && uploaded.blob) thumb = uploaded.blob;
        }
      }
    }
    return { $type: "app.bsky.embed.external", external: { uri: url, title, description, ...(thumb ? { thumb } : {}) } };
  } catch {
    return undefined;
  }
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
  const facets = detectBlueskyFacets(text);
  const linkMatch = text.match(/https?:\/\/[^\s)#]+/u);
  const embed = linkMatch ? await fetchBlueskyLinkCard(linkMatch[0], `Bearer ${session.accessJwt}`) : undefined;
  const postResponse = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessJwt}` },
    body: JSON.stringify({
      repo: session.did,
      collection: "app.bsky.feed.post",
      record: {
        $type: "app.bsky.feed.post",
        text,
        langs: ["en"],
        ...(facets.length ? { facets } : {}),
        ...(embed ? { embed } : {}),
        createdAt: new Date().toISOString(),
      },
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
    body: JSON.stringify({ status: text.slice(0, 500), visibility: "public", language: "en" }),
  });
  const data = (await response.json().catch(() => ({}))) as any;
  if (!response.ok || !data.url) throw new TRPCError({ code: "BAD_GATEWAY", message: `Mastodon post failed (${response.status}).` });
  return data.url as string;
}

async function postFacebook(text: string): Promise<string> {
  const pageId = requireEnv("FACEBOOK_PAGE_ID");
  const token = requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN");
  const linkMatch = text.match(/https?:\/\/[^\s)]+/);
  const link = linkMatch ? linkMatch[0].replace(/[.,;:!?)\]}'"]+$/, "") : undefined;
  const params = new URLSearchParams();
  params.set("message", text);
  if (link) params.set("link", link);
  params.set("access_token", token);
  const response = await fetch(`https://graph.facebook.com/v26.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = (await response.json().catch(() => ({}))) as any;
  if (!response.ok || !data.id) throw new TRPCError({ code: "BAD_GATEWAY", message: `Facebook post failed (${response.status}): ${data?.error?.message ?? "unknown"}` });
  const postId = String(data.id).split("_").pop();
  return `https://www.facebook.com/${pageId}/posts/${postId}`;
}

async function postInstagram(caption: string, imageUrl: string | undefined, slug: string): Promise<string> {
  const igUserId = requireEnv("FACEBOOK_IG_USER_ID");
  const token = process.env.INSTAGRAM_ACCESS_TOKEN || requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN");
  // Resolve image: explicit payload → og:image from canonical URL → error
  let image = imageUrl?.trim();
  if (!image) {
    const linkMatch = caption.match(/https?:\/\/[^\s)]+/);
    if (linkMatch) {
      try {
        const page = await fetch(linkMatch[0].replace(/[.,;:!?)\]}'"]+$/, ""), { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
        if (page.ok) {
          const html = await page.text();
          const m = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
          if (m?.[1]) image = m[1].replace(/&amp;/g, "&");
        }
      } catch {}
    }
  }
  if (!image) throw new TRPCError({ code: "BAD_REQUEST", message: "Instagram requires an image — provide payload.imageUrl or ensure caption contains canonical URL with og:image." });
  const optimized = optimizedSocialImage(image) || image;
  // Instagram needs 1080x1350 (4:5) — use 1080x1350 render if source is Supabase, else use as-is
  let igImage = optimized;
  if (optimized.includes("supabase.co/storage/v1/render/image/public/") && !optimized.includes("height=1350")) {
    igImage = optimized.replace(/width=\d+&height=\d+/, "width=1080&height=1350");
  } else if (optimized.includes("supabase.co/storage/v1/object/public/")) {
    igImage = optimizedSocialImage(image, 1080, 1350) || optimized;
  }
  const create = await fetch(`https://graph.facebook.com/v26.0/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ image_url: igImage, caption: caption.slice(0, 2200), access_token: token }).toString(),
  });
  const cData = (await create.json().catch(() => ({}))) as any;
  if (!create.ok || !cData.id) throw new TRPCError({ code: "BAD_GATEWAY", message: `Instagram container failed (${create.status}): ${cData?.error?.message ?? "unknown"}` });
  // Poll status up to 10s (IG processes image)
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const statusRes = await fetch(`https://graph.facebook.com/v26.0/${cData.id}?fields=status_code&access_token=${encodeURIComponent(token)}`);
    const sData = (await statusRes.json().catch(() => ({}))) as any;
    if (sData.status_code === "FINISHED" || sData.status_code === "PUBLISHED") break;
    if (sData.status_code === "ERROR") throw new TRPCError({ code: "BAD_GATEWAY", message: `Instagram media error: ${sData.status_code}` });
  }
  const publish = await fetch(`https://graph.facebook.com/v26.0/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: cData.id, access_token: token }).toString(),
  });
  const pData = (await publish.json().catch(() => ({}))) as any;
  if (!publish.ok || !pData.id) throw new TRPCError({ code: "BAD_GATEWAY", message: `Instagram publish failed (${publish.status}): ${pData?.error?.message ?? "unknown"}` });
  return `https://www.instagram.com/p/${pData.id}/`;
}

async function dispatch(row: any): Promise<{ url?: string }> {
  if (row.channel === "devto") {
    if (row.payload?.articleId) {
      return { url: await flipDevtoDraft(String(row.payload.articleId), String(row.slug), String(row.site_id)) };
    }
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
  if (row.channel === "facebook") {
    const text = row.payload?.text;
    if (!text) throw new Error("facebook payload is missing text");
    return { url: await postFacebook(String(text)) };
  }
  if (row.channel === "instagram") {
    const text = row.payload?.caption || row.payload?.text;
    const imageUrl = row.payload?.imageUrl;
    if (!text) throw new Error("instagram payload is missing caption/text");
    return { url: await postInstagram(String(text), imageUrl ? String(imageUrl) : undefined, String(row.slug)) };
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
      await recordAudit(actor, "distribution.enqueued", "post", input.postId ?? null, { slug: input.slug, channels: input.items.map(i => i.channel) });
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
      if (MAX_DAILY_POSTS > 0 && postedToday >= MAX_DAILY_POSTS) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Daily cap reached: ${postedToday}/${MAX_DAILY_POSTS} posts already sent today. The cap resets at 00:00 UTC.` });
      }
      await db.from("distribution_queue").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", row.id);
      try {
        const { url } = await dispatch(row);
        const { data: updated } = await db.from("distribution_queue").update({ status: "posted", posted_url: url, posted_at: new Date().toISOString(), error: null, updated_at: new Date().toISOString() }).eq("id", row.id).select("*").single();
        await recordAudit(actor, "distribution.posted", "post", row.post_id ?? null, { channel: row.channel, url, slug: row.slug });
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
      if (MAX_DAILY_POSTS > 0 && postedToday >= MAX_DAILY_POSTS) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Daily cap reached (${postedToday}/${MAX_DAILY_POSTS}).` });
      }
      let url: string;
      try {
        url = await flipDevtoDraft(input.articleId, input.slug, actor.siteId);
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
      await recordAudit(actor, "distribution.devto_flipped", "post", null, { slug: input.slug, url });
      return { url };
    }),

});
