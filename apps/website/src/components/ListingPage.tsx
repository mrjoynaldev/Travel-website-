import { ArticleCard, type ArticleCardPost } from "@/components/public/ArticleCard";
import Link from "next/link";

export function ListingPage({ eyebrow, title, description, items }: { eyebrow: string; title: string; description: string; items: ArticleCardPost[] }) {
  return <>
    <section className="border-b border-border bg-[#e8ede6]"><div className="container max-w-5xl lg:max-w-6xl py-14 md:py-20 lg:py-24 xl:py-28"><p className="font-label text-[10px] lg:text-[11px] text-primary">{eyebrow}</p><h1 className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-6xl lg:text-[3.4rem] xl:text-6xl lg:leading-[0.95]">{title}</h1><p className="mt-5 max-w-2xl lg:max-w-[42rem] text-lg lg:text-[19px] leading-8 lg:leading-9 text-muted-foreground">{description}</p></div></section>
    <section className="container py-12 md:py-16 lg:py-20 xl:py-24">{items.length ? <div className="grid gap-x-7 lg:gap-x-8 xl:gap-x-9 gap-y-12 lg:gap-y-14 md:grid-cols-3">{items.map(post => <ArticleCard key={post.id} post={post} />)}</div> : <div className="rounded-xl lg:rounded-2xl border border-dashed border-border bg-white p-14 lg:p-16 text-center"><p className="font-display text-2xl lg:text-[1.7rem]">No published stories are here yet.</p><p className="mt-2 text-sm lg:text-[15px] text-muted-foreground">Explore another topic or return soon.</p><Link href="/" className="mt-5 inline-block text-sm lg:text-[15px] font-semibold text-primary hover:underline">Browse all stories</Link></div>}</section>
  </>;
}
