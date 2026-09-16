#!/usr/bin/env node
/**
 * Sundarban Yatri — Distribution Kit generator (Phase 2 of the syndication engine).
 *
 * Generates ready-to-paste share kits for every published article so each piece
 * earns reach AND backlinks without duplicate-content risk. Canonical home is
 * ALWAYS sundarbanyatri.com (see POST-WRITING-SKILL.md §9).
 *
 *   SY_TOKEN=sy_... node distribute.mjs kit <slug>
 *   SY_TOKEN=sy_... node distribute.mjs kit <slug> --out ~/somewhere
 *
 * Env vars:
 *   SY_TOKEN     Required. API access token (shown once at creation).
 *   SY_API_URL   Optional. Defaults to https://travel-website-n69r.onrender.com
 *   SY_SITE_URL  Optional. Defaults to https://sundarbanyatri.com
 *   SY_KITS_DIR  Optional. Defaults to ~/sy-cli/kits/<slug>/
 *
 * Channel tiers (POST-WRITING-SKILL.md §9, travel-first):
 *   TIER 1 Instagram · Facebook Page · YouTube Short · WhatsApp broadcast (books trips)
 *   AUTO   Facebook · Instagram · Bluesky · Mastodon · dev.to-teaser (queue approve, auto post)
 *   QUEUE  Reddit + Quora answers                       (approve-then-post, 3/day cap)
 *   MANUAL YouTube description · WhatsApp text · Medium import (7–10d, canonical)
 */
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import superjson from "superjson";

const API_URL = (process.env.SY_API_URL || "https://travel-website-n69r.onrender.com").replace(/\/+$/, "");
const PUBLIC_SITE = (process.env.SY_SITE_URL || "https://sundarbanyatri.com").replace(/\/+$/, "");
const TOKEN = process.env.SY_TOKEN || process.env.SY_TOKEN || (process.argv.find(a => a.startsWith("--token=")) || "").slice(8);

if (!TOKEN) {
  console.error("Missing access token. Set SY_TOKEN or pass --token=sy_...");
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

const liveUrl = slug => `${PUBLIC_SITE}/articles/${slug}`;

function decodeEntities(value) {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function textOf(html) {
  return decodeEntities(String(html).replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function inlineMd(html) {
  let s = String(html);
  s = s.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => `[${textOf(label)}](${decodeEntities(href).trim()})`);
  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**");
  s = s.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, "_$2_");
  s = s.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");
  return s;
}

function tableToMd(tableHtml) {
  const rows = [...tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(row =>
    [...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(cell =>
      inlineMd(cell[1]).replace(/<[^>]*>/g, "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim()
    )
  );
  if (!rows.length) return "";
  const [head, ...body] = rows;
  const width = head.length;
  const pad = row => (row.length < width ? [...row, ...Array(width - row.length).fill("")] : row);
  const lines = [
    `| ${pad(head).join(" | ")} |`,
    `| ${Array(width).fill("---").join(" | ")} |`,
    ...body.map(r => `| ${pad(r).join(" | ")} |`),
  ];
  return `\n${lines.join("\n")}\n`;
}

function htmlToMarkdown(html) {
  const codeBlocks = [];
  let work = String(html || "");

  work = work.replace(/<pre\b[^>]*>\s*<code\b([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, attrs, code) => {
    const lang = attrs.match(/class="language-([\w+#-]+)"/i)?.[1] || attrs.match(/data-lang="([\w+#-]+)"/i)?.[1] || "";
    codeBlocks.push("```" + lang + "\n" + decodeEntities(code.replace(/<[^>]*>/g, "")).replace(/\s+$/, "") + "\n```");
    return `\n@@CRGBLOCK${codeBlocks.length - 1}@@\n`;
  });

  work = work.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (_, inner) => tableToMd(inner));

  work = work.replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, type, inner) => {
    let index = 0;
    const items = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(([, item]) => {
      index += 1;
      const marker = type.toLowerCase() === "ol" ? `${index}.` : "-";
      return `${marker} ${textOf(inlineMd(item))}`;
    });
    return `\n\n${items.join("\n")}\n\n`;
  });

  work = work.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) =>
    `\n\n${textOf(inlineMd(inner)).split(/(?<=\S)\s{2,}/).map(line => `> ${line}`).join("\n> ")}\n\n`
  );

  work = work.replace(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, inner) => `\n\n${"#".repeat(Number(tag.slice(1)))} ${textOf(inner)}\n\n`);
  work = work.replace(/<hr\b[^>]*>/gi, "\n\n---\n\n");
  work = work.replace(/<img\b[^>]*>/gi, tag => {
    const src = tag.match(/src="([^"]*)"/i)?.[1];
    if (!src) return "";
    const alt = tag.match(/alt="([^"]*)"/i)?.[1] || "";
    return `\n\n![${decodeEntities(alt)}](${decodeEntities(src)})\n\n`;
  });
  work = work.replace(/<br\s*\/?>/gi, "\n");
  work = work.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_, inner) => `\n\n${inlineMd(inner)}\n\n`);

  work = work.replace(/<[^>]*>/g, " ");
  work = decodeEntities(work);
  work = work.replace(/@@CRGBLOCK(\d+)@@/g, (_, n) => `\n\n${codeBlocks[Number(n)] ?? ""}\n\n`);
  work = work.replace(/^[ \t]*(?:[a-z+#-]+[ \t]+)?Copy[ \t]*$/gim, "");
  work = work.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return work;
}

function truncateWords(value, maxChars) {
  const words = String(value).split(/\s+/);
  let out = "";
  for (const word of words) {
    if ((out + " " + word).trim().length > maxChars) break;
    out = (out + " " + word).trim();
  }
  return out || words[0].slice(0, maxChars);
}

function graphemeLength(value) {
  return Array.from(String(value)).length;
}

function devTags(post) {
  // Travel-first tag pool: post tags first, Sundarban trip tags as fallback.
  const fallback = ["sundarban", "sundarbantour", "kolkata", "travel"];
  const own = (post.tags || [])
    .map(tag => String(tag.name || tag.slug || "").toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(tag => tag.length >= 3 && tag.length <= 20);
  return [...new Set([...own, ...fallback])].slice(0, 4);
}

function sectionHeadings(markdown) {
  return markdown
    .split("\n")
    .filter(line => /^##\s+/.test(line))
    .map(line => line.replace(/^##\s+/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

function buildKit(post) {
  const url = liveUrl(post.slug);
  const markdown = htmlToMarkdown(post.rendered_html);
  const title = textOf(post.title);
  const summary = textOf(post.meta_description || post.excerpt || "").slice(0, 140) || truncateWords(title, 130);
  const cover = post.og_image_url || post.featuredMedia?.url || "";
  const tags = devTags(post);

  const blueskyTail = `\n\n${url}${tags.length ? `\n\n${tags.slice(0, 2).map(tag => "#" + tag).join(" ")}` : ""}`;
  const blueskyRoom = 300 - graphemeLength(blueskyTail) - 1;
  const blueskyTitle = graphemeLength(title) > blueskyRoom ? `${Array.from(truncateWords(title, blueskyRoom)).slice(0, blueskyRoom - 1).join("")}…` : title;

  const bullets = sectionHeadings(markdown);

  const files = {};

  // Teaser drives traffic to canonical — never dump full article on dev.to (see https://developers.forem.com/api/v0 + forem/forem#front-matter-beats-API).
  const teaserPreview = truncateWords(textOf(markdown.replace(/[#*_`>\-\n]+/g, " ").replace(/\s+/g, " ").trim()), 320);
  files["devto.md"] = `---
title: ${title}
published: false
description: ${summary}
tags: ${tags.join(", ")}
canonical_url: ${url}${cover ? `\ncover_image: ${cover}` : ""}
---

${summary}

> Originally published at **Sundarban Yatri** — read the full guide with photos, costs and timings at **${url}**.

## Why this matters

${teaserPreview}…

## What you'll get in the full article

 ${bullets.map(bullet => `- ${bullet}`).join("\n") || `- Full step-by-step trip plan`}
- Verified timings, costs and inclusions with check dates — no fluff

👉 **Read the full guide:** ${url}

*Planning a Sundarban trip? Discussion continues on the original post.*

---
*Canonical: ${url}*
`;

  files["bluesky.txt"] = `${blueskyTitle}${blueskyTail}\n`;

  // Facebook Page: link on its own line so Graph API creates link preview via og:image (1200×630)
  files["facebook.txt"] = `${title}\n\n${summary}\n\n${bullets.slice(0, 3).map(b => `• ${b}`).join("\n")}\n\nRead the full guide: ${url}\n\n#Sundarban #SundarbanTour ${tags.slice(0, 2).map(t => `#${t}`).join(" ")}\n`;

  // Instagram: caption not clickable — drive to link in bio + image via cover
  const instaTags = tags.slice(0, 3).map(t => `#${t}`).join(" ");
  files["instagram.txt"] = `${title}\n\n${summary}\n\n${bullets.slice(0, 3).map(b => `• ${b}`).join("\n")}\n\nFull guide — link in bio: ${url}\n\n${instaTags} #Sundarban #SundarbanYatri\n`;

  files["reddit-comments.md"] = `# Reddit kit — ${title}
URL: ${url}

## Rules first (POST-WRITING-SKILL.md §9)
- Threads younger than 24 hours only. Read the thread fully before commenting.
- Lead with the ANSWER, not the link. The link is supporting evidence, one sentence, never a CTA.
- One community per week maximum. Global cap: 3 approved posts/day across all channels.
- Candidate subs by topic: r/travel, r/india, r/kolkata and Kolkata travel subs, Quora Sundarban topics, TripAdvisor Sundarban threads (pick ONLY where the trip question genuinely fits).

## Draft A — direct-answer comment
> Replace [QUESTION CONTEXT] with what the thread actually asks. Delete this note before posting.

[QUESTION CONTEXT]

The core answer comes down to [ONE-PARAGRAPH DIRECT ANSWER drawn from the article].

I verified this while writing up "${title}" — full breakdown with timings/costs: ${url}

## Draft B — data-point comment
> Use when the thread debates tradeoffs. Delete this note before posting.

Worth adding hard numbers to this debate: [KEY FACT OR NUMBER from the article].

Context: ${summary} Full analysis: ${url}
`;

  files["linkedin.md"] = `${title}

${summary}

In this piece we cover:
${bullets.map(bullet => `• ${bullet}`).join("\n") || "• The full trip plan and what it changes for travellers"}

Read the full guide: ${url}

#Sundarban #SundarbanTour${tags.slice(0, 2).map(tag => ` #${tag.charAt(0).toUpperCase()}${tag.slice(1)}`).join("")}
`;

  files["hn-title.txt"] = `${truncateWords(title, 80)}\n`;

  files["hn-firstcomment.md"] = `First-comment draft (post it yourself right after submitting — honest, no marketing tone):

What's new: ${summary}

Why it's interesting: [FILL IN — the §4b angle in one sentence: what this changes for travellers that other coverage misses]

Full write-up with [THE ORIGINAL EVIDENCE: timings/costs/table]: ${url}

Reminder: submit the URL only (${url}) with the title from hn-title.txt. Never automate HN submissions.
`;

  files["medium-import.url"] = `${url}
Import via Medium → your profile → "… → Import a story": it sets rel=canonical automatically.
Never use their closed write API — canonical cannot be added after publishing through it.
`;

  files["newsletter-tip.md"] = `Editor pitch — send only after the article is indexed (day ~7–10).

To: [FILL IN — a travel editor / tour-feature desk that covers Sundarban or Bengal trips]
Subject suggestion: ${title}
Link: ${url}

One-line pitch: ${summary}
Information gain (why their readers care): [FILL IN — the one thing no other outlet covered: verified timings, cost table, or route change]
`;

  files["checklist.md"] = `# Distribution checklist — ${title}
Article: ${url}
Published: ${post.published_at ? new Date(post.published_at).toISOString().slice(0, 10) : "unknown"}
Golden rule: sundarbanyatri.com is canonical. Wait 7–10 days after publish BEFORE full-copy syndication (dev.to/Medium). Trip-channel posts (Instagram/Facebook/YouTube/WhatsApp/Reddit/Quora) go same-day.

## TIER 1 — books trips (do on every publish)
- [ ] Instagram — post instagram.txt + cover 1080×1350 (auto via Graph API, caption link in bio)
- [ ] Facebook Page — post facebook.txt (auto via Graph API, link preview via og:image)
- [ ] YouTube Short — review/safari clip + description link (manual)
- [ ] WhatsApp — status + broadcast to past/lost leads for weekend/season pushes (manual)

## AUTO channels (system posts within hard daily cap)
- [ ] Facebook Page — review facebook.txt first (trip intent)
- [ ] Instagram — review instagram.txt first (trip intent)
- [ ] Bluesky — post bluesky.txt verbatim (reach-only)
- [ ] Mastodon — reuse bluesky.txt content (drop hashtags beyond 2 if noisy, reach-only)
- [ ] dev.to — review devto.md (teaser), flip published:true, confirm canonical_url renders (reach-only)

## Verified channel rules (official docs, 2026-08-22)
| Channel | Format | Link rule | Media |
|---|---|---|---|
| Instagram | caption + 1080×1350 image | link in bio (captions not clickable) | image REQUIRED 1080×1350 |
| Facebook Page | message + link param | link on own line → og:image preview | link preview auto via og:image |
| YouTube Short | 30–60s real clip + description | full URL in description + pinned comment | real review/safari footage only |
| Bluesky | plain text ≤300 graphemes incl. URL+hashtags | API injects facets automatically | link-preview card auto-built from og:image |
| Mastodon | plain text ≤500 chars | URLs always count as 23 chars — never shorten | optional: 1 image via Studio media library first |
| dev.to | teaser markdown + front matter | canonical_url = our URL; ≤4 lowercase travel tags | cover_image REQUIRED (1000×420 render) |
| Quora/Reddit | full value-first answer | link only where it completes the answer | optional photo that proves the claim |

## QUEUE channel
- [ ] Reddit + Quora — pick ONE fresh trip-question thread (<24h) matching drafts in reddit-comments.md; approve in Studio queue (cap 3/day)

## MANUAL channels
- [ ] YouTube Short description + WhatsApp broadcast text (Tier 1, same day)
- [ ] Quora answer — adapt reddit-comments.md Draft A (same day OK)
- [ ] Medium — Import-a-story with medium-import.url (after indexing window)
- [ ] Editor pitch — newsletter-tip.md (after indexing window)
- [ ] LinkedIn / X / HN files in this kit are legacy — skip for Sundarban trips (zero trip intent)

## ONE-TIME (site-wide, not per-article)
- [ ] TripAdvisor + Google Business profile completeness
- [ ] Travel-forum profiles with real answers (no links until trusted)

## Placement log
| Date | Channel | URL of placement | Result (views/upvotes/replies) |
|---|---|---|---|
|  |  |  |  |
`;

  return files;
}

async function resolvePost(slug) {
  const pool = await client.studio.posts.list.query({ status: "published" });
  if (!Array.isArray(pool)) throw new Error("Unexpected response from posts.list.");
  const exact = pool.find(post => post.slug === slug);
  const loose = exact || pool.find(post => post.slug.includes(slug));
  if (!loose) {
    console.error(`✗ No published post matches "${slug}".`);
    console.error("  Published slugs:");
    for (const post of pool) console.error(`   - ${post.slug}`);
    process.exit(1);
  }
  const full = await client.studio.posts.get.query({ id: loose.id });
  return {
    ...loose,
    ...full,
    tags: loose.tags ?? [],
    featuredMedia: loose.featuredMedia ?? null,
  };
}

function requireSlug(args) {
  const slug = args[0];
  if (!slug) {
    console.error("Usage: node distribute.mjs <kit|push> <slug> [--out <dir>]");
    process.exit(1);
  }
  return slug;
}

function kitDirFor(args, slug) {
  const outFlagIndex = args.indexOf("--out");
  if (outFlagIndex >= 0 && args[outFlagIndex + 1]) return resolve(args[outFlagIndex + 1]);
  if (process.env.SY_KITS_DIR || process.env.SY_KITS_DIR) return resolve(process.env.SY_KITS_DIR || process.env.SY_KITS_DIR, slug);
  return join(homedir(), "sy-cli", "kits", slug);
}

async function pushKit(slug) {
  const dir = kitDirFor(process.argv.slice(2), slug);
  let devtoMd;
  let blueskyTxt;
  try {
    devtoMd = readFileSync(join(dir, "devto.md"), "utf8");
    blueskyTxt = readFileSync(join(dir, "bluesky.txt"), "utf8").trim();
  } catch {
    console.error(`✗ Kit not found in ${dir}. Run \`node distribute.mjs kit ${slug}\` first.`);
    process.exit(1);
  }
  let facebookTxt = "";
  let instagramTxt = "";
  try { facebookTxt = readFileSync(join(dir, "facebook.txt"), "utf8").trim(); } catch {}
  try { instagramTxt = readFileSync(join(dir, "instagram.txt"), "utf8").trim(); } catch {}
  // Instagram needs cover image URL at 1080x1350 — parse from devto front matter
  const coverMatch = devtoMd.match(/cover_image:\s*(.+)/);
  const rawCover = coverMatch ? coverMatch[1].trim() : "";
  const instaImageFinal = rawCover
    ? rawCover.split("?")[0].replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") + "?width=1080&height=1350&resize=cover&quality=75"
    : "";
  console.error("-> Enqueuing facebook + instagram + bluesky + mastodon + devto into the Studio distribution queue...");
  const items = [
    { channel: "devto", payload: { bodyMarkdown: devtoMd } },
    { channel: "bluesky", payload: { text: blueskyTxt } },
    { channel: "mastodon", payload: { text: blueskyTxt } },
    ...(facebookTxt ? [{ channel: "facebook", payload: { text: facebookTxt } }] : []),
    ...(instagramTxt ? [{ channel: "instagram", payload: { caption: instagramTxt, imageUrl: instaImageFinal || cover } }] : []),
  ];
  const rows = await client.distribution.enqueue.mutate({ slug, items });
  console.error(`   queued ${rows.length} item(s):`);
  for (const row of rows) console.error(`   - [${row.status}] ${row.channel}`);
  console.log("\nQueued. Approve them in Studio → Distribution (auto post — no daily limit).");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help" || command === "--help") {
    console.log(`Usage: node distribute.mjs <command> <slug> [--out <dir>]

  kit <slug>    Generate a travel-first distribution kit (Instagram caption,
                Facebook post, Reddit/Quora answer drafts, Bluesky post, dev.to
                teaser, Medium import URL, editor pitch, placement checklist)
                for one published article.
  push <slug>   Enqueue facebook + instagram + bluesky + mastodon + devto payloads
                from an existing kit into the Studio distribution queue
                (approve-then-post, cap 3/day).

Env: SY_TOKEN (required), SY_API_URL, SY_SITE_URL, SY_KITS_DIR.`);
    return;
  }

  if (command !== "kit" && command !== "push") {
    console.error(`Unknown command "${command}". Try: kit <slug> | push <slug>`);
    process.exit(1);
  }

  const slug = requireSlug(args.slice(1));
  const outDir = kitDirFor(args, slug);

  console.error(`-> Fetching published post "${slug}"...`);
  const post = await resolvePost(slug);
  console.error(`-> Found: ${post.title}`);

  if (command === "push") {
    await pushKit(slug);
    return;
  }

  console.error(`-> Generating kit in ${outDir} ...`);
  console.error(`-> Found: ${post.title}`);
  console.error(`-> Generating kit in ${outDir} ...`);

  mkdirSync(outDir, { recursive: true });
  const files = buildKit(post);
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(outDir, name), content, "utf8");
    console.error(`   ✓ ${name}`);
  }

  console.log(`\nKit ready: ${outDir}`);
  console.log("Next: follow checklist.md. AUTO channels fire within the daily cap; MANUAL channels are paste-ready.");
}

main().catch(error => {
  const message = error?.message || String(error);
  console.error(`✗ ${message}`);
  process.exit(1);
});
