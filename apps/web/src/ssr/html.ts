import type { HeadMeta } from "./prefetch";

const SITE_URL = (process.env.CANONICAL_ORIGIN || "").replace(/\/$/, "");

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderHead(head: HeadMeta): string {
  const tags: string[] = [];
  tags.push(`<title>${escapeHtml(head.title)}</title>`);
  tags.push(`<meta name="description" content="${escapeHtml(head.description)}" />`);
  if (head.noindex) tags.push(`<meta name="robots" content="noindex,nofollow" />`);
  tags.push(`<meta property="og:site_name" content="${escapeHtml(head.title)}" />`);
  tags.push(`<meta property="og:title" content="${escapeHtml(head.title)}" />`);
  tags.push(`<meta property="og:description" content="${escapeHtml(head.description)}" />`);
  if (head.ogType) tags.push(`<meta property="og:type" content="${head.ogType}" />`);
  if (head.ogImage) tags.push(`<meta property="og:image" content="${escapeHtml(head.ogImage)}" />`);
  if (head.canonicalPath) {
    const canonical = SITE_URL ? `${SITE_URL}${head.canonicalPath}` : head.canonicalPath;
    tags.push(`<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  }
  if (head.ogType === "article") {
    tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
    if (head.publishedTime) tags.push(`<meta property="article:published_time" content="${head.publishedTime}" />`);
    if (head.modifiedTime) tags.push(`<meta property="article:modified_time" content="${head.modifiedTime}" />`);
  }
  if (head.jsonLd) tags.push(`<script type="application/ld+json">${head.jsonLd}</script>`);
  return tags.join("\n    ");
}

export function serializeState(state: unknown): string {
  return JSON.stringify(state).replace(/</g, "\\u003c");
}

export const MIME_TYPES: Record<string, string> = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".json": "application/json",
  ".map": "application/json",
};
