import { serverTrpc } from "@web/lib/trpc-server";

export const dynamic = "force-static";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatra.com";

/**
 * llms.txt — a markdown map of this site for LLM crawlers
 * (see https://llmstxt.org). Served at /llms.txt.
 */
export async function GET() {
  const base = siteUrl();
  let publication: any = null;
  let posts: any[] = [];
  let categories: any[] = [];
  try {
    const [publicationResult, listResult, categoriesResult] = await Promise.all([
      serverTrpc.blog.publication.query(),
      serverTrpc.blog.list.query({ page: 1 }),
      serverTrpc.blog.categories.query(),
    ]);
    publication = publicationResult;
    posts = listResult.items ?? [];
    categories = categoriesResult ?? [];
  } catch {
    // Fall back to static content below if the API is unreachable.
  }

  const name = publication?.name || "Sundarban Yatri";
  const description =
    publication?.description ||
    "Developer-first AI news, analysis, and practical guides for people who build and ship software.";

  const lines: string[] = [
    `# ${name}`,
    "",
    `> ${description}`,
    "",
    `Site: ${base}`,
    "Language: en",
    "Content type: Sundarban travel publication — tours, safari, destinations, things to do, and practical trip-planning guides.",
    "",
    "## How to cite us",
    "",
    `- Cite articles by title with the author byline and the canonical URL (${base}/articles/<slug>).`,
    "- Publication dates are exposed in each article's structured data (datePublished / dateModified).",
    "",
    "## Sections",
    "",
    ...(categories.length
      ? categories.map(
          (c: any) =>
            `- [${c.name}](${base}/topics/${c.slug}): ${c.description || `Articles about ${c.name}.`}`,
        )
      : ["- News, analysis, and guides about AI and software development."]),
    "",
    "## Articles",
    "",
    ...(posts.length
      ? posts.map(
          (p: any) =>
            `- [${p.title}](${base}/articles/${p.slug}): ${
              p.excerpt ? String(p.excerpt).slice(0, 140) : "Full article."
            }`,
        )
      : ["- New articles are published regularly; check the sitemap at /sitemap.xml."]),
    "",
    "## Pages",
    "",
    `- [Home](${base})`,
    `- [Archive](${base}/archive)`,
    `- [Sitemap](${base}/sitemap.xml)`,
    "",
  ];

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
