/**
 * Unified API origin for the decoupled deployments.
 *
 * - When `VITE_API_URL` is set (e.g. `https://api.example.com`), every client
 *   request is sent cross-origin to the Render-hosted backend and relative
 *   asset URLs (media, storage) are resolved against that origin.
 * - When unset, the app falls back to same-origin `/api/trpc` for local
 *   development inside the monolith.
 */
const viteEnv: Record<string, string | undefined> =
  typeof (import.meta as unknown as { env?: Record<string, string | undefined> }).env === "object"
    ? (import.meta as unknown as { env: Record<string, string | undefined> }).env
    : {};

export const API_URL: string = viteEnv.VITE_API_URL ?? (typeof process !== "undefined" ? process.env.VITE_API_URL : undefined) ?? "";

export const apiUrl = (path: string): string => (API_URL ? `${API_URL}${path}` : path);

export const getTrpcUrl = (): string => apiUrl("/api/trpc");

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) return "";
  if (/^(https?:)?\/\//.test(url)) return url.startsWith("//") ? `https:${url}` : url;
  if (url.startsWith("/")) return apiUrl(url);
  return url;
};
