import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@shared/app-router";
import superjson from "superjson";

const baseUrl = (process.env.API_URL || "http://localhost:4000").replace(/\/+$/, "");

export const serverTrpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: `${baseUrl}/api/trpc`, transformer: superjson })],
});
