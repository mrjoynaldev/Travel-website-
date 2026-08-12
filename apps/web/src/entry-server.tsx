import { dehydrate, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { renderToString } from "react-dom/server";
import superjson from "superjson";
import { Router } from "wouter";
import App from "./App";
import { trpc } from "@/lib/trpc";
import { prefetchForPath, type HeadMeta, type SsrPrefetch } from "./ssr/prefetch";

export async function render(url: string, prefetch: SsrPrefetch): Promise<{ html: string; dehydratedState: unknown; head: HeadMeta }> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
  const queryIndex = url.indexOf("?"); const ssrPath = queryIndex === -1 ? url : url.slice(0, queryIndex); const ssrSearch = queryIndex === -1 ? "" : url.slice(queryIndex + 1);
  const head = await prefetchForPath(url, queryClient, prefetch);
  if (ssrPath === "/studio" || ssrPath.startsWith("/studio/")) return { html: "", dehydratedState: dehydrate(queryClient), head };
  const trpcClient = trpc.createClient({ links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })] });
  const html = renderToString(<trpc.Provider client={trpcClient} queryClient={queryClient}><QueryClientProvider client={queryClient}><Router ssrPath={ssrPath} ssrSearch={ssrSearch}><App /></Router></QueryClientProvider></trpc.Provider>);
  return { html, dehydratedState: dehydrate(queryClient), head };
}
