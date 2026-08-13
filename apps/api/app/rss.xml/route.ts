import { rssXml } from "@/publicFeeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { body, contentType, status } = await rssXml();
  return new Response(body, { status, headers: { "content-type": contentType } });
}
