import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getSupabase } from "./supabase";

const adminIdentity = { openId: "qa-e2e-admin-v1", name: "QA Administrator", email: "qa-e2e-admin@example.test" };
const baseUrl = process.env.QA_APP_BASE_URL || "http://localhost:3000";

function context() {
  return { user: { id: -1, openId: adminIdentity.openId, name: adminIdentity.name, email: adminIdentity.email, loginMethod: "qa", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: {}, protocol: "https" }, res: { clearCookie: () => undefined } } as any;
}

let categoryId = "";
let tagId = "";

beforeAll(async () => {
  const db = getSupabase();
  const { error: cleanupError } = await db.from("posts").update({ status: "archived", archived_at: new Date().toISOString() }).ilike("slug", "qa-%").neq("status", "archived");
  if (cleanupError) throw cleanupError;
  const { data: site, error: siteError } = await db.from("sites").select("id, organization_id").eq("status", "active").order("created_at", { ascending: true }).limit(1).single();
  if (siteError || !site) throw siteError ?? new Error("An active QA publication is required.");
  const { data: profile, error: profileError } = await db.from("profiles").upsert({ external_auth_id: adminIdentity.openId, display_name: adminIdentity.name, email: adminIdentity.email }, { onConflict: "external_auth_id" }).select("id").single();
  if (profileError || !profile) throw profileError ?? new Error("Could not prepare QA administrator profile.");
  const { error: memberError } = await db.from("memberships").upsert({ organization_id: site.organization_id, site_id: site.id, profile_id: profile.id, role: "admin" }, { onConflict: "organization_id,site_id,profile_id" });
  if (memberError) throw memberError;
  const { data: category, error: categoryError } = await db.from("categories").upsert({ organization_id: site.organization_id, site_id: site.id, name: "QA Lifecycle", slug: "qa-lifecycle", description: "QA-only category for route testing." }, { onConflict: "site_id,slug" }).select("id").single();
  if (categoryError || !category) throw categoryError ?? new Error("Could not prepare QA category.");
  categoryId = category.id;
  const { data: tag, error: tagError } = await db.from("tags").upsert({ organization_id: site.organization_id, site_id: site.id, name: "qa-lifecycle", slug: "qa-lifecycle" }, { onConflict: "site_id,slug" }).select("id").single();
  if (tagError || !tag) throw tagError ?? new Error("Could not prepare QA tag.");
  tagId = tag.id;
});

describe("QA public discovery routes", () => {
  it("renders the published QA story through article, topic, tag, and archive pages before archival", async (ctx) => {
    // Server-rendered route checks require a running web server (the SSR app, not
    // this API). Skip cleanly when none is reachable, e.g. in a plain `pnpm test`
    // or CI without `pnpm dev` running.
    let serverReachable = true;
    try {
      const probe = await fetch(baseUrl, { signal: AbortSignal.timeout(3000) });
      if (probe.status !== 200) serverReachable = false;
    } catch {
      serverReachable = false;
    }
    if (!serverReachable) return ctx.skip();
    const suffix = Date.now().toString(36);
    const slug = `qa-public-routes-${suffix}`;
    const caller = appRouter.createCaller(context());
    const created = await caller.studio.posts.create({ title: `QA Public Routes ${suffix}`, slug, excerpt: "QA-only temporary published story for actual server-rendered discovery route checks.", contentJson: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "QA-only content validates the actual public page routing layer." }] }] }, renderedHtml: "<p>QA-only content validates the actual public page routing layer.</p>", metaTitle: `QA Public Routes ${suffix}`, metaDescription: "QA-only metadata for public route rendering checks.", canonicalUrl: "", ogImageUrl: "", featuredMediaId: null, categoryIds: [categoryId], tagIds: [tagId] });
    await caller.studio.posts.transition({ id: created.id, status: "review" });
    await caller.studio.posts.transition({ id: created.id, status: "published" });
    const year = new Date().getUTCFullYear();
    const paths = [`/articles/${slug}`, "/topics/qa-lifecycle", "/tags/qa-lifecycle", "/archive", `/archive/${year}`];
    const pages = await Promise.all(paths.map(async path => ({ path, response: await fetch(`${baseUrl}${path}`) })));
      for (const page of pages) {
        expect(page.response.status, page.path).toBe(200);
        const html = await page.response.text();
        expect(html, page.path).toContain(page.path === "/archive" ? "Publication archive" : page.path === `/archive/${year}` ? String(year) : page.path === "/topics/qa-lifecycle" ? "QA Lifecycle" : page.path === "/tags/qa-lifecycle" ? "#qa-lifecycle" : `QA Public Routes ${suffix}`);
        if (page.path === `/articles/${slug}`) {
          expect(html).toContain(`QA Public Routes ${suffix}`);
          expect(html).toContain("By submitting, you acknowledge the handling of your details under our");
          expect(html).toContain('href="/privacy"');
        }
      }
      const homepage = await fetch(`${baseUrl}/`);
      expect(homepage.status).toBe(200);
      expect(await homepage.text()).toContain("By subscribing, you acknowledge the handling of your email as described in our");
    const archived = await caller.studio.posts.transition({ id: created.id, status: "archived" });
    expect(archived.status).toBe("archived");
    console.info(`[QA public routes] Archived temporary post ${created.id} (${slug}) after SSR route verification.`);
  }, 60_000);
});
