import { notFound } from "next/navigation";
import { ListingPage } from "@web/components/ListingPage";
import { serverTrpc } from "@web/lib/trpc-server";

export const dynamic = "force-dynamic";

type PostListItem = Awaited<ReturnType<typeof serverTrpc.blog.list.query>>["items"][number];

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
