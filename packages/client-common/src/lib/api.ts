/**
 * Unified API origin for the decoupled deployments.
 *
 * - When set (`NEXT_PUBLIC_API_URL` for Next.js browser bundles — inlined at
 *   build time — or `VITE_API_URL`), every request goes cross-origin to the
 *   hosted backend (Render) and relative asset URLs resolve against it.
 * - When unset, the app falls back to same-origin `/api/trpc` (local dev
 *   with Next.js rewrites, or Vite proxy).
 */
const viteEnv: Record<string, string | undefined> =
  typeof (import.meta as unknown as { env?: Record<string, string | undefined> }).env === "object"
    ? (import.meta as unknown as { env: Record<string, string | undefined> }).env
    : {};

// NOTE: keep the literal `process.env.NEXT_PUBLIC_API_URL` member access —
// Next.js/Turbopack only inlines env vars it can see statically. Reading them
// through a local alias object (e.g. nodeEnv.X) silently evaluates to "" in
// the browser, which breaks every API call on static hosting.
const nextPublicApiUrl =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined;
const nodeViteApiUrl =
  typeof process !== "undefined" ? process.env.VITE_API_URL : undefined;

export const API_URL: string =
  viteEnv.VITE_API_URL ?? nextPublicApiUrl ?? nodeViteApiUrl ?? "";

export const apiUrl = (path: string): string => (API_URL ? `${API_URL}${path}` : path);

export const getTrpcUrl = (): string => apiUrl("/api/trpc");

/**
 * fetch wrapper that always includes credentials so the httpOnly session
 * cookie flows cross-origin (e.g. Studio on Vercel → API on Render). In local
 * dev the Vite proxy keeps requests same-origin, where this is equivalent to
 * the default behavior.
 */
export const credentialsFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, credentials: "include" });

const SESSION_TOKEN_KEY = "sy_session";

/** Browser-only session-token store (null during SSR/prerender). */
export const getSessionToken = (): string | null => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setSessionToken = (token: string): void => {
  try {
    window.localStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {
    // private mode etc. — cookie path still applies
  }
};

export const clearSessionToken = (): void => {
  try {
    window.localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // ignore
  }
};

/**
 * Auth fetch for static-hosted frontends (Firebase) talking cross-origin to
 * the API: sends the httpOnly cookie AND, when a sign-in stored one, the
 * session JWT as a Bearer fallback for browsers that block third-party
 * cookies (Safari ITP, Brave, Firefox strict, Incognito). The server accepts
 * either via authenticateRequest; cookie stays the primary mechanism.
 */
export const authFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  if (!headers.has("authorization")) {
    const token = getSessionToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers, credentials: "include" });
};

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) return "";
  if (/^(https?:)?\/\//.test(url)) return url.startsWith("//") ? `https:${url}` : url;
  if (url.startsWith("/")) return apiUrl(url);
  return url;
};
