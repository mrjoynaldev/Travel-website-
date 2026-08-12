import type { QueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { TRPCError, type inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@shared/app-router";
import { trpc } from "@/lib/trpc";

export type HeadMeta = { title: string; description: string; ogType?: "website" | "article"; ogImage?: string; canonicalPath?: string; publishedTime?: string; modifiedTime?: string; noindex?: boolean; notFound?: boolean; jsonLd?: string };
type Outputs = inferRouterOutputs<AppRouter>;
export type SsrPrefetch = { publication: () => Promise<Outputs["blog"]["publication"]>; pages: () => Promise<Outputs["blog"]["pages"]>; pageBySlug: (slug: string) => Promise<Outputs["blog"]["pageBySlug"]>; categories: () => Promise<Outputs["blog"]["categories"]>; tags: () => Promise<Outputs["blog"]["tags"]>; sections: () => Promise<Outputs["blog"]["sections"]>; archives: () => Promise<Outputs["blog"]["archives"]>; list: (input: { page: number; query?: string; category?: string; tag?: string; year?: number }) => Promise<Outputs["blog"]["list"]>; bySlug: (slug: string) => Promise<Outputs["blog"]["bySlug"]>; author: (authorId: string) => Promise<Outputs["blog"]["author"]> };

const SITE = "CodeReport Global";
const DESC = "Developer-first AI news, analysis, and practical guides for people who build and ship software.";
const seed = (queryClient: QueryClient, key: unknown, value: unknown) => queryClient.setQueryData(key as any, value);

export async function prefetchForPath(url: string, queryClient: QueryClient, prefetch: SsrPrefetch): Promise<HeadMeta> {
  let path = url.split("?")[0] || "/";
  try { path = decodeURI(path); } catch { /* keep malformed path for the 404 branch */ }
  const clean = path.replace(/\/+$/, "") || "/";
  const publication = await prefetch.publication();
  const publicationName = publication.name || SITE;
  const publicationSettings = publication.settings as { brand?: { defaultOgImageUrl?: string } } | undefined;
  const publicationPages = await prefetch.pages();
  seed(queryClient, getQueryKey(trpc.blog.publication, undefined, "query"), publication);
  seed(queryClient, getQueryKey(trpc.blog.pages, undefined, "query"), publicationPages);
  if (clean === "/") {
    const input = { page: 1, query: undefined, category: undefined };
    const [categories, feed, sections] = await Promise.all([prefetch.categories(), prefetch.list(input), prefetch.sections().catch(() => [])]);
    seed(queryClient, getQueryKey(trpc.blog.categories, undefined, "query"), categories);
    seed(queryClient, getQueryKey(trpc.blog.list, input, "query"), feed);
    seed(queryClient, getQueryKey(trpc.blog.sections, undefined, "query"), sections);
    return { title: `${publicationName} — Developer AI News & Guides`, description: publication.description || DESC, ogImage: publicationSettings?.brand?.defaultOgImageUrl, canonicalPath: "/" };
  }
  const article = clean.match(/^\/articles\/([^/]+)$/);
  if (article) {
    try {
      const data = await prefetch.bySlug(article[1]);
      seed(queryClient, getQueryKey(trpc.blog.bySlug, { slug: article[1] }, "query"), data);
      const post = data.post as any;
      const jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.meta_description?.trim() || post.excerpt || DESC,
        datePublished: post.published_at || undefined,
        dateModified: post.updated_at || undefined,
        author: post.author?.display_name ? [{ "@type": "Person", name: post.author.display_name }] : undefined,
        image: post.og_image_url || post.featuredMedia?.url || publicationSettings?.brand?.defaultOgImageUrl || undefined,
        articleSection: post.categories?.[0]?.name || undefined,
        keywords: post.tags?.map((tag: any) => tag.name).join(", ") || undefined,
        publisher: { "@type": "Organization", name: publicationName },
      });
      return { title: post.meta_title?.trim() || `${post.title} · ${publicationName}`, description: post.meta_description?.trim() || post.excerpt || DESC, ogType: "article", ogImage: post.og_image_url || post.featuredMedia?.url || publicationSettings?.brand?.defaultOgImageUrl, canonicalPath: `/articles/${post.slug}`, publishedTime: post.published_at || undefined, modifiedTime: post.updated_at || undefined, jsonLd };
    } catch (error) { if (error instanceof TRPCError && error.code === "NOT_FOUND") { seed(queryClient, getQueryKey(trpc.blog.bySlug, { slug: article[1] }, "query"), null); return { title: publicationName, description: publication.description || DESC, notFound: true }; } throw error; }
  }
  const author = clean.match(/^\/authors\/([^/]+)$/);
  if (author) {
    try { const data = await prefetch.author(author[1]); seed(queryClient, getQueryKey(trpc.blog.author, { authorId: author[1] }, "query"), data); return { title: `${data.author.display_name} · ${SITE}`, description: data.author.bio || `Published work by ${data.author.display_name}.`, canonicalPath: `/authors/${author[1]}` }; }
    catch (error) { if (error instanceof TRPCError && error.code === "NOT_FOUND") return { title: SITE, description: DESC, notFound: true }; throw error; }
  }
  const topic = clean.match(/^\/topics\/([^/]+)$/);
  if (topic) {
    const input = { page: 1, category: topic[1] };
    const [categories, feed] = await Promise.all([prefetch.categories(), prefetch.list(input)]);
    seed(queryClient, getQueryKey(trpc.blog.categories, undefined, "query"), categories);
    seed(queryClient, getQueryKey(trpc.blog.list, input, "query"), feed);
    const current = categories.find(category => category.slug === topic[1]);
    return { title: `${current?.name || "Topic"} · ${SITE}`, description: current?.description || DESC, canonicalPath: `/topics/${topic[1]}` };
  }
  const tag = clean.match(/^\/tags\/([^/]+)$/);
  if (tag) {
    const input = { page: 1, tag: tag[1] };
    const [tags, feed] = await Promise.all([prefetch.tags(), prefetch.list(input)]);
    seed(queryClient, getQueryKey(trpc.blog.tags, undefined, "query"), tags);
    seed(queryClient, getQueryKey(trpc.blog.list, input, "query"), feed);
    const current = tags.find(item => item.slug === tag[1]);
    return { title: `#${current?.name || "Tag"} · ${SITE}`, description: DESC, canonicalPath: `/tags/${tag[1]}` };
  }
  if (clean === "/archive") {
    const archives = await prefetch.archives();
    seed(queryClient, getQueryKey(trpc.blog.archives, undefined, "query"), archives);
    return { title: `Archive · ${SITE}`, description: "A chronological map of CodeReport Global's published stories.", canonicalPath: "/archive" };
  }
  const yearArchive = clean.match(/^\/archive\/(\d{4})$/);
  if (yearArchive) {
    const year = Number(yearArchive[1]); const input = { page: 1, year };
    const [archives, feed] = await Promise.all([prefetch.archives(), prefetch.list(input)]);
    seed(queryClient, getQueryKey(trpc.blog.archives, undefined, "query"), archives);
    seed(queryClient, getQueryKey(trpc.blog.list, input, "query"), feed);
    return { title: `${year} Archive · ${SITE}`, description: `CodeReport Global's published stories from ${year}.`, canonicalPath: `/archive/${year}` };
  }
  if (clean === "/studio" || clean.startsWith("/studio/")) return { title: `${publicationName} Studio`, description: publication.description || DESC, noindex: true };
  if (clean === "/login") return { title: `Sign in · ${publicationName}`, description: publication.description || DESC, noindex: true };
  const topLevelPage = clean.match(/^\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (topLevelPage) {
    try { const page = await prefetch.pageBySlug(topLevelPage[1]); seed(queryClient, getQueryKey(trpc.blog.pageBySlug, { slug: topLevelPage[1] }, "query"), page); return { title: page.meta_title?.trim() || `${page.title} · ${publicationName}`, description: page.meta_description?.trim() || publication.description || DESC, ogImage: publicationSettings?.brand?.defaultOgImageUrl, canonicalPath: `/${page.slug}`, modifiedTime: page.updated_at || undefined }; }
    catch (error) { if (error instanceof TRPCError && error.code === "NOT_FOUND") return { title: publicationName, description: publication.description || DESC, notFound: true }; throw error; }
  }
  return { title: publicationName, description: publication.description || DESC, notFound: true };
}
