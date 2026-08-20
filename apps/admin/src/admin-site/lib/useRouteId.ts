"use client";

import { usePathname } from "next/navigation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The Studio app is mounted under a catch-all route ([[...segments]]) that
 * does not surface typed route params, so `useParams` cannot read the post id.
 * This hook reads it from the pathname instead (the final path segment), and
 * returns `undefined` for route ends that are not ids (e.g. `/posts/new`).
 */
export function useRouteId() {
  const pathname = usePathname();
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  return UUID_RE.test(last) ? last : undefined;
}