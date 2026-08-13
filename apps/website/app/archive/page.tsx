import type { Metadata } from "next";
import { Tags } from "lucide-react";
import Link from "next/link";
import { serverTrpc } from "@web/lib/trpc-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Publication archive", description: "A chronological map of every published CodeReport Global story." };

export default async function ArchivePage() {
  let archives: { year: number; count: number }[] = [];
  try {
    archives = await serverTrpc.blog.archives.query();
  } catch {
    archives = [];
  }
  return <>
    <section className="border-b border-border bg-[#e8ede6]"><div className="container max-w-5xl py-14 md:py-20"><p className="font-label text-[10px] text-primary">Publication archive</p><h1 className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-6xl">By the year.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">A chronological map of every published CodeReport Global story.</p></div></section>
    <section className="container max-w-5xl py-12 md:py-16">{archives.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{archives.map(item => <Link key={item.year} href={`/archive/${item.year}`} className="group rounded-xl border border-border bg-white p-6 shadow-sm transition hover:border-primary"><div className="flex items-center justify-between"><span className="font-display text-4xl font-semibold">{item.year}</span><Tags className="h-5 w-5 text-primary" /></div><p className="mt-5 text-sm text-muted-foreground">{item.count} {item.count === 1 ? "published story" : "published stories"}</p></Link>)}</div> : <p className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">The archive will appear after the first story is published.</p>}</section>
  </>;
}
