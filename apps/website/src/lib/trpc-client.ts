import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@shared/app-router";
import superjson from "superjson";

export const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
});
