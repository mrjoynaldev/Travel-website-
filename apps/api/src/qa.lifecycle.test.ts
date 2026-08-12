import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getSupabase } from "./supabase";

const qa = {
  admin: { openId: "qa-e2e-admin-v1", name: "QA Administrator", email: "qa-e2e-admin@example.test" },
  editor: { openId: "qa-e2e-editor-v1", name: "QA Editor", email: "qa-e2e-editor@example.test" },
  author: { openId: "qa-e2e-author-v1", name: "QA Author", email: "qa-e2e-author@example.test" },
};

function context(identity?: { openId: string; name: string; email: string }) {
  return {
    user: identity ? { id: -1, openId: identity.openId, name: identity.name, email: identity.email, loginMethod: "qa", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null,
    req: { headers: {}, protocol: "https" },
    res: { clearCookie: () => undefined },
  } as any;
}

let postId = "";
let postSlug = "";
let categoryId = "";
let tagId = "";
let qaSiteId = "";
let qaOrgId = "";

beforeAll(async () => {
  const db = getSupabase();
  const { error: cleanupError } = await db.from("posts").update({ status: "archived", archived_at: new Date().toISOString() }).ilike("slug", "qa-%").neq("status", "archived");
  if (cleanupError) throw cleanupError;
  let { data: site, error } = await db.from("sites").select("id, organization_id").eq("status", "active").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;
  if (!site) {
    const { data: org, error: orgError } = await db.from("organizations").insert({ name: "QA Acceptance Organization", slug: "qa-acceptance-org-v1" }).select("id").single();
    if (orgError || !org) throw orgError ?? new Error("Could not create QA organization");
    const { data: createdSite, error: siteError } = await db.from("sites").insert({ organization_id: org.id, name: "QA Acceptance Publication", slug: "qa-acceptance" }).select("id, organization_id").single();
    if (siteError || !createdSite) throw siteError ?? new Error("Could not create QA site");
    site = createdSite;
  }
  qaSiteId = site.id; qaOrgId = site.organization_id;
  const identities = [qa.admin, qa.editor, qa.author];
  const { data: profiles, error: profilesError } = await db.from("profiles").upsert(identities.map(identity => ({ external_auth_id: identity.openId, display_name: identity.name, email: identity.email, bio: "QA-only acceptance-test identity." })), { onConflict: "external_auth_id" }).select("id, external_auth_id");
  if (profilesError || !profiles) throw profilesError ?? new Error("Could not create QA profiles");
  const profileByOpenId = new Map(profiles.map(profile => [profile.external_auth_id, profile.id]));
  const { error: membershipError } = await db.from("memberships").upsert([
    { organization_id: qaOrgId, site_id: qaSiteId, profile_id: profileByOpenId.get(qa.admin.openId), role: "admin" },
    { organization_id: qaOrgId, site_id: qaSiteId, profile_id: profileByOpenId.get(qa.editor.openId), role: "editor" },
    { organization_id: qaOrgId, site_id: qaSiteId, profile_id: profileByOpenId.get(qa.author.openId), role: "author" },
  ], { onConflict: "organization_id,site_id,profile_id" });
  if (membershipError) throw membershipError;
  const { data: category, error: categoryError } = await db.from("categories").upsert({ organization_id: qaOrgId, site_id: qaSiteId, name: "QA Lifecycle", slug: "qa-lifecycle", description: "QA-only category for acceptance testing." }, { onConflict: "site_id,slug" }).select("id").single();
  if (categoryError || !category) throw categoryError ?? new Error("Could not create QA category");
  categoryId = category.id;
  const { data: tag, error: tagError } = await db.from("tags").upsert({ organization_id: qaOrgId, site_id: qaSiteId, name: "qa-lifecycle", slug: "qa-lifecycle" }, { onConflict: "site_id,slug" }).select("id").single();
  if (tagError || !tag) throw tagError ?? new Error("Could not create QA tag");
  tagId = tag.id;
});

describe("QA administrator-to-reader lifecycle", () => {
  it("creates, reviews, publishes, discovers, moderates, measures, and archives a clearly labeled QA post", async () => {
    const suffix = Date.now().toString(36);
    postSlug = `qa-lifecycle-${suffix}`;
    const author = appRouter.createCaller(context(qa.author));
    const editor = appRouter.createCaller(context(qa.editor));
    const admin = appRouter.createCaller(context(qa.admin));
    const publicCaller = appRouter.createCaller(context());
    const contentJson = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "This QA-only acceptance post validates the publication lifecycle without customer claims or reviews." }] }] };

    const created = await author.studio.posts.create({ title: `QA Lifecycle Acceptance ${suffix}`, slug: postSlug, excerpt: "QA-only test content for verified editorial workflow coverage.", contentJson, renderedHtml: "<p>This QA-only acceptance post validates the publication lifecycle without customer claims or reviews.</p>", metaTitle: `QA Lifecycle ${suffix}`, metaDescription: "QA-only verification of author-to-reader publishing flow.", canonicalUrl: "", ogImageUrl: "", featuredMediaId: null, categoryIds: [categoryId], tagIds: [tagId] });
    postId = created.id;
    expect(created.status).toBe("draft");

    const submitted = await author.studio.posts.transition({ id: postId, status: "review" });
    expect(submitted.status).toBe("review");
    await publicCaller.blog.subscribe({ email: `qa-subscriber-${suffix}@example.test` });
    const published = await editor.studio.posts.transition({ id: postId, status: "published" });
    expect(published.status).toBe("published");

    const found = await publicCaller.blog.bySlug({ slug: postSlug });
    expect(found.post.id).toBe(postId);
    expect(found.post.status).toBe("published");
    expect(found.post.meta_title).toBe(`QA Lifecycle ${suffix}`);
    expect(found.post.meta_description).toBe("QA-only verification of author-to-reader publishing flow.");
    const search = await publicCaller.blog.list({ query: suffix, category: "qa-lifecycle", tag: "qa-lifecycle", page: 1 });
    expect(search.items.some(item => item.id === postId)).toBe(true);
    const publicationYear = new Date(found.post.published_at!).getUTCFullYear();
    const yearSearch = await publicCaller.blog.list({ year: publicationYear, category: "qa-lifecycle", tag: "qa-lifecycle", page: 1 });
    expect(yearSearch.items.some(item => item.id === postId)).toBe(true);
    const archives = await publicCaller.blog.archives();
    expect(archives.some(entry => entry.year === publicationYear && entry.count > 0)).toBe(true);
    const tagged = await publicCaller.blog.tags();
    expect(tagged.some(tag => tag.id === tagId)).toBe(true);
    const authorPage = await publicCaller.blog.author({ authorId: found.post.author_id });
    expect(authorPage.posts.some(item => item.id === postId)).toBe(true);

    await publicCaller.blog.track({ postId, eventType: "article_view", sessionHash: `qa-session-${suffix}`, properties: { qa: true } });
    await publicCaller.blog.track({ postId, eventType: "reading_complete", sessionHash: `qa-session-${suffix}`, properties: { qa: true } });
    await publicCaller.blog.submitComment({ postId, authorName: "QA Reader", email: "qa-reader@example.test", body: "QA-only comment submitted for moderation workflow coverage." });

    const queue = await editor.studio.moderation.list({ status: "pending" });
    const comment = queue.find(item => item.post_id === postId);
    expect(comment).toBeTruthy();
    await editor.studio.moderation.resolve({ id: comment!.id, status: "approved", note: "QA acceptance moderation." });
    const comments = await publicCaller.blog.comments({ postId });
    expect(comments.some(item => item.id === comment!.id)).toBe(true);

    const analytics = await admin.studio.analytics({});
    expect(analytics.totalViews).toBeGreaterThan(0);
    const notifications = await editor.studio.notifications();
    expect(notifications.some(item => item.post_id === postId && item.event_type === "review_submitted")).toBe(true);
    expect(notifications.some(item => item.post_id === postId && item.event_type === "post_approved")).toBe(true);
    expect(notifications.some(item => item.post_id === postId && item.event_type === "post_published")).toBe(true);
    const audit = await admin.studio.audit.list({ limit: 100 });
    expect(audit.some(item => item.resource_id === postId && item.action === "post.workflow_transition")).toBe(true);

    const archived = await editor.studio.posts.transition({ id: postId, status: "archived" });
    expect(archived.status).toBe("archived");
  }, 60_000);

  it("retains the archival state and audit evidence for the completed QA artifact", async () => {
    const admin = appRouter.createCaller(context(qa.admin));
    const post = await admin.studio.posts.get({ id: postId });
    expect(post.status).toBe("archived");
    const audit = await admin.studio.audit.list({ limit: 200 });
    expect(audit.some(item => item.resource_id === postId && item.action === "post.workflow_transition" && (item.metadata as { to?: string }).to === "archived")).toBe(true);
    console.info(`[QA acceptance] Archived post ${post.id} (${post.slug}) retained workflow and audit records.`);
  });
});
