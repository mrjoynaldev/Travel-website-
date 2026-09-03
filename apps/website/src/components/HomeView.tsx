"use client";

import { ArticleCard, type ArticleCardPost } from "@/components/public/ArticleCard";
import { SearchField } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, MoveRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useTransition, useState } from "react";
import { toast } from "sonner";
import { trpcClient } from "@web/lib/trpc-client";

type HomepageSection = {
  id: string;
  title: string;
  section_type: "featured" | "latest" | "category" | "tag" | "custom";
  subtitle: string | null;
  rendered_html: string | null;
  posts: ArticleCardPost[];
};

type Category = { id: string; name: string; slug: string; description: string | null };

type HomeViewProps = {
  categories: Category[];
  sections: HomepageSection[];
  posts: { items: ArticleCardPost[]; total: number; page: number; totalPages: number };
  search: string;
  category?: string;
  page: number;
};

function buildQuery(params: Record<string, string | number | undefined>) {
  const url = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    url.set(key, String(value));
  }
  const qs = url.toString();
  return qs ? `/?${qs}` : "/";
}

function ConfiguredSections({ sections }: { sections: HomepageSection[] }) {
  return <div className="space-y-14 lg:space-y-16">
    {sections.map(section => <section key={section.id} className="border-t border-border pt-10 lg:pt-12 first:border-t-0 first:pt-0">
      <div className="mb-7 lg:mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="font-label text-xs lg:text-[11px] text-primary">{section.section_type === "custom" ? "Editorial note" : "From the journal"}</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl lg:text-[2.2rem]">{section.title}</h2>{section.subtitle && <p className="mt-2 max-w-2xl text-sm lg:text-[15.5px] leading-6 lg:leading-7 text-muted-foreground">{section.subtitle}</p>}</div>{section.posts.length > 0 && <span className="text-sm text-muted-foreground hidden sm:inline">{section.posts.length} stories</span>}</div>
      {section.section_type === "custom" ? <div className="article-prose rounded-2xl border border-[#d6e2d1] bg-[#f5f9f3] p-6 lg:p-7" dangerouslySetInnerHTML={{ __html: section.rendered_html || "" }} /> : section.posts.length ? <div className="grid gap-x-7 lg:gap-x-8 xl:gap-x-9 gap-y-12 lg:gap-y-14 md:grid-cols-3">{section.posts.map((post, index) => <ArticleCard key={post.id} post={post} featured={index === 0 && section.posts.length === 1} />)}</div> : <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">No published stories in this section yet.</p>}
    </section>)}
  </div>;
}

export default function HomeView({ categories, sections, posts, search, category, page }: HomeViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(category);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const navigate = (params: Record<string, string | number | undefined>) => {
    startTransition(() => router.push(buildQuery({ search: searchInput.trim() || undefined, category: categoryFilter, ...params })));
  };

  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      startTransition(() => router.push(buildQuery({ search: value.trim() || undefined, category: categoryFilter, page: 1 })));
    }, 350);
  };

  const setTopic = (topic?: string) => {
    clearTimeout(searchTimer.current);
    setCategoryFilter(topic);
    navigate({ category: topic, page: 1 });
  };

  const retry = () => { startTransition(() => router.refresh()); };

  const subscribe = async () => {
    if (!email) return;
    setSubmitting(true);
    try {
      await trpcClient.blog.subscribe.mutate({ email });
      setEmail("");
      toast.success("You are subscribed. Welcome to CodeReport Global.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Subscription could not be saved.");
    } finally {
      setSubmitting(false);
    }
  };

  const heading = search ? `Results for “${search}”` : category ? categories.find(item => item.slug === category)?.name || "Selected stories" : "Latest stories";
  const showConfiguredSections = !search && !category && sections.length > 0;
  const isLoading = isPending;

  return <>
    <section className="paper-grid border-b border-border"><div className="container grid gap-10 lg:gap-12 xl:gap-16 py-16 md:py-24 lg:py-28 xl:py-32 md:grid-cols-[1.1fr_.9fr]"><div className="enter-fade"><p className="font-label text-xs lg:text-[11px] text-primary">Fix dev errors fast with AI — 18, AI-native</p><h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[.98] lg:leading-[0.96] tracking-tight text-foreground sm:text-6xl lg:text-7xl">I fix <em className="font-normal text-primary">dev errors</em><br />in minutes.</h1><p className="mt-6 max-w-lg lg:max-w-[32rem] text-base lg:text-[16.5px] leading-7 lg:leading-8 text-muted-foreground">CodeReport Global: practical fix guides + AI builds. Stuck on a bug, need a landing page in 24h, or want an automation? I’ll ship it — no fluff. <Link href="/hire" className="font-medium text-primary underline underline-offset-4 decoration-primary/20 hover:decoration-primary">Hire me →</Link></p><div className="mt-8 lg:mt-10 flex flex-wrap gap-3"><Button asChild className="shadow-sm lg:h-11 lg:px-6"><Link href="/hire">Get help in 24h</Link></Button><Button variant="outline" asChild className="lg:h-11 lg:px-6"><Link href="/archive">Browse guides</Link></Button></div><div className="mt-6 lg:mt-8 max-w-md lg:max-w-[26rem]"><SearchField value={searchInput} onChange={onSearchChange} /></div></div><div className="flex flex-col justify-end rounded-2xl border border-[#cbd8c5] bg-[#e4ece0]/80 p-7 lg:p-8 xl:p-9 shadow-[0_18px_40px_-32px_rgba(31,77,59,.55)] lg:shadow-[0_24px_48px_-28px_rgba(31,77,59,0.5)]"><p className="font-label text-[10px] lg:text-[11px] text-primary">The editorial note</p><p className="mt-5 lg:mt-6 font-display text-2xl lg:text-[1.65rem] xl:text-[1.75rem] leading-snug lg:leading-[1.35] text-[#263c31]">We believe attention is a form of care. The best ideas have room to unfold — and then ship.</p><div className="mt-6 lg:mt-8 flex items-center gap-3 border-t border-[#c6d4c2] pt-4 lg:pt-5">
      <img src="/logo.png" alt="CodeReport Global" className="h-9 w-9 rounded-full object-cover border border-[#c6d4c2]" />
      <div>
        <p className="text-sm font-semibold">The CodeReport Global team</p>
        <p className="text-xs text-muted-foreground">Editors at large</p>
      </div>
    </div></div></div></section>
    <section id="topics" className="border-b border-border bg-white"><div className="container py-7 lg:py-8"><div className="flex gap-2 lg:gap-2.5 overflow-x-auto lg:flex-wrap lg:overflow-visible pb-1 lg:pb-0 scrollbar-none"><Button size="sm" variant={!categoryFilter ? "default" : "outline"} onClick={() => setTopic()} className="shrink-0 rounded-full lg:h-9 lg:px-4 lg:text-[14px]">All stories</Button>{categories.map(item => <Button key={item.id} size="sm" variant={categoryFilter === item.slug ? "default" : "outline"} onClick={() => setTopic(item.slug)} className="shrink-0 rounded-full lg:h-9 lg:px-4 lg:text-[14px]">{item.name}</Button>)}</div></div></section>
    <section className="container py-14 md:py-20 lg:py-24 xl:py-28">{showConfiguredSections ? <ConfiguredSections sections={sections} /> : <><div className="mb-10 lg:mb-12 flex items-end justify-between gap-4"><div><p className="font-label text-xs lg:text-[11px] text-primary">From the journal</p><h2 className="mt-2 font-display text-4xl lg:text-[2.4rem] font-semibold tracking-tight">{heading}</h2></div><p className="hidden text-sm lg:text-[14px] text-muted-foreground sm:block">{posts.total} published pieces</p></div>{isLoading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : posts.items.length ? <div className="space-y-14 lg:space-y-16"><ArticleCard post={posts.items[0]} featured /><div className="grid gap-x-7 lg:gap-x-8 xl:gap-x-9 gap-y-12 lg:gap-y-14 border-t border-border pt-12 lg:pt-14 md:grid-cols-3">{posts.items.slice(1).map(post => <ArticleCard key={post.id} post={post} />)}</div><div className="mt-12 lg:mt-16 rounded-xl border border-border bg-[#fbfcfa] p-6 lg:p-7"><p className="font-label text-xs lg:text-[11px] text-primary">All guides — for readers and search engines</p><ul className="mt-3 lg:mt-4 space-y-2 lg:space-y-2.5 pl-0 list-none">{posts.items.map(p => <li key={p.id} className="flex items-start gap-2 text-sm lg:text-[14.5px]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><Link href={`/articles/${p.slug}`} className="font-medium text-primary hover:underline leading-6 lg:leading-7">{p.title}</Link>{p.excerpt && <span className="hidden text-muted-foreground lg:inline">— {p.excerpt.slice(0, 80)}…</span>}</li>)}</ul></div></div> : <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center"><p className="font-display text-2xl">There are no published stories here yet.</p><p className="mt-2 text-sm text-muted-foreground">Try a different search, explore another topic, or return soon.</p></div>}{posts.totalPages > 1 && <div className="mt-12 lg:mt-16 flex items-center justify-center gap-3"><Button variant="outline" className="lg:h-10 lg:px-5" disabled={page === 1} onClick={() => navigate({ page: page - 1 })}>Previous</Button><span className="text-sm text-muted-foreground">Page {page} of {posts.totalPages}</span><Button variant="outline" disabled={page === posts.totalPages} onClick={() => navigate({ page: page + 1 })}>Next</Button></div>}</>}</section>
    <section id="newsletter" className="bg-[#dce7d7]"><div className="container grid gap-8 lg:gap-12 xl:gap-16 py-14 md:py-20 lg:py-24 xl:py-28 md:grid-cols-[1fr_.8fr] md:items-end"><div><p className="font-label text-xs lg:text-[11px] text-primary">Stay with the good stuff</p><h2 className="mt-3 max-w-xl lg:max-w-[28rem] font-display text-4xl lg:text-[2.5rem] xl:text-[2.65rem] font-semibold tracking-tight lg:leading-[1.05]">A quiet note when there's something worth reading.</h2></div><div><form onSubmit={event => { event.preventDefault(); subscribe(); }} className="flex flex-col gap-3 sm:flex-row lg:gap-4"><div className="relative flex-1"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" className="h-11 lg:h-12 bg-white pl-10 lg:pl-11 shadow-sm" /></div><Button type="submit" disabled={submitting} className="h-11 lg:h-12 lg:px-6 gap-2 shadow-sm">{submitting ? "Joining…" : "Subscribe"}<MoveRight className="h-4 w-4" /></Button></form><p className="mt-3 lg:mt-4 text-xs lg:text-[13px] leading-5 lg:leading-6 text-muted-foreground">By subscribing, you acknowledge the handling of your email as described in our <Link href="/privacy" className="font-medium text-primary underline underline-offset-2 hover:decoration-primary">Privacy policy</Link>.</p></div></div></section>
  </>;
}
