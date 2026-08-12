import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { assertRole, getActor, recordAudit } from "../blog";
import { chatWithProvider, LLM_PROVIDER_TYPES, LLM_TASK_TYPES, listProviderModels, maskApiKey } from "../_core/llm";
import { getSupabase } from "../supabase";
import { protectedProcedure, router } from "../_core/trpc";

const providerTypeSchema = z.enum(LLM_PROVIDER_TYPES);
const taskSchema = z.enum(LLM_TASK_TYPES);

const normalizeBaseUrl = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
};

async function actorFor(ctx: { user: { openId: string; name: string | null; email: string | null } }) {
  return getActor({ openId: ctx.user.openId, name: ctx.user.name, email: ctx.user.email });
}

async function providerRowFor(actor: { organizationId: string; siteId: string }, providerId: string) {
  const { data, error } = await getSupabase()
    .from("llm_providers")
    .select("*")
    .eq("id", providerId)
    .eq("organization_id", actor.organizationId)
    .eq("site_id", actor.siteId)
    .maybeSingle();
  if (error || !data) throw new TRPCError({ code: "NOT_FOUND", message: "AI provider not found." });
  return data;
}

export const llmRouter = router({
  providers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin"]);
      const { data, error } = await getSupabase()
        .from("llm_providers")
        .select("id, provider_type, name, base_url, is_active, created_at, updated_at")
        .eq("organization_id", actor.organizationId)
        .eq("site_id", actor.siteId)
        .order("created_at", { ascending: true });
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load AI providers." });
      const { data: keys, error: keyError } = await getSupabase()
        .from("llm_providers")
        .select("id, api_key")
        .eq("organization_id", actor.organizationId)
        .eq("site_id", actor.siteId);
      if (keyError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load AI provider credentials." });
      const masked = new Map((keys ?? []).map(row => [row.id, maskApiKey(row.api_key)]));
      return (data ?? []).map(row => ({ ...row, api_key_masked: masked.get(row.id) ?? "" }));
    }),

    create: protectedProcedure.input(z.object({ providerType: providerTypeSchema, name: z.string().trim().min(1).max(80), apiKey: z.string().trim().min(4).max(4000), baseUrl: z.string().trim().max(2048).optional() })).mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin"]);
      const providerType = input.providerType;
      const baseUrl = normalizeBaseUrl(input.baseUrl);
      if (providerType === "custom" && !baseUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "Custom providers need a base URL, e.g. https://your-gateway.example/v1." });

      const probe = {
        id: "probe",
        providerType,
        name: input.name,
        baseUrl,
        apiKey: input.apiKey,
        isActive: true,
      };
      let models: { id: string }[] = [];
      try {
        models = await listProviderModels(probe);
      } catch (probeError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `The provider rejected the API key: ${probeError instanceof Error ? probeError.message : "unreachable"}` });
      }

      const { data, error } = await getSupabase()
        .from("llm_providers")
        .insert({ organization_id: actor.organizationId, site_id: actor.siteId, provider_type: providerType, name: input.name, base_url: baseUrl, api_key: input.apiKey, is_active: true })
        .select("id, provider_type, name, base_url, is_active")
        .single();
      if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "The provider could not be saved. The name may already be in use." });

      await recordAudit(actor, "llm.provider_created", "llm_provider", data.id, { providerType, modelsDiscovered: models.length });
      return { provider: data, models };
    }),

    update: protectedProcedure.input(z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(80).optional(), apiKey: z.string().trim().max(4000).optional(), baseUrl: z.string().trim().max(2048).nullable().optional(), isActive: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin"]);
      const existing = await providerRowFor(actor, input.id);
      const patch: Record<string, unknown> = {};
      if (input.name && input.name !== existing.name) patch.name = input.name;
      if (input.apiKey) patch.api_key = input.apiKey;
      if (typeof input.baseUrl === "string" || input.baseUrl === null) patch.base_url = normalizeBaseUrl(input.baseUrl ?? undefined);
      if (typeof input.isActive === "boolean") patch.is_active = input.isActive;
      if (Object.keys(patch).length === 0) return existing;
      const { data, error } = await getSupabase()
        .from("llm_providers")
        .update(patch)
        .eq("id", existing.id)
        .eq("organization_id", actor.organizationId)
        .eq("site_id", actor.siteId)
        .select("id, provider_type, name, base_url, is_active")
        .single();
      if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "The provider could not be updated." });
      await recordAudit(actor, "llm.provider_updated", "llm_provider", data.id, { fields: Object.keys(patch) });
      return data;
    }),

    remove: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin"]);
      const existing = await providerRowFor(actor, input.id);
      const { error } = await getSupabase()
        .from("llm_providers")
        .delete()
        .eq("id", existing.id)
        .eq("organization_id", actor.organizationId)
        .eq("site_id", actor.siteId);
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: "The provider could not be removed." });
      await recordAudit(actor, "llm.provider_removed", "llm_provider", input.id, { providerType: existing.provider_type });
      return { success: true };
    }),

    models: protectedProcedure.input(z.object({ providerId: z.string().uuid() })).query(async ({ ctx, input }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin"]);
      const row = await providerRowFor(actor, input.providerId);
      try {
        const models = await listProviderModels({ id: row.id, providerType: row.provider_type, name: row.name, baseUrl: row.base_url, apiKey: row.api_key, isActive: row.is_active });
        return models;
      } catch (modelsError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Could not load models: ${modelsError instanceof Error ? modelsError.message : "unreachable"}` });
      }
    }),

    test: protectedProcedure.input(z.object({ providerId: z.string().uuid(), model: z.string().trim().min(1).max(200) })).mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin"]);
      const row = await providerRowFor(actor, input.providerId);
      try {
        const result = await chatWithProvider({ id: row.id, providerType: row.provider_type, name: row.name, baseUrl: row.base_url, apiKey: row.api_key, isActive: row.is_active }, {
          model: input.model,
          messages: [{ role: "system", content: "Reply with exactly: OK" }, { role: "user", content: "Connection test." }],
          maxTokens: 20,
        });
        return { ok: true, content: result.content.slice(0, 400), model: result.model };
      } catch (testError) {
        return { ok: false, content: testError instanceof Error ? testError.message : "The provider request failed." };
      }
    }),
  }),

  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin"]);
      const db = getSupabase();
      const [settings, providers] = await Promise.all([
        db.from("llm_task_settings").select("task, model, provider_id").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId),
        db.from("llm_providers").select("id, name, provider_type").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).eq("is_active", true),
      ]);
      if (settings.error || providers.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load AI task routing." });
      const providerName = new Map((providers.data ?? []).map(row => [row.id, row]));
      return LLM_TASK_TYPES.map(task => {
        const assignment = (settings.data ?? []).find(row => row.task === task);
        const provider = assignment?.provider_id ? providerName.get(assignment.provider_id) : undefined;
        return { task, model: assignment?.model ?? null, providerId: assignment?.provider_id ?? null, providerName: provider?.name ?? null, providerType: provider?.provider_type ?? null };
      });
    }),

    set: protectedProcedure.input(z.object({ task: taskSchema, providerId: z.string().uuid(), model: z.string().trim().min(1).max(200) })).mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin"]);
      await providerRowFor(actor, input.providerId);
      const { data, error } = await getSupabase()
        .from("llm_task_settings")
        .upsert({ organization_id: actor.organizationId, site_id: actor.siteId, task: input.task, provider_id: input.providerId, model: input.model }, { onConflict: "site_id,task" })
        .select("task, model, provider_id")
        .single();
      if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "The task routing could not be saved." });
      await recordAudit(actor, "llm.task_routed", "llm_task_settings", null, { task: data.task, model: data.model, providerId: data.provider_id });
      return data;
    }),

    status: protectedProcedure.query(async ({ ctx }) => {
      const actor = await actorFor(ctx);
      assertRole(actor, ["admin", "editor", "author"]);
      const { data, error } = await getSupabase()
        .from("llm_task_settings")
        .select("task, model, llm_providers(name, provider_type)")
        .eq("organization_id", actor.organizationId)
        .eq("site_id", actor.siteId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load AI status." });
      const rows = new Map<string, { model: string; provider: string }>();
      for (const row of data ?? []) {
        const provider = Array.isArray((row as any).llm_providers) ? (row as any).llm_providers[0] : (row as any).llm_providers;
        rows.set(row.task, { model: row.model, provider: provider?.name ?? "Unknown provider" });
      }
      return { configured: rows.size, assignments: Object.fromEntries(rows) };
    }),
  }),
});
