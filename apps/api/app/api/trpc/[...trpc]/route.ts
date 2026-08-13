import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { applyCors, corsPreflight } from "@/_core/cors";
import { createContext } from "@/_core/context";
import { appRouter } from "@/routers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: Request) {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    allowMethodOverride: true,
    onError: ({ error }) => {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error("[trpc]", error);
      }
    },
  });
  return applyCors(req, response);
}

export const GET = handler;
export const POST = handler;
export const OPTIONS = corsPreflight;
