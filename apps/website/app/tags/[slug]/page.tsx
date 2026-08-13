import { notFound } from "next/navigation";
import { ListingPage } from "@web/components/ListingPage";
import { serverTrpc } from "@web/lib/trpc-server";

export const dynamic = "force-dynamic";

type PostListItem = Awaited<ReturnType<typeof serverTrpc.blog.list.query>>["items"][number];

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let tag: { id: string; name: string; slug: string } | undefined;
  let items: PostListItem[] = [];
  try {
    const [tagsResult, listResult] = await Promise.all([
      serverTrpc.blog.tags.query(),
      serverTrpc.blog.list.query({ tag: slug, page: 1 }),
    ]);
    tag = tagsResult.find(item => item.slug === slug);
    items = listResult.items;
  } catch {
    notFound();
  }
  return <ListingPage eyebrow="Tag" title={tag ? `#${tag.name}` : "Tag"} description="Published stories connected by a specific idea, thread, or subject." items={items} />;
}
