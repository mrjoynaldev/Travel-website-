import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileWarning } from "lucide-react";
import Link from "next/link";
import { serverTrpc } from "@web/lib/trpc-server";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatri.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await serverTrpc.blog.pageBySlug.query({ slug });
    const title = page.meta_title?.trim() || page.title;
    return {
      title,
      description: page.meta_description?.trim() || undefined,
      alternates: { canonical: `/${page.slug}` },
      openGraph: { type: "website", siteName: "Sundarban Yatri", locale: "en_US", url: `${siteUrl()}/${page.slug}`, title, images: [{ url: `${siteUrl()}/og-default.png`, width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image", images: [`${siteUrl()}/og-default.png`], title },
    };
  } catch {
    return {};
  }
}

// Static routes (about, contact, …) always win over [slug]; excluding their
// names here keeps the export deterministic instead of order-dependent.
const RESERVED = new Set([
  "about", "contact", "hire", "tours", "archive", "articles", "authors",
  "topics", "tags", "api", "login", "llms.txt", "sitemap.xml", "robots.txt",
]);

export async function generateStaticParams() {
  try {
    const pages = await serverTrpc.blog.pages.query();
    const slugs = pages.map(p => p.slug).filter(slug => slug && !RESERVED.has(slug));
    return slugs.length ? slugs.map(slug => ({ slug })) : [{ slug: "__pending__" }];
  } catch {
    return [];
  }
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  let page: { title: string; rendered_html: string; updated_at: string | null };
  try {
    page = await serverTrpc.blog.pageBySlug.query({ slug });
  } catch {
    notFound();
  }
  return <>
    <section className="border-b border-border bg-[#edf3ee]"><div className="container max-w-4xl lg:max-w-5xl py-14 md:py-20 lg:py-24 xl:py-28"><p className="font-label text-xs lg:text-[11px] text-primary">Information page</p><h1 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-6xl lg:text-[3.3rem] lg:leading-[0.95]">{page.title}</h1></div></section>
    <section className="container max-w-4xl lg:max-w-[760px] py-12 md:py-16 lg:py-20"><article className="article-prose" dangerouslySetInnerHTML={{ __html: page.rendered_html }} /></section>
  </>;
}
