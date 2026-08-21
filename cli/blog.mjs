#!/usr/bin/env node
/**
 * CodeReport Global — CLI (full account control)
 *
 * Manage the entire publication from the command line using an API access
 * token. Create a token in Studio → "API tokens" (scope: read + write), then:
 *
 *   CRG_TOKEN=crg_... node cli/blog.mjs whoami
 *
 * Env vars:
 *   CRG_TOKEN     Required. API access token (shown once at creation).
 *   CRG_API_URL   Optional. Defaults to https://codereportglobal-backend.onrender.com
 */
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import superjson from "superjson";
import { gravityToHtml } from "./gravity.mjs";

const API_URL = (process.env.CRG_API_URL || "https://codereportglobal-backend.onrender.com").replace(/\/+$/, "");
const PUBLIC_SITE = (process.env.CRG_SITE_URL || "https://codereportglobal.indevs.in").replace(/\/+$/, "");
const TOKEN = process.env.CRG_TOKEN || parseFlag("--token");

const liveUrl = slug => `${PUBLIC_SITE}/articles/${slug}`;
const note = message => console.error(message);

if (!TOKEN) {
  console.error("Missing access token. Set CRG_TOKEN or pass --token=crg_...");
  console.error("Create one in Studio → API tokens.");
  process.exit(1);
}

const client = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      headers: () => ({ Authorization: `Bearer ${TOKEN}` }),
      transformer: superjson,
    }),
  ],
});

function parseFlag(name) {
  const hit = process.argv.find(a => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : undefined;
}

function argValue(name) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : undefined;
}

function argValues(name) {
  const values = [];
  process.argv.forEach((arg, idx) => {
    if (arg === name && process.argv[idx + 1]) values.push(process.argv[idx + 1]);
    else if (arg.startsWith(`${name}=`)) values.push(arg.slice(name.length + 1));
  });
  return values;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function print(value) {
  console.log(JSON.stringify(value, null, 2));
}

function fail(error) {
  const message = error?.message || String(error);
  console.error(`✗ ${message}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Content + taxonomy helpers                                          */
/* ------------------------------------------------------------------ */

function normalizeGravityDoc(raw) {
  const doc = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!doc || doc.type !== "gravity" || !Array.isArray(doc.blocks)) {
    throw new Error("Gravity file must be JSON: { \"type\": \"gravity\", \"version\": 1, \"sections\": [], \"blocks\": [...] }");
  }
  doc.blocks.forEach((block, index) => {
    if (!block.id) block.id = `b${index + 1}`;
    if (typeof block.x !== "number") block.x = 40;
    if (typeof block.y !== "number") block.y = 40 + index * 120;
    if (typeof block.width !== "number") block.width = block.type === "text" ? 300 : 460;
  });
  return {
    contentJson: { type: "gravity", version: 1, sections: doc.sections || [], blocks: doc.blocks },
    renderedHtml: gravityToHtml(doc.blocks, doc.sections || []),
  };
}

function textToDoc(text) {
  const paragraphs = String(text).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (!paragraphs.length) return { type: "doc", content: [] };
  return { type: "doc", content: paragraphs.map(p => ({ type: "paragraph", content: [{ type: "text", text: p }] })) };
}

function textToHtml(text) {
  return String(text).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join("\n");
}

async function resolveTaxonomy(kind, names) {
  const resolved = [];
  for (const name of names) {
    const lists = await client.studio.taxonomy.list.query();
    const pool = kind === "category" ? lists.categories : lists.tags;
    const hit = pool.find(item => item.name.toLowerCase() === name.toLowerCase() || item.slug === name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    if (hit) { resolved.push(hit.id); continue; }
    const created = kind === "category"
      ? await client.studio.taxonomy.createCategory.mutate({ name })
      : await client.studio.taxonomy.createTag.mutate({ name });
    console.error(`+ created ${kind}: ${created.name} (${created.id})`);
    resolved.push(created.id);
  }
  return resolved;
}

const MIME_BY_EXT = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".pdf": "application/pdf",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".ogg": "audio/ogg",
  ".mp4": "video/mp4", ".webm": "video/webm",
};

async function buildPostInput({ requireContent }) {
  const input = {};
  const title = argValue("--title");
  if (title) input.title = title;
  if (requireContent && !title) throw new Error("--title is required");
  const slug = argValue("--slug");
  if (slug) input.slug = slug;
  const excerpt = argValue("--excerpt");
  if (excerpt !== undefined) input.excerpt = excerpt;
  const metaTitle = argValue("--meta-title");
  if (metaTitle !== undefined) input.metaTitle = metaTitle;
  const metaDescription = argValue("--meta-description");
  if (metaDescription !== undefined) input.metaDescription = metaDescription;
  const canonical = argValue("--canonical");
  if (canonical !== undefined) input.canonicalUrl = canonical;
  const ogImage = argValue("--og-image");
  if (ogImage !== undefined) input.ogImageUrl = ogImage;

  const categories = argValues("--category");
  if (categories.length) input.categoryIds = await resolveTaxonomy("category", categories);
  const tags = argValues("--tag");
  if (tags.length) input.tagIds = await resolveTaxonomy("tag", tags);

  const thumbnail = argValue("--thumbnail");
  if (thumbnail) {
    if (/^[0-9a-f-]{36}$/i.test(thumbnail)) input.featuredMediaId = thumbnail;
    else {
      const library = await client.studio.media.list.query({});
      const hit = library.find(asset => asset.url === thumbnail);
      if (!hit) throw new Error(`No media asset found for ${thumbnail}. Upload it first: media upload --file <path>`);
      input.featuredMediaId = hit.id;
    }
  }

  const gravityPath = argValue("--gravity-file");
  const filePath = argValue("--file");
  const bodyText = argValue("--body");
  if (gravityPath) {
    Object.assign(input, normalizeGravityDoc(readFileSync(gravityPath, "utf8")));
  } else if (filePath) {
    const raw = readFileSync(filePath, "utf8");
    if (raw.trimStart().startsWith("{")) Object.assign(input, normalizeGravityDoc(raw));
    else { input.contentJson = textToDoc(raw); input.renderedHtml = textToHtml(raw); }
  } else if (bodyText) {
    input.contentJson = textToDoc(bodyText);
    input.renderedHtml = textToHtml(bodyText);
  } else if (requireContent) {
    throw new Error("Provide content via --gravity-file <path>, --file <path>, or --body <text>");
  }
  return input;
}

/* ------------------------------------------------------------------ */
/* Commands                                                            */
/* ------------------------------------------------------------------ */

const HELP = `
CodeReport Global CLI — full publication control

Usage: node cli/blog.mjs <command> [options]

Account:
  whoami                                Show publication + role for this token

Research:
  research ga [--days <n>]              GA4 traffic: visitors, views, top pages, countries, sources
  research trends [--geo <US>]          Google Trends trending searches by country
  research hn [--query <q>]             Hacker News front page or topic search

Posts:
  posts list [--status <s>] [--search <q>]          List posts (draft|review|published|archived)
  posts get <id>                                    Fetch one post with taxonomy
  posts url <id>                                    Print the live website URL (published only)
  posts create [fields]                             Create a draft (see fields below)
  posts update <id> [fields]                        Update any field (merged with current)
  posts submit <id>                                 Draft → review
  posts publish <id>                                Review → published (live)
  posts archive <id>                                Published → archived
  posts delete <id>                                 Move to trash (soft delete)
  posts feature <id> [--off]                        Toggle homepage feature flag
  posts schedule <id> --at <iso-date>|--clear       Schedule / clear scheduled publishing

IndexNow (instant Bing/Yandex indexing):
  indexnow --url <u> [--url <u2> …]                 Submit changed URLs immediately
                                                    (publishes auto-submit via API)

Post fields:
  --title <t>                    Headline (required to create)
  --slug <s>                     URL slug (auto from title)
  --excerpt <e>                  Reader-facing summary (feeds meta description)
  --meta-title <t>               SEO title override (≤60 chars)
  --meta-description <d>         Meta description (150–160 chars)
  --canonical <url>              Canonical URL (usually omitted)
  --og-image <url>               Social share image URL (any host)
  --thumbnail <asset-id|url>     Cover/thumbnail from the media library
  --category <name>              Category by name (repeatable; auto-created)
  --tag <name>                   Tag by name (repeatable; auto-created)
  --gravity-file <path>          Gravity JSON document (blocks) — preferred
  --file <path>                  Plain-text or Gravity JSON file
  --body <text>                  Plain text body (fallback)

Media (images / audio / video / documents):
  media list [--folder <f>] [--search <q>]          List library assets
  media upload --file <path> [--alt <t>] [--caption <c>] [--folder <f>] [--mime <type>]
                                                 Upload and return the asset id + URL

Taxonomy:
  categories list | categories create --name <n> [--description <d>]
  tags list       | tags create --name <n>

Audience & insights:
  subscribers list
  analytics                       30-day analytics summary
  export [--format json|markdown] Full content export

Options:
  --token=<crg_...>   Access token (alternative to CRG_TOKEN)
`;

function requireArg(args, index, usage) {
  const value = args[index];
  if (!value) { console.error(`✗ Missing argument. Usage: ${usage}`); process.exit(1); }
  return value;
}

function requireFlag(name) {
  const value = argValue(name);
  if (!value) { console.error(`✗ ${name} is required`); process.exit(1); }
  return value;
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith("--token="));
  const [cmd, sub] = args;

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") return console.log(HELP);

  try {
    if (cmd === "whoami") return print(await client.studio.bootstrap.query());

    if (cmd === "posts") {
      if (!sub || sub === "list") {
        return print(await client.studio.posts.list.query({ status: argValue("--status"), search: argValue("--search") }));
      }
      if (sub === "get") return print(await client.studio.posts.get.query({ id: requireArg(args, 2, "posts get <id>") }));
      if (sub === "url") {
        const post = await client.studio.posts.get.query({ id: requireArg(args, 2, "posts url <id>") });
        if (post.status !== "published") {
          note(`✗ "${post.title}" is ${post.status} — no public URL yet. Publish it first.`);
          process.exit(1);
        }
        return console.log(liveUrl(post.slug));
      }
      if (sub === "create") {
        const post = await client.studio.posts.create.mutate(await buildPostInput({ requireContent: true }));
        note(`✓ Draft created (id ${post.id}). Not public yet — run: posts publish ${post.id}`);
        return print(post);
      }
      if (sub === "update") {
        const id = requireArg(args, 2, "posts update <id> [fields]");
        const current = await client.studio.posts.get.query({ id });
        const patch = await buildPostInput({ requireContent: false });
        const merged = {
          title: patch.title ?? current.title,
          slug: patch.slug ?? current.slug,
          excerpt: patch.excerpt ?? current.excerpt ?? "",
          metaTitle: patch.metaTitle ?? current.meta_title ?? "",
          metaDescription: patch.metaDescription ?? current.meta_description ?? "",
          canonicalUrl: patch.canonicalUrl ?? current.canonical_url ?? "",
          ogImageUrl: patch.ogImageUrl ?? current.og_image_url ?? "",
          featuredMediaId: patch.featuredMediaId !== undefined ? patch.featuredMediaId : current.featured_media_id,
          categoryIds: patch.categoryIds ?? current.categoryIds,
          tagIds: patch.tagIds ?? current.tagIds,
          contentJson: patch.contentJson ?? current.content_json,
          renderedHtml: patch.renderedHtml ?? current.rendered_html,
        };
        return print(await client.studio.posts.update.mutate({ id, data: merged, revisionNote: argValue("--revision-note") || "CLI update" }));
      }
      if (sub === "submit") {
        const post = await client.studio.posts.transition.mutate({ id: requireArg(args, 2, "posts submit <id>"), status: "review" });
        note("✓ Submitted for review.");
        return print(post);
      }
      if (sub === "publish") {
        const post = await client.studio.posts.transition.mutate({ id: requireArg(args, 2, "posts publish <id>"), status: "published" });
        note(`✓ Published live: ${liveUrl(post.slug)}`);
        return print(post);
      }
      if (sub === "archive") return print(await client.studio.posts.transition.mutate({ id: requireArg(args, 2, "posts archive <id>"), status: "archived" }));
      if (sub === "delete") return print(await client.studio.posts.remove.mutate({ id: requireArg(args, 2, "posts delete <id>"), confirmed: true }));
      if (sub === "feature") return print(await client.studio.posts.toggleFeatured.mutate({ id: requireArg(args, 2, "posts feature <id>"), featured: !hasFlag("--off") }));
      if (sub === "schedule") {
        const id = requireArg(args, 2, "posts schedule <id> --at <iso>|--clear");
        if (hasFlag("--clear")) return print(await client.studio.posts.schedule.mutate({ id, clear: true }));
        return print(await client.studio.posts.schedule.mutate({ id, scheduledAt: new Date(requireFlag("--at")).toISOString() }));
      }
      return console.log(HELP);
    }

    if (cmd === "media") {
      if (!sub || sub === "list") {
        return print(await client.studio.media.list.query({ folder: argValue("--folder"), search: argValue("--search") }));
      }
      if (sub === "upload") {
        const path = requireFlag("--file");
        const mimeType = argValue("--mime") || MIME_BY_EXT[extname(path).toLowerCase()];
        if (!mimeType) { console.error(`✗ Unknown file type for ${path}. Pass --mime <type>.`); process.exit(1); }
        const base64 = readFileSync(path).toString("base64");
        return print(await client.studio.media.upload.mutate({
          filename: path.split("/").pop(),
          mimeType,
          base64,
          folder: argValue("--folder") || "library",
          altText: argValue("--alt") || "",
          caption: argValue("--caption") || "",
        }));
      }
      return console.log(HELP);
    }

    if (cmd === "categories") {
      if (!sub || sub === "list") return print(await client.studio.taxonomy.list.query().then(r => r.categories));
      if (sub === "create") return print(await client.studio.taxonomy.createCategory.mutate({ name: requireFlag("--name"), description: argValue("--description") }));
      return console.log(HELP);
    }

    if (cmd === "tags") {
      if (!sub || sub === "list") return print(await client.studio.taxonomy.list.query().then(r => r.tags));
      if (sub === "create") return print(await client.studio.taxonomy.createTag.mutate({ name: requireFlag("--name") }));
      return console.log(HELP);
    }

    if (cmd === "research") {
      if (!sub || sub === "ga") {
        const days = Number(argValue("--days")) || 28;
        const data = await client.studio.research.gaOverview.query({ days });
        if (!data.configured) { note("✗ Google Analytics is not configured on the API server yet."); return print(data); }
        const t = data.totals;
        note(`✓ GA4 last ${data.days} days: ${t.activeUsers} visitors · ${t.sessions} sessions · ${t.pageviews} pageviews · top page: ${data.topPages[0]?.path ?? "n/a"}`);
        return print(data);
      }
      if (sub === "trends") {
        const geo = (argValue("--geo") || "US").toUpperCase();
        const data = await client.studio.research.trends.query({ geo });
        note(`✓ Google Trends for ${geo} (${(data.items || []).length} items). Use --geo <country-code> to switch.`);
        return print(data);
      }
      if (sub === "hn") {
        const query = argValue("--query");
        const data = await client.studio.research.hackerNews.query({ query, limit: Number(argValue("--limit")) || 20 });
        note(query ? `✓ Hacker News stories matching "${query}".` : "✓ Hacker News front page right now.");
        return print(data);
      }
      return console.log(HELP);
    }

    if (cmd === "indexnow") {
      const urls = argValues("--url");
      if (!urls.length) { console.error("Usage: indexnow --url <https://…> [--url <…> …]"); process.exit(1); }
      const KEY = "38f216160dda9ea59525512b52c19573";
      const response = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: "codereportglobal.indevs.in",
          key: KEY,
          keyLocation: `https://codereportglobal.indevs.in/${KEY}.txt`,
          urlList: urls,
        }),
      });
      note(response.ok
        ? `✓ IndexNow accepted ${urls.length} URL(s) (HTTP ${response.status}).`
        : `✗ IndexNow returned HTTP ${response.status} (403=key issue, 422=wrong host, 429=spam guard).`);
      return print({ status: response.status, urls });
    }

    if (cmd === "subscribers" && (!sub || sub === "list")) return print(await client.studio.subscribers.list.query());
    if (cmd === "analytics") return print(await client.studio.analytics.query({}));
    if (cmd === "export") return print(await client.studio.exportContent.query({ format: argValue("--format") || "json" }));

    console.log(HELP);
  } catch (error) {
    fail(error?.shape?.message || error);
  }
}

main();
