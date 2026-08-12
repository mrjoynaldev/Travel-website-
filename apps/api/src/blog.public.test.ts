import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function publicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
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
});
