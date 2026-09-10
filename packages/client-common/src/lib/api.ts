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

const nodeEnv: Record<string, string | undefined> =
  typeof process !== "undefined" && typeof process.env === "object"
    ? (process.env as Record<string, string | undefined>)
    : {};

export const API_URL: string =
  viteEnv.VITE_API_URL ?? nodeEnv.NEXT_PUBLIC_API_URL ?? nodeEnv.VITE_API_URL ?? "";

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

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) return "";
  if (/^(https?:)?\/\//.test(url)) return url.startsWith("//") ? `https:${url}` : url;
  if (url.startsWith("/")) return apiUrl(url);
  return url;
};
