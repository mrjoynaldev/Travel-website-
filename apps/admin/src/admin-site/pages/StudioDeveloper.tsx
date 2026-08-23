"use client";

import DashboardLayout from "@/admin-site/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Bot,
  ClipboardList,
  Copy,
  KeyRound,
  Lightbulb,
  Loader2,
  PenLine,
  Plus,
  Send,
  Sparkles,
  Trash2,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DOCS_BASE = "https://codereportglobal-backend.onrender.com/docs";
const API_BASE = "https://codereportglobal-backend.onrender.com";

function agentPreamble(token: string) {
  return `You are the CodeReport Global AI Editor — the publishing agent for the developer news site https://codereportglobal.indevs.in (repo: github.com/adittaya/codereportglobal).

ACCESS TOKEN — full account control. Treat it as a secret; never print or commit it:
CRG_TOKEN=${token}
API base: ${API_BASE}

FIRST, before doing anything else:
1. Fetch and internalize these documents — they define your identity, your powers, the editorial skill, and the publishing contract:
   - ${DOCS_BASE}/AI-EDITOR-AGENT.md   (who you are, what you control, terminal workflow, guardrails)
   - ${DOCS_BASE}/POST-WRITING-SKILL.md (how to find ideas, validate them, interrogate before writing, structure and optimize posts)
   - ${DOCS_BASE}/API-ACCESS.md          (token security rules and CLI reference)
2. Set up your environment exactly as AI-EDITOR-AGENT.md §2 describes. If you do not have a local checkout of the repository, use Path B: download and run https://codereportglobal-backend.onrender.com/docs/setup.sh in a fresh directory.
3. Run \`node blog.mjs whoami\` (or \`node cli/blog.mjs whoami\` inside a repo checkout) and confirm you are connected as admin.`;
}

const AI_PROMPTS = [
  {
    id: "full",
    icon: Bot,
    title: "Full Publishing Agent",
    description: "Complete control. Reads every doc, verifies access, reports the site state, proposes today's content plan, then writes and publishes on command.",
    instructions: `After connecting, report back: your role, the current categories and tags, how many posts exist in each status, and the newest published article. Then run \`research ga\`, \`research trends --geo US\` and \`research hn\` (via blog.mjs per §2) and use those signals to propose a data-grounded content plan for today following POST-WRITING-SKILL.md (one cluster at a time) — WAIT for my approval before writing anything. Once I approve a piece: pass the §4b angle gate FIRST (show me the one-sentence angle in the exact required shape and wait for my confirmation), then follow the full skill (interrogation → draft → QA checklist), create it with every field set, submit it, and give me the live URL. Write like a person, not an AI: first-person engineer who actually ran everything (§5a — personalized openings, zero banned AI-tell phrases), finish tutorials completely with every command/expected-output/error/verification and NO length cap (§5b), use the full format arsenal deliberately (code/screenshots/embeds/tables per §5c). If the brief serves more than one distinct search goal, SPLIT it into multiple complete articles wired hub-and-spoke with promise-naming backlinks (§5d) instead of one mega-post. After publishing, run the §9 distribution pass: generate the share kit with \`node distribute.mjs kit <slug>\` and report the kit path plus which channels are auto vs manual. Follow §9 COMPREHENSIVE POST SKILL (all 5 auto channels, official docs) exactly: dev.to teaser only (≤4 tags, canonical_url, cover 1000×420, front matter+JSON published:true); Bluesky ≤300 graphemes URL+2-3 hashtags (facets+link card auto via og:image 1200×630); Mastodon URLs=23/500 public+en; Facebook Page 1194345043773378 message+link param → og:image preview; Instagram 17841430858092702 1080×1350 image REQUIRED + caption Link in bio (2200 chars). Blue links: dev.to [text](url), Bluesky facets, Mastodon auto, Facebook link param, Instagram link-in-bio (not clickable). Media: dev.to cover+液 youtube, Bluesky thumb+1-2 images (<976KB)/video (<50MB), Mastodon media_ids, Facebook photo/video, Instagram image REQUIRED — use 1 strong cover everywhere, 2nd image/video only if it proves a claim, never replace canonical link. Every article must be GEO citation-ready: quotable answer in the first two paragraphs, concrete facts and named sources, full entity names, zero generic intro fluff — AI engines must be able to cite us verbatim. You may create categories and tags when a topic genuinely needs them. You may NEVER delete or archive a post unless I explicitly say so in our conversation.`,
  },
  {
    id: "strategy",
    icon: Lightbulb,
    title: "Content Strategy Session",
    description: "No publishing. Analyzes the site and audience, then brings me niche/cluster options with demand and difficulty, and asks me questions.",
    instructions: `Do NOT publish or modify anything yet. Act as my content strategist. Analyze what the site covers (fetch categories, tags, and recent posts via the CLI), think about the developer-news audience, then present a table of 5 candidate content clusters/niches scored on demand, competition difficulty, intent fit, and freshness potential. For each, sketch a 5-article funnel (hub ← comparisons ← explainers) and tell me which ONE cluster you would start with and why. Before finalizing, ask me up to 3 questions about my goals, tone, and priorities.`,
  },
  {
    id: "article",
    icon: PenLine,
    title: "Write & Publish One Article",
    description: "Give it a topic brief. It interrogates the idea, drafts the Gravity JSON, runs the QA checklist, and publishes after my approval.",
    instructions: `I will give you a topic brief next. Follow POST-WRITING-SKILL.md §4 first: present me the interrogation answers (intent, top-5 table stakes, the gap, depth target, unique value, quotable answer) and wait for my confirmation. Then draft the article as a Gravity JSON file — written in the §5a first-person engineer voice, complete per the §5b contract (every command, expected output, errors, verification; no length cap), rich formats per §5c, and split into multiple linked articles if it serves two distinct search goals (§5d). Run the pre-publish QA checklist from AI-EDITOR-AGENT.md §7, create the post with ALL fields set (meta description 120–160 chars, category, tags, thumbnail, og-image), submit it, and share the preview link. Publish only after I explicitly approve.`,
  },
  {
    id: "research",
    icon: Sparkles,
    title: "Content Research & Trends",
    description: "Pulls Google Trends + Hacker News + our GA4 traffic through the CLI, cross-matches with our categories, and proposes scored story ideas.",
    instructions: `Run these commands and analyze the results (command is \`node blog.mjs <cmd>\` after a setup.sh bootstrap, or \`node cli/blog.mjs <cmd>\` inside a repo checkout):
1. \`research trends --geo US\` (repeat for other geos if I ask)
2. \`research hn\` — and \`research hn --query <topic>\` for topics I mention
3. \`research ga\` — see which of OUR articles already pull traffic
4. \`posts list --status published\` — know what we have covered

Then propose 5 story ideas. For EACH idea give: proposed headline, target category/tag, the signal behind it (trend item / HN thread / traffic pattern), why now, search-intent angle, and a difficulty score (easy/medium/hard to rank or be timely). Rank them by expected impact and tell me which ONE you would write today. Do NOT publish anything yet — wait for my pick.`,
  },
  {
    id: "weekly-review",
    icon: TrendingUp,
    title: "Weekly Ranking Review",
    description:
      "No publishing. Pulls our GA signals + my GSC snapshot, re-tests target queries in AI engines, and applies the update-vs-new decision tree.",
    instructions: `Do NOT publish or modify anything. Run our weekly ranking ritual per POST-WRITING-SKILL.md §8: 1) run \`research ga\` and list our top articles by views with engagement signals (depth of session, returning visitors); 2) ask me for this week's GSC snapshot (queries, impressions, positions) and log it against last week; 3) for every target query cluster we track, re-ask its core question in ChatGPT, Perplexity and Google AI Mode (if you cannot browse, give me the exact question list to paste and I will return answers) and record who gets cited vs us; 4) apply the §8 update-vs-new decision tree and present a table: article → signal → verdict (UPDATE / NEW companion / MERGE / leave) with the exact next action for each row; 5) also check pending distribution kits in ~/crg-cli/kits/ and report which placements were logged since last week. End with the ONE highest-leverage move for this week.`,
  },
] as const;

function Workspace({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 border-b border-border pb-5 sm:mb-7 sm:pb-6">
          <p className="font-label text-[10px] text-primary">{eyebrow}</p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
        </header>
        {children}
      </div>
    </DashboardLayout>
  );
}

export function StudioApiTokens() {
  const tokens = trpc.studio.apiTokens.list.useQuery();
  const create = trpc.studio.apiTokens.create.useMutation({
    onSuccess: () => {
      tokens.refetch();
      toast.success("Access token created.");
    },
    onError: error => toast.error(error.message),
  });
  const revoke = trpc.studio.apiTokens.revoke.useMutation({
    onSuccess: () => {
      tokens.refetch();
      toast.success("Access token revoked.");
    },
    onError: error => toast.error(error.message),
  });
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<"read" | "write">("write");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiToken, setAiToken] = useState("");
  const [customExtra, setCustomExtra] = useState("");
  const submit = () => {
    if (!name.trim()) {
      toast.error("Give the token a name.");
      return;
    }
    const chosen: ("read" | "write")[] =
      scopes === "write" ? ["read", "write"] : ["read"];
    create.mutate(
      { name: name.trim(), scopes: chosen },
      {
        onSuccess: data => {
          setNewToken(data.token);
          setName("");
        },
      }
    );
  };
  const copyToken = () => {
    if (!newToken) return;
    navigator.clipboard
      .writeText(newToken)
      .then(() => toast.success("Token copied to clipboard."));
  };
  const openAiPrompts = () => {
    setAiToken(newToken || "");
    setAiOpen(true);
  };
  const copyPrompt = (instructions: string) => {
    if (!aiToken.trim()) {
      toast.error("Paste your access token first (create one above if needed).");
      return;
    }
    const extra = customExtra.trim()
      ? `\n\nEDITOR'S EXTRA INSTRUCTIONS:\n${customExtra.trim()}`
      : "";
    const prompt = `${agentPreamble(aiToken.trim())}\n\nYOUR ASSIGNMENT:\n${instructions}${extra}`;
    navigator.clipboard
      .writeText(prompt)
      .then(() => toast.success("Prompt copied — paste it into your AI agent."))
      .catch(() => toast.error("Could not access the clipboard."));
  };
  return (
    <Workspace title="API access tokens" eyebrow="Developer · headless access">
      <p className="mb-5 max-w-2xl text-sm text-muted-foreground">
        Access tokens let the command-line tool and scripts manage this
        publication through the same role-scoped API as the Studio. The full
        token is shown <strong>only once</strong> when created.
      </p>
      {newToken && (
        <section className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <p className="font-label text-[10px] text-amber-800">
            Copy this token now — it will not be shown again
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 font-mono text-xs">
              {newToken}
            </code>
            <Button size="sm" variant="outline" onClick={copyToken}>
              <Copy className="mr-1 h-3.5 w-3.5" />
              Copy
            </Button>
          </div>
          <p className="mt-2 text-xs text-amber-800">
            Store it in an environment variable, e.g. <code>CRG_TOKEN</code>,
            and use it with the CLI.
          </p>
        </section>
      )}
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <h2 className="font-display text-2xl font-semibold">
              Create a token
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Scopes: read-only tokens cannot make changes.
            </p>
          </div>
          <Button onClick={openAiPrompts} className="gap-2" variant="secondary">
            <Sparkles className="h-4 w-4" />
            AI prompts
          </Button>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">
              Token name
            </label>
            <Input
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="e.g. CI publisher"
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Scope
            </label>
            <Select
              value={scopes}
              onValueChange={value => setScopes(value as "read" | "write")}
            >
              <SelectTrigger className="mt-1.5 h-10 w-full bg-white sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="write">Read & write</SelectItem>
                <SelectItem value="read">Read only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={submit}
            disabled={create.isPending}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create token
          </Button>
        </div>
      </section>
      <section className="mt-6 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {tokens.isLoading ? (
          <div className="grid min-h-32 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : tokens.data?.length ? (
          tokens.data.map(token => (
            <div
              key={token.id}
              className="flex flex-col gap-3 border-b border-border p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{token.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <code>{token.token_prefix}…</code> · {token.scopes.join(", ")}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {token.revoked_at
                    ? "Revoked"
                    : token.expires_at
                      ? `Expires ${new Date(token.expires_at).toLocaleDateString()}`
                      : "No expiry"}
                  {token.last_used_at
                    ? ` · last used ${new Date(token.last_used_at).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              {!token.revoked_at && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Revoke "${token.name}"? This immediately stops it from working.`
                      )
                    )
                      revoke.mutate({ id: token.id, confirmed: true });
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Revoke
                </Button>
              )}
            </div>
          ))
        ) : (
          <p className="p-12 text-center text-sm text-muted-foreground">
            No access tokens yet. Create one to use the CLI.
          </p>
        )}
      </section>
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI agent prompts
            </DialogTitle>
            <DialogDescription>
              Pick a prompt, copy it, and paste it into any AI agent (Claude,
              ChatGPT, Cursor…). The copied prompt includes your access token
              and links to every guide the agent needs.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Access token (embedded into the copied prompt)
            </label>
            <Input
              value={aiToken}
              onChange={event => setAiToken(event.target.value)}
              placeholder="crg_… — pre-filled if you just created one"
              className="mt-1.5 font-mono text-xs"
            />
            {newToken && !aiToken && (
              <button
                type="button"
                className="mt-1 text-[11px] font-medium text-primary hover:underline"
                onClick={() => setAiToken(newToken)}
              >
                Use the token you just created
              </button>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Extra instructions (optional, appended to every prompt)
            </label>
            <Textarea
              value={customExtra}
              onChange={event => setCustomExtra(event.target.value)}
              rows={2}
              placeholder="e.g. Focus on Rust and developer-tools news this month."
              className="mt-1.5"
            />
          </div>
          <div className="space-y-2">
            {AI_PROMPTS.map(prompt => (
              <div
                key={prompt.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-white p-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10">
                  <prompt.icon className="h-4 w-4 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{prompt.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {prompt.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  onClick={() => copyPrompt(prompt.instructions)}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Security: the pasted prompt contains a live admin token. Share it
            only with agents you trust and revoke the token in this screen when
            finished.
          </p>
        </DialogContent>
      </Dialog>
    </Workspace>
  );
}

export function StudioDistribution() {
  const queue = trpc.distribution.list.useQuery();
  const invalidate = () => queue.refetch();
  const approve = trpc.distribution.approve.useMutation({
    onSuccess: data => {
      invalidate();
      toast.success(`Posted: ${data?.posted_url ?? "done"}`);
    },
    onError: error => toast.error(error.message),
  });
  const skip = trpc.distribution.skip.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Skipped.");
    },
    onError: error => toast.error(error.message),
  });
  const reset = trpc.distribution.reset.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Back to pending.");
    },
    onError: error => toast.error(error.message),
  });

  const items = queue.data?.items ?? [];
  const cap = queue.data?.dailyCap ?? 3;
  const used = queue.data?.postedToday ?? 0;

  const statusStyle: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-blue-100 text-blue-800",
    posted: "bg-emerald-100 text-emerald-800",
    failed: "bg-red-100 text-red-700",
    skipped: "bg-muted text-muted-foreground",
  };
  const channelLabel: Record<string, string> = {
    devto: "dev.to",
    bluesky: "Bluesky",
    mastodon: "Mastodon",
  };

  return (
    <Workspace title="Distribution" eyebrow="Syndication · approve-then-post">
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        Auto channels for the syndication engine. Generate kits and enqueue
        them with{" "}
        <code>node distribute.mjs push &lt;slug&gt;</code>, then approve here.
        Hard cap {cap} posts/day (resets 00:00 UTC).
      </p>
      <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 shadow-sm">
        <Send className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {used} / {cap} posts sent today
        </span>
      </div>
      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {queue.isLoading ? (
          <div className="grid min-h-32 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : items.length ? (
          items.map(item => (
            <div
              key={item.id}
              className="flex flex-col gap-3 border-b border-border p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
                    {channelLabel[item.channel] ?? item.channel}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyle[item.status] ?? ""}`}>
                    {item.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <a
                  href={`https://codereportglobal.indevs.in/articles/${item.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate text-sm font-medium hover:underline"
                >
                  {item.slug}
                </a>
                {item.posted_url && (
                  <a href={item.posted_url} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-xs text-primary hover:underline">
                    {item.posted_url}
                  </a>
                )}
                {item.error && (
                  <p className="mt-0.5 truncate text-xs text-red-600">{item.error}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {(item.status === "pending" || item.status === "failed") && (
                  <>
                    <Button size="sm" onClick={() => approve.mutate({ id: item.id })} disabled={approve.isPending}>
                      Approve &amp; post
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => skip.mutate({ id: item.id })}>
                      Skip
                    </Button>
                  </>
                )}
                {(item.status === "failed" || item.status === "skipped") && (
                  <Button size="sm" variant="ghost" onClick={() => reset.mutate({ id: item.id })}>
                    Reset
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="p-12 text-center text-sm text-muted-foreground">
            Nothing queued yet. Run <code>node distribute.mjs kit &lt;slug&gt;</code>{" "}
            then <code>push &lt;slug&gt;</code> from the CLI toolkit.
          </p>
        )}
      </section>
    </Workspace>
  );
}

export function StudioSubscribers() {
  const subscribers = trpc.studio.subscribers.list.useQuery();
  const remove = trpc.studio.subscribers.remove.useMutation({
    onSuccess: () => {
      subscribers.refetch();
      toast.success("Subscriber removed.");
    },
    onError: error => toast.error(error.message),
  });
  const total = subscribers.data?.length ?? 0;
  return (
    <Workspace title="Subscribers" eyebrow="Audience · newsletter">
      <p className="mb-5 text-sm text-muted-foreground">
        {total} subscriber{total === 1 ? "" : "s"} on record. Subscribers are
        captured through the public newsletter form and the privacy policy link.
      </p>
      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {subscribers.isLoading ? (
          <div className="grid min-h-32 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : subscribers.data?.length ? (
          subscribers.data.map(subscriber => (
            <div
              key={subscriber.id}
              className="flex flex-col gap-3 border-b border-border p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <UsersRound className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{subscriber.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Subscribed{" "}
                    {new Date(subscriber.consented_at).toLocaleDateString()} ·{" "}
                    <span className="capitalize">{subscriber.status}</span>
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (window.confirm(`Remove ${subscriber.email}?`))
                    remove.mutate({ id: subscriber.id });
                }}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          ))
        ) : (
          <p className="p-12 text-center text-sm text-muted-foreground">
            No subscribers yet.
          </p>
        )}
      </section>
    </Workspace>
  );
}
