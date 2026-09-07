import { NextRequest, NextResponse } from "next/server";

/**
 * Redirect HTTP → HTTPS with a 301 Moved Permanently.
 *
 * Hosting providers (Vercel, Render, etc.) terminate TLS at the edge
 * and forward requests to Next.js over plain HTTP. They set the
 * `x-forwarded-proto` header to indicate the original protocol.
 *
 * NOTE: Next.js itself defaults `x-forwarded-proto` to "http" for direct
 * plain-HTTP requests (see base-server.js), so the header is effectively
 * NEVER missing — checking `proto === "http"` alone redirects localhost
 * too and breaks local dev. Therefore this redirect only runs in
 * production and never for loopback hosts.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || request.nextUrl.host;
  const isLoopback = /^(localhost|127\.0\.0\.1|\[?::1\]?)(:\d+)?$/i.test(host);
  if (isLoopback || process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }
  const proto = request.headers.get("x-forwarded-proto");
  if (proto === "http") {
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(`https://${host}${pathname}${search}`, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
