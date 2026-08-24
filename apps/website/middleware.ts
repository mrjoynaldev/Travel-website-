import { NextRequest, NextResponse } from "next/server";

/**
 * Redirect HTTP → HTTPS with a 301 Moved Permanently.
 *
 * Hosting providers (Vercel, Render, etc.) terminate TLS at the edge
 * and forward requests to Next.js over plain HTTP. They set the
 * `x-forwarded-proto` header to indicate the original protocol.
 *
 * We only redirect when that header is explicitly "http", so this
 * is safe even if the header is missing (e.g. local dev, health checks).
 * This avoids redirect loops.
 */
export function middleware(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto === "http") {
    const host = request.headers.get("host") || request.nextUrl.host;
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(`https://${host}${pathname}${search}`, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
