import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingPage } from "@web/components/ListingPage";
import { serverTrpc } from "@web/lib/trpc-server";

export const revalidate = 300;

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://codereportglobal.indevs.in";

type PostListItem = Awaited<ReturnType<typeof serverTrpc.blog.list.query>>["items"][number];

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const year = Number((await params).year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return {};
  const title = `Publication archive — ${year}`;
  const description = `Published CodeReport Global stories from ${year}.`;
  return {
    title,
    description,
    alternates: { canonical: `/archive/${year}` },
    openGraph: { type: "website", siteName: "CodeReport Global", locale: "en_US", url: `${siteUrl()}/archive/${year}`, title, description, images: [{ url: `${siteUrl()}/og-default.png`, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [`${siteUrl()}/og-default.png`] },
  };
}

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
