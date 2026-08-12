import { ArticleCard, type ArticleCardPost } from "@/components/public/ArticleCard";
import { PublicShell, SearchField } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Mail, MoveRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

type HomepageSection = {
  id: string;
  title: string;
  section_type: "featured" | "latest" | "category" | "tag" | "custom";
  subtitle: string | null;
  rendered_html: string | null;
  posts: ArticleCardPost[];
};

function ConfiguredSections({ sections }: { sections: HomepageSection[] }) {
  return <div className="space-y-14">
    {sections.map(section => <section key={section.id} className="border-t border-border pt-10 first:border-t-0 first:pt-0">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="font-label text-xs text-primary">{section.section_type === "custom" ? "Editorial note" : "From the journal"}</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">{section.title}</h2>{section.subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{section.subtitle}</p>}</div>{section.posts.length > 0 && <span className="text-sm text-muted-foreground">{section.posts.length} stories</span>}</div>
      {section.section_type === "custom" ? <div className="article-prose rounded-2xl border border-[#d6e2d1] bg-[#f5f9f3] p-6" dangerouslySetInnerHTML={{ __html: section.rendered_html || "" }} /> : section.posts.length ? <div className="grid gap-x-7 gap-y-12 md:grid-cols-3">{section.posts.map((post, index) => <ArticleCard key={post.id} post={post} featured={index === 0 && section.posts.length === 1} />)}</div> : <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">No published stories in this section yet.</p>}
    </section>)}
  </div>;
}

export default function Home() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [email, setEmail] = useState("");
  const categories = trpc.blog.categories.useQuery();
  const posts = trpc.blog.list.useQuery({ page, query: search || undefined, category });
  const sections = trpc.blog.sections.useQuery();
  const subscribe = trpc.blog.subscribe.useMutation({
    onSuccess: () => { setEmail(""); toast.success("You are subscribed. Welcome to CodeReport Global."); },
    onError: error => toast.error(error.message),
  });
  const setTopic = (topic?: string) => { setCategory(topic); setPage(1); };
  const retry = () => { categories.refetch(); posts.refetch(); sections.refetch(); };
  const heading = search ? `Results for “${search}”` : category ? categories.data?.find(item => item.slug === category)?.name || "Selected stories" : "Latest stories";
  const showConfiguredSections = !search && !category && !sections.isError && Boolean(sections.data?.length);

  return <PublicShell>
    <section className="paper-grid border-b border-border"><div className="container grid gap-10 py-16 md:grid-cols-[1.1fr_.9fr] md:py-24"><div className="enter-fade"><p className="font-label text-xs text-primary">Independent ideas, clearly told</p><h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[.98] tracking-tight text-foreground sm:text-6xl lg:text-7xl">A journal for the<br /><em className="font-normal text-primary">longer look.</em></h1><p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">CodeReport Global is a living collection of lucid thinking about the systems, stories, and decisions shaping our shared world.</p><div className="mt-8 max-w-md"><SearchField value={search} onChange={value => { setSearch(value); setPage(1); }} /></div></div><div className="flex flex-col justify-end rounded-2xl border border-[#cbd8c5] bg-[#e4ece0]/80 p-7 shadow-[0_18px_40px_-32px_rgba(31,77,59,.55)]"><p className="font-label text-[10px] text-primary">The editorial note</p><p className="mt-5 font-display text-2xl leading-snug text-[#263c31]">We believe attention is a form of care. The best ideas have room to unfold.</p><div className="mt-8 flex items-center gap-3 border-t border-[#c6d4c2] pt-5"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-bold text-white">C</span><div><p className="text-sm font-semibold">The CodeReport Global team</p><p className="text-xs text-muted-foreground">Editors at large</p></div></div></div></div></section>
    <section id="topics" className="border-b border-border bg-white"><div className="container py-7"><div className="flex gap-2 overflow-x-auto pb-1"><Button size="sm" variant={!category ? "default" : "outline"} onClick={() => setTopic()} className="shrink-0 rounded-full">All stories</Button>{categories.data?.map(item => <Button key={item.id} size="sm" variant={category === item.slug ? "default" : "outline"} onClick={() => setTopic(item.slug)} className="shrink-0 rounded-full">{item.name}</Button>)}{categories.isError && <span className="ml-2 self-center text-xs text-destructive">Topics could not load.</span>}</div></div></section>
    <section className="container py-14 md:py-20">{showConfiguredSections ? <ConfiguredSections sections={(sections.data || []) as HomepageSection[]} /> : <><div className="mb-10 flex items-end justify-between gap-4"><div><p className="font-label text-xs text-primary">From the journal</p><h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">{heading}</h2></div><p className="hidden text-sm text-muted-foreground sm:block">{posts.data?.total ?? 0} published pieces</p></div>{posts.isLoading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : posts.isError ? <div className="rounded-2xl border border-dashed border-[#d7b8b2] bg-[#fffafa] px-6 py-16 text-center"><AlertCircle className="mx-auto h-7 w-7 text-destructive" /><p className="mt-4 font-display text-2xl">The journal could not load just now.</p><p className="mt-2 text-sm text-muted-foreground">Your search was not lost. Please try again in a moment.</p><Button variant="outline" className="mt-5 gap-2" onClick={retry}><RefreshCw className="h-4 w-4" />Try again</Button></div> : posts.data?.items.length ? <div className="space-y-14"><ArticleCard post={posts.data.items[0]} featured /><div className="grid gap-x-7 gap-y-12 border-t border-border pt-12 md:grid-cols-3">{posts.data.items.slice(1).map(post => <ArticleCard key={post.id} post={post} />)}</div></div> : <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center"><p className="font-display text-2xl">There are no published stories here yet.</p><p className="mt-2 text-sm text-muted-foreground">Try a different search, explore another topic, or return soon.</p></div>}{(posts.data?.totalPages ?? 0) > 1 && <div className="mt-12 flex items-center justify-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-sm text-muted-foreground">Page {page} of {posts.data?.totalPages}</span><Button variant="outline" disabled={page === posts.data?.totalPages} onClick={() => setPage(page + 1)}>Next</Button></div>}</>}</section>
    <section id="newsletter" className="bg-[#dce7d7]"><div className="container grid gap-8 py-14 md:grid-cols-[1fr_.8fr] md:items-end md:py-20"><div><p className="font-label text-xs text-primary">Stay with the good stuff</p><h2 className="mt-3 max-w-xl font-display text-4xl font-semibold tracking-tight">A quiet note when there’s something worth reading.</h2></div><div><form onSubmit={event => { event.preventDefault(); subscribe.mutate({ email }); }} className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" className="h-11 bg-white pl-10" /></div><Button type="submit" disabled={subscribe.isPending} className="h-11 gap-2">{subscribe.isPending ? "Joining…" : "Subscribe"}<MoveRight className="h-4 w-4" /></Button></form><p className="mt-3 text-xs leading-5 text-muted-foreground">By subscribing, you acknowledge the handling of your email as described in our <Link href="/privacy" className="font-medium text-primary underline underline-offset-2">Privacy policy</Link>.</p></div></div></section>
  </PublicShell>;
}
