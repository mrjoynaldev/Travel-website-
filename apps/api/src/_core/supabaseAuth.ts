import { ENV } from "./env";

export type SupabaseAuthUser = {
  id: string;
  email: string | null;
  name: string | null;
};

type GoTrueUser = {
  id: string;
  email: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type GoTrueSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: GoTrueUser;
};

export class SupabaseAuthError extends Error {
  constructor(message: string, public readonly errorCode?: string) {
    super(message);
    this.name = "SupabaseAuthError";
  }
}

function authEndpoint(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${ENV.supabaseUrl}/auth/v1${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

function authHeaders(): Record<string, string> {
  return {
    apikey: ENV.supabasePublishableKey,
    "Content-Type": "application/json",
  };
}

function toAuthUser(user: GoTrueUser): SupabaseAuthUser {
  const metadata = user.user_metadata ?? {};
  const name =
    typeof metadata["full_name"] === "string" && metadata["full_name"].trim()
      ? metadata["full_name"].trim()
      : typeof metadata["name"] === "string" && metadata["name"].trim()
        ? metadata["name"].trim()
        : null;
  return { id: user.id, email: user.email ?? null, name };
}

function mapAuthError(status: number, payload: { error_code?: string; msg?: string }): SupabaseAuthError {
  const code = payload.error_code ?? "";
  const msg = payload.msg ?? "";
  if (code === "invalid_credentials") return new SupabaseAuthError("Invalid email or password.", code);
  if (code === "email_not_confirmed") return new SupabaseAuthError("Please confirm your email before signing in.", code);
  if (code === "user_already_exists") return new SupabaseAuthError("An account with that email already exists.", code);
  if (code === "weak_password" || msg.toLowerCase().includes("at least 8 characters")) {
    return new SupabaseAuthError("Password must be at least 8 characters.", code);
  }
  if (status === 429) return new SupabaseAuthError("Too many attempts. Please wait a moment and try again.", code);
  return new SupabaseAuthError(msg || "Authentication failed. Please try again.", code || String(status));
}

async function goTrue<T>(path: string, params: Record<string, string>, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(authEndpoint(path, params), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error_code?: string; msg?: string };
  if (!response.ok) throw mapAuthError(response.status, payload);
  return payload;
}

export async function signInWithPassword(email: string, password: string): Promise<SupabaseAuthUser> {
  const session = await goTrue<GoTrueSession>("/token", { grant_type: "password" }, { email, password });
  return toAuthUser(session.user);
}

export async function signUp(
  email: string,
  password: string,
  name?: string,
): Promise<{ user: SupabaseAuthUser; session: SupabaseAuthUser | null }> {
  const data = await goTrue<{ user: GoTrueUser; session?: GoTrueSession | null }>(
    "/signup",
    {},
    { email, password, data: name ? { full_name: name } : undefined },
  );
  return { user: toAuthUser(data.user), session: data.session ? toAuthUser(data.session.user) : null };
}
