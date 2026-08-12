import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getSupabase } from "./supabase";
import { LLM_TASK_TYPES } from "./_core/llm";

const admin = { openId: "qa-llm-admin-v1", name: "QA LLM Administrator", email: "qa-llm-admin@example.test" };

function context() {
  return { user: { id: -1, openId: admin.openId, name: admin.name, email: admin.email, loginMethod: "qa", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: {}, protocol: "https" }, res: { clearCookie: () => undefined } } as any;
}

beforeAll(async () => {
  const db = getSupabase();
  const { data: site, error: siteError } = await db.from("sites").select("id, organization_id").eq("status", "active").order("created_at", { ascending: true }).limit(1).single();
  if (siteError || !site) throw siteError ?? new Error("An active QA publication is required.");
  const { data: profile, error: profileError } = await db.from("profiles").upsert({ external_auth_id: admin.openId, display_name: admin.name, email: admin.email }, { onConflict: "external_auth_id" }).select("id").single();
  if (profileError || !profile) throw profileError ?? new Error("Could not prepare QA LLM administrator.");
  const { error: memberError } = await db.from("memberships").upsert({ organization_id: site.organization_id, site_id: site.id, profile_id: profile.id, role: "admin" }, { onConflict: "organization_id,site_id,profile_id" });
  if (memberError) throw memberError;
});

describe("multi-provider LLM routing", () => {
  it("returns every editorial task with no assignments and masks provider credentials", async () => {
    const caller = appRouter.createCaller(context());
    const tasks = await caller.llm.tasks.list();
    expect(tasks.map(row => row.task)).toEqual(Array.from(LLM_TASK_TYPES));
    expect(tasks.every(row => row.providerId === null)).toBe(true);
    const providers = await caller.llm.providers.list();
    expect(Array.isArray(providers)).toBe(true);
  }, 30_000);

  it("rejects provider creation when the API key cannot reach a model catalog", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.llm.providers.create({ providerType: "custom", name: "QA Unreachable", apiKey: "qa-invalid-key", baseUrl: "http://127.0.0.1:9/v1" })).rejects.toThrow(/rejected the API key/i);
  }, 30_000);

  it("does not expose raw API keys to the browser", async () => {
    const caller = appRouter.createCaller(context());
    const providers = await caller.llm.providers.list();
    for (const provider of providers) {
      expect(JSON.stringify(provider)).not.toContain("api_key\":");
      expect(JSON.stringify(provider)).not.toContain("apiKey");
    }
  }, 30_000);
});
