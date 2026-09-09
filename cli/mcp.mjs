#!/usr/bin/env node
/**
 * Sundarban Yatri — MCP server (full account control for AI agents).
 *
 * Speaks Model Context Protocol over stdio (newline-delimited JSON-RPC), so
 * ANY MCP-capable agent (opencode, Claude Code, custom agents) can manage the
 * entire publication: posts, taxonomy, media, tours, FAQs, video reviews,
 * food menu, leads, business settings and the brand kit — plus the skill
 * library as MCP prompts and resources.
 *
 * Zero npm dependencies — plain `node` only.
 *
 *   SY_TOKEN=sy_... node cli/mcp.mjs            # run as MCP server (stdio)
 *   SY_TOKEN=sy_... node cli/mcp.mjs --selftest  # protocol + live API check
 *
 * Env vars:
 *   SY_TOKEN    Required. API access token, scope read+write.
 *               Create one in Studio → "MCP access" (shown once).
 *   SY_API_URL  Optional. Defaults to https://sundarbanyatra.com
 *               (use http://localhost:4000 for local dev).
 *
 * Permanent install (example — opencode):
 *   { "mcp": { "sundarban-yatri": {
 *     "type": "local",
 *     "command": ["node", "/abs/path/to/mcp.mjs"],
 *     "environment": { "SY_TOKEN": "sy_...", "SY_API_URL": "https://sundarbanyatra.com" }
 *   } } }
 */

const API_URL = (process.env.SY_API_URL || "https://sundarbanyatra.com").replace(/\/+$/, "");
const TOKEN = process.env.SY_TOKEN || "";
const SELFTEST = process.argv.includes("--selftest");
const MAX_OUT = 20000;
const SERVER_VERSION = "1.2.0";

// ————————————————————————————————————————————————————————————————————————
// Skill library — served as MCP prompts (task routines) + resources
// (full files, always fresh from /docs). Grounded in the target audience:
// Sundarban tourists; every skill serves trip-enquiry leads.
// ————————————————————————————————————————————————————————————————————————

const SKILLS = [
  { file: "BRAND-SKILL.md", title: "Brand kit: hero video/image, trust badges, safari block, about photo" },
  { file: "LEAD-SKILL.md", title: "Lead generation: audiences, funnel, pipeline, scripts, KPIs" },
  { file: "TOUR-SKILL.md", title: "Tour products: honesty, pricing, gallery, seasonal ops" },
  { file: "SHOWCASE-SKILL.md", title: "Video reviews + food menu collection ethics" },
  { file: "SUNDARBAN-FACTS.md", title: "Ground truth: gateways, places, wildlife wording" },
  { file: "SOCIAL-SKILL.md", title: "Travel-first distribution: Instagram/FB/YouTube first" },
  { file: "POST-WRITING-SKILL.md", title: "Guide writing: demand checks, clusters, GEO" },
  { file: "AI-EDITOR-AGENT.md", title: "Agent operating manual + publishing contract" },
  { file: "ROADMAP.md", title: "90-day lead-engine plan + weekly cadence" },
  { file: "API-ACCESS.md", title: "Tokens, MCP, CLI and HTTP reference" },
  { file: "SEO-GOOGLE.md", title: "Google Search compliance digest" },
];

const PROMPTS = [
  {
    name: "write-trip-guide",
    title: "Write a trip guide",
    description: "Brief → demand check → draft a Sundarban trip guide that ranks and converts to enquiries.",
    arguments: [{ name: "topic", description: "The trip question, e.g. cost of 2D/1N from Kolkata", required: true }],
    build: (a) => `Write a Sundarban trip guide on: "${a.topic || "(ask the owner for the topic first)"}".\n\nFollow POST-WRITING-SKILL.md (demand check + interrogation + QA gate), LEAD-SKILL.md (call/WhatsApp-first funnel, link ≥1 tour), SUNDARBAN-FACTS.md (only verified facts) and the GEO rules in AI-EDITOR-AGENT.md §3f. Create it as a DRAFT via posts_create_draft and report the id. Do NOT publish without explicit approval.`,
  },
  {
    name: "audit-tour",
    title: "Audit a tour page",
    description: "Check a tour against TOUR-SKILL honesty + completeness gates and fix it.",
    arguments: [{ name: "tour", description: "Tour slug, or 'all' for every tour", required: false }],
    build: (a) => `Audit tour "${a.tour || "all"}" against TOUR-SKILL.md §2–§6 (real timings, named places, inclusions AND exclusions, meeting point/transport/stay, current price note, real gallery, related guides, enquiry CTA). List every gap, fix what you can as edits (keep status draft until the owner confirms), and report what needs owner input (prices, seasonal running status).`,
  },
  {
    name: "follow-up-leads",
    description: "Work the enquiry pipeline: new → contacted → won/lost with real replies.",
    arguments: [],
    build: () => `Work the lead pipeline per LEAD-SKILL.md §4: list leads with status=new, then contacted. For each, draft a short specific first-follow-up WhatsApp message (name, tour, date, group size, meeting point, one yes/no question — never a brochure). Report the drafts and WAIT for owner approval before marking contacted. Summarize win/loss movement and flag any lead older than 7 days untouched.`,
  },
  {
    name: "publish-check",
    title: "Pre-publish QA gate",
    description: "Run the fail-closed QA checklist on a draft before it goes live.",
    arguments: [{ name: "postId", description: "Draft post id", required: false }],
    build: (a) => `Run the pre-publish QA gate (AI-EDITOR-AGENT.md §7 + POST-WRITING-SKILL.md §10b 17 questions) on ${a.postId ? `post ${a.postId}` : "the current draft"}. Fail closed: any No/Weak answer means research more or switch angle — never publish generic. Report pass/fail per item.`,
  },
  {
    name: "food-reel-plan",
    title: "Weekly reel + proof plan",
    description: "Turn the newest review clips and dishes into this week's distribution.",
    arguments: [],
    build: () => `Build this week's proof loop per SOCIAL-SKILL.md §2 + SHOWCASE-SKILL.md: list the newest published reviews and dishes, pick ONE reel (newest genuine clip), its Facebook twin with tour link, one food carousel, and 3 forum questions worth answering. Report the plan and wait for approval before creating any automation or post.`,
  },
  {
    name: "season-prep",
    title: "Season readiness check",
    description: "Re-verify everything that changes between seasons.",
    arguments: [],
    build: () => `Run the verify-every-season list (SUNDARBAN-FACTS.md §6) against the live site: tour timings/price notes, meeting points, contact details, running status. Cross-check LEAD-SKILL.md §3 for what this season demands. Report a table: item → current value → verified/stale/unknown, and what you need from the owner.`,
  },
  {
    name: "audit-brand",
    title: "Brand kit audit",
    description: "Audit the hero, trust badges, safari block and about photo against BRAND-SKILL.",
    arguments: [],
    build: () => `Audit the live brand kit against BRAND-SKILL.md §5: read the current brand (brand_get), then check (1) hero — image set? video present with poster? copy specific? (2) trust badges — ≤6, each a verifiable truth? (3) safari block — photo real, copy seasonal, checklist ≤4? (4) about photo — real team/boat, not stock? (5) any stale seasonal copy? Report pass/fail per item with the exact fix for each fail. Apply fixes ONLY after owner approval — brand changes are instantly public with no draft mode.`,
  },
];

const log = (...args) => console.error("[mcp]", ...args);

// ————————————————————————————————————————————————————————————————————————
// tRPC over plain fetch (superjson batch envelope, plain-JSON payloads)
// ————————————————————————————————————————————————————————————————————————

async function trpc(path, input, method) {
  if (!TOKEN) throw new Error("Missing SY_TOKEN. Create a token in Studio → MCP access and set SY_TOKEN.");
  const url = `${API_URL}/api/trpc/${path}?batch=1`;
  const envelope = JSON.stringify({ 0: { json: input === undefined ? null : input } });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let res;
  try {
    if (method === "GET") {
      res = await fetch(`${url}&input=${encodeURIComponent(envelope)}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        signal: controller.signal,
      });
    } else {
      res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: envelope,
        signal: controller.signal,
      });
    }
  } catch (error) {
    throw new Error(`API unreachable at ${API_URL}: ${error.message}`);
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`API returned non-JSON (HTTP ${res.status}). Is SY_API_URL correct?`);
  }
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  if (first?.error) {
    const e = first.error.json ?? first.error;
    throw new Error(e?.message || `tRPC error on ${path}`);
  }
  return first?.result?.data?.json ?? null;
}

function cap(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  if (text.length <= MAX_OUT) return text;
  return text.slice(0, MAX_OUT) + `\n…[truncated ${text.length - MAX_OUT} chars — narrow the query]`;
}

const minimalDoc = (text) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: text || "" }] }],
});
const paraHtml = (text) => `<p>${String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`;

// ————————————————————————————————————————————————————————————————————————
// Tool catalogue (full control; high-impact tools carry confirm-first rules)
// ————————————————————————————————————————————————————————————————————————

const CONFIRM_RULE = "Confirm with the site owner BEFORE running this (publishing and deletion are irreversible in effect).";

const TOOLS = [
  {
    name: "whoami",
    description: "Verify the connection. Returns the admin identity this token acts as. ALWAYS call first.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => trpc("auth.me", null, "GET"),
  },
  {
    name: "posts_list",
    description: "List editorial posts. Filter by status (draft/review/published/archived) and/or search text.",
    inputSchema: { type: "object", properties: { status: { type: "string", enum: ["draft", "review", "published", "archived"] }, search: { type: "string" } } },
    run: (a) => trpc("studio.posts.list", { status: a.status, search: a.search }, "GET"),
  },
  {
    name: "posts_get",
    description: "Fetch one post with full content by id.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    run: (a) => trpc("studio.posts.get", { id: a.id }, "GET"),
  },
  {
    name: "posts_create_draft",
    description: "Create a DRAFT post (never published). Returns the new post id for further edits.",
    inputSchema: { type: "object", properties: { title: { type: "string" }, excerpt: { type: "string" }, html: { type: "string", description: "Full article body as HTML" } }, required: ["title"] },
    run: (a) => trpc("studio.posts.create", {
      title: a.title,
      excerpt: a.excerpt || "",
      contentJson: minimalDoc(a.html || a.excerpt || a.title),
      renderedHtml: a.html || paraHtml(a.excerpt || a.title),
      categoryIds: [], tagIds: [],
    }, "POST"),
  },
  {
    name: "posts_transition",
    description: `Move a post through draft→review→published→archived. ${CONFIRM_RULE}`,
    inputSchema: { type: "object", properties: { id: { type: "string" }, status: { type: "string", enum: ["draft", "review", "published", "archived"] } }, required: ["id", "status"] },
    run: (a) => trpc("studio.posts.transition", { id: a.id, status: a.status }, "POST"),
  },
  {
    name: "taxonomy_list",
    description: "List categories and tags.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => trpc("studio.taxonomy.list", null, "GET"),
  },
  {
    name: "media_list",
    description: "List media-library assets. Optional folder and filename search.",
    inputSchema: { type: "object", properties: { folder: { type: "string" }, search: { type: "string" } } },
    run: (a) => trpc("studio.media.list", { folder: a.folder, search: a.search }, "GET"),
  },
  {
    name: "tours_list",
    description: "List tour packages (all statuses).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => trpc("studio.catalog.tours.list", null, "GET"),
  },
  {
    name: "tours_create",
    description: "Create a tour as DRAFT. Cover image must already be uploaded (use image_url from the media library).",
    inputSchema: { type: "object", properties: { title: { type: "string" }, summary: { type: "string" }, duration: { type: "string" }, days: { type: "number" }, category: { type: "string" }, imageUrl: { type: "string" }, priceNote: { type: "string" }, bestFor: { type: "string" } }, required: ["title"] },
    run: (a) => trpc("studio.catalog.tours.create", {
      title: a.title, summary: a.summary || "", duration: a.duration || "", days: a.days || 1,
      category: a.category || "", imageUrl: a.imageUrl || "", priceNote: a.priceNote || "",
      bestFor: a.bestFor || "", detail: { startPoint: "", overview: [], highlights: [], gallery: [], itinerary: [], inclusions: [], exclusions: [], meetingPoint: "", transport: "", stay: "" },
      sortOrder: 0, status: "draft",
    }, "POST"),
  },
  {
    name: "tours_update",
    description: `Update a tour (any field; include unchanged fields you want to keep for nested detail). ${CONFIRM_RULE} when changing status to published.`,
    inputSchema: { type: "object", properties: { id: { type: "string" }, title: { type: "string" }, summary: { type: "string" }, status: { type: "string", enum: ["draft", "published"] } }, required: ["id"] },
    run: async (a) => {
      const list = await trpc("studio.catalog.tours.list", null, "GET");
      const current = (list || []).find((t) => t.id === a.id);
      if (!current) throw new Error("Tour not found.");
      const { id, ...rest } = a;
      return trpc("studio.catalog.tours.update", {
        id,
        data: {
          title: rest.title ?? current.title, summary: rest.summary ?? current.summary,
          duration: current.duration || "", days: current.days || 1, category: current.category || "",
          imageUrl: current.image_url || "", priceNote: current.price_note || "", bestFor: current.best_for || "",
          detail: current.detail || {}, sortOrder: current.sort_order || 0, status: rest.status || current.status,
        },
      }, "POST");
    },
  },
  {
    name: "faqs_list",
    description: "List FAQs (all statuses).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => trpc("studio.catalog.faqs.list", null, "GET"),
  },
  {
    name: "faqs_create",
    description: "Create an FAQ (published by default so it appears on the site).",
    inputSchema: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } }, required: ["question", "answer"] },
    run: (a) => trpc("studio.catalog.faqs.create", { question: a.question, answer: a.answer, sortOrder: 0, status: "published" }, "POST"),
  },
  {
    name: "reviews_list",
    description: "List customer video reviews (all statuses).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => trpc("studio.catalog.reviews.list", null, "GET"),
  },
  {
    name: "reviews_create",
    description: "Add a customer video review as DRAFT. videoUrl must be an already-uploaded file URL (upload via Studio media library first — MCP cannot upload binaries). Only genuine customer clips, never stock.",
    inputSchema: { type: "object", properties: { customerName: { type: "string" }, videoUrl: { type: "string" }, quote: { type: "string" }, rating: { type: "number" }, tourSlug: { type: "string" } }, required: ["customerName", "videoUrl"] },
    run: (a) => trpc("studio.catalog.reviews.create", {
      customerName: a.customerName, tourSlug: a.tourSlug || "", videoUrl: a.videoUrl,
      thumbnailUrl: "", quote: a.quote || "", rating: a.rating ?? null, sortOrder: 0, status: "draft",
    }, "POST"),
  },
  {
    name: "reviews_update",
    description: `Update a review (status draft/published flips homepage visibility). ${CONFIRM_RULE} when publishing.`,
    inputSchema: { type: "object", properties: { id: { type: "string" }, status: { type: "string", enum: ["draft", "published"] }, quote: { type: "string" }, rating: { type: "number" } }, required: ["id"] },
    run: async (a) => {
      const list = await trpc("studio.catalog.reviews.list", null, "GET");
      const current = (list || []).find((r) => r.id === a.id);
      if (!current) throw new Error("Review not found.");
      return trpc("studio.catalog.reviews.update", {
        id: a.id,
        data: {
          customerName: current.customer_name, tourSlug: current.tour_slug || "", videoUrl: current.video_url,
          thumbnailUrl: current.thumbnail_url || "", quote: a.quote ?? current.quote ?? "",
          rating: a.rating ?? current.rating ?? null, sortOrder: current.sort_order || 0,
          status: a.status || current.status,
        },
      }, "POST");
    },
  },
  {
    name: "menu_list",
    description: "List food-menu dishes (all statuses).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => trpc("studio.catalog.foodMenu.list", null, "GET"),
  },
  {
    name: "menu_create",
    description: "Add a food-menu dish as DRAFT. imageUrl must be an already-uploaded photo URL.",
    inputSchema: { type: "object", properties: { name: { type: "string" }, imageUrl: { type: "string" }, description: { type: "string" }, priceNote: { type: "string" }, category: { type: "string" } }, required: ["name", "imageUrl"] },
    run: (a) => trpc("studio.catalog.foodMenu.create", {
      name: a.name, description: a.description || "", priceNote: a.priceNote || "",
      imageUrl: a.imageUrl, category: a.category || "", sortOrder: 0, status: "draft",
    }, "POST"),
  },
  {
    name: "menu_update",
    description: `Update a dish (status draft/published flips homepage visibility). ${CONFIRM_RULE} when publishing.`,
    inputSchema: { type: "object", properties: { id: { type: "string" }, status: { type: "string", enum: ["draft", "published"] }, priceNote: { type: "string" }, description: { type: "string" } }, required: ["id"] },
    run: async (a) => {
      const list = await trpc("studio.catalog.foodMenu.list", null, "GET");
      const current = (list || []).find((m) => m.id === a.id);
      if (!current) throw new Error("Menu item not found.");
      return trpc("studio.catalog.foodMenu.update", {
        id: a.id,
        data: {
          name: current.name, description: a.description ?? current.description ?? "",
          priceNote: a.priceNote ?? current.price_note ?? "", imageUrl: current.image_url || "",
          category: current.category || "", sortOrder: current.sort_order || 0,
          status: a.status || current.status,
        },
      }, "POST");
    },
  },
  {
    name: "leads_list",
    description: "List trip-enquiry leads (newest first). Read-only sales follow-up data — never invent or share outside.",
    inputSchema: { type: "object", properties: { status: { type: "string", enum: ["new", "contacted", "won", "lost"] } } },
    run: (a) => trpc("studio.leads.list", { status: a.status }, "GET"),
  },
  {
    name: "business_get",
    description: "Read business/contact settings (phone, WhatsApp, email, hours) used across the site.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => trpc("studio.business.get", null, "GET"),
  },
  {
    name: "brand_get",
    description: "Read the full brand kit: hero image/video + copy, safari block, about photo, trust badges, logo, colors, tagline.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => trpc("studio.settings.get", null, "GET"),
  },
  {
    name: "brand_update",
    description: `Update brand kit fields (hero, safari, trust, about, tagline, colors). Changes are INSTANTLY PUBLIC with no draft mode. ${CONFIRM_RULE} Pass only the fields to change; everything else is preserved. Binary uploads cannot go through MCP — ask the owner to upload media in Studio, then set the returned URL here.`,
    inputSchema: {
      type: "object",
      properties: {
        tagline: { type: "string" },
        heroMediaType: { type: "string", enum: ["image", "video"] },
        heroImageUrl: { type: "string" },
        heroVideoUrl: { type: "string" },
        heroEyebrow: { type: "string" },
        heroTitle: { type: "string" },
        heroSubtitle: { type: "string" },
        safariImageUrl: { type: "string" },
        safariTitle: { type: "string" },
        safariText: { type: "string" },
        safariPoints: { type: "array", items: { type: "string" } },
        aboutImageUrl: { type: "string" },
        primaryColor: { type: "string" },
        accentColor: { type: "string" },
      },
    },
    run: async (a) => {
      const current = await trpc("studio.settings.get", null, "GET");
      const site = current.site || {};
      const settings = current.settings || {};
      const contact = settings.contact || {};
      const allowed = ["tagline", "heroMediaType", "heroImageUrl", "heroVideoUrl", "heroEyebrow", "heroTitle", "heroSubtitle", "safariImageUrl", "safariTitle", "safariText", "safariPoints", "aboutImageUrl", "primaryColor", "accentColor"];
      const patch = {};
      for (const key of allowed) {
        if (a[key] !== undefined) patch[key] = a[key];
      }
      if (!Object.keys(patch).length) throw new Error("No brand fields provided to update.");
      return trpc("studio.settings.update", {
        name: site.name || "Sundarban Yatri",
        description: site.description || undefined,
        customDomain: site.custom_domain || undefined,
        themeSettings: site.theme_settings || {},
        navigation: settings.navigation || [],
        defaultLocale: settings.default_locale || "en",
        timezone: settings.timezone || "UTC",
        seoDefaults: settings.seo_defaults || {},
        featureFlags: settings.feature_flags || {},
        brand: { ...(settings.brand || {}), ...patch },
        footerLinks: settings.footer_links || [],
        contact: { name: contact.name || "", email: contact.email || "" },
      }, "POST");
    },
  },
];

const TOOL_MAP = Object.fromEntries(TOOLS.map((t) => [t.name, t]));

// ————————————————————————————————————————————————————————————————————————
// JSON-RPC over stdio
// ————————————————————————————————————————————————————————————————————————

const SUPPORTED_PROTOCOLS = ["2024-11-05", "2025-03-26", "2025-06-18"];

function respond(id, result) {
  if (id === undefined || id === null) return;
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

function respondError(id, code, message) {
  if (id === undefined || id === null) return;
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
}

async function handleMessage(msg) {
  if (Array.isArray(msg)) {
    for (const m of msg) await handleMessage(m);
    return;
  }
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    respondError(msg?.id, -32600, "Invalid Request: expected JSON-RPC 2.0 with a method.");
    return;
  }
  const { id, method, params } = msg;
  try {
    switch (method) {
      case "initialize": {
        const requested = params?.protocolVersion;
        const negotiated = SUPPORTED_PROTOCOLS.includes(requested) ? requested : "2024-11-05";
        respond(id, {
          protocolVersion: negotiated,
          capabilities: { tools: {}, prompts: { listChanged: false }, resources: {} },
          serverInfo: { name: "sundarban-yatri", version: SERVER_VERSION },
        });
        break;
      }
      case "ping":
        respond(id, {});
        break;
      case "prompts/list":
        respond(id, {
          prompts: PROMPTS.map((p) => ({ name: p.name, title: p.title, description: p.description, arguments: p.arguments })),
        });
        break;
      case "prompts/get": {
        const prompt = PROMPTS.find((p) => p.name === params?.name);
        if (!prompt) {
          respondError(id, -32602, `Unknown prompt: ${params?.name}`);
          break;
        }
        respond(id, {
          description: prompt.description,
          messages: [{ role: "user", content: { type: "text", text: prompt.build(params?.arguments || {}) } }],
        });
        break;
      }
      case "resources/list":
        respond(id, {
          resources: SKILLS.map((s) => ({
            uri: `sundarban-yatri://docs/${s.file}`,
            name: s.file,
            title: s.title,
            mimeType: "text/markdown",
          })),
        });
        break;
      case "resources/read": {
        const uri = String(params?.uri || "");
        const skill = SKILLS.find((s) => uri === `sundarban-yatri://docs/${s.file}`);
        if (!skill) {
          respondError(id, -32602, `Unknown resource: ${uri || "(missing uri)"}`);
          break;
        }
        try {
          const res = await fetch(`${API_URL}/docs/${skill.file}`);
          if (!res.ok) throw new Error(`docs returned HTTP ${res.status}`);
          let text = await res.text();
          if (text.length > 60000) text = text.slice(0, 60000) + "\n\n…[truncated — read the rest at " + `${API_URL}/docs/${skill.file}]`;
          respond(id, { contents: [{ uri, mimeType: "text/markdown", text }] });
        } catch (error) {
          respondError(id, -32000, `Could not load ${skill.file}: ${error.message}`);
        }
        break;
      }
      case "tools/list":
        respond(id, {
          tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
        });
        break;
      case "tools/call": {
        const tool = TOOL_MAP[params?.name];
        if (!tool) {
          respondError(id, -32602, `Unknown tool: ${params?.name}`);
          break;
        }
        try {
          const data = await tool.run(params?.arguments || {});
          respond(id, { content: [{ type: "text", text: cap(data) }] });
        } catch (error) {
          respond(id, { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true });
        }
        break;
      }
      default:
        if (String(method).startsWith("notifications/")) return; // fire-and-forget
        respondError(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    respondError(id, -32603, error.message || "Internal error.");
  }
}

async function selftest() {
  const results = [];
  const check = async (label, fn) => {
    try {
      const out = await fn();
      results.push(`ok   ${label}: ${String(out).slice(0, 160)}`);
    } catch (error) {
      results.push(`FAIL ${label}: ${error.message}`);
    }
  };
  // Protocol checks (no token needed).
  await check("initialize", async () => {
    let captured;
    const orig = process.stdout.write.bind(process.stdout);
    process.stdout.write = (s) => { captured = s; return true; };
    await handleMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05" } });
    process.stdout.write = orig;
    const res = JSON.parse(captured);
    return `protocol=${res.result.protocolVersion} server=${res.result.serverInfo.name}`;
  });
  await check("tools/list", async () => `${TOOLS.length} tools`);
  await check("prompts/list", async () => `${PROMPTS.length} prompts`);
  await check("resources/list", async () => `${SKILLS.length} resources`);
  await check("prompts/get", async () => {
    let captured;
    const orig = process.stdout.write.bind(process.stdout);
    process.stdout.write = (s) => { captured = s; return true; };
    await handleMessage({ jsonrpc: "2.0", id: 7, method: "prompts/get", params: { name: "write-trip-guide", arguments: { topic: "cost" } } });
    process.stdout.write = orig;
    const res = JSON.parse(captured);
    const text = res.result.messages[0].content.text;
    if (!text.includes("cost")) throw new Error("prompt argument not applied");
    return "write-trip-guide ok";
  });
  // Live checks (need SY_TOKEN + reachable API).
  await check("whoami", () => TOOL_MAP.whoami.run({}));
  await check("tours_list", async () => { const r = await TOOL_MAP.tours_list.run({}); return `${(r || []).length} tours`; });
  await check("resources/read", async () => {
    const res = await fetch(`${API_URL}/docs/SUNDARBAN-FACTS.md`);
    if (!res.ok) throw new Error(`docs HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes("Sundarban")) throw new Error("unexpected docs content");
    return `${text.length} chars`;
  });
  console.log(results.join("\n"));
  process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
}

if (SELFTEST) {
  selftest();
} else {
  const active = new Set();
  const track = (promise) => {
    active.add(promise);
    promise.finally(() => active.delete(promise));
  };
  let buffer = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let msg;
      try {
        msg = JSON.parse(trimmed);
      } catch {
        respondError(undefined, -32700, "Parse error: expected newline-delimited JSON.");
        continue;
      }
      track(handleMessage(msg));
    }
  });
  process.stdin.on("end", async () => {
    // Drain in-flight tool calls so piped clients always get every response.
    const started = Date.now();
    while (active.size > 0 && Date.now() - started < 30000) {
      await new Promise((r) => setTimeout(r, 25));
    }
    process.exit(0);
  });
  process.stdin.resume();
  log(`ready (api=${API_URL}, token=${TOKEN ? "set" : "MISSING — set SY_TOKEN"})`);
}
