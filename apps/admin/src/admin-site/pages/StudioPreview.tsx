"use client";

import { ArticleMeta } from "@/components/public/ArticleMeta";
import { PublicShell } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouteId } from "@/admin-site/lib/useRouteId";
import { trpc } from "@/lib/trpc";

export default function StudioPreview() {
  const id = useRouteId() ?? "";
  const query = trpc.studio.posts.get.useQuery({ id }, { enabled: Boolean(id) });

  if (query.isLoading) return <PublicShell><div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div></PublicShell>;
  if (!query.data) return <PublicShell><div className="container py-24 text-center"><p className="font-display text-4xl">This preview is unavailable.</p><Link href="/studio/posts" className="mt-5 inline-block text-primary underline">Return to posts</Link></div></PublicShell>;

  const post = query.data;
  return <PublicShell>
    <ArticleMeta post={post} />
    <div className="border-b border-[#e4b565] bg-[#fff3d8]"><div className="container flex flex-wrap items-center justify-between gap-3 py-3"><p className="flex items-center gap-2 text-sm font-medium text-[#6c4b0d]"><Eye className="h-4 w-4" />Authenticated preview — this {post.status} post is not publicly visible.</p><Link href={`/studio/posts/${post.id}`}><Button size="sm" variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Return to editor</Button></Link></div></div>
    <article><header className="border-b border-border bg-[#e8ede6]"><div className="container max-w-4xl py-14 md:py-20"><p className="font-label text-[10px] text-primary">Manuscript preview</p><h1 className="mt-4 font-display text-5xl font-semibold leading-[1.03] tracking-tight md:text-6xl">{post.title}</h1>{post.excerpt && <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{post.excerpt}</p>}</div></header><div className="container max-w-3xl py-12"><div className="article-prose" dangerouslySetInnerHTML={{ __html: post.rendered_html }} /></div></article>
  </PublicShell>;
}
