import { NextRequest, NextResponse } from "next/server";

const RETRYABLE = new Set([429, 502, 503, 504]);
const MAX_ATTEMPTS = 4;

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/keep-alive")) {
    return NextResponse.next();
  }
  const apiOrigin = (process.env.API_URL || "http://localhost:4000").replace(/\/+$/, "");
  if (!apiOrigin) return NextResponse.next();

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  const isBodyless = request.method === "GET" || request.method === "HEAD";
  const body = isBodyless ? undefined : await request.arrayBuffer();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${apiOrigin}${pathname}${search}`, {
        method: request.method,
        headers,
        body,
        redirect: "manual",
        cache: "no-store",
      });
    } catch {
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      return NextResponse.json({ error: "upstream unreachable" }, { status: 502 });
    }
    if (attempt < MAX_ATTEMPTS - 1 && RETRYABLE.has(res.status)) {
      await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
      continue;
    }
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: new Headers([...res.headers.entries(), ["x-proxy", "proxy"]]),
    });
  }
  return NextResponse.json({ error: "upstream unavailable" }, { status: 502 });
}

export const config = {
  matcher: "/api/:path*",
};