import type { Express } from "express";
import { getSupabase } from "./supabase";

const xmlEscape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const stripHtml = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const origin = () => (process.env.CANONICAL_ORIGIN || "").replace(/\/$/, "");

async function latestPosts() {
  const db = getSupabase();
  const { data: site, error: siteError } = await db.from("sites").select("id, name, description, updated_at").eq("status", "active").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (siteError) throw siteError;
  if (!site) return { site: null, posts: [] as any[], pages: [] as any[] };
  const [{ data: posts, error: postError }, { data: pages, error: pageError }] = await Promise.all([db.from("posts").select("slug, title, excerpt, rendered_html, published_at, updated_at").eq("site_id", site.id).eq("status", "published").order("published_at", { ascending: false }).limit(500), db.from("site_pages").select("slug, updated_at, published_at").eq("site_id", site.id).eq("status", "published").order("published_at", { ascending: false }).limit(100)]);
  if (postError || pageError) throw postError || pageError;
  return { site, posts: posts ?? [], pages: pages ?? [] };
}

export function registerPublicFeeds(app: Express) {
  app.get("/robots.txt", (_req, res) => {
    const base = origin();
    res.type("text/plain").send(`User-agent: *\nAllow: /\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ""}`);
  });

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const { posts, pages } = await latestPosts(); const base = origin();
      if (!base) return res.status(503).type("text/plain").send("CANONICAL_ORIGIN must be configured before sitemap generation.");
      const urls = [
        `<url><loc>${xmlEscape(`${base}/`)}</loc></url>`,
        ...posts.map(post => `<url><loc>${xmlEscape(`${base}/articles/${post.slug}`)}</loc><lastmod>${new Date(post.updated_at || post.published_at).toISOString()}</lastmod></url>`),
        ...pages.map(page => `<url><loc>${xmlEscape(`${base}/${page.slug}`)}</loc><lastmod>${new Date(page.updated_at || page.published_at).toISOString()}</lastmod></url>`),
      ].join("");
      res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
    } catch {
      res.status(503).type("text/plain").send("Sitemap is temporarily unavailable.");
    }
  });

  app.get("/rss.xml", async (_req, res) => {
    try {
      const { site, posts } = await latestPosts(); const base = origin();
      if (!base) return res.status(503).type("text/plain").send("CANONICAL_ORIGIN must be configured before RSS generation.");
      const items = posts.slice(0, 50).map(post => `<item><title>${xmlEscape(post.title)}</title><link>${xmlEscape(`${base}/articles/${post.slug}`)}</link><guid isPermaLink="true">${xmlEscape(`${base}/articles/${post.slug}`)}</guid><pubDate>${new Date(post.published_at).toUTCString()}</pubDate><description>${xmlEscape(post.excerpt || stripHtml(post.rendered_html).slice(0, 400))}</description></item>`).join("");
      const name = site?.name || process.env.SITE_NAME || "CodeReport Global";
      res.type("application/rss+xml").send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xmlEscape(name)}</title><link>${xmlEscape(base)}</link><description>${xmlEscape(site?.description || "Independent ideas, clearly told.")}</description>${items}</channel></rss>`);
    } catch {
      res.status(503).type("text/plain").send("RSS is temporarily unavailable.");
    }
  });
}
