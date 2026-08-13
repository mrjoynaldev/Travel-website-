import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/errors";
import { parse as parseCookieHeader, serialize as serializeCookie, type SerializeOptions } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import type { AuthUser } from "./context";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

export type SessionUser = {
  openId: string;
  name: string | null;
  email: string | null;
};

type SessionClaims = SessionUser & { exp: number };

const SESSION_LIFETIME_MS = ONE_YEAR_MS;

function sessionSecret(): Uint8Array {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const issuedAt = Date.now();
  return new SignJWT({
    openId: user.openId,
    name: user.name ?? "",
    email: user.email ?? "",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(Math.floor(issuedAt / 1000))
    .setExpirationTime(Math.floor((issuedAt + SESSION_LIFETIME_MS) / 1000))
    .sign(sessionSecret());
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: ["HS256"] });
    const { openId, name, email } = payload as Record<string, unknown>;
    if (typeof openId !== "string" || openId.length === 0) return null;
    return {
      openId,
      name: typeof name === "string" && name.length > 0 ? name : null,
      email: typeof email === "string" && email.length > 0 ? email : null,
      exp: typeof payload.exp === "number" ? payload.exp : 0,
    };
  } catch {
    return null;
  }
}

function buildUser(claims: SessionClaims): AuthUser {
  const now = new Date();
  return {
    id: -1,
    openId: claims.openId,
    name: claims.name,
    email: claims.email,
    loginMethod: "supabase",
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

export async function authenticateRequest(req: Request): Promise<AuthUser> {
  const cookies = parseCookieHeader(req.headers.get("cookie") ?? "");
  let token = cookies[COOKIE_NAME];

  // Header fallback mirrors the cookie for browsers that block cookie storage
  // (Safari ITP, private browsing, WebView).
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  const claims = await verifySessionToken(token);
  if (!claims) throw ForbiddenError("Invalid session cookie");
  return buildUser(claims);
}

function cookieOptions(req: Request, maxAge: number): SerializeOptions {
  return { ...getSessionCookieOptions(req), maxAge };
}

export function setSessionCookie(req: Request, resHeaders: Headers, token: string): void {
  resHeaders.append("Set-Cookie", serializeCookie(COOKIE_NAME, token, cookieOptions(req, SESSION_LIFETIME_MS / 1000)));
}

export function clearSessionCookie(req: Request, resHeaders: Headers): void {
  resHeaders.append("Set-Cookie", serializeCookie(COOKIE_NAME, "", cookieOptions(req, -1)));
}
