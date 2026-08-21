# SKILL: Post Writing for CodeReport Global

Editorial operating system for the AI Editor Agent. Derived from a full SEO
course (search-intent-first keyword strategy, topic clusters, on-page
checklists, link-worthy content, AI-search visibility). Follow it in order:
**find → validate → interrogate → structure → write → optimize → publish.**

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

- Verify HTTP 200 on the article URL.
- The post auto-enters `/sitemap.xml` and (for 48h) `/news-sitemap.xml`.
- Log the target query cluster; revisit GSC after ~2 weeks for impressions and
  position movement; update titles/intros on posts stuck at positions 5–15.
- Update existing page-2/3 posts before writing brand-new ones when both
  options exist — refreshing a near-miss usually beats a fresh draft.
- **Track citations, not just rankings**: after 2–4 weeks re-ask the target
  question in ChatGPT/Perplexity/Google AI Mode. If competitors are cited and
  we are not, treat it as a content defect to fix (sharper answer block,
  deeper facts, more sources), not bad luck.
- **Track engagement, not just visits** (`research ga` / GA4): leading
  signals that the conversion architecture works are impressions rising before
  clicks, multi-page sessions via internal links, and returning visitors.
  Posts with traffic but no depth-of-engagement get the depth fix first.
- Early-stage discipline: publish 10–15 excellent pieces before investing in
  link outreach; the best links arrive when something is genuinely worth
  linking to.
