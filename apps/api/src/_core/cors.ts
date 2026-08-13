const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

/**
 * Applies CORS headers to a Response when the request originates from an
 * allowed origin. The frontends talk to the API through same-origin Next.js
 * rewrites, so CORS is only exercised for direct cross-origin API consumers.
 */
export function applyCors(req: Request, res: Response): Response {
  const origin = req.headers.get("origin");
  if (!origin || !CORS_ORIGINS.includes(origin)) return res;

  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", req.headers.get("access-control-request-headers") || "Content-Type,Authorization");
  headers.set("Access-Control-Max-Age", "600");

  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export function corsPreflight(req: Request): Response {
  return applyCors(req, new Response(null, { status: 204 }));
}
