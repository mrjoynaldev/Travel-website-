import { resolveStorageRedirect } from "@/_core/storageProxy";
import { applyCors, corsPreflight } from "@/_core/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  const result = await resolveStorageRedirect(key.join("/"));
  if (result.error) {
    return applyCors(req, new Response(result.error.message, { status: result.error.status, headers: { "Cache-Control": "no-store" } }));
  }
  return applyCors(req, new Response(null, { status: 307, headers: { Location: result.url, "Cache-Control": "no-store" } }));
}

export const OPTIONS = corsPreflight;
