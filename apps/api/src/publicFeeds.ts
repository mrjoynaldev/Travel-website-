import { getSupabase } from "./supabase";

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const origin = () => (process.env.CANONICAL_ORIGIN || "").replace(/\/$/, "");

async function latestPosts() {
  const db = getSupabase();
  const { data: site, error: siteError } = await db
    .from("sites")
    .select("id, name, description, updated_at")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (siteError) throw siteError;
  if (!site) return { site: null, posts: [] as any[], pages: [] as any[], categories: [] as any[], tags: [] as any[], authors: [] as any[] };
  const { data: posts, error: postError } = await db
    .from("posts")
    .select("slug, title, excerpt, rendered_html, author_id, published_at, updated_at")
    .eq("site_id", site.id)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(500);
  if (postError) throw postError;
  const [pagesResult, categoriesResult, tagsResult, authorsResult] = await Promise.all([
    db.from("site_pages").select("slug, updated_at, published_at").eq("site_id", site.id).eq("status", "published").order("published_at", { ascending: false }).limit(100),
    db.from("categories").select("slug").eq("site_id", site.id),
    db.from("tags").select("slug").eq("site_id", site.id),
    db.from("profiles").select("id").in("id", Array.from(new Set((posts ?? []).map((post: any) => post.author_id)))),
  ]);
  if (pagesResult.error || categoriesResult.error || tagsResult.error || authorsResult.error) {
    throw pagesResult.error || categoriesResult.error || tagsResult.error || authorsResult.error;
  }
  return {
    site,
    posts: posts ?? [],
    pages: pagesResult.data ?? [],
    categories: categoriesResult.data ?? [],
    tags: tagsResult.data ?? [],
    authors: authorsResult.data ?? [],
  };
}

export type FeedResult = { body: string; contentType: string; status: number };

export async function robotsTxt(): Promise<FeedResult> {
  const base = origin();
  // Verified against vendor docs + Cloudflare AI Crawl Control bot directory (2026).
  const aiBots = [
    // OpenAI
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    // Anthropic
    "ClaudeBot",
    "Claude-SearchBot",
    "Claude-User",
    "anthropic-ai",
    // Perplexity
    "PerplexityBot",
    "Perplexity-User",
    // Google / Apple tokens & crawlers
    "Google-Extended",
    "Applebot",
    "Applebot-Extended",
    // Meta
    "Meta-ExternalAgent",
    "Meta-ExternalFetcher",
    "FacebookBot",
    // Others
    "CCBot",
    "Amazonbot",
    "Bytespider",
    "cohere-ai",
    "MistralAI-User",
    "DuckAssistBot",
    "YouBot",
    "Diffbot",
  ]
    .map(bot => `User-agent: ${bot}\nAllow: /`)
    .join("\n");
  const sitemapLines = base ? [`Sitemap: ${base}/sitemap.xml`, `Sitemap: ${base}/news-sitemap.xml`] : [];
  const body = [`User-agent: *\nAllow: /`, aiBots, ...sitemapLines].filter(Boolean).join("\n") + "\n";
  return { body, contentType: "text/plain", status: 200 };
}

export async function newsSitemapXml(): Promise<FeedResult> {
  try {
    const { posts } = await latestPosts();
    const base = origin();
    if (!base) return { body: "CANONICAL_ORIGIN must be configured before sitemap generation.", contentType: "text/plain", status: 503 };
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const recent = posts.filter((post: any) => {
      const published = new Date(post.published_at || post.updated_at).getTime();
      return Number.isFinite(published) && published >= cutoff;
    });
    const urls = recent.map((post: any) => {
      const title = stripHtml(post.title || post.slug);
      const date = new Date(post.published_at || post.updated_at).toISOString();
      return `<url><loc>${xmlEscape(`${base}/articles/${post.slug}`)}</loc><news:news><news:publication><news:name>CodeReport Global</news:name><news:language>en</news:language></news:publication><news:publication_date>${date}</news:publication_date><news:title>${xmlEscape(title)}</news:title></news:news></url>`;
    }).join("");
    return { body: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`, contentType: "application/xml", status: 200 };
  } catch {
    return { body: "News sitemap is temporarily unavailable.", contentType: "text/plain", status: 503 };
  }
}

export async function sitemapXml(): Promise<FeedResult> {
  try {
    const { posts, pages, categories, tags, authors } = await latestPosts();
    const base = origin();
    if (!base) return { body: "CANONICAL_ORIGIN must be configured before sitemap generation.", contentType: "text/plain", status: 503 };
    const urls = [
      `<url><loc>${xmlEscape(`${base}/`)}</loc></url>`,
      ...posts.map(post => `<url><loc>${xmlEscape(`${base}/articles/${post.slug}`)}</loc><lastmod>${new Date(post.updated_at || post.published_at).toISOString()}</lastmod></url>`),
      ...pages.map(page => `<url><loc>${xmlEscape(`${base}/${page.slug}`)}</loc><lastmod>${new Date(page.updated_at || page.published_at).toISOString()}</lastmod></url>`),
      ...categories.map(category => `<url><loc>${xmlEscape(`${base}/topics/${category.slug}`)}</loc></url>`),
      ...tags.map(tag => `<url><loc>${xmlEscape(`${base}/tags/${tag.slug}`)}</loc></url>`),
      ...authors.map(author => `<url><loc>${xmlEscape(`${base}/authors/${author.id}`)}</loc></url>`),
      `<url><loc>${xmlEscape(`${base}/archive`)}</loc></url>`,
    ].join("");
    return { body: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, contentType: "application/xml", status: 200 };
  } catch {
    return { body: "Sitemap is temporarily unavailable.", contentType: "text/plain", status: 503 };
  }
}

export async function rssXml(): Promise<FeedResult> {
  try {
    const { site, posts } = await latestPosts();
    const base = origin();
    if (!base) return { body: "CANONICAL_ORIGIN must be configured before RSS generation.", contentType: "text/plain", status: 503 };
    const items = posts
      .slice(0, 50)
      .map(post => `<item><title>${xmlEscape(post.title)}</title><link>${xmlEscape(`${base}/articles/${post.slug}`)}</link><guid isPermaLink="true">${xmlEscape(`${base}/articles/${post.slug}`)}</guid><pubDate>${new Date(post.published_at).toUTCString()}</pubDate><description>${xmlEscape(post.excerpt || stripHtml(post.rendered_html).slice(0, 400))}</description></item>`)
      .join("");
    const name = site?.name || process.env.SITE_NAME || "CodeReport Global";
    const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xmlEscape(name)}</title><link>${xmlEscape(base)}</link><description>${xmlEscape(site?.description || "Independent ideas, clearly told.")}</description>${items}</channel></rss>`;
    return { body, contentType: "application/rss+xml", status: 200 };
  } catch {
    return { body: "RSS is temporarily unavailable.", contentType: "text/plain", status: 503 };
  }
}
