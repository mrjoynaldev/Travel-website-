import { ArticleCard, type ArticleCardPost } from "@/components/public/ArticleCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ListingPage({ eyebrow, title, description, items }: { eyebrow: string; title: string; description: string; items: ArticleCardPost[] }) {
  return (
    <>
      <section className="border-b border-border bg-[#eff4ee]">
        <div className="container max-w-5xl py-14 md:py-20 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Back home</Link>
          <p className="mt-6 font-label text-[11px] text-primary">{eyebrow}</p>
          <h1 className="mt-3 h1 font-display">{title}</h1>
          <p className="mt-4 max-w-2xl body-lg text-muted-foreground">{description}</p>
        </div>
      </section>
      <section className="container py-12 md:py-16 lg:py-20">
        {items.length ? (
          <div className="grid gap-x-7 gap-y-12 md:grid-cols-3">{items.map((post) => <ArticleCard key={post.id} post={post} />)}</div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-border bg-white p-14 text-center">
            <p className="font-display text-2xl">No published guides here yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">Explore another topic, or plan your trip with us directly.</p>
            <div className="mt-5 flex justify-center gap-3">
              <Link href="/" className="text-sm font-semibold text-primary hover:underline">Browse all guides</Link>
              <span className="text-border">•</span>
              <Link href="/hire" className="text-sm font-semibold text-primary hover:underline">Plan your trip</Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
