import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { assertCanEditPost, assertRole, canTransition, editorDocumentSchema, getActor, getAnalyticsSummary, getPostForActor, POST_STATUSES, publishScheduled, queueWorkflowNotifications, recordAudit, sanitizeArticleHtml, saveRevision, uploadInputSchema, uploadMedia } from "../blog";
import { generateApiToken } from "../_core/apiTokens";
import { getSupabase } from "../supabase";
import { dispatchPendingNotifications } from "../email";
import { protectedProcedure, router } from "../_core/trpc";

const postInput = z.object({
  title: z.string().trim().min(1).max(180), slug: z.string().trim().max(180).optional(), excerpt: z.string().max(500).optional(),
  contentJson: editorDocumentSchema, renderedHtml: z.string().max(500_000), metaTitle: z.string().max(180).optional(), metaDescription: z.string().max(320).optional(), canonicalUrl: z.string().url().max(2048).optional().or(z.literal("")), ogImageUrl: z.string().url().max(2048).optional().or(z.literal("")), featuredMediaId: z.string().uuid().nullable().optional(), categoryIds: z.array(z.string().uuid()).max(8).default([]), tagIds: z.array(z.string().uuid()).max(20).default([]),
});

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 150) || "untitled-post";

async function actorFor(ctx: any) { return getActor({ openId: ctx.user.openId, name: ctx.user.name, email: ctx.user.email }); }
async function syncTaxonomy(postId: string, categoryIds: string[], tagIds: string[]) {
  const db = getSupabase();
  const [deleteCategories, deleteTags] = await Promise.all([db.from("post_categories").delete().eq("post_id", postId), db.from("post_tags").delete().eq("post_id", postId)]);
  if (deleteCategories.error || deleteTags.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not update taxonomy." });
  if (categoryIds.length) {
    const { error } = await db.from("post_categories").insert(categoryIds.map(category_id => ({ post_id: postId, category_id })));
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: "One or more selected categories are invalid." });
  }
  if (tagIds.length) {
    const { error } = await db.from("post_tags").insert(tagIds.map(tag_id => ({ post_id: postId, tag_id })));
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: "One or more selected tags are invalid." });
  }
}

async function assertSectionSource(actor: any, sectionType: "featured" | "latest" | "category" | "tag" | "custom", categoryId: string | null | undefined, tagId: string | null | undefined) {
  if (sectionType === "category") {
    if (!categoryId) throw new TRPCError({ code: "BAD_REQUEST", message: "A category section requires a category." });
    const { data, error } = await getSupabase().from("categories").select("id").eq("id", categoryId).eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).maybeSingle();
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not validate the category section source." });
    if (!data) throw new TRPCError({ code: "FORBIDDEN", message: "That category does not belong to this publication." });
    if (tagId) throw new TRPCError({ code: "BAD_REQUEST", message: "A category section cannot also use a tag." });
    return;
  }
  if (sectionType === "tag") {
    if (!tagId) throw new TRPCError({ code: "BAD_REQUEST", message: "A tag section requires a tag." });
    const { data, error } = await getSupabase().from("tags").select("id").eq("id", tagId).eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).maybeSingle();
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not validate the tag section source." });
    if (!data) throw new TRPCError({ code: "FORBIDDEN", message: "That tag does not belong to this publication." });
    if (categoryId) throw new TRPCError({ code: "BAD_REQUEST", message: "A tag section cannot also use a category." });
    return;
  }
  if (categoryId || tagId) throw new TRPCError({ code: "BAD_REQUEST", message: "This homepage section type cannot use a category or tag source." });
}

export const studioRouter = router({
  bootstrap: protectedProcedure.query(async ({ ctx }) => {
    const actor = await actorFor(ctx);
    const { data: site } = await getSupabase().from("sites").select("id, name, slug, description").eq("id", actor.siteId).single();
    return { actor, site };
  }),

  posts: router({
    list: protectedProcedure.input(z.object({ status: z.enum(POST_STATUSES).optional(), search: z.string().trim().max(100).optional() })).query(async ({ ctx, input }) => {
      const actor = await actorFor(ctx); const db = getSupabase();
      await publishScheduled(actor.siteId);
      let query = db.from("posts").select("id, title, slug, status, excerpt, updated_at, published_at, submitted_at, scheduled_at, featured, author_id, profiles!posts_author_id_fkey(display_name)").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).is("deleted_at", null).order("updated_at", { ascending: false });
      if (actor.role === "author") query = query.eq("author_id", actor.profileId);
      if (input.status) query = query.eq("status", input.status);
      if (input.search) query = query.ilike("title", `%${input.search.replace(/[,%]/g, "")}%`);
      const { data, error } = await query.limit(100);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load posts." });
      return data ?? [];
    }),
    get: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
      const actor = await actorFor(ctx); const { post } = await assertCanEditPost(actor, input.id);
      const [categories, tags] = await Promise.all([
        getSupabase().from("post_categories").select("category_id").eq("post_id", post.id),
        getSupabase().from("post_tags").select("tag_id").eq("post_id", post.id),
      ]);
      if (categories.error || tags.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load post taxonomy." });
      return { ...post, categoryIds: (categories.data ?? []).map(row => row.category_id), tagIds: (tags.data ?? []).map(row => row.tag_id) };
    }),
    create: protectedProcedure.input(postInput).mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor", "author"]); const db = getSupabase();
      const slug = slugify(input.slug || input.title);
      const { data, error } = await db.from("posts").insert({ organization_id: actor.organizationId, site_id: actor.siteId, author_id: actor.profileId, title: input.title, slug, excerpt: input.excerpt ?? null, content_json: input.contentJson, rendered_html: sanitizeArticleHtml(input.renderedHtml), meta_title: input.metaTitle ?? null, meta_description: input.metaDescription ?? null, canonical_url: input.canonicalUrl || null, og_image_url: input.ogImageUrl || null, featured_media_id: input.featuredMediaId ?? null }).select("*").single();
      if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "The post could not be created. The slug may already exist." });
      await syncTaxonomy(data.id, input.categoryIds, input.tagIds);
      await recordAudit(actor, "post.created", "post", data.id, { status: data.status });
      return data;
    }),
    update: protectedProcedure.input(z.object({ id: z.string().uuid(), data: postInput, revisionNote: z.string().max(300).default("Content updated") })).mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx); const { post } = await assertCanEditPost(actor, input.id); await saveRevision(actor, post, input.revisionNote);
      const { data, error } = await getSupabase().from("posts").update({ title: input.data.title, slug: slugify(input.data.slug || input.data.title), excerpt: input.data.excerpt ?? null, content_json: input.data.contentJson, rendered_html: sanitizeArticleHtml(input.data.renderedHtml), meta_title: input.data.metaTitle ?? null, meta_description: input.data.metaDescription ?? null, canonical_url: input.data.canonicalUrl || null, og_image_url: input.data.ogImageUrl || null, featured_media_id: input.data.featuredMediaId ?? null }).eq("id", post.id).select("*").single();
      if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "The post could not be saved. The slug may already exist." });
      await syncTaxonomy(data.id, input.data.categoryIds, input.data.tagIds);
      await recordAudit(actor, "post.updated", "post", data.id, { status: data.status });
      return data;
    }),
    transition: protectedProcedure.input(z.object({ id: z.string().uuid(), status: z.enum(POST_STATUSES), rejectionNote: z.string().max(500).optional() })).mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx); const { post, ownsPost } = await assertCanEditPost(actor, input.id);
      if (!canTransition(actor.role, post.status, input.status, ownsPost)) throw new TRPCError({ code: "FORBIDDEN", message: "This workflow transition is not permitted." });
      const patch: Record<string, unknown> = { status: input.status, reviewer_id: actor.role === "author" ? post.reviewer_id : actor.profileId };
      // Restoring a trashed post (archived + deleted_at) back to draft clears the
      // soft-delete marker so it reappears in Studio and can be re-published.
      if (input.status === "draft" && post.deleted_at) patch.deleted_at = null;
      const { data, error } = await getSupabase().from("posts").update(patch).eq("id", post.id).select("*").single();
      if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "The workflow transition could not be completed." });
      await queueWorkflowNotifications(actor, post, post.status, input.status, input.rejectionNote);
      await recordAudit(actor, "post.workflow_transition", "post", post.id, { from: post.status, to: input.status });
      await dispatchPendingNotifications(actor.siteId, post.id);
      return data;
    }),
    revisions: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
      const actor = await actorFor(ctx); await assertCanEditPost(actor, input.id);
      const { data, error } = await getSupabase().from("post_revisions").select("id, revision_number, title, summary, created_at, editor_id, profiles!post_revisions_editor_id_fkey(display_name)").eq("post_id", input.id).order("revision_number", { ascending: false });
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load revisions." }); return data ?? [];
    }),
    restore: protectedProcedure.input(z.object({ postId: z.string().uuid(), revisionId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor"]); const { post } = await assertCanEditPost(actor, input.postId);
      const { data: revision, error } = await getSupabase().from("post_revisions").select("*").eq("id", input.revisionId).eq("post_id", input.postId).maybeSingle();
      if (error || !revision) throw new TRPCError({ code: "NOT_FOUND", message: "Revision not found." }); await saveRevision(actor, post, "Revision restored");
      const { data, error: updateError } = await getSupabase().from("posts").update({ title: revision.title, content_json: revision.content_json, rendered_html: revision.rendered_html }).eq("id", input.postId).select("*").single();
      if (updateError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not restore the revision." }); return data;
    }),
    schedule: protectedProcedure.input(z.object({ id: z.string().uuid(), scheduledAt: z.string().datetime().optional(), clear: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor"]); const { post } = await assertCanEditPost(actor, input.id);
      if (!["draft", "review"].includes(post.status)) throw new TRPCError({ code: "FORBIDDEN", message: "Only draft or review posts can be scheduled." });
      if (!input.clear && !input.scheduledAt) throw new TRPCError({ code: "BAD_REQUEST", message: "A publication time is required." });
      const patch: Record<string, unknown> = input.clear ? { scheduled_at: null } : { scheduled_at: input.scheduledAt };
      if (!input.clear && post.status === "draft") patch.status = "review";
      const { data, error } = await getSupabase().from("posts").update(patch).eq("id", post.id).select("*").single();
      if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "The schedule could not be saved." });
      await recordAudit(actor, "post.scheduled", "post", post.id, { scheduledAt: input.clear ? null : input.scheduledAt });
      return data;
    }),
    toggleFeatured: protectedProcedure.input(z.object({ id: z.string().uuid(), featured: z.boolean() })).mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor"]); const { post } = await assertCanEditPost(actor, input.id);
      const { data, error } = await getSupabase().from("posts").update({ featured: input.featured }).eq("id", post.id).select("*").single();
      if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "The featured flag could not be updated." });
      await recordAudit(actor, "post.featured_updated", "post", post.id, { featured: input.featured });
      return data;
    }),
    remove: protectedProcedure.input(z.object({ id: z.string().uuid(), confirmed: z.literal(true) })).mutation(async ({ ctx, input }) => {
      const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor"]); const { post } = await assertCanEditPost(actor, input.id);
      const { data, error } = await getSupabase().from("posts").update({ deleted_at: new Date().toISOString(), status: "archived" }).eq("id", post.id).eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).select("*").single();
      if (error || !data) throw new TRPCError({ code: "NOT_FOUND", message: "The post could not be deleted." });
      await recordAudit(actor, "post.deleted", "post", post.id, { softDeleted: true });
      return data;
    }),
  }),

  taxonomy: router({
    list: protectedProcedure.query(async ({ ctx }) => { const actor = await actorFor(ctx); const [categories, tags] = await Promise.all([getSupabase().from("categories").select("*").eq("site_id", actor.siteId).order("name"), getSupabase().from("tags").select("*").eq("site_id", actor.siteId).order("name")]); if (categories.error || tags.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load taxonomy." }); return { categories: categories.data ?? [], tags: tags.data ?? [] }; }),
    createCategory: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(100), description: z.string().max(300).optional() })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor"]); const { data, error } = await getSupabase().from("categories").insert({ organization_id: actor.organizationId, site_id: actor.siteId, name: input.name, slug: slugify(input.name), description: input.description ?? null }).select("*").single(); if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "Category could not be created." }); await recordAudit(actor, "taxonomy.category_created", "category", data.id, { name: data.name }); return data; }),
    createTag: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(80) })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor"]); const { data, error } = await getSupabase().from("tags").insert({ organization_id: actor.organizationId, site_id: actor.siteId, name: input.name, slug: slugify(input.name) }).select("*").single(); if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "Tag could not be created." }); await recordAudit(actor, "taxonomy.tag_created", "tag", data.id, { name: data.name }); return data; }),
  }),

  media: router({
    list: protectedProcedure.input(z.object({ folder: z.string().max(80).optional(), search: z.string().max(100).optional() })).query(async ({ ctx, input }) => { const actor = await actorFor(ctx); let query = getSupabase().from("media_assets").select("*").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).order("created_at", { ascending: false }); if (input.folder) query = query.eq("folder", input.folder); if (input.search) query = query.ilike("filename", `%${input.search.replace(/[,%]/g, "")}%`); const { data, error } = await query.limit(150); if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load media." }); return data ?? []; }),
    upload: protectedProcedure.input(uploadInputSchema).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor", "author"]); return uploadMedia(actor, input); }),
  }),

  moderation: router({
    list: protectedProcedure.input(z.object({ status: z.enum(["pending", "approved", "rejected", "deleted"]).default("pending") })).query(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor"]); const { data, error } = await getSupabase().from("comments").select("*, posts(title, slug)").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).eq("status", input.status).order("created_at", { ascending: true }); if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load the moderation queue." }); return data ?? []; }),
    resolve: protectedProcedure.input(z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected", "deleted"]), note: z.string().max(500).optional() })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor"]); const { data, error } = await getSupabase().from("comments").update({ status: input.status, moderation_note: input.note ?? null, reviewed_by: actor.profileId, reviewed_at: new Date().toISOString() }).eq("id", input.id).eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).select("*").single(); if (error || !data) throw new TRPCError({ code: "NOT_FOUND", message: "Comment could not be moderated." }); await recordAudit(actor, "comment.moderated", "comment", data.id, { status: input.status }); return data; }),
  }),

  people: router({
    list: protectedProcedure.query(async ({ ctx }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const { data, error } = await getSupabase().from("memberships").select("id, role, created_at, profiles(id, display_name, email, bio, avatar_url)").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).order("created_at"); if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load editorial users." }); return data ?? []; }),
    changeRole: protectedProcedure.input(z.object({ membershipId: z.string().uuid(), role: z.enum(["admin", "editor", "author"]) })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const { data, error } = await getSupabase().from("memberships").update({ role: input.role }).eq("id", input.membershipId).eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).select("*").single(); if (error || !data) throw new TRPCError({ code: "NOT_FOUND", message: "Role could not be updated." }); await recordAudit(actor, "membership.role_updated", "membership", data.id, { role: input.role }); return data; }),
  }),

  analytics: protectedProcedure.input(z.object({ from: z.string().datetime().optional(), to: z.string().datetime().optional() })).query(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor", "author"]); const to = input.to ?? new Date().toISOString(); const from = input.from ?? new Date(Date.now() - 30 * 86400000).toISOString(); return getAnalyticsSummary(actor, from, to); }),

  notifications: protectedProcedure.query(async ({ ctx }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor"]); const { data, error } = await getSupabase().from("notification_outbox").select("*").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).order("created_at", { ascending: false }).limit(100); if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load notification outbox." }); return data ?? []; }),

  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const [site, settings] = await Promise.all([getSupabase().from("sites").select("id, name, slug, description, custom_domain, theme_settings").eq("id", actor.siteId).single(), getSupabase().from("site_settings").select("*").eq("site_id", actor.siteId).maybeSingle()]); if (site.error || !site.data || settings.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load site settings." }); return { site: site.data, settings: settings.data }; }),
    update: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(120), description: z.string().max(500).optional(), customDomain: z.string().trim().max(253).optional(), themeSettings: z.record(z.string(), z.unknown()).default({}), navigation: z.array(z.object({ label: z.string().trim().min(1).max(40), path: z.string().trim().min(1).max(300) })).max(20).default([]), defaultLocale: z.string().trim().min(2).max(12).default("en"), timezone: z.string().trim().min(1).max(64).default("UTC"), seoDefaults: z.record(z.string(), z.unknown()).default({}), featureFlags: z.record(z.string(), z.boolean()).default({}), brand: z.object({ tagline: z.string().max(180).optional(), logoUrl: z.string().url().max(2048).optional().or(z.literal("")), logoAlt: z.string().max(160).optional(), faviconUrl: z.string().url().max(2048).optional().or(z.literal("")), defaultOgImageUrl: z.string().url().max(2048).optional().or(z.literal("")), primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(), accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional() }).default({}), footerLinks: z.array(z.object({ label: z.string().trim().min(1).max(60), path: z.string().trim().min(1).max(300) })).max(20).default([]), contact: z.object({ email: z.string().email().max(320).optional().or(z.literal("")), name: z.string().max(120).optional() }).default({}) })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const db = getSupabase(); const { error: siteError } = await db.from("sites").update({ name: input.name, description: input.description || null, custom_domain: input.customDomain || null, theme_settings: input.themeSettings }).eq("id", actor.siteId).eq("organization_id", actor.organizationId); if (siteError) throw new TRPCError({ code: "BAD_REQUEST", message: "The site settings could not be saved. The custom domain may already belong to another site." }); const { data, error } = await db.from("site_settings").upsert({ organization_id: actor.organizationId, site_id: actor.siteId, navigation: input.navigation, default_locale: input.defaultLocale, timezone: input.timezone, seo_defaults: input.seoDefaults, feature_flags: input.featureFlags, brand: input.brand, footer_links: input.footerLinks, contact: input.contact, updated_by: actor.profileId }, { onConflict: "site_id" }).select("*").single(); if (error || !data) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The scoped settings record could not be saved." }); await recordAudit(actor, "site.settings_updated", "site", actor.siteId, { changed: ["name", "description", "customDomain", "themeSettings", "navigation", "seoDefaults", "featureFlags", "brand", "footerLinks", "contact"] }); return data; }),
  }),

  pages: router({
    list: protectedProcedure.query(async ({ ctx }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor"]); const { data, error } = await getSupabase().from("site_pages").select("id, page_type, title, slug, status, meta_title, meta_description, updated_at, published_at").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).order("page_type"); if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load site pages." }); return data ?? []; }),
    get: protectedProcedure.input(z.object({ pageType: z.enum(["privacy", "terms", "contact", "custom"]) })).query(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor"]); const { data, error } = await getSupabase().from("site_pages").select("*").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).eq("page_type", input.pageType).maybeSingle(); if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load this site page." }); return data; }),
    save: protectedProcedure.input(z.object({ pageType: z.enum(["privacy", "terms", "contact", "custom"]), title: z.string().trim().min(1).max(180), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120), contentJson: editorDocumentSchema, renderedHtml: z.string().max(300_000), metaTitle: z.string().max(180).optional(), metaDescription: z.string().max(320).optional(), status: z.enum(["draft", "published", "archived"]).default("published") })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const { data, error } = await getSupabase().from("site_pages").upsert({ organization_id: actor.organizationId, site_id: actor.siteId, author_id: actor.profileId, page_type: input.pageType, title: input.title, slug: input.slug, content_json: input.contentJson, rendered_html: sanitizeArticleHtml(input.renderedHtml), meta_title: input.metaTitle || null, meta_description: input.metaDescription || null, status: input.status }, { onConflict: "site_id,page_type" }).select("*").single(); if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "The site page could not be saved. Its slug may already be in use." }); await recordAudit(actor, "site_page.saved", "site_page", data.id, { pageType: data.page_type, status: data.status }); return data; }),
  }),

  audit: router({
    list: protectedProcedure.input(z.object({ resourceType: z.string().max(80).optional(), limit: z.number().int().min(1).max(200).default(100) })).query(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); let query = getSupabase().from("audit_events").select("id, action, resource_type, resource_id, metadata, created_at, profiles!audit_events_actor_profile_id_fkey(display_name, email)").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).order("created_at", { ascending: false }).limit(input.limit); if (input.resourceType) query = query.eq("resource_type", input.resourceType); const { data, error } = await query; if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load audit events." }); return data ?? []; }),
  }),

  sections: router({
    list: protectedProcedure.query(async ({ ctx }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor"]); const { data, error } = await getSupabase().from("site_sections").select("*, categories(name, slug), tags(name, slug)").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).order("sort_order"); if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load homepage sections." }); return data ?? []; }),    create: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(120), sectionType: z.enum(["featured", "latest", "category", "tag", "custom"]), categoryId: z.string().uuid().nullable().optional(), tagId: z.string().uuid().nullable().optional(), subtitle: z.string().max(300).optional(), renderedHtml: z.string().max(50_000).optional(), isVisible: z.boolean().default(true) })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); await assertSectionSource(actor, input.sectionType, input.categoryId, input.tagId); const db = getSupabase();
 const { data: last } = await db.from("site_sections").select("sort_order").eq("site_id", actor.siteId).order("sort_order", { ascending: false }).limit(1).maybeSingle(); const { data, error } = await db.from("site_sections").insert({ organization_id: actor.organizationId, site_id: actor.siteId, title: input.title, section_type: input.sectionType, category_id: input.categoryId ?? null, tag_id: input.tagId ?? null, subtitle: input.subtitle ?? null, rendered_html: sanitizeArticleHtml(input.renderedHtml ?? ""), sort_order: (last?.sort_order ?? -1) + 1, is_visible: input.isVisible }).select("*").single(); if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "The section could not be created. A category or tag section requires its source selected." }); await recordAudit(actor, "section.created", "site_section", data.id, { sectionType: data.section_type, title: data.title }); return data; }),    update: protectedProcedure.input(z.object({ id: z.string().uuid(), title: z.string().trim().min(1).max(120), sectionType: z.enum(["featured", "latest", "category", "tag", "custom"]), categoryId: z.string().uuid().nullable().optional(), tagId: z.string().uuid().nullable().optional(), subtitle: z.string().max(300).optional(), renderedHtml: z.string().max(50_000).optional(), sortOrder: z.number().int().min(0).max(10_000), isVisible: z.boolean() })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); await assertSectionSource(actor, input.sectionType, input.categoryId, input.tagId); const { data, error } = await getSupabase().from("site_sections").update({
 title: input.title, section_type: input.sectionType, category_id: input.categoryId ?? null, tag_id: input.tagId ?? null, subtitle: input.subtitle ?? null, rendered_html: sanitizeArticleHtml(input.renderedHtml ?? ""), sort_order: input.sortOrder, is_visible: input.isVisible }).eq("id", input.id).eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).select("*").single(); if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "The section could not be saved." }); await recordAudit(actor, "section.updated", "site_section", data.id, { sectionType: data.section_type, title: data.title }); return data; }),
    reorder: protectedProcedure.input(z.object({ ids: z.array(z.string().uuid()).min(1).max(100) })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const { data: current, error: readError } = await getSupabase().from("site_sections").select("id").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId); if (readError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not read homepage sections." }); const currentIds = (current ?? []).map(item => item.id); const submitted = new Set(input.ids); if (submitted.size !== currentIds.length || currentIds.some(id => !submitted.has(id))) throw new TRPCError({ code: "BAD_REQUEST", message: "The section order must include every section exactly once." }); for (const [index, id] of input.ids.entries()) { const { error } = await getSupabase().from("site_sections").update({ sort_order: index }).eq("id", id).eq("organization_id", actor.organizationId).eq("site_id", actor.siteId); if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not save the homepage section order." }); } await recordAudit(actor, "section.reordered", "site_section", null, { order: input.ids }); return { success: true }; }),
    remove: protectedProcedure.input(z.object({ id: z.string().uuid(), confirmed: z.literal(true) })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const { data, error } = await getSupabase().from("site_sections").delete().eq("id", input.id).eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).select("*").single(); if (error || !data) throw new TRPCError({ code: "NOT_FOUND", message: "The section could not be removed." }); await recordAudit(actor, "section.removed", "site_section", data.id, { sectionType: data.section_type, title: data.title }); return { success: true }; }),
  }),

  capabilities: router({
    list: protectedProcedure.query(async ({ ctx }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const [catalog, policy] = await Promise.all([getSupabase().from("capabilities").select("*").order("capability_key"), getSupabase().from("site_role_capabilities").select("id, role, capability_id, allowed").eq("site_id", actor.siteId)]); if (catalog.error || policy.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load the capability policy." }); return { catalog: catalog.data ?? [], policy: policy.data ?? [] }; }),
    set: protectedProcedure.input(z.object({ role: z.enum(["admin", "editor", "author"]), capabilityId: z.string().uuid(), allowed: z.boolean(), confirmed: z.literal(true) })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const { data, error } = await getSupabase().from("site_role_capabilities").upsert({ organization_id: actor.organizationId, site_id: actor.siteId, role: input.role, capability_id: input.capabilityId, allowed: input.allowed }, { onConflict: "site_id,role,capability_id" }).select("*").single(); if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "The capability policy could not be updated." }); await recordAudit(actor, "capability.policy_updated", "capability", input.capabilityId, { role: input.role, allowed: input.allowed, confirmed: true }); return data; }),
  }),

  subscribers: router({
    list: protectedProcedure.query(async ({ ctx }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin", "editor"]); const { data, error } = await getSupabase().from("subscribers").select("id, email, status, consented_at, unsubscribed_at, created_at").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).order("created_at", { ascending: false }).limit(500); if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load subscribers." }); return data ?? []; }),
    remove: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const { error } = await getSupabase().from("subscribers").delete().eq("id", input.id).eq("organization_id", actor.organizationId).eq("site_id", actor.siteId); if (error) throw new TRPCError({ code: "NOT_FOUND", message: "The subscriber could not be removed." }); await recordAudit(actor, "subscriber.removed", "subscriber", input.id, {}); return { success: true }; }),
  }),

  apiTokens: router({
    list: protectedProcedure.query(async ({ ctx }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const { data, error } = await getSupabase().from("api_tokens").select("id, name, token_prefix, scopes, last_used_at, expires_at, revoked_at, created_at").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).order("created_at", { ascending: false }); if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load API tokens." }); return data ?? []; }),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(80), scopes: z.array(z.enum(["read", "write"])).min(1).default(["read", "write"]), expiresAt: z.string().datetime().optional() })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const { token, hash, prefix } = generateApiToken(); const { data, error } = await getSupabase().from("api_tokens").insert({ organization_id: actor.organizationId, site_id: actor.siteId, profile_id: actor.profileId, name: input.name, token_hash: hash, token_prefix: prefix, scopes: input.scopes, expires_at: input.expiresAt ?? null }).select("id, name, token_prefix, scopes, created_at").single(); if (error || !data) throw new TRPCError({ code: "BAD_REQUEST", message: "The token could not be created." }); await recordAudit(actor, "api_token.created", "api_token", data.id, { name: data.name, scopes: input.scopes }); return { ...data, token }; }),
    revoke: protectedProcedure.input(z.object({ id: z.string().uuid(), confirmed: z.literal(true) })).mutation(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const { data, error } = await getSupabase().from("api_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", input.id).eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).select("id").single(); if (error || !data) throw new TRPCError({ code: "NOT_FOUND", message: "The token could not be revoked." }); await recordAudit(actor, "api_token.revoked", "api_token", input.id, {}); return { success: true }; }),
  }),

  exportContent: protectedProcedure.input(z.object({ format: z.enum(["json", "markdown"]).default("json") })).query(async ({ ctx, input }) => { const actor = await actorFor(ctx); assertRole(actor, ["admin"]); const db = getSupabase(); const [posts, categories, tags, media, subscribers] = await Promise.all([db.from("posts").select("*").eq("organization_id", actor.organizationId).eq("site_id", actor.siteId).is("deleted_at", null).order("created_at"), db.from("categories").select("*").eq("site_id", actor.siteId).order("name"), db.from("tags").select("*").eq("site_id", actor.siteId).order("name"), db.from("media_assets").select("*").eq("site_id", actor.siteId).order("created_at"), db.from("subscribers").select("email, status, consented_at, created_at").eq("site_id", actor.siteId).order("created_at")]); if (posts.error || categories.error || tags.error || media.error || subscribers.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not prepare the content export." }); await recordAudit(actor, "content.exported", "site", actor.siteId, { format: input.format }); if (input.format === "markdown") { const markdown = (posts.data ?? []).map(post => `---\ntitle: ${JSON.stringify(post.title)}\nslug: ${post.slug}\nstatus: ${post.status}\npublished_at: ${post.published_at || ""}\ncanonical_url: ${post.canonical_url || ""}\n---\n\n${post.rendered_html}`).join("\n\n---\n\n"); return { format: "markdown" as const, content: markdown }; } return { format: "json" as const, content: JSON.stringify({ exportedAt: new Date().toISOString(), organizationId: actor.organizationId, siteId: actor.siteId, posts: posts.data ?? [], categories: categories.data ?? [], tags: tags.data ?? [], media: media.data ?? [], subscribers: subscribers.data ?? [] }, null, 2) }; }),
});
