import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock(import("./_core/llm"), async importOriginal => {
  const actual = await importOriginal<typeof import("./_core/llm")>();
  return {
    ...actual,
    invokeLLM: vi.fn().mockResolvedValue({ choices: [{ message: { content: "This is a safe, tenant-scoped QA analysis." } }] }),
    runTaskChat: vi.fn().mockResolvedValue({ content: "This is a safe, tenant-scoped QA analysis.", model: "qa-model", providerId: "qa-provider" }),
  };
});

import { appRouter } from "./routers";
import { getSupabase } from "./supabase";

const admin = { openId: "qa-agent-admin-v1", name: "QA Agent Administrator", email: "qa-agent-admin@example.test" };
const author = { openId: "qa-agent-author-v1", name: "QA Agent Author", email: "qa-agent-author@example.test" };
let organizationId = ""; let siteId = "";

function context(identity: typeof admin) { return { user: { id: -1, openId: identity.openId, name: identity.name, email: identity.email, loginMethod: "qa", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: {}, protocol: "https" }, res: { clearCookie: () => undefined } } as any; }

const describeDb = process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? describe : describe.skip;

describeDb("permissioned agent safeguards", () => {
  beforeAll(async () => {
  const db = getSupabase(); const { data: site, error } = await db.from("sites").select("id, organization_id").eq("status", "active").order("created_at", { ascending: true }).limit(1).single(); if (error || !site) throw error ?? new Error("No active publication found."); siteId = site.id; organizationId = site.organization_id;
  const { data: profiles, error: profileError } = await db.from("profiles").upsert([admin, author].map(person => ({ external_auth_id: person.openId, display_name: person.name, email: person.email })), { onConflict: "external_auth_id" }).select("id, external_auth_id"); if (profileError || !profiles) throw profileError ?? new Error("Could not seed QA agent profiles."); const ids = new Map(profiles.map(profile => [profile.external_auth_id, profile.id]));
  const { error: memberError } = await db.from("memberships").upsert([{ organization_id: organizationId, site_id: siteId, profile_id: ids.get(admin.openId), role: "admin" }, { organization_id: organizationId, site_id: siteId, profile_id: ids.get(author.openId), role: "author" }], { onConflict: "organization_id,site_id,profile_id" }); if (memberError) throw memberError;
});

describe("permissioned agent safeguards", () => {
  it("records analysis without direct tools and requires administrator approval before executing a prepared draft", async () => {
    const adminCaller = appRouter.createCaller(context(admin)); const message = await adminCaller.agent.ask({ prompt: "Analyze current editorial coverage and suggest a QA draft." }); expect(message.reply).toContain("tenant-scoped");
    const before = await adminCaller.studio.posts.list({ search: "QA agent approved draft" }); const proposal = await adminCaller.agent.actions.propose({ threadId: message.threadId, actionType: "create_draft", payload: { title: "QA agent approved draft", slug: `qa-agent-approved-${Date.now().toString(36)}`, content: "QA-only agent proposal content." } }); expect(proposal.status).toBe("proposed");
    const beforeApproval = await adminCaller.studio.posts.list({ search: "QA agent approved draft" }); expect(beforeApproval.length).toBe(before.length);
    const executed = await adminCaller.agent.actions.approve({ actionId: proposal.id, confirmed: true }); expect(executed.status).toBe("executed"); const result = executed.result as { createdPost?: { id: string } }; expect(result.createdPost?.id).toBeTruthy();
    const created = await adminCaller.studio.posts.get({ id: result.createdPost!.id }); expect(created.status).toBe("draft"); await adminCaller.studio.posts.transition({ id: created.id, status: "archived" });
  }, 30_000);

  it("rejects action approval by an author even when the proposal is in the same tenant", async () => {
    const adminCaller = appRouter.createCaller(context(admin)); const authorCaller = appRouter.createCaller(context(author)); const message = await authorCaller.agent.ask({ prompt: "Suggest a category for QA." }); const action = await authorCaller.agent.actions.propose({ threadId: message.threadId, actionType: "create_category", payload: { name: "QA Agent Taxonomy" } });
    await expect(authorCaller.agent.actions.approve({ actionId: action.id, confirmed: true })).rejects.toThrow(/permission/i);
    const pending = await adminCaller.agent.actions.list(); expect(pending.find(item => item.id === action.id)?.status).toBe("proposed"); await adminCaller.agent.actions.reject({ actionId: action.id, confirmed: true });
  }, 30_000);
});
});
