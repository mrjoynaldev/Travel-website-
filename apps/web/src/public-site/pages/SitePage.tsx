import { PublicShell } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, FileWarning, Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useEffect } from "react";

export default function SitePage() {
  const [, params] = useRoute("/:slug");
  const slug = params?.slug || "";
  const { data, isLoading, error } = trpc.blog.pageBySlug.useQuery({ slug }, { enabled: Boolean(slug) });
  useEffect(() => { if (data) document.title = data.meta_title || `${data.title} · Fieldnote`; }, [data]);
  return <PublicShell><section className="border-b border-border bg-[#edf3ee]"><div className="container max-w-4xl py-14 md:py-20"><p className="font-label text-xs text-primary">PUBLICATION PAGE</p><h1 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-6xl">{isLoading ? "Loading page" : data?.title || "Page unavailable"}</h1></div></section><section className="container max-w-4xl py-12 md:py-16">{isLoading ? <div className="flex items-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading this page…</div> : error || !data ? <div className="rounded-2xl border border-border bg-card p-8 text-center"><FileWarning className="mx-auto h-9 w-9 text-primary" /><h2 className="mt-4 font-display text-2xl font-semibold">This page is not available</h2><p className="mt-2 text-muted-foreground">The requested publication page may have moved or is not currently published.</p><Link href="/"><Button className="mt-6 gap-2"><ArrowLeft className="h-4 w-4" />Return home</Button></Link></div> : <article className="prose prose-stone max-w-none prose-headings:font-display prose-a:text-primary prose-img:rounded-xl" dangerouslySetInnerHTML={{ __html: data.rendered_html }} />}</section></PublicShell>;
}
