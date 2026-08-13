import { sitemapXml } from "@/publicFeeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { body, contentType, status } = await sitemapXml();
  return new Response(body, { status, headers: { "content-type": contentType } });
}
