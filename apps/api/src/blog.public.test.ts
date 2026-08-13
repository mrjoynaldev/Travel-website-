import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function publicContext(): TrpcContext {
  return {
    user: null,
    apiToken: null,
    req: new Request("http://localhost"),
    resHeaders: new Headers(),
  };
}

const describeDb = process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? describe : describe.skip;

describeDb("public publication feed", () => {
  it("returns a paginated feed from the configured Supabase project", async () => {
    const caller = appRouter.createCaller(publicContext());
    const feed = await caller.blog.list({ page: 1 });

    expect(Array.isArray(feed.items)).toBe(true);
    expect(feed.page).toBe(1);
    expect(feed.total).toBeGreaterThanOrEqual(0);
  }, 15_000);

  it("returns configured homepage sections with only public story data", async () => {
    const caller = appRouter.createCaller(publicContext());
    const sections = await caller.blog.sections();

    expect(Array.isArray(sections)).toBe(true);
    for (const section of sections) {
      expect(section.is_visible).toBe(true);
      expect(Array.isArray(section.posts)).toBe(true);
      expect(section.posts.every((post: { id: string; slug: string; title: string }) => Boolean(post.id && post.slug && post.title))).toBe(true);
      expect(section.posts.every((post: { organization_id?: string }) => !Object.prototype.hasOwnProperty.call(post, "organization_id"))).toBe(true);
      expect(section.rendered_html || "").not.toMatch(/<script|javascript:/i);
    }
  }, 15_000);
});
