import { resolveApiToken, type ApiTokenContext } from "./apiTokens";
import { authenticateRequest } from "./session";

export type AuthUser = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type TrpcContext = {
  /** The incoming fetch Request (headers, cookies, url). */
  req: Request;
  /**
   * Mutable response headers — everything appended here (e.g. `Set-Cookie`)
   * is merged into the HTTP response by the tRPC fetch adapter.
   */
  resHeaders: Headers;
  user: AuthUser | null;
  apiToken: ApiTokenContext | null;
};

export async function createContext(opts: { req: Request; resHeaders: Headers }): Promise<TrpcContext> {
  let user: AuthUser | null = null;
  let apiToken: ApiTokenContext | null = null;

  try {
    user = await authenticateRequest(opts.req);
  } catch {
    // Session cookie/header did not authenticate. Try an API access token.
    const authHeader = opts.req.headers.get("authorization");
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      const resolved = await resolveApiToken(authHeader.slice(7));
      if (resolved) {
        user = resolved.user;
        apiToken = resolved.token;
      }
    }
    if (!user) user = null;
  }

  return {
    req: opts.req,
    resHeaders: opts.resHeaders,
    user,
    apiToken,
  };
}
