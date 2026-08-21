import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleView from "@web/components/ArticleView";
import { serverTrpc } from "@web/lib/trpc-server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://codereportglobal.indevs.in";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { post } = await serverTrpc.blog.bySlug.query({ slug });
    const title = post.meta_title?.trim() || post.title;
    const description = post.meta_description?.trim() || post.excerpt?.trim() || undefined;
    const canonical = post.canonical_url?.trim() || `${siteUrl()}/articles/${post.slug}`;
    const image = post.og_image_url?.trim() || post.featuredMedia?.url || undefined;
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
        images: image ? [{ url: image }] : undefined,
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
        images: image ? [image] : undefined,
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
  const image = post.og_image_url?.trim() || post.featuredMedia?.url || undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        headline: post.meta_title?.trim() || post.title,
        description: post.meta_description?.trim() || post.excerpt?.trim() || undefined,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleView post={post} related={related} comments={comments} slug={slug} />
    </>
  );
}