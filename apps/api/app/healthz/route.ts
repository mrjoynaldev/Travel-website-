export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, service: "sundarban-yatri-api", timestamp: new Date().toISOString() });
}
