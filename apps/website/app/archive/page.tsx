import type { Metadata } from "next";
import { Tags } from "lucide-react";
import Link from "next/link";
import { serverTrpc } from "@web/lib/trpc-server";

export const revalidate = 300;

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatra.com";

export const metadata: Metadata = {
  title: "Guide archive",
  description: "Every Sundarban Yatri travel guide, browsable by year.",
  // Thin index page: keep crawlable for users, out of the index.
  robots: { index: false, follow: true },
  alternates: { canonical: "/archive" },
  openGraph: { type: "website", siteName: "Sundarban Yatri", locale: "en_US", url: `${siteUrl()}/archive`, images: [{ url: `${siteUrl()}/og-default.png`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: [`${siteUrl()}/og-default.png`] },
};

export default async function ArchivePage() {
  let archives: { year: number; count: number }[] = [];
  try {
    archives = await serverTrpc.blog.archives.query();
  } catch {
    archives = [];
  }
  return <>
    <section className="border-b border-border bg-[#e8ede6]"><div className="container max-w-5xl lg:max-w-6xl py-14 md:py-20 lg:py-24 xl:py-28"><p className="font-label text-[10px] lg:text-[11px] text-primary">Guide archive</p><h1 className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-6xl lg:text-[3.4rem] xl:text-6xl lg:leading-[0.95]">By the year.</h1><p className="mt-5 max-w-2xl lg:max-w-[42rem] text-lg lg:text-[19px] leading-8 lg:leading-9 text-muted-foreground">Every Sundarban travel guide we have published, browsable by year.</p></div></section>
    <section className="container max-w-5xl lg:max-w-6xl py-12 md:py-16 lg:py-20 xl:py-24">{archives.length ? <div className="grid gap-4 lg:gap-5 xl:gap-6 sm:grid-cols-2 lg:grid-cols-3">{archives.map(item => <Link key={item.year} href={`/archive/${item.year}`} className="group rounded-xl lg:rounded-2xl border border-border bg-white p-6 lg:p-7 shadow-sm hover:shadow-md lg:hover:-translate-y-1 transition-all hover:border-primary"><div className="flex items-center justify-between"><span className="font-display text-4xl lg:text-[2.5rem] font-semibold">{item.year}</span><Tags className="h-5 w-5 lg:h-6 lg:w-6 text-primary group-hover:scale-110 transition-transform" /></div><p className="mt-5 text-sm lg:text-[15px] text-muted-foreground">{item.count} {item.count === 1 ? "guide" : "guides"}</p></Link>)}</div> : <p className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">Guides will appear here once published.</p>}</section>
  </>;
}
