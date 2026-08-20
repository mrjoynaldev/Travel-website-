import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publishScheduled } from "../blog";
import { getSupabase } from "../supabase";
import { publicProcedure, router } from "../_core/trpc";

const pageSize = 9;

async function publicSiteOrThrow() {
  const { data, error } = await getSupabase()
    .from("sites")
    .select("id, organization_id, name, slug, description")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load the publication." });
  return data;
}

async function hydratePosts(posts: any[]) {
  if (!posts.length) return [];
  const db = getSupabase();
  const postIds = posts.map(post => post.id);
  const authorIds = Array.from(new Set(posts.map(post => post.author_id)));
  const mediaIds = Array.from(new Set(posts.map(post => post.featured_media_id).filter(Boolean)));
  const [authorsResult, categoriesResult, tagsResult] = await Promise.all([
    db.from("profiles").select("id, display_name, bio, avatar_url, website_url").in("id", authorIds),
    db.from("post_categories").select("post_id, categories(id, name, slug)").in("post_id", postIds),
    db.from("post_tags").select("post_id, tags(id, name, slug)").in("post_id", postIds),
  ]);
  const mediaResult = mediaIds.length
    ? await db.from("media_assets").select("id, url, alt_text, caption").in("id", mediaIds)
    : { data: [] as any[], error: null };
  if (authorsResult.error || mediaResult.error || categoriesResult.error || tagsResult.error) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load publication relationships." });
  }
  const authors = new Map((authorsResult.data ?? []).map((author: any) => [author.id, author]));
  const media = new Map((mediaResult.data ?? []).map((asset: any) => [asset.id, asset]));
  const categories = new Map<string, any[]>();
  const tags = new Map<string, any[]>();
  for (const row of categoriesResult.data ?? []) categories.set(row.post_id, (categories.get(row.post_id) ?? []).concat(row.categories ?? []));
  for (const row of tagsResult.data ?? []) tags.set(row.post_id, (tags.get(row.post_id) ?? []).concat(row.tags ?? []));
  return posts.map(post => ({ ...post, author: authors.get(post.author_id) ?? null, featuredMedia: post.featured_media_id ? media.get(post.featured_media_id) ?? null : null, categories: categories.get(post.id) ?? [], tags: tags.get(post.id) ?? [] }));
}

export const blogRouter = router({
  publication: publicProcedure.query(async () => {
    const site = await publicSiteOrThrow();
    if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Publication not found." });
    const { data: settings, error } = await getSupabase().from("site_settings").select("navigation, seo_defaults, brand, footer_links, contact").eq("site_id", site.id).maybeSingle();
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load publication settings." });
    return { ...site, settings: settings ?? { navigation: [], seo_defaults: {}, brand: {}, footer_links: [], contact: {} } };
  }),

  pages: publicProcedure.query(async () => {
    const site = await publicSiteOrThrow();
    if (!site) return [];
    const { data, error } = await getSupabase().from("site_pages").select("page_type, title, slug, meta_title, meta_description, updated_at").eq("site_id", site.id).eq("status", "published").order("page_type");
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load public site pages." });
    return data ?? [];
  }),

  pageBySlug: publicProcedure.input(z.object({ slug: z.string().min(1).max(120) })).query(async ({ input }) => {
    const site = await publicSiteOrThrow();
    if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Publication not found." });
    const { data, error } = await getSupabase().from("site_pages").select("id, page_type, title, slug, rendered_html, meta_title, meta_description, updated_at, published_at").eq("site_id", site.id).eq("slug", input.slug).eq("status", "published").maybeSingle();
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load this public page." });
    if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Page not found." });
    return data;
  }),
  categories: publicProcedure.query(async () => {
    const site = await publicSiteOrThrow();
    if (!site) return [];
    const { data, error } = await getSupabase().from("categories").select("id, name, slug, description").eq("site_id", site.id).order("name");
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load categories." });
    return data ?? [];
  }),

  sections: publicProcedure.query(async () => {
    const site = await publicSiteOrThrow();
    if (!site) return [];
    await publishScheduled(site.id);
    const db = getSupabase();
    const { data: sections, error } = await db.from("site_sections").select("id, title, section_type, subtitle, rendered_html, sort_order, is_visible, category_id, tag_id").eq("site_id", site.id).eq("is_visible", true).order("sort_order");
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load homepage sections." });
    if (!sections?.length) return [];

    const feed = await Promise.all((sections ?? []).map(async section => {
      if (section.section_type === "custom") return { ...section, posts: [] };
      let query = db.from("posts").select("id, title, slug, excerpt, published_at, updated_at, featured, featured_media_id, author_id").eq("site_id", site.id).eq("status", "published").is("deleted_at", null).order("published_at", { ascending: false }).limit(6);
      if (section.section_type === "category" && section.category_id) {
        const { data: rows } = await db.from("post_categories").select("post_id").eq("category_id", section.category_id);
        const ids = (rows ?? []).map(row => row.post_id);
        if (!ids.length) return { ...section, posts: [] };
        query = query.in("id", ids);
      }
      if (section.section_type === "tag" && section.tag_id) {
        const { data: rows } = await db.from("post_tags").select("post_id").eq("tag_id", section.tag_id);
        const ids = (rows ?? []).map(row => row.post_id);
        if (!ids.length) return { ...section, posts: [] };
        query = query.in("id", ids);
      }
      if (section.section_type === "featured") query = query.eq("featured", true);
      const { data, error: feedError } = await query;
      if (feedError) return { ...section, posts: [] };
      return { ...section, posts: await hydratePosts(data ?? []) };
    }));
    return feed;
  }),

  tags: publicProcedure.query(async () => {
    const site = await publicSiteOrThrow();
    if (!site) return [];
    const { data, error } = await getSupabase().from("tags").select("id, name, slug").eq("site_id", site.id).order("name");
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load tags." });
    return data ?? [];
  }),

  list: publicProcedure.input(z.object({ query: z.string().trim().max(100).optional(), category: z.string().max(120).optional(), tag: z.string().max(120).optional(), year: z.number().int().min(2000).max(2100).optional(), page: z.number().int().min(1).max(500).default(1) })).query(async ({ input }) => {
    const site = await publicSiteOrThrow();
    if (!site) return { items: [], total: 0, page: input.page, totalPages: 0 };
    const db = getSupabase();
    await publishScheduled(site.id);
    let categoryId: string | undefined;
    if (input.category) {
      const { data: category } = await db.from("categories").select("id").eq("site_id", site.id).eq("slug", input.category).maybeSingle();
      if (!category) return { items: [], total: 0, page: input.page, totalPages: 0 };
      categoryId = category.id;
    }
    let postIds: string[] | undefined;
    if (categoryId) {
      const { data, error } = await db.from("post_categories").select("post_id").eq("category_id", categoryId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not filter publication posts." });
      postIds = (data ?? []).map(row => row.post_id);
      if (!postIds.length) return { items: [], total: 0, page: input.page, totalPages: 0 };
    }
    if (input.tag) {
      const { data: tag } = await db.from("tags").select("id").eq("site_id", site.id).eq("slug", input.tag).maybeSingle();
      if (!tag) return { items: [], total: 0, page: input.page, totalPages: 0 };
      const { data, error } = await db.from("post_tags").select("post_id").eq("tag_id", tag.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not filter publication posts." });
      const taggedIds = (data ?? []).map(row => row.post_id);
      postIds = postIds ? postIds.filter(id => taggedIds.includes(id)) : taggedIds;
      if (!postIds.length) return { items: [], total: 0, page: input.page, totalPages: 0 };
    }
    let query = db.from("posts").select("*", { count: "exact" }).eq("site_id", site.id).eq("status", "published").is("deleted_at", null).order("featured", { ascending: false }).order("published_at", { ascending: false });
    if (postIds) query = query.in("id", postIds);
    if (input.year) query = query.gte("published_at", `${input.year}-01-01T00:00:00.000Z`).lt("published_at", `${input.year + 1}-01-01T00:00:00.000Z`);
    if (input.query) query = query.or(`title.ilike.%${input.query.replace(/[,%]/g, "")}%,excerpt.ilike.%${input.query.replace(/[,%]/g, "")}%`);
    const from = (input.page - 1) * pageSize;
    const { data, error, count } = await query.range(from, from + pageSize - 1);
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load the publication feed." });
    const total = count ?? 0;
    return { items: await hydratePosts(data ?? []), total, page: input.page, totalPages: Math.ceil(total / pageSize) };
  }),

  archives: publicProcedure.query(async () => {
    const site = await publicSiteOrThrow();
    if (!site) return [];
    const { data, error } = await getSupabase().from("posts").select("published_at").eq("site_id", site.id).eq("status", "published").is("deleted_at", null).not("published_at", "is", null);
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load publication archives." });
    const years = new Map<number, number>();
    for (const post of data ?? []) { const year = new Date(post.published_at).getUTCFullYear(); years.set(year, (years.get(year) ?? 0) + 1); }
    return Array.from(years.entries()).sort((a, b) => b[0] - a[0]).map(([year, count]) => ({ year, count }));
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string().min(1).max(180) })).query(async ({ input }) => {
    const site = await publicSiteOrThrow();
    if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Publication not found." });
    await publishScheduled(site.id);
    const { data, error } = await getSupabase().from("posts").select("*").eq("site_id", site.id).eq("slug", input.slug).eq("status", "published").is("deleted_at", null).maybeSingle();
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load the article." });
    if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Article not found." });
    const [post] = await hydratePosts([data]);
    const relatedIds = new Set<string>();
    const catIds = (post.categories ?? []).map((category: { id: string }) => category.id);
    const tagIds = (post.tags ?? []).map((tag: { id: string }) => tag.id);
    if (catIds.length || tagIds.length) {
      const [catRows, tagRows] = await Promise.all([
        catIds.length ? getSupabase().from("post_categories").select("post_id").in("category_id", catIds) : Promise.resolve({ data: [] }),
        tagIds.length ? getSupabase().from("post_tags").select("post_id").in("tag_id", tagIds) : Promise.resolve({ data: [] }),
      ]);
      for (const row of (catRows as any)?.data ?? []) relatedIds.add(row.post_id);
      for (const row of (tagRows as any)?.data ?? []) relatedIds.add(row.post_id);
      relatedIds.delete(data.id);
    }
    const baseRelated = getSupabase().from("posts").select("*").eq("site_id", site.id).eq("status", "published").is("deleted_at", null).neq("id", data.id).order("published_at", { ascending: false });
    let relatedRows: any[] = [];
    if (relatedIds.size) {
      const [topical, latest] = await Promise.all([
        baseRelated.in("id", Array.from(relatedIds)).limit(6),
        baseRelated.limit(6),
      ]);
      relatedRows = (topical.data ?? []).slice(0, 3);
      if (relatedRows.length < 3) {
        const seen = new Set((topical.data ?? []).map((row: any) => row.id));
        for (const row of latest.data ?? []) {
          if (relatedRows.length >= 3) break;
          if (seen.has(row.id)) continue;
          seen.add(row.id);
          relatedRows.push(row);
        }
      }
    } else {
      const latest = await baseRelated.limit(3);
      relatedRows = latest.data ?? [];
    }
    return { post, related: await hydratePosts(relatedRows) };
  }),

  author: publicProcedure.input(z.object({ authorId: z.string().uuid() })).query(async ({ input }) => {
    const site = await publicSiteOrThrow();
    if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Publication not found." });
    const { data: author, error: authorError } = await getSupabase().from("profiles").select("id, display_name, bio, avatar_url, website_url").eq("id", input.authorId).maybeSingle();
    if (authorError || !author) throw new TRPCError({ code: "NOT_FOUND", message: "Author not found." });
    const { data: posts, error } = await getSupabase().from("posts").select("*").eq("site_id", site.id).eq("author_id", input.authorId).eq("status", "published").is("deleted_at", null).order("published_at", { ascending: false });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load author posts." });
    return { author, posts: await hydratePosts(posts ?? []) };
  }),

  comments: publicProcedure.input(z.object({ postId: z.string().uuid() })).query(async ({ input }) => {
    const { data, error } = await getSupabase().from("comments").select("id, parent_id, author_name, body, created_at").eq("post_id", input.postId).eq("status", "approved").order("created_at");
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load comments." });
    return data ?? [];
  }),

  submitComment: publicProcedure.input(z.object({ postId: z.string().uuid(), authorName: z.string().trim().min(2).max(120), email: z.string().email().max(320), body: z.string().trim().min(2).max(5000), parentId: z.string().uuid().optional() })).mutation(async ({ input }) => {
    const { data: post, error: postError } = await getSupabase().from("posts").select("organization_id, site_id, status").eq("id", input.postId).maybeSingle();
    if (postError || !post || post.status !== "published") throw new TRPCError({ code: "NOT_FOUND", message: "Published article not found." });
    const { error } = await getSupabase().from("comments").insert({ organization_id: post.organization_id, site_id: post.site_id, post_id: input.postId, parent_id: input.parentId ?? null, author_name: input.authorName, author_email: input.email, body: input.body, status: "pending" });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Your comment could not be submitted." });
    return { success: true };
  }),

  subscribe: publicProcedure.input(z.object({ email: z.string().email().max(320) })).mutation(async ({ input }) => {
    const site = await publicSiteOrThrow();
    if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Publication not found." });
    const { error } = await getSupabase().from("subscribers").upsert({ organization_id: site.organization_id, site_id: site.id, email: input.email.toLowerCase(), status: "active", unsubscribed_at: null }, { onConflict: "site_id,email" });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Subscription could not be saved." });
    return { success: true };
  }),

  track: publicProcedure.input(z.object({ postId: z.string().uuid().optional(), eventType: z.enum(["page_view", "article_view", "scroll_depth", "reading_complete", "comment_submitted", "subscription_created"]), sessionHash: z.string().max(120).optional(), referrerHost: z.string().max(255).optional(), properties: z.record(z.string(), z.unknown()).default({}) })).mutation(async ({ input }) => {
    const site = await publicSiteOrThrow();
    if (!site) return { success: false };
    const { error } = await getSupabase().from("analytics_events").insert({ organization_id: site.organization_id, site_id: site.id, post_id: input.postId ?? null, event_type: input.eventType, session_hash: input.sessionHash ?? null, referrer_host: input.referrerHost ?? null, properties: input.properties });
    if (error) return { success: false };
    return { success: true };
  }),
});
