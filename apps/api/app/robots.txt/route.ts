import { robotsTxt } from "@/publicFeeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { body, contentType } = await robotsTxt();
  return new Response(body, { status: 200, headers: { "content-type": contentType } });
}
