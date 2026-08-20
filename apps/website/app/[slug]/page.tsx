import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileWarning } from "lucide-react";
import Link from "next/link";
import { serverTrpc } from "@web/lib/trpc-server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await serverTrpc.blog.pageBySlug.query({ slug });
    const title = page.meta_title?.trim() || page.title;
    return {
      title,
      description: page.meta_description?.trim() || undefined,
      alternates: { canonical: `/${page.slug}` },
      openGraph: { type: "website", siteName: "CodeReport Global", locale: "en_US", url: `/${page.slug}`, title },
      twitter: { card: "summary_large_image", title },
    };
  } catch {
    return {};
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
    <section className="border-b border-border bg-[#edf3ee]"><div className="container max-w-4xl py-14 md:py-20"><p className="font-label text-xs text-primary">PUBLICATION PAGE</p><h1 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-6xl">{page.title}</h1></div></section>
    <section className="container max-w-4xl py-12 md:py-16"><article className="article-prose" dangerouslySetInnerHTML={{ __html: page.rendered_html }} /></section>
  </>;
}
