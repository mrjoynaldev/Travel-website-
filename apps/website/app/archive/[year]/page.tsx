import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingPage } from "@web/components/ListingPage";
import { serverTrpc } from "@web/lib/trpc-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Publication archive", description: "A chronological map of every published CodeReport Global story." };

type PostListItem = Awaited<ReturnType<typeof serverTrpc.blog.list.query>>["items"][number];

export default async function YearArchivePage({ params }: { params: Promise<{ year: string }> }) {
  const year = Number((await params).year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) notFound();
  let items: PostListItem[] = [];
  try {
    const listResult = await serverTrpc.blog.list.query({ year, page: 1 });
    items = listResult.items;
  } catch {
    notFound();
  }
  return <ListingPage eyebrow="Publication archive" title={String(year)} description="Published CodeReport Global stories from this year." items={items} />;
}
