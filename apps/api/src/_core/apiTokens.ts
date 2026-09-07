import { createHash, randomBytes } from "node:crypto";
import { getSupabase } from "../supabase";
import type { AuthUser } from "./context";

export const API_TOKEN_PREFIX = "sy_";
// Tokens minted by the old blog platform ("crg_…") keep working.
const LEGACY_TOKEN_PREFIX = "crg_";

export type ApiTokenScopes = "read" | "write";

export type ResolvedApiToken = {
  id: string;
  name: string;
  scopes: ApiTokenScopes[];
  profileId: string;
};

export type ApiTokenContext = {
  id: string;
  name: string;
  scopes: ApiTokenScopes[];
};

export function generateApiToken(): { token: string; hash: string; prefix: string } {
  const secret = randomBytes(24).toString("hex");
  const token = `${API_TOKEN_PREFIX}${secret}`;
  return { token, hash: hashApiToken(token), prefix: token.slice(0, 12) };
}

export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Resolves an API access token to its owning profile so the request can reuse
 * the same role-scoped authorization as a signed-in contributor.
 */
export async function resolveApiToken(token: string): Promise<{ user: AuthUser; token: ApiTokenContext } | null> {
  if (!token.startsWith(API_TOKEN_PREFIX) && !token.startsWith(LEGACY_TOKEN_PREFIX)) return null;
  const hash = hashApiToken(token);
  const db = getSupabase();
  const { data: row, error } = await db
    .from("api_tokens")
    .select("id, name, scopes, profile_id, expires_at, revoked_at, profiles!api_tokens_profile_id_fkey(external_auth_id, display_name, email)")
    .eq("token_hash", hash)
    .maybeSingle();
  if (error || !row) return null;
  if (row.revoked_at) return null;
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return null;
  const profile = Array.isArray((row as any).profiles) ? (row as any).profiles[0] : (row as any).profiles;
  if (!profile?.external_auth_id) return null;

  // Bump last_used_at without failing the request if the write errors.
  void db.from("api_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", row.id).then(() => undefined, () => undefined);

  const now = new Date();
  const user: AuthUser = {
    id: -1,
    openId: profile.external_auth_id,
    name: profile.display_name ?? null,
    email: profile.email ?? null,
    loginMethod: "api-token",
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
  return { user, token: { id: row.id, name: row.name, scopes: (row.scopes ?? ["read", "write"]) as ApiTokenScopes[] } };
}
