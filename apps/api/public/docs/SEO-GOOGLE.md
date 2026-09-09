# Google Search Central — Official Rules Digest (verified 2026-08-22)

Distilled from https://developers.google.com/search/docs (all sections read in full).
This is the compliance reference for Sundarban Yatri. When a rule here conflicts
with any SEO folklore, THIS file wins.

## 1. Core stance on AI content (our #1 strategic fact)

- AI-generated content is **allowed** and gets **no separate ranking treatment**.
  Official position: "regardless of how content is produced" — what matters is
  helpfulness, not production method ("reward, not method").
- The failure mode is ONLY the spam policies, chiefly **scaled content abuse**:
  "many pages generated for the primary purpose of manipulating rankings…
  large amounts of unoriginal content that provides little to no value, no matter
  how it's created." → Our defense: every article must pass the §4b angle gate
  (original testing/analysis/value per page). Volume without value is the violation.
- Disclosure of AI use: **not mandatory**. "Consider adding when reasonably
  expected" (where readers would ask how it was made).
- AI Overviews / AI Mode eligibility = normal indexing + snippet eligibility +
  site enabled for generative AI features in Search Console. RAG + query fan-out.
  Do NOT create one page per fan-out variant (= scaled abuse). llms.txt is
  ignored by Google (harmless; we keep it for other crawlers).
- E-E-A-T is **not a direct ranking factor**; systems use signals aligned with it.
  Trust is the most important component. Author pages + bios + sources help.

## 2. People-first self-check (answer YES to all before publishing)

1. Original info, reporting, research, or analysis?
2. Substantial, complete, comprehensive description of the topic?
3. Insightful analysis beyond the obvious?
4. Drawn on other sources WITHOUT merely copying/rewriting — added substantial value?
5. Descriptive, helpful headline (not exaggerated/shocking)?
6. Bookmark/share-worthy? Print-publication worthy?
7. Substantial value vs. other pages in the SERP?
8. Clear sourcing + author background (author page linked)?
9. Would the intended audience find it useful arriving DIRECTLY (not via search)?
10. Reader leaves able to achieve their goal?

Search-engine-first warning signs (any YES = rewrite): primarily attracting search
visits · many topics hoping something sticks · extensive automation producing
content on many topics · trend-chasing over audience fit · reader must search again
· writing to a word count (no ideal count exists) · promising unconfirmed answers ·
refreshing dates without substance · bulk adding/deleting for "freshness".

## 3. Spam policies that could bite us

| Policy | Rule for us |
|---|---|
| Scaled content abuse | Value-per-page test; never bulk-produce thin rewrites |
| Scraped content | News roundups must add original analysis, cite sources |
| Link spam | Editorial citations need NO rel attr; affiliate/sponsored outbound MUST carry rel="sponsored" or rel="nofollow"; never buy/sell/exchange links |
| UGC spam | Comments are moderated pre-publication ✓; comment text renders plain (no links) ✓ |
| Machine-generated traffic | Only bans automated queries TO Google (SERP scraping) — never scrape SERPs for rank tracking; our own analytics crawler is fine |
| Doorway / hidden text / stuffing | No per-tool boilerplate variants; accordions/tabs OK; keyword lists banned |
| Site reputation abuse | Explicitly NOT violated by syndication between publications (dev.to OK) |

Consequence path: manual action → fix → reconsideration request.

## 4. Titles & snippets

- `<title>` sources: title element, h1, prominent headings, og:title, anchors.
- Good title = unique per page, descriptive, concise, no stuffing, no repeated
  boilerplate; brand once with a delimiter (`Article Title · Sundarban Yatri` —
  our Next.js template does this ✓). Rewrite triggers to avoid: half-empty titles,
  obsolete years, multiple equal-weight headings, duplicated site name.
- Meta descriptions: unique per page, accurate summary of what the reader GAINS;
  include author/date/byline info where natural (docs explicitly suggest this for
  blogs/news). No hard length limit — truncated to device width (~150–160 chars
  practical target).
- Featured snippets: automatic; no special markup. Write crisp definition-style
  passages under descriptive H2s. `nosnippet`/`data-nosnippet` block if ever needed.

## 5. Dates (byline consistency rule)

Visible date AND structured data must MATCH. ISO 8601 with timezone in JSON-LD;
visible "Month Day, Year" label. Never future dates. On substantive updates:
update BOTH the visible "Updated" line and dateModified together. NEVER bump dates
without substance (spam signal).

## 6. Structured data we ship

- Layout: Organization + WebSite (name, url, alternateName[]) → site-name in SERP.
- Articles: NewsArticle with headline, description, url, image[], datePublished/
  dateModified, mainEntityOfPage, articleSection, keywords, author (Person + url),
  publisher @id. All properties recommended-not-required but completeness wins.
- BreadcrumbList: Home → topic → article (position starts at 1).
- Policies: never mark up invisible content; markup only what's on the page;
  validate via Rich Results Test; spammy markup loses rich-result eligibility.
- Images in Article SD: ≥50K pixels total; recommended ratios 16×9, 4×3, 1×1;
  representative of content (no logos).

## 7. Discover + images

- Discover needs NO special tags; auto-eligible once indexed. Big lever: images
  **≥1200px wide**, ~16:9, >300K pixels total, plus robots meta
  `max-image-preview:large` (we set this in layout metadata).
- Honest titles (no clickbait); timely stories or unique insights; strong CWV.
- Alt text: information-rich IN CONTEXT ("puppy playing fetch" style), near
  relevant text, short descriptive filenames. Every published image needs alt.
- Real <img> elements only (CSS backgrounds aren't indexed).

## 8. Crawling & indexing facts

- Pipeline: crawl (Googlebot renders JS like recent Chrome) → index (clusters
  duplicates, picks canonical) → serve. Nothing guaranteed; new sites rely on
  internal links + sitemap.
- Canonical signals ranked: redirects > rel=canonical (cross-domain fully
  supported — our dev.to copies point back at us ✓) > sitemap; HTTPS helps.
  Keep canonical in SSR head; never change it client-side; absolute URLs only.
- Sitemaps: ≤50k URLs/file; lastmod used ONLY if consistently accurate (content
  changes only — ours uses updated_at/published_at ✓); priority/changefreq ignored.
  News sitemap: articles from LAST 48 HOURS ONLY, ≤1000 entries, publication name
  matches news.google.com listing (we're not in Google News yet — low stakes).
- robots.txt controls crawling NOT indexing; never block pages whose meta rules
  you need followed; use noindex (meta) to deindex, never robots.txt.
- Recrawl requests: URL Inspection tool or sitemap resubmission; days-to-weeks.
- URL rules: lowercase, hyphens not underscores, readable words (/articles/<slug> ✓).
- Links: crawlable = real <a href> with descriptive anchor text ("click here"
  banned); every important page needs ≥1 internal link; comment links would need
  rel="ugc nofollow" (moot today — plain text).

## 9. Page experience

- CWV thresholds: LCP ≤ 2.5s · INP < 200ms · CLS < 0.1 (field data, mobile-first).
- Signals: CWV + HTTPS + mobile-friendly + no intrusive interstitials + clearly
  distinguishable main content. Relevance still outranks experience; don't chase
  perfect scores instead of content quality.

## 10. Monitoring ritual (weekly review card inputs)

- Reports in order of importance: Performance (queries/pages/CTR/position, 16-mo
  cap), Page Indexing, Core Web Vitals, Manual Actions, Security Issues, Sitemaps.
- Traffic-drop triage order: Data anomalies → algorithm update (check status
  dashboard) → technical (Crawl Stats + Page Indexing spikes) → security/manual
  actions → seasonality (Trends cross-check) → migration.
- Impressions stable + clicks down = title/snippet problem → rewrite metadata.
- Bubble-chart quadrants (y=position reversed, x=CTR, size=clicks):
  high-pos/high-CTR = done · **low-pos/high-CTR = create/expand page (top
  opportunity)** · low/low = skip · high-pos/low-CTR = rewrite title+description.
- GSC clicks vs GA sessions: compare TRENDS not counts; join on landing page.
- Trends: seed keywords from Performance queries → Rising related queries →
  publish BEFORE seasonal spikes; brand-term monitoring 30/90-day windows.
