import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { authFetch } from "@/lib/api";
import type { AppRouter } from "@shared/app-router";
import superjson from "superjson";

// Absolute in production (static hosting has no /api rewrite — the browser
// talks to the Render API directly); relative in local dev via rewrites.
const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${apiOrigin}/api/trpc`,
      transformer: superjson,
      fetch: authFetch,
    }),
  ],
});
