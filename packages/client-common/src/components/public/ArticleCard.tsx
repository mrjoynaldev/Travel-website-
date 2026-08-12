import { ArrowUpRight, Clock3 } from "lucide-react";
import { Link } from "wouter";

export type ArticleCardPost = {
  id: string; title: string; slug: string; excerpt: string | null; published_at: string | null; updated_at?: string; featured: boolean; featuredMedia?: { url: string; alt_text: string | null } | null; author?: { id: string; display_name: string } | null; categories?: Array<{ id: string; name: string; slug: string }>;
};

const formatDate = (date: string | null) => date ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "In editorial review";
const readTime = (excerpt: string | null) => Math.max(3, Math.ceil((excerpt?.split(/\s+/).length ?? 160) / 35));

export function ArticleCard({ post, featured = false }: { post: ArticleCardPost; featured?: boolean }) {
  return <article className={`group ${featured ? "grid gap-6 md:grid-cols-[1.1fr_.9fr] md:items-center" : "flex flex-col"}`}>
    <Link href={`/articles/${post.slug}`} className={`relative block overflow-hidden bg-secondary ${featured ? "aspect-[16/10] rounded-[1.25rem]" : "aspect-[16/11] rounded-xl"}`} aria-label={`Read ${post.title}`}>
      {post.featuredMedia ? <img src={post.featuredMedia.url} alt={post.featuredMedia.alt_text || ""} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" loading="lazy" /> : <div className="paper-grid flex h-full items-end bg-[#dce7d7] p-6"><span className="font-display text-3xl leading-none text-[#2f5e49]/70">{post.categories?.[0]?.name || "CodeReport"}</span></div>}
    </Link>
    <div className={featured ? "py-1" : "pt-5"}><div className="flex flex-wrap items-center gap-2"><span className="font-label text-[10px] text-primary">{post.categories?.[0]?.name || "Essay"}</span><span className="h-1 w-1 rounded-full bg-[#c3c9c4]" /><span className="text-xs text-muted-foreground">{formatDate(post.published_at)}</span></div><h2 className={`${featured ? "mt-4 text-4xl sm:text-5xl" : "mt-3 text-2xl"} font-display font-semibold leading-[1.07] tracking-tight transition-colors group-hover:text-primary`}><Link href={`/articles/${post.slug}`}>{post.title}</Link></h2>{post.excerpt && <p className={`${featured ? "mt-4 text-base leading-7" : "mt-3 text-sm leading-6"} max-w-xl text-muted-foreground`}>{post.excerpt}</p>}<div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{post.author?.display_name || "CodeReport Global editorial"}</span><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{readTime(post.excerpt)} min read</span></div>{featured && <Link href={`/articles/${post.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">Read the story <ArrowUpRight className="h-4 w-4" /></Link>}</div>
  </article>;
}
