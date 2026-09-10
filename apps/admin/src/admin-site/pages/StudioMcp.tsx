"use client";

import DashboardLayout from "@/admin-site/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  KeyRound,
  Loader2,
  PlugZap,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://travel-website-n69r.onrender.com";
const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatra.com";

function masterPrompt(token: string): string {
  return `You are the full-control site agent for Sundarban Yatri (${API_URL}) — tours, safari, destinations, travel guides and trip enquiries. You can manage EVERYTHING on the site through its MCP server. With that power comes one duty: never break the owner's trust.

SECRET — full account control. Store it as an environment variable, never print it, never commit it, never paste it anywhere except the config below:
SY_TOKEN=${token}
SY_API_URL=${API_URL}

PERMANENT SETUP — do this once, in order, and make it survive restarts:
1. Get the MCP server file. If this machine has the site repo, it is at cli/mcp.mjs. Otherwise download it:
   mkdir -p ~/sy-cli && cd ~/sy-cli && curl -fsSL ${API_URL}/docs/mcp.mjs -o mcp.mjs
   It needs plain node only — zero npm dependencies.
2. Verify the connection BEFORE anything else:
   SY_TOKEN="${token}" SY_API_URL="${API_URL}" node ~/sy-cli/mcp.mjs --selftest
   Every line must say "ok". If anything FAILs, stop and report the exact output — never work around auth.
3. Install it PERMANENTLY in this agent, using the first option that fits:
   a) opencode — add to opencode.json and restart the session:
      { "mcp": { "sundarban-yatri": { "type": "local",
        "command": ["node", "/home/USER/sy-cli/mcp.mjs"],
        "environment": { "SY_TOKEN": "${token}", "SY_API_URL": "${API_URL}" } } } }
      (Replace /home/USER with the real absolute path to mcp.mjs on THIS machine.)
   b) Claude Code — run:
      claude mcp add --transport stdio sundarban-yatri --env SY_TOKEN=${token} --env SY_API_URL=${API_URL} -- node /home/USER/sy-cli/mcp.mjs
   c) Any other MCP client — register a stdio server: command "node", args ["/abs/path/mcp.mjs"], env SY_TOKEN + SY_API_URL as above.
4. Prove it stuck: list the available tools, prompts and resources, call "whoami", and read the LEAD-SKILL.md resource. Report back: (i) where you saved the config, (ii) how many tools/prompts/skills you see, (iii) the identity whoami returns, (iv) the one-line goal of the business in your own words. Only then accept further tasks.

OPERATING RULES — follow these on every task, no exceptions:
- Call "whoami" first in every fresh session to confirm you are still connected as admin.
- Draft-first: create posts, tours, reviews and dishes as DRAFTS. Confirm with the owner BEFORE publishing, unpublishing, deleting, or moving anything to published/archived.
- Never fabricate: no invented reviews, ratings, prices, sightings, timings or testimonials. Use only data returned by the tools.
- Leads and subscribers are private customer data — read for follow-up summaries only, never copy it elsewhere.
- Binary uploads (video/photo files) cannot go through MCP — ask the owner to upload those in Studio, then reference the returned file URL.
- Every change is audit-logged to the owner's account. If a tool returns an error, report the exact message instead of retrying blindly.`;
}

function mcpConfig(token: string): string {
  return JSON.stringify(
    {
      mcp: {
        "sundarban-yatri": {
          type: "local",
          command: ["node", "/home/USER/sy-cli/mcp.mjs"],
          environment: { SY_TOKEN: token, SY_API_URL: API_URL },
        },
      },
    },
    null,
    2,
  );
}

const TOOL_GROUPS: { title: string; tools: { name: string; what: string }[] }[] = [
  {
    title: "Content",
    tools: [
      { name: "whoami", what: "Verify connection + admin identity (call first)" },
      { name: "posts_list / posts_get", what: "Browse and read full posts" },
      { name: "posts_create_draft", what: "New post, always as draft" },
      { name: "posts_transition", what: "Move draft → review → published → archived" },
      { name: "taxonomy_list", what: "Categories and tags" },
      { name: "media_list", what: "Media-library files and URLs" },
    ],
  },
  {
    title: "Catalogue",
    tools: [
      { name: "tours_list / create / update", what: "Tour packages" },
      { name: "faqs_list / create", what: "Traveller FAQs" },
      { name: "reviews_list / create / update", what: "Customer video reviews" },
      { name: "menu_list / create / update", what: "Food-menu dishes" },
    ],
  },
  {
    title: "Sales & site",
    tools: [
      { name: "leads_list", what: "Trip-enquiry leads for follow-up" },
      { name: "business_get", what: "Phone, WhatsApp, email, hours" },
      { name: "brand_get / brand_update", what: "Hero, trust, safari, about, colors" },
    ],
  },
];

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    if (!text) { toast.error("Nothing to copy yet."); return; }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setDone(true);
    toast.success(`${label} copied — paste it into your AI agent.`);
    setTimeout(() => setDone(false), 2500);
  };
  return (
    <Button size="sm" onClick={copy} className="gap-1.5">
      {done ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
      {done ? "Copied!" : `Copy ${label}`}
    </Button>
  );
}

export function StudioMcp() {
  const tokens = trpc.studio.apiTokens.list.useQuery();
  const create = trpc.studio.apiTokens.create.useMutation({
    onSuccess: () => { tokens.refetch(); toast.success("Agent token created — copy it now."); },
    onError: e => toast.error(e.message),
  });
  const revoke = trpc.studio.apiTokens.revoke.useMutation({
    onSuccess: () => { tokens.refetch(); toast.success("Token revoked — connected agents lose access immediately."); },
    onError: e => toast.error(e.message),
  });

  const [name, setName] = useState("agent-full-control");
  const [secret, setSecret] = useState<string | null>(null);

  const prompt = useMemo(() => (secret ? masterPrompt(secret) : ""), [secret]);
  const config = useMemo(() => (secret ? mcpConfig(secret) : ""), [secret]);

  const submit = () => {
    if (!name.trim()) { toast.error("Give the token a name."); return; }
    create.mutate(
      { name: name.trim(), scopes: ["read", "write"] },
      { onSuccess: data => { setSecret(data.token); } },
    );
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
          <div>
            <p className="font-label text-[10px] text-primary">Studio · full agent control</p>
            <h1 className="mt-2 flex items-center gap-3 font-display text-2xl font-semibold tracking-tight sm:text-4xl">
              <PlugZap className="h-7 w-7 text-primary" /> MCP access
            </h1>
          </div>
        </header>

        <section className="mb-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <div className="text-sm leading-6 text-red-900">
            <p className="font-semibold">A token from this page controls your whole site.</p>
            <p className="mt-1">Any agent holding it can create, edit, publish and delete content, read leads, and change the catalogue — exactly as if it were you. Create one token per agent, and revoke it the moment you stop trusting that agent.</p>
          </div>
        </section>

        {/* Step 1 — token */}
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-xl font-semibold">1 · Mint the agent token</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Read + write scope. Shown <strong>once</strong> — copy it immediately.</p>
            </div>
          </div>
          {secret && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 font-mono text-xs">{secret}</code>
                <CopyBtn text={secret} label="Token" />
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">Token name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="agent-full-control" className="mt-1.5" />
            </div>
            <Button onClick={submit} disabled={create.isPending} className="gap-2">
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {create.isPending ? "Minting…" : "Mint token"}
            </Button>
          </div>
        </section>

        {/* Step 2 — connect */}
        <section className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold">2 · Connect it once</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            After minting, the ready-to-paste MCP config appears here. Your agent needs <code>node</code> and the <code>mcp.mjs</code> file
            (ships with the repo at <code>cli/mcp.mjs</code>, downloadable at <code>{API_URL}/docs/mcp.mjs</code>).
            Replace <code>/home/USER</code> with the real path on the agent&apos;s machine.
          </p>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-label text-[10px] uppercase tracking-wider text-muted-foreground">opencode.json / any MCP client</span>
              <CopyBtn text={config} label="Config" />
            </div>
            <Textarea readOnly rows={12} value={config || "// Mint a token above — your personal config with the secret appears here."} className="font-mono text-xs" />
          </div>
        </section>

        {/* Step 3 — master prompt */}
        <section className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">3 · Give your agent the master prompt</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Copy this into your AI agent&apos;s chat. It installs the MCP connection <strong>permanently</strong>, verifies itself,
                and then follows your operating rules. One prompt does the whole onboarding.
              </p>
            </div>
            <CopyBtn text={prompt} label="Master prompt" />
          </div>
          <Textarea readOnly rows={18} value={prompt || "// Mint a token above — your personal master prompt with the secret appears here."} className="mt-4 font-mono text-xs leading-5" />
        </section>

        {/* Capabilities */}
        <section className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">What the agent gets — 22 tools · 7 task prompts · 11 skill docs</h2>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Tools do the work. <strong>Task prompts</strong> are one-tap routines the agent runs
            (guide briefs, tour audits, lead follow-up, publish gates, reel plans, season prep).
            <strong> Skill docs</strong> are the always-fresh playbooks — audiences, funnel, honesty
            rules, ground truth — written for Sundarban tourists and trip-enquiry leads.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {TOOL_GROUPS.map(group => (
              <div key={group.title} className="rounded-xl bg-background/70 p-4">
                <p className="font-label text-[10px] uppercase tracking-wider text-primary">{group.title}</p>
                <ul className="mt-2 space-y-2">
                  {group.tools.map(tool => (
                    <li key={tool.name} className="text-sm leading-5">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">{tool.name}</code>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{tool.what}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold">Skill library — how the agent thinks</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Every file targets the same customer (Sundarban tourists) and the same goal
            (trip-enquiry leads). Served live at <code>{API_URL}/docs/&lt;file&gt;</code>.
          </p>
          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {[
              ["BRAND-SKILL.md", "Hero video/image, trust badges, safari block, about photo"],
              ["LEAD-SKILL.md", "The money skill — audiences, funnel, pipeline, scripts, KPIs"],
              ["TOUR-SKILL.md", "The 4 products, itinerary honesty, pricing, gallery"],
              ["SHOWCASE-SKILL.md", "Real review clips + food photos, consent ethics"],
              ["SUNDARBAN-FACTS.md", "Ground truth: gateways, places, wildlife wording"],
              ["SOCIAL-SKILL.md", "Instagram/FB/YouTube-first distribution that books"],
              ["POST-WRITING-SKILL.md", "Guide writing: demand checks, clusters, GEO"],
              ["AI-EDITOR-AGENT.md", "Agent manual + publishing contract"],
              ["ROADMAP.md", "90-day lead-engine plan + weekly cadence"],
              ["API-ACCESS.md", "Tokens, MCP, CLI and HTTP reference"],
              ["SEO-GOOGLE.md", "Google Search compliance digest"],
            ].map(([file, what]) => (
              <a
                key={file}
                href={`${API_URL}/docs/${file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-background/70 p-3.5 transition-colors hover:bg-muted"
              >
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">{file}</code>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{what}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Tokens */}
        <section className="mt-6 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <div className="border-b border-border p-5">
            <h2 className="font-display text-xl font-semibold">Agent tokens</h2>
            <p className="mt-1 text-sm text-muted-foreground">Revoke any token to cut that agent off instantly.</p>
          </div>
          {tokens.isLoading ? (
            <div className="grid min-h-24 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : tokens.data?.length ? (
            tokens.data.map(token => (
              <div key={token.id} className="flex flex-col gap-2 border-b border-border p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{token.name} <span className="ml-1 font-mono text-xs text-muted-foreground">{token.token_prefix}…</span></p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {(token.scopes ?? []).join(" + ")}
                    {token.revoked_at ? " · REVOKED" : token.last_used_at ? ` · last used ${new Date(token.last_used_at).toLocaleString()}` : " · never used"}
                  </p>
                </div>
                {!token.revoked_at && (
                  <Button size="sm" variant="outline" className="gap-1.5 self-start text-destructive hover:text-destructive sm:self-auto" onClick={() => { if (window.confirm(`Revoke "${token.name}"? Connected agents lose access immediately.`)) revoke.mutate({ id: token.id, confirmed: true as const }); }}>
                    <Trash2 className="h-3.5 w-3.5" /> Revoke
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">No tokens yet — mint the first one above.</p>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
