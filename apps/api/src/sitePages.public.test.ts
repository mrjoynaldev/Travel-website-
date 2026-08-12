import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const publicContext = { user: null, req: { headers: {}, protocol: "https" }, res: { clearCookie: () => undefined } } as any;

const describeDb = process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? describe : describe.skip;

describeDb("public site pages", () => {
  it("serves configured privacy, terms, and contact pages through the public reader API without unsafe script markup", async () => {
    const caller = appRouter.createCaller(publicContext);
    const pages = await caller.blog.pages();
    expect(pages.some(page => page.slug === "privacy" && page.page_type === "privacy")).toBe(true);
    expect(pages.some(page => page.slug === "terms" && page.page_type === "terms")).toBe(true);
    expect(pages.some(page => page.slug === "contact" && page.page_type === "contact")).toBe(true);
    const privacy = await caller.blog.pageBySlug({ slug: "privacy" });
    expect(privacy.title).toBe("Privacy policy");
    expect(privacy.rendered_html).toContain("Your privacy matters");
    expect(privacy.rendered_html).not.toMatch(/<script|javascript:/i);
    await expect(caller.blog.pageBySlug({ slug: "terms" })).resolves.toMatchObject({ title: "Terms of use", page_type: "terms" });
    await expect(caller.blog.pageBySlug({ slug: "contact" })).resolves.toMatchObject({ title: "Contact", page_type: "contact" });
  });
});
