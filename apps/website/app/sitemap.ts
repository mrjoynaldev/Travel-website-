import type { MetadataRoute } from "next";
import { getTours, getAllPublishedRefs } from "@web/lib/catalogue";
import { serverTrpc } from "@web/lib/trpc-server";

// Always render fresh (not build-time only) so Studio-published posts,
// tours and topics enter the sitemap instantly without redeploys.
// NOTE: `revalidate = 3600` was ignored for this route — the sitemap froze
// at build time (Sep 18) and missed newer posts. force-dynamic guarantees
// every request sees all published content; the queries below are light
// and this URL is hit infrequently (Google + occasional checks).
export const dynamic = "force-dynamic";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatri.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl().replace(/\/$/, "");
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Static routes
  const staticRoutes = ["", "/tours", "/hire", "/about", "/contact", "/archive"];
  for (const p of staticRoutes) {
    entries.push({
      url: `${base}${p || "/"}`,
      lastModified: now,
      changeFrequency: p === "" ? "daily" : "weekly",
      priority: p === "" ? 1 : 0.8,
    });
  }

  // Tours
  try {
    const tours = await getTours();
    for (const t of tours) {
      entries.push({
        url: `${base}/tours/${t.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
  } catch {
    // tour fetch failed; skip
  }

  // Articles + authors
  try {
    const { slugs, authorIds } = await getAllPublishedRefs();
    for (const slug of slugs) {
      entries.push({
        url: `${base}/articles/${slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    const seenAuthors = new Set<string>();
    for (const id of authorIds) {
      if (seenAuthors.has(id)) continue;
      seenAuthors.add(id);
      entries.push({
        url: `${base}/authors/${id}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.4,
      });
    }
  } catch {
    // article/author fetch failed; skip
  }

  // Topics (categories)
  try {
    const categories = await serverTrpc.blog.categories.query();
    for (const c of categories) {
      entries.push({
        url: `${base}/topics/${c.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    // categories fetch failed; skip
  }

  // CMS pages
  try {
    const pages = await serverTrpc.blog.pages.query();
    const reserved = new Set([
      "about", "contact", "hire", "tours", "archive", "articles", "authors",
      "topics", "tags", "api", "login", "llms.txt", "sitemap.xml", "robots.txt",
    ]);
    for (const p of pages) {
      if (!p.slug || reserved.has(p.slug)) continue;
      entries.push({
        url: `${base}/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  } catch {
    // pages fetch failed; skip
  }

  return entries;
}
