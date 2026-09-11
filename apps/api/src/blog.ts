import { nanoid } from "nanoid";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { storagePut, storageRemove } from "./storage";
import { getSupabase } from "./supabase";

export const APP_ROLES = ["admin", "editor", "author"] as const;
export type AppRole = (typeof APP_ROLES)[number];
export const POST_STATUSES = ["draft", "review", "published", "archived"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

type AuthIdentity = { openId: string; name: string | null; email: string | null };

export type BlogActor = {
  profileId: string;
  organizationId: string;
  siteId: string;
  role: AppRole;
  displayName: string;
  email: string | null;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72) || "publication";

function dbError(message: string, error: unknown): never {
  const detail = error instanceof Error ? error.message : String(error);
  throw new Error(`${message}: ${detail}`);
}

export function sanitizeArticleHtml(html: string) {
  const cleaned = sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h1", "h2", "h3", "h4", "blockquote", "ul", "ol", "li", "strong", "em",
      "s", "del", "u", "mark", "a", "img", "pre", "code", "hr", "table", "thead", "tbody", "tr", "th", "td",
      "figure", "figcaption", "audio", "video", "source", "iframe", "span", "div", "button",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      img: ["src", "alt", "title", "width", "height"],
      code: ["class"],
      span: ["class"],
      pre: ["class"],
      div: ["class", "data-lang", "data-code", "data-code-b64"],
      button: ["type", "class", "aria-label", "onclick"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      figure: ["class"],
      figcaption: ["class"],
      audio: ["src", "controls", "preload", "loop"],
      video: ["src", "controls", "poster", "preload", "loop", "width", "height"],
      source: ["src", "type"],
      iframe: ["src", "width", "height", "title", "loading", "allow", "allowfullscreen", "frameborder", "referrerpolicy"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowedIframeHostnames: [
      "www.youtube.com", "www.youtube-nocookie.com", "youtube.com", "m.youtube.com",
      "player.vimeo.com", "vimeo.com", "w.soundcloud.com", "soundcloud.com",
    ],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
      img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }),
      iframe: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          title: attribs.title || "Embedded video",
          loading: attribs.loading || "lazy",
          allowfullscreen: "true",
          referrerpolicy: attribs.referrerpolicy || "strict-origin-when-cross-origin",
        },
      }),
      audio: (tagName, attribs) => ({ tagName, attribs: { ...attribs, controls: "" } }),
      video: (tagName, attribs) => ({ tagName, attribs: { ...attribs, controls: "" } }),
    },
  });
  // Drop any iframe whose src was stripped (e.g. a non-allowlisted host) so no
  // empty frame is left in the rendered article.
  return cleaned.replace(/<iframe(?![^>]*\bsrc=)[^>]*>\s*<\/iframe>/g, "");
}

export const editorDocumentSchema = z.object({
  type: z.string().max(60),
  content: z.array(z.unknown()).max(2000).optional(),
}).passthrough();

export function assertRole(actor: BlogActor, allowed: readonly AppRole[]) {
  if (!allowed.includes(actor.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
}

export function canTransition(role: AppRole, from: PostStatus, to: PostStatus, ownsPost: boolean) {
  const permittedGraph: Record<PostStatus, PostStatus[]> = {
    draft: ["review", "archived"],
    review: ["draft", "published", "archived"],
    published: ["archived"],
    archived: ["draft"],
  };
  if (!permittedGraph[from].includes(to)) return false;
  if (role === "author") return ownsPost && ((from === "draft" && to === "review") || (from === "review" && to === "draft"));
  return role === "editor" || role === "admin";
}

export async function recordAudit(
  actor: BlogActor,
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await getSupabase().from("audit_events").insert({
    organization_id: actor.organizationId,
    site_id: actor.siteId,
    actor_profile_id: actor.profileId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });
  if (error) dbError("Could not record the audit event", error);
}

export async function getActor(identity: AuthIdentity): Promise<BlogActor> {
  const db = getSupabase();
  const displayName = identity.name?.trim() || identity.email?.split("@")[0] || "Editorial user";
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .upsert(
      { external_auth_id: identity.openId, display_name: displayName, email: identity.email },
      { onConflict: "external_auth_id" },
    )
    .select("id, display_name, email")
    .single();
  if (profileError || !profile) dbError("Could not synchronize the platform profile", profileError);

  const { data: membership, error: membershipError } = await db
    .from("memberships")
    .select("organization_id, site_id, role")
    .eq("profile_id", profile.id)
    .not("site_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membershipError) dbError("Could not read the platform membership", membershipError);

  if (membership?.site_id) {
    return {
      profileId: profile.id,
      organizationId: membership.organization_id,
      siteId: membership.site_id,
      role: membership.role as AppRole,
      displayName: profile.display_name,
      email: profile.email,
    };
  }

  const workspaceSlug = `workspace-${slugify(displayName).slice(0, 36)}-${nanoid(6).toLowerCase()}`;
  const { data: organization, error: organizationError } = await db
    .from("organizations")
    .insert({ name: `${displayName}'s workspace`, slug: workspaceSlug })
    .select("id")
    .single();
  if (organizationError || !organization) dbError("Could not create the workspace", organizationError);

  const { data: site, error: siteError } = await db
    .from("sites")
    .insert({ organization_id: organization.id, name: "Publication", slug: "main" })
    .select("id")
    .single();
  if (siteError || !site) dbError("Could not create the publication", siteError);

  const { error: newMembershipError } = await db.from("memberships").insert({
    organization_id: organization.id,
    site_id: site.id,
    profile_id: profile.id,
    role: "admin",
  });
  if (newMembershipError) dbError("Could not assign the workspace administrator", newMembershipError);

  return {
    profileId: profile.id,
    organizationId: organization.id,
    siteId: site.id,
    role: "admin",
    displayName: profile.display_name,
    email: profile.email,
  };
}

export async function publishScheduled(siteId: string) {
  const { data, error } = await getSupabase()
    .from("posts")
    .update({ status: "published" })
    .eq("site_id", siteId)
    .eq("status", "review")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", new Date().toISOString())
    .is("deleted_at", null)
    .select("id");
  if (error) return 0;
  return data?.length ?? 0;
}

export async function resolvePublicSite() {
  const { data, error } = await getSupabase()
    .from("sites")
    .select("id, organization_id, name, slug, description, theme_settings")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) dbError("Could not resolve the public publication", error);
  return data;
}

export async function getPostForActor(actor: BlogActor, postId: string) {
  const { data, error } = await getSupabase()
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("organization_id", actor.organizationId)
    .eq("site_id", actor.siteId)
    .maybeSingle();
  if (error) dbError("Could not retrieve the post", error);
  if (!data) throw new Error("The requested post was not found in this publication.");
  return data;
}

export async function assertCanEditPost(actor: BlogActor, postId: string) {
  const post = await getPostForActor(actor, postId);
  const ownsPost = post.author_id === actor.profileId;
  if (actor.role === "author" && !ownsPost) throw new Error("Authors may edit only their own posts.");
  return { post, ownsPost };
}

export async function saveRevision(actor: BlogActor, post: { id: string; title: string; content_json: unknown; rendered_html: string }, summary: string) {
  const db = getSupabase();
  const { data: last, error: lastError } = await db
    .from("post_revisions")
    .select("revision_number")
    .eq("post_id", post.id)
    .order("revision_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) dbError("Could not read post revisions", lastError);

  const { error } = await db.from("post_revisions").insert({
    post_id: post.id,
    editor_id: actor.profileId,
    revision_number: (last?.revision_number ?? 0) + 1,
    title: post.title,
    content_json: post.content_json,
    rendered_html: post.rendered_html,
    summary,
  });
  if (error) dbError("Could not save the post revision", error);
}

export const uploadInputSchema = z.object({
  filename: z.string().min(1).max(180),
  mimeType: z.enum([
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "application/pdf",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/webm", "video/mp4", "video/webm",
  ]),
  base64: z.string().min(8).max(70_000_000),
  folder: z.string().trim().min(1).max(80).default("library"),
  altText: z.string().max(300).optional(),
  caption: z.string().max(500).optional(),
});

export async function uploadMedia(actor: BlogActor, input: z.infer<typeof uploadInputSchema>) {
  const payload = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
  const maxBytes = input.mimeType.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  if (payload.length === 0 || payload.length > maxBytes) {
    throw new Error(
      input.mimeType.startsWith("video/")
        ? "Video must be a valid file smaller than 50 MB."
        : "Media must be a valid file smaller than 10 MB.",
    );
  }
  if (input.mimeType === "image/svg+xml" && /<script|onload=|onerror=/i.test(payload.toString("utf8"))) {
    throw new Error("SVG files containing executable content are not accepted.");
  }

  const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const { key, url } = await storagePut(
    `${actor.organizationId}/${actor.siteId}/${input.folder}/${nanoid(10)}-${safeFilename}`,
    payload,
    input.mimeType,
  );
  const { data, error } = await getSupabase().from("media_assets").insert({
    organization_id: actor.organizationId,
    site_id: actor.siteId,
    uploaded_by: actor.profileId,
    storage_key: key,
    url,
    filename: input.filename,
    mime_type: input.mimeType,
    byte_size: payload.length,
    alt_text: input.altText ?? null,
    caption: input.caption ?? null,
    folder: input.folder,
  }).select("*").single();
  if (error || !data) dbError("Could not register the uploaded media", error);
  await recordAudit(actor, "media.uploaded", "media_asset", data.id, { mimeType: input.mimeType, byteSize: payload.length });
  return data;
}

// Brand URL fields (site_settings.brand JSON) that may reference a library asset.
const BRAND_URL_FIELDS = [
  ["logoUrl", "site logo"],
  ["heroImageUrl", "homepage hero image"],
  ["heroVideoUrl", "homepage hero video"],
  ["safariImageUrl", "safari section image"],
  ["aboutImageUrl", "about image"],
] as const;

function ilikeEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function removeMedia(actor: BlogActor, id: string) {
  const db = getSupabase();
  const { data: asset, error } = await db
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .eq("organization_id", actor.organizationId)
    .eq("site_id", actor.siteId)
    .maybeSingle();
  if (error || !asset) dbError("Media asset not found", error);

  // Guard 1: featured image of a live (non-deleted) post.
  const { data: featuredIn } = await db
    .from("posts")
    .select("id, title")
    .eq("featured_media_id", id)
    .is("deleted_at", null)
    .limit(4);
  if (featuredIn?.length) {
    throw new Error(
      `This file is the featured image of ${featuredIn.length} post${featuredIn.length > 1 ? "s" : ""} (${featuredIn.map(p => p.title).join(", ")}). Remove it there first.`,
    );
  }

  // Guard 2: embedded inside article bodies.
  const { data: embeddedIn } = await db
    .from("posts")
    .select("id, title")
    .eq("site_id", actor.siteId)
    .is("deleted_at", null)
    .ilike("rendered_html", `%${ilikeEscape(asset.url)}%`)
    .limit(4);
  if (embeddedIn?.length) {
    throw new Error(
      `This file appears inside ${embeddedIn.length} article${embeddedIn.length > 1 ? "s" : ""} (${embeddedIn.map(p => p.title).join(", ")}). Remove it there first.`,
    );
  }

  // Guard 3: referenced by site brand settings (logo, hero, sections).
  const { data: settings } = await db
    .from("site_settings")
    .select("brand")
    .eq("site_id", actor.siteId)
    .maybeSingle();
  const brand = (settings?.brand ?? {}) as Record<string, unknown>;
  for (const [field, label] of BRAND_URL_FIELDS) {
    if (typeof brand[field] === "string" && (brand[field] as string).trim() === asset.url) {
      throw new Error(`This file is used as the ${label}. Change it in Site Management first.`);
    }
  }

  // Guard 4: referenced by tours, food menu, or video reviews.
  const [{ data: tourUse }, { data: menuUse }, { data: reviewUse }] = await Promise.all([
    db.from("tours").select("id, title").eq("site_id", actor.siteId).eq("image_url", asset.url).limit(2),
    db.from("food_menu_items").select("id, name").eq("site_id", actor.siteId).eq("image_url", asset.url).limit(2),
    db.from("video_reviews").select("id, customer_name").eq("site_id", actor.siteId).eq("thumbnail_url", asset.url).limit(2),
  ]);
  if (tourUse?.length) throw new Error(`This file is the cover image of "${tourUse[0].title}". Change it in the tour first.`);
  if (menuUse?.length) throw new Error(`This file illustrates "${menuUse[0].name}" on the food menu. Change it there first.`);
  if (reviewUse?.length) throw new Error(`This file is a review thumbnail for "${reviewUse[0].customer_name}". Change it there first.`);

  // Delete the registry row first (a leftover file is invisible and harmless;
  // a leftover DB pointer would render a broken image).
  const { error: deleteError } = await db
    .from("media_assets")
    .delete()
    .eq("id", id)
    .eq("organization_id", actor.organizationId)
    .eq("site_id", actor.siteId);
  if (deleteError) dbError("Could not delete the media asset", deleteError);

  try {
    await storageRemove(asset.storage_key);
  } catch {
    // Row is gone; a stray object will be cleaned on the next storage audit.
  }
  await recordAudit(actor, "media.removed", "media_asset", id, { filename: asset.filename });
  return { success: true as const };
}

async function createOutbox(
  actor: BlogActor,
  post: { id: string; title: string; author_id: string },
  eventType: "review_submitted" | "post_approved" | "post_rejected" | "post_published",
  recipientEmail: string,
  recipientRole: AppRole | null,
  subject: string,
  bodyText: string,
) {
  const { error } = await getSupabase().from("notification_outbox").insert({
    organization_id: actor.organizationId,
    site_id: actor.siteId,
    post_id: post.id,
    recipient_email: recipientEmail,
    recipient_role: recipientRole,
    event_type: eventType,
    subject,
    body_text: bodyText,
  });
  if (error) dbError("Could not queue the notification", error);
}

export async function queueWorkflowNotifications(
  actor: BlogActor,
  post: { id: string; title: string; author_id: string },
  from: PostStatus,
  to: PostStatus,
  rejectionNote?: string,
) {
  const db = getSupabase();
  if (to === "review" && from !== "review") {
    const { data: editors, error } = await db
      .from("memberships")
      .select("profiles(email)")
      .eq("organization_id", actor.organizationId)
      .eq("site_id", actor.siteId)
      .in("role", ["admin", "editor"]);
    if (error) dbError("Could not identify editorial recipients", error);
    for (const entry of editors ?? []) {
      const joinedProfile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
      const email = (joinedProfile as { email?: string | null } | null)?.email;
      if (email) await createOutbox(actor, post, "review_submitted", email, "editor", `Review requested: ${post.title}`, "A post has been submitted for editorial review.");
    }
  }

  if (from === "review" && (to === "published" || to === "draft")) {
    const { data: author, error } = await db.from("profiles").select("email").eq("id", post.author_id).maybeSingle();
    if (error) dbError("Could not identify the post author", error);
    if (author?.email) {
      const approved = to === "published";
      await createOutbox(
        actor,
        post,
        approved ? "post_approved" : "post_rejected",
        author.email,
        "author",
        approved ? `Approved: ${post.title}` : `Changes requested: ${post.title}`,
        approved ? "Your post has been approved and published." : `Your post was returned to draft.${rejectionNote ? ` Editorial note: ${rejectionNote}` : ""}`,
      );
    }
  }

  if (to === "published" && from !== "published") {
    const { data: subscribers, error } = await db
      .from("subscribers")
      .select("email")
      .eq("organization_id", actor.organizationId)
      .eq("site_id", actor.siteId)
      .eq("status", "active");
    if (error) dbError("Could not identify active subscribers", error);
    for (const subscriber of subscribers ?? []) {
      await createOutbox(actor, post, "post_published", subscriber.email, null, `New post: ${post.title}`, `A new post has been published: ${post.title}`);
    }
  }
}

export async function getAnalyticsSummary(actor: BlogActor, from: string, to: string) {
  const { data: events, error } = await getSupabase()
    .from("analytics_events")
    .select("event_type, post_id, occurred_at, properties, session_hash, posts(title, slug)")
    .eq("organization_id", actor.organizationId)
    .eq("site_id", actor.siteId)
    .gte("occurred_at", from)
    .lte("occurred_at", to);
  if (error) dbError("Could not load analytics", error);

  const isReal = (e: any) => {
    const p = (e.properties ?? {}) as any;
    return p.is_admin !== true && p.qa !== true && p.smoke !== true && p.is_admin !== "true";
  };
  const realEvents = (events ?? []).filter(isReal);
  const totalViews = realEvents.filter((event: any) => event.event_type === "article_view" || event.event_type === "page_view").length;
  const engagementEvents = realEvents.filter((event: any) => ["scroll_depth", "reading_complete", "comment_submitted", "subscription_created"].includes(event.event_type)).length;
  const topPosts = new Map<string, { postId: string; title: string; slug: string; views: number; engagement: number }>();
  for (const event of realEvents) {
    if (!event.post_id) continue;
    const raw = event.posts as unknown as { title?: string; slug?: string } | Array<{ title: string; slug: string }> | null;
    const resolved = Array.isArray(raw) ? raw[0] : raw;
    const current = topPosts.get(event.post_id) ?? {
      postId: event.post_id,
      title: resolved?.title ?? "Untitled post",
      slug: resolved?.slug ?? "",
      views: 0,
      engagement: 0,
    };
    if (event.event_type === "article_view" || event.event_type === "page_view") current.views += 1;
    else current.engagement += 1;
    topPosts.set(event.post_id, current);
  }

  return {
    totalViews,
    engagementEvents,
    engagementRate: totalViews ? Number(((engagementEvents / totalViews) * 100).toFixed(1)) : 0,
    topPosts: Array.from(topPosts.values()).sort((a, b) => b.views - a.views).slice(0, 8),
  };
}
