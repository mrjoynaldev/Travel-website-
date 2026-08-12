#!/usr/bin/env node
/**
 * CodeReport Global — CLI
 *
 * Manage your publication from the command line using an API access token.
 * Create a token in Studio → "API tokens", then run:
 *
 *   CRG_TOKEN=crg_... node cli/blog.mjs whoami
 *
 * Env vars:
 *   CRG_TOKEN     Required. API access token (shown once at creation).
 *   CRG_API_URL   Optional. Defaults to http://localhost:4000
 */
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { readFileSync } from "node:fs";
import superjson from "superjson";

const API_URL = (process.env.CRG_API_URL || "http://localhost:4000").replace(/\/+$/, "");
const TOKEN = process.env.CRG_TOKEN || parseFlag("--token");

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

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textToDoc(text) {
  const paragraphs = String(text).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (!paragraphs.length) return { type: "doc", content: [] };
  return { type: "doc", content: paragraphs.map(p => ({ type: "paragraph", content: [{ type: "text", text: p }] })) };
}

function textToHtml(text) {
  return String(text).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join("\n");
}

function print(value) {
  console.log(JSON.stringify(value, null, 2));
}

function fail(error) {
  const message = error?.message || String(error);
  console.error(`✗ ${message}`);
  process.exit(1);
}

const HELP = `
CodeReport Global CLI

Usage: node cli/blog.mjs <command> [options]

Account:
  whoami                          Show the publication + role for this token

Posts:
  posts list [--status <s>] [--search <q>]   List posts (status: draft|review|published|archived)
  posts get <id>                            Fetch a single post
  posts create --title <t> [--slug <s>] [--excerpt <e>] [--body <text>|--file <path>]
  posts publish <id>                        Move a review post to published
  posts archive <id>                        Archive a post
  posts delete <id>                         Soft-delete a post (trash)

Taxonomy:
  categories list
  categories create --name <n> [--description <d>]
  tags list
  tags create --name <n>

Audience & media:
  subscribers list
  media list [--folder <f>]

Options:
  --token=<crg_...>   Access token (alternative to CRG_TOKEN)
`;

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith("--token="));
  const [cmd, sub] = args;

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") return console.log(HELP);

  try {
    if (cmd === "whoami") return print(await client.studio.bootstrap.query());

    if (cmd === "posts") {
      if (!sub || sub === "list") {
        const status = argValue("--status");
        const search = argValue("--search");
        return print(await client.studio.posts.list.query({ status, search }));
      }
      if (sub === "get") return print(await client.studio.posts.get.query({ id: requireArg(args, 2, "posts get <id>") }));
      if (sub === "publish") return print(await client.studio.posts.transition.mutate({ id: requireArg(args, 2, "posts publish <id>"), status: "published" }));
      if (sub === "archive") return print(await client.studio.posts.transition.mutate({ id: requireArg(args, 2, "posts archive <id>"), status: "archived" }));
      if (sub === "delete") return print(await client.studio.posts.remove.mutate({ id: requireArg(args, 2, "posts delete <id>"), confirmed: true }));
      if (sub === "create") {
        const title = argValue("--title");
        if (!title) return console.error("✗ --title is required");
        const body = argValue("--body") || (argValue("--file") ? readFileSync(argValue("--file"), "utf8") : "");
        const created = await client.studio.posts.create.mutate({
          title,
          slug: argValue("--slug"),
          excerpt: argValue("--excerpt"),
          contentJson: textToDoc(body),
          renderedHtml: textToHtml(body),
        });
        return print(created);
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

    if (cmd === "subscribers" && (!sub || sub === "list")) return print(await client.studio.subscribers.list.query());
    if (cmd === "media" && (!sub || sub === "list")) return print(await client.studio.media.list.query({ folder: argValue("--folder") }));

    console.log(HELP);
  } catch (error) {
    fail(error);
  }
}

function requireArg(args, index, usage) {
  const value = args[index];
  if (!value) {
    console.error(`✗ Missing argument. Usage: ${usage}`);
    process.exit(1);
  }
  return value;
}

function requireFlag(name) {
  const value = argValue(name);
  if (!value) {
    console.error(`✗ ${name} is required`);
    process.exit(1);
  }
  return value;
}

main();
