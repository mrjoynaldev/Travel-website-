import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingPage } from "@web/components/ListingPage";
import { serverTrpc } from "@web/lib/trpc-server";

export const revalidate = 300;

type PostListItem = Awaited<ReturnType<typeof serverTrpc.blog.list.query>>["items"][number];

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const tagsResult = await serverTrpc.blog.tags.query();
    const tag = tagsResult.find(item => item.slug === slug);
    if (!tag) return {};
    const title = `#${tag.name}`;
    return {
      title,
      description: `Published stories tagged ${tag.name} from CodeReport Global.`,
      alternates: { canonical: `/tags/${tag.slug}` },
      openGraph: { type: "website", siteName: "CodeReport Global", locale: "en_US", url: `/tags/${tag.slug}`, title, images: [{ url: "/og-default.png", width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image", images: ["/og-default.png"], title },
    };
  } catch {
    return {};
  }
}

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
