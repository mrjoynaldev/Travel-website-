import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleView from "@web/components/ArticleView";
import { serverTrpc } from "@web/lib/trpc-server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { post } = await serverTrpc.blog.bySlug.query({ slug });
    const title = post.meta_title?.trim() || post.title;
    const description = post.meta_description?.trim() || post.excerpt?.trim() || undefined;
    return {
      title,
      description,
      alternates: { canonical: post.canonical_url?.trim() || `/articles/${post.slug}` },
      openGraph: {
        title,
        description,
        type: "article",
        url: `/articles/${post.slug}`,
        images: post.og_image_url?.trim() || post.featuredMedia?.url || undefined,
      },
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
  return <ArticleView post={post} related={related} comments={comments} slug={slug} />;
}
