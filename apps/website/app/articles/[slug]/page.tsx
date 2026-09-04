import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleView from "@web/components/ArticleView";
import { injectRelatedLinks } from "@web/lib/articleHtml";
import { serverTrpc } from "@web/lib/trpc-server";
import { optimizedSocialImage } from "@web/lib/social-image";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://codereportglobal.indevs.in";

const titleOverrides: Record<string, string> = {
  "ai-code-production-checks": "AI Code Fails in Production? Fix Guide (2026)",
  "ai-deployment-fixes": "AI Website Deployment Fails? 15 Fixes (2026)",
  "claude-code-sandbox": "Sandbox Claude Code Without Breaking Git/MCP (2026)",
  "n8n-mcp-production": "Deploy n8n MCP in Production: Proxy + Queue (2026)",
  "deepseek-opencode-image-error": "DeepSeek Image Error in OpenCode? Fix (2026)",
  "openai-hugging-face-agent-intrusion": "OpenAI–Hugging Face Intrusion: 7 Sandbox Fixes",
};

const metaDescriptionOverrides: Record<string, string> = {
  "ai-code-production-checks": "AI code passes tests but breaks in production? Use this 15-point checklist to catch edge cases, env mismatches, and integration failures before your users do.",
  "ai-deployment-fixes": "AI-built websites break during deployment? Fix the 15 most common issues: SSR mismatches, missing env vars, broken routes, and more.",
  "claude-code-sandbox": "Sandbox Claude Code safely without breaking Git, MCP, or your dev workflow. Step-by-step setup with Docker and permission controls.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { post } = await serverTrpc.blog.bySlug.query({ slug });
    const title = titleOverrides[slug] || post.meta_title?.trim() || post.title;
    const description = metaDescriptionOverrides[slug] || post.meta_description?.trim() || post.excerpt?.trim() || undefined;
    const canonical = post.canonical_url?.trim() || `${siteUrl()}/articles/${post.slug}`;
  const uploadedImage = post.og_image_url?.trim() || post.featuredMedia?.url;
    const image = optimizedSocialImage(uploadedImage) || `${siteUrl()}/api/og?title=${encodeURIComponent(title)}&kicker=${encodeURIComponent(post.categories?.[0]?.name ?? "")}`;
    const keywords = (post.tags ?? []).map((tag: { name: string }) => tag.name);
    return {
      title,
      description,
      keywords: keywords.length ? keywords.join(", ") : undefined,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        type: "article",
        url: canonical,
        siteName: "CodeReport Global",
        locale: "en_US",
        images: [{ url: image }],
        publishedTime: post.published_at || undefined,
        modifiedTime: post.updated_at || undefined,
        authors: post.author?.display_name ? [post.author.display_name] : undefined,
        section: post.categories?.[0]?.name || undefined,
        tags: keywords.length ? keywords : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
      robots: { index: true, follow: true },
    };
  } catch {
    return {};
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  let post: Awaited<ReturnType<typeof serverTrpc.blog.bySlug.query>>["post"];
  let related: Awaited<ReturnType<typeof serverTrpc.blog.bySlug.query>>["related"] = [];
  let comments: { id: string; parent_id: string | null; author_name: string; body: string; created_at: string }[] = [];
  try {
    const data = await serverTrpc.blog.bySlug.query({ slug });
    post = data.post;
    related = data.related;
    comments = await serverTrpc.blog.comments.query({ postId: post.id });
  } catch {
    notFound();
  }

  const pageUrl = `${siteUrl()}/articles/${post.slug}`;
  const canonical = post.canonical_url?.trim() || pageUrl;
  const articleTitle = titleOverrides[slug] || post.meta_title?.trim() || post.title;
  const uploadedImage = post.og_image_url?.trim() || post.featuredMedia?.url;
  const image = uploadedImage || `${siteUrl()}/api/og?title=${encodeURIComponent(articleTitle)}&kicker=${encodeURIComponent(post.categories?.[0]?.name ?? "")}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        "@id": `${pageUrl}#article`,
        headline: titleOverrides[slug] || post.meta_title?.trim() || post.title,
        description: metaDescriptionOverrides[slug] || post.meta_description?.trim() || post.excerpt?.trim() || undefined,
        url: canonical,
        image: image ? [image] : undefined,
        datePublished: post.published_at || undefined,
        dateModified: post.updated_at || post.published_at || undefined,
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
        articleSection: post.categories?.map((category: { name: string }) => category.name) || undefined,
        keywords: (post.tags ?? []).map((tag: { name: string }) => tag.name).join(", ") || undefined,
        author: post.author
          ? { "@type": "Person", name: post.author.display_name, url: post.author.website_url || `${siteUrl()}/authors/${post.author.id}` }
          : undefined,
        publisher: { "@id": `${siteUrl()}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl()}/` },
          ...(post.categories?.[0]
            ? [{ "@type": "ListItem", position: 2, name: post.categories[0].name, item: `${siteUrl()}/topics/${post.categories[0].slug}` }]
            : []),
          { "@type": "ListItem", position: post.categories?.[0] ? 3 : 2, name: post.meta_title?.trim() || post.title, item: pageUrl },
        ],
      },
    ],
  };

  // Extract FAQ questions from article H2s for FAQPage schema
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const faqItems: { question: string; answer: string }[] = [];
  let match;
  while ((match = h2Regex.exec(post.rendered_html)) !== null) {
    const question = match[1].replace(/<[^>]*>/g, "").trim();
    if (/\?/.test(question) || /^(how|what|why|when|where|which|can|do|does|is|are|should|will)/i.test(question)) {
      // Extract the paragraph after this H2 as the answer
      const afterH2 = post.rendered_html.slice(match.index + match[0].length);
      const nextH2 = afterH2.search(/<h2/i);
      const answerBlock = nextH2 > 0 ? afterH2.slice(0, nextH2) : afterH2.slice(0, 500);
      const answer = answerBlock.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
      if (answer.length > 20) faqItems.push({ question, answer });
    }
  }

  if (faqItems.length >= 3) {
    (jsonLd["@graph"] as any[]).push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: faqItems.slice(0, 8).map(item => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  // SSR-visible internal links: inject the Related/Also-read fallback on the
  // server so crawlers and no-JS readers get real <a href> links in the HTML.
  const bodyHtml = injectRelatedLinks(
    post.rendered_html,
    (related ?? []).map((r: { slug: string; title: string }) => ({ slug: r.slug, title: r.title })),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleView post={{ ...post, rendered_html: bodyHtml }} related={related} comments={comments} slug={slug} />
    </>
  );
}