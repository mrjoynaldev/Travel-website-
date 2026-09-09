export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Root of the API origin (:4000).
 *
 * This is a backend only — there is no UI here. Hitting this URL in a
 * browser previously rendered a blank Next 404, which looked like a
 * "white screen". Return an explicit service map instead.
 */
export function GET() {
  return Response.json(
    {
      ok: true,
      service: "sundarban-yatri-api",
      message: "API origin — no UI here. Use the website (:3000) or studio (:3100).",
      ports: { website: 3000, admin: 3100, api: 4000 },
      endpoints: {
        health: "/healthz",
        ready: "/readyz",
        trpc: "/api/trpc",
        sitemap: "/sitemap.xml",
        rss: "/rss.xml",
        robots: "/robots.txt",
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
