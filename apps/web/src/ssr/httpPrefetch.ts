import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@shared/app-router";
import type { SsrPrefetch } from "./prefetch";

const API_ORIGIN = process.env.VITE_API_URL || process.env.API_URL || "http://localhost:4000";

export function createHttpPrefetch(): SsrPrefetch {
  const client = createTRPCClient<AppRouter>({
    links: [httpBatchLink({ url: `${API_ORIGIN.replace(/\/$/, "")}/api/trpc`, transformer: superjson })],
  });
  return {
    publication: () => client.blog.publication.query(),
    pages: () => client.blog.pages.query(),
    pageBySlug: (slug: string) => client.blog.pageBySlug.query({ slug }),
    categories: () => client.blog.categories.query(),
    tags: () => client.blog.tags.query(),
    archives: () => client.blog.archives.query(),
    list: (input: { page: number; query?: string; category?: string; tag?: string; year?: number }) =>
      client.blog.list.query(input),
    bySlug: (slug: string) => client.blog.bySlug.query({ slug }),
    author: (authorId: string) => client.blog.author.query({ authorId }),
  };
}
