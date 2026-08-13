import type { SerializeOptions } from "cookie";

function isSecureRequest(req: Request): boolean {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (!forwardedProto) return false;
  return forwardedProto
    .split(",")
    .some(proto => proto.trim().toLowerCase() === "https");
}

/**
 * Session cookie options shared by sign-in, sign-up and logout.
 *
 * - Over HTTP (local development) the cookie is SameSite=Lax so browsers store
 *   it even though it is not `Secure`.
 * - Over HTTPS (production) it is SameSite=None + Secure so the cookie also
 *   survives direct cross-origin calls to the API.
 */
export function getSessionCookieOptions(
  req: Request,
): Pick<SerializeOptions, "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure,
  };
}
