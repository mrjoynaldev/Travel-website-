import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingPage } from "@web/components/ListingPage";
import { serverTrpc } from "@web/lib/trpc-server";

export const dynamic = "force-dynamic";

type PostListItem = Awaited<ReturnType<typeof serverTrpc.blog.list.query>>["items"][number];

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const categoriesResult = await serverTrpc.blog.categories.query();
    const category = categoriesResult.find(item => item.slug === slug);
    if (!category) return {};
    const title = `${category.name} — CodeReport Global`;
    return {
      title,
      description: category.description || `Published stories from CodeReport Global on ${category.name}.`,
      alternates: { canonical: `/topics/${category.slug}` },
      openGraph: { type: "website", siteName: "CodeReport Global", locale: "en_US", url: `/topics/${category.slug}`, title, description: category.description || undefined, images: [{ url: "/og-default.png", width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image", images: ["/og-default.png"], title },
    };
  } catch {
    return {};
  }
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let category: { id: string; name: string; slug: string; description: string | null } | undefined;
  let items: PostListItem[] = [];
  try {
    const [categoriesResult, listResult] = await Promise.all([
      serverTrpc.blog.categories.query(),
      serverTrpc.blog.list.query({ category: slug, page: 1 }),
    ]);
    category = categoriesResult.find(item => item.slug === slug);
    items = listResult.items;
  } catch {
    notFound();
  }
  return <ListingPage eyebrow="Topic" title={category?.name || "Topic"} description={category?.description || "A collection of published stories organized around a shared editorial theme."} items={items} />;
}
