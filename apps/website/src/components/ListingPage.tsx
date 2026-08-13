import { ArticleCard, type ArticleCardPost } from "@/components/public/ArticleCard";
import Link from "next/link";

export function ListingPage({ eyebrow, title, description, items }: { eyebrow: string; title: string; description: string; items: ArticleCardPost[] }) {
  return <>
    <section className="border-b border-border bg-[#e8ede6]"><div className="container max-w-5xl py-14 md:py-20"><p className="font-label text-[10px] text-primary">{eyebrow}</p><h1 className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-6xl">{title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p></div></section>
    <section className="container py-12 md:py-16">{items.length ? <div className="grid gap-x-7 gap-y-12 md:grid-cols-3">{items.map(post => <ArticleCard key={post.id} post={post} />)}</div> : <div className="rounded-xl border border-dashed border-border bg-white p-14 text-center"><p className="font-display text-2xl">No published stories are here yet.</p><p className="mt-2 text-sm text-muted-foreground">Explore another topic or return soon.</p><Link href="/" className="mt-5 inline-block text-sm font-semibold text-primary">Browse all stories</Link></div>}</section>
  </>;
}
