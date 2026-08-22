# SKILL: Post Writing for CodeReport Global

Editorial operating system for the AI Editor Agent. Derived from a full SEO
course (search-intent-first keyword strategy, topic clusters, on-page
checklists, link-worthy content, AI-search visibility). Follow it in order:
**find → validate → interrogate → angle → structure → write → optimize →
publish → distribute.**

---

## 1. How to find content ideas

Work only inside the current cluster plan (one topical funnel at a time — see
§3). Sources, best first:

1. **News hooks** (this is a news/analysis site): model releases, dev-tool
   launches, benchmark drops, funding, regressions, deprecations, security
   incidents. Freshness wins the news-sitemap window (48h).
2. **Search Console**: once traffic exists, mine real queries (impressions with
   low CTR = title/description problem; positions 5–15 = update candidates).
3. **Google autocomplete + People Also Ask**: type the cluster seed, harvest
   every suggestion; each PAA box is a ready-made H2 or standalone post.
4. **Reddit / Hacker News / GitHub issues**: capture the exact phrasing
   developers use when describing the problem — that phrasing is the keyword.
5. **Competitor gaps**: paste a competitor sitemap into an LLM and list what
   they cover that we do not; invert it too (what everyone misses).
6. **AI-assistant mining**: ask ChatGPT, Perplexity AND Google AI Mode the
   cluster's buying-style questions. Record which brands get cited (your real
   competitors) and which source pages get quoted (the formats to beat). If a
   rival is cited and we are not, study exactly what their page does that ours
   does not — then do it better.

## 2. Validate before writing (keyword sweet spot)

A topic earns a post only when it scores on all four:

| Attribute | Question |
|---|---|
| Demand | Do people actually search this? (long-tail is fine: "best…" "how to fix…" "vs" "pricing") |
| Fit | Does it serve our audience (developers) and our hubs? |
| Intent | What does the searcher want — news, tutorial, comparison? Can we satisfy exactly that? |
| Difficulty | Can a brand-new site realistically rank? Prefer specific long-tail over head terms. |

Rule of thumb: shorter keyword = higher volume, vaguer intent, brutal
competition. Start long-tail; build up as authority grows.

Search behavior shift: users increasingly paste **full conversational
questions** into Google and assistants ("I want to pick up a new hobby… can you
recommend classes near me?"). Prefer targets phrased the way people actually
ask, and make sure one H2 answers each natural sub-question of that sentence.

## 3. Cluster strategy (never scatter)

- Money-equivalent pages here are the **topic hubs** (`/topics/{slug}`) — every
  article must strengthen one.
- Build ONE funnel at a time: hub ← comparison/best-of posts ← educational
  how-to/explainer posts, all interlinked.
- Finish a cluster before starting the next. Google trusts sites that cover a
  subject comprehensively (topical authority), not isolated one-offs.
- Same reader, different stages: the person searching "how to prevent X" is
  the person who searched "what is X" months earlier. Covering the full
  journey keeps them on our site for that entire arc.

## 3b. Conversion architecture (traffic → readers → repeat viewers)

A keyword without a conversion path is vanity traffic. Define each post's
pipeline job BEFORE writing:

1. **Entry promise = exact intent.** Title/intro must match what the query
   actually wants (news ≠ tutorial ≠ comparison). Mismatched intent bounces.
2. **Depth holds attention.** If top-5 results average 3,000 words, 500 words
   is not comprehensive — it's a bounce. Depth is also the only defense in the
   zero-click era: content must go deeper than the AI summary to earn the
   click at all.
3. **Exit paths everywhere — never a dead end.** ≥3 contextual internal links
   inside body copy (topic hub + ≥2 related articles) plus a close-of-post CTA
   button. Internal linking is the highest effort-to-value tactic in SEO and
   the engine of multi-page sessions.
4. **Stage-aware CTA:** news/explainer → link the deeper guide or hub;
   comparison/best-of → link the hub. Every link moves the reader one step
   down the funnel, never sideways to something unrelated.
5. **Free-value exchange:** runnable code, checklists, tables-as-reference,
   (future) small tools/calculators. These convert a visit into a remembered
   brand, earn bookmarks, and become the assets other sites link to.
6. **Compounding loop:** original data/analysis → backlinks → authority →
   easier rankings → more traffic. Early stage: publish 10–15 excellent
   pieces before any outreach. Later: refreshing a position 5–15 post usually
   beats a fresh draft.

## 4. The pre-write interrogation (ask yourself BEFORE writing)

Answer these in one short paragraph each before drafting:

1. **Who searches this and what do they want?** (intent sentence)
2. **What is ranking in the top 5 right now?** Read them. List the topics they
   cover — that is table stakes.
3. **What do all of them miss?** That gap IS your angle. No gap → find a
   different angle or skip the post.
4. **How deep must it go?** Match/exceed the depth of top results; surface-level
   gets zero clicks in the AI-overview era.
5. **What unique value do we add?** Original analysis, real numbers, a code
   sample that actually runs, a comparison table nobody built, an expert quote,
   a contrarian-but-defensible take.
6. **What will AI assistants quote?** Write the direct answer to the target
   question so clearly that a language model can lift it verbatim.

The bar: **5× better than what already exists** for this exact search. If you
cannot articulate how, do not write the post.

### 4b. The angle gate (mandatory sentence before drafting)

Before any draft exists, complete this sentence and show it to the editor:

> "Unlike [current top results / mainstream coverage], this post [the specific
> gap it fills] for [exact reader], proven by [our unique evidence]."

- If it cannot be completed with something concrete, there is no angle — go
  back to §1 or skip the post. "Comprehensive guide" is not an angle;
  neither is "we also covered it."
- **Information gain is the currency**: each post must contain at least one
  thing a reader cannot get from the top-3 combined (original test, assembled
  table, named-source synthesis, contrarian-but-defensible read).
- News posts still need an angle: "what changed" is table stakes; the angle is
  "what this changes for developers who do X."
- Re-check after drafting: if the draft does not deliver the promised angle,
  fix the draft, not the sentence.

## 5. Structure blueprint

- **Title**: ≤60 chars, keyword front-loaded, specific promise. News: what
  happened + why it matters ("X ships Y — here's what changes for devs").
- **Slug**: 2–5 words, lowercase-hyphenated, keyword-rich, no filler.
- **Intro (first 2 paragraphs)**: direct answer / the news / the payoff
  immediately. No throat-clearing. This is the block AI overviews and
  assistants quote.
- **Body**: one `h2` per section mirroring sub-questions searchers have;
  `h3` for sub-points. Include: at least one runnable code block (developer
  topics), a list or table where scannable, media every 2–3 blocks.
- **Code blocks (strict)**:
  - Every fenced block MUST declare its language explicitly (`bash`, `yaml`,
    `json`, `ts`, …). The site auto-renders a language chip + copy button on
    each block — never type "Copy", "yamlCopy" or any UI residue into
    content; those strings are ChatGPT paste artifacts and are treated as
    defects.
  - Terminal commands: ONE command sequence per fenced `bash` block, exactly
    as a reader would paste it — no `$` prompts unless showing output
    interleaving, no invented flags.
- **Close**: verdict/what-to-watch + one button CTA (related article or hub).

## 6. On-page optimization (set these CLI fields)

| Field | Rule |
|---|---|
| `--meta-title` | Only if title >60 chars; keep keyword, add brand |
| `--meta-description` | 120–160 chars, ad copy: benefit + keyword + hook |
| `--excerpt` | 1–2 honest sentences (cards + meta fallback) |
| `--category` | Exactly one primary hub (max two) |
| `--tag` | 2–5 specific entity tags (company, product, language) |
| `--thumbnail` + `--og-image` | Always set; alt text mandatory on every image |

Internal linking (best-effort-to-value tactic in SEO): ≥3 per post — the topic
hub, ≥2 related articles, plus outbound citations to primary sources.

## 7. Originality layer (what survives AI slop)

Every post must contain at least two of:

- Original analysis (we did the math/read the changelog/tested the thing)
- A working, non-trivial code example
- A comparison table or timeline nobody else has assembled
- Sourced expert quotes (real, linked)
- Concrete outcomes/numbers instead of vague claims

Never fabricate quotes, stats, dates, or products. Attribute everything.

## 7b. GEO layer (be the citation, not the source that got skipped)

The zero-click reality: AI Overviews now answer even commercial queries and
only a small minority of searchers click any result. **You are either inside
the answer or invisible** — being quoted matters as much as ranking. Google
AI Overviews, ChatGPT, Perplexity and Claude answer first and cite a handful
of sources. Write so an LLM can lift a passage verbatim:

- **Quotable answer block** — 2–4 sentences right after the intro that directly
  answer the core question. This is the passage engines will steal.
- **Fact density** — numbers, dates, version names, prices. One concrete fact
  per paragraph beats three adjectives.
- **Question-shaped subheads** — H2s phrased as the questions users ask AI
  ("Is X faster than Y?", "How much does X cost?").
- **Named entities** — full names on first mention; link primary sources.
- **Comparison tables and lists** — the most-cited formats in AI answers.
- **Freshness signal** — mention the news date ("on August 21, 2026, …") and
  keep evergreen claims dateless.

### E-E-A-T block (mandatory in every post)

Engines weight demonstrable Experience, Expertise, Authority, Trust:

- **Author identity** on the post (byline via author fields) + a one-line
  "why you can trust this analysis" note where relevant.
- **Sources section / inline citations**: every claim traced to a primary
  source link (docs, changelog, benchmark, filing).
- **Original research we did** that AI cannot produce: ran the benchmark,
  read the whole changelog, surveyed devs, built the table.
- Expert quotes from podcasts/talks/papers with links — sourced expertise is
  still expertise.

## 7c. Citation-source map (where LLMs actually pull from)

Approximate engine biases worth knowing when choosing targets and outbound
citations: ChatGPT leans Wikipedia/Reddit/Forbes; Perplexity leans Reddit,
YouTube, LinkedIn; AI Overviews lean YouTube/Reddit/Quora. Reddit appears in
every list. Implications:

1. **Cite these surfaces in posts** when they host the primary discussion
   (linking real Reddit/HN/YouTube threads as evidence).
2. **Participate off-site** where developers discuss our topics (HN threads,
   relevant subreddits) with genuinely useful comments — brand mentions inside
   cited communities feed back into AI answers. Never spam; add value or stay
   out.
3. Our own `llms.txt`, schema markup and clean structure are already deployed —
   early-mover advantage compounds; keep them accurate as content grows.

## 8. After publishing

**Publish day:**
- Verify HTTP 200 on the article URL.
- The post auto-enters `/sitemap.xml` and (for 48h) `/news-sitemap.xml`.
- Log the target query cluster and the visible position baseline.

**Day-3 check (`research ga` + GSC):**
- Indexing confirmed? Impressions appearing? Zero impressions by day 7 =
  suspect indexing or intent mismatch — re-inspect title/meta against the
  actual query phrasing.

**Day-14 ranking ritual:**
- GSC positions: stuck at **positions 5–15** = update candidate (refresh
  title/intro/depth). Pages 2–3 → run the decision tree below.
- **Citations**: re-ask the target question in ChatGPT, Perplexity AND Google
  AI Mode. Competitors cited and we are not = content defect to fix (sharper
  answer block, deeper facts, more sources), not bad luck.
- **Engagement** (`research ga`): leading signals the conversion architecture
  works are impressions rising before clicks, multi-page sessions via internal
  links, returning visitors. Traffic without depth-of-engagement gets the
  depth fix first.

**Update-vs-new decision tree:**
1. Same intent + near-miss ranking (5–15) or thin depth → **UPDATE** the
   existing post; refreshing a near-miss usually beats a fresh draft.
2. Adjacent but distinct question users ask → **NEW** post that links back.
3. Two of our own posts splitting one intent → **MERGE** into the stronger
   URL, then update it.

Early-stage discipline: publish 10–15 excellent pieces before investing in
link outreach; the best links arrive when something is genuinely worth
linking to.

## 9. Distribution & share kits (syndication engine)

Publishing is half the job. Every published article gets a distribution pass
so the piece earns reach AND backlinks without duplicate-content risk.

Golden rules:
1. **Own domain first.** codereportglobal.indevs.in is always the canonical
   home; every syndicated copy must point back with rel=canonical.
2. **Wait for indexing before full-copy syndication**: as a new site wait
   7–10 days after publish (verify with GSC), then syndicate. Link drops and
   social posts are exempt — only full-text copies wait.
3. **Never hand-paste raw markdown into platforms.** Generate the share kit:
   `node distribute.mjs kit <slug>` writes `~/crg-cli/kits/<slug>/` with
   per-platform files (`devto.md`, `bluesky.txt`, `reddit-comments.md`,
   `linkedin.md`, `hn-title.txt` + `hn-firstcomment.md`, `medium-import.url`,
   `newsletter-tip.md`, `checklist.md`).

Channel tiers:
- **AUTO** (system posts inside a hard daily cap): dev.to (canonical_url set),
  Bluesky, Mastodon, Hashnode (RSS import respects canonicals).
- **QUEUE + APPROVE**: Reddit comments — approve-then-post only, global cap
  3 posts/day enforced in code. Find threads younger than 24h; contribute
  value first; link only when genuinely relevant; never the same community
  twice in one week.
- **MANUAL** (paste from kit): Hacker News (title + first comment drafted;
  automating story posts = ban), LinkedIn, X, Medium (Import-a-story sets the
  canonical automatically — never use their closed API), Quora, newsletter
  tips (TLDR AI, Ben's Bites, Console.dev).
- **ONE-TIME checklist**: GitHub awesome-list PRs, Source of Sources signup,
  daily.dev Squad (corporate blogs are ineligible as plain sources).

Discipline: reply to every serious comment on our syndicated copies within
24h — engagement outweighs the drop itself. Log every placement in the kit's
`checklist.md` so the Weekly Ranking Review can attribute traffic and citations.
