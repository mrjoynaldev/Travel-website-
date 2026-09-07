import type { Metadata } from "next";
import HomeView from "@web/components/HomeView";
import { serverTrpc } from "@web/lib/trpc-server";

export const revalidate = 300;

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatra.in";

export const metadata: Metadata = {
  title: "Sundarban Yatra — Sundarban Tours, Safari, Destinations & Travel Guides",
  description: "Plan your Sundarban journey with confidence — mangrove tours, safari, destinations, things to do and practical travel guides.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Sundarban Yatra", locale: "en_US", url: siteUrl(), images: [{ url: `${siteUrl()}/og-default.png`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: [`${siteUrl()}/og-default.png`] },
};

type SearchParams = { search?: string | string[]; category?: string | string[]; page?: string | string[] };

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const category = typeof params.category === "string" ? params.category : undefined;
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);

  let categories: Awaited<ReturnType<typeof serverTrpc.blog.categories.query>> = [];
  let sections: Awaited<ReturnType<typeof serverTrpc.blog.sections.query>> = [];
  let posts: Awaited<ReturnType<typeof serverTrpc.blog.list.query>> = { items: [], total: 0, page: 1, totalPages: 0 };

  try {
    const [categoriesResult, sectionsResult, listResult] = await Promise.all([
      serverTrpc.blog.categories.query(),
      serverTrpc.blog.sections.query(),
      serverTrpc.blog.list.query({ page, query: search || undefined, category }),
    ]);
    categories = categoriesResult;
    sections = sectionsResult;
    posts = listResult;
  } catch (error) {
    console.error("[home] failed to load the feed:", error);
  }

  return <HomeView categories={categories} sections={sections} posts={posts} search={search} category={category} page={page} />;
}
