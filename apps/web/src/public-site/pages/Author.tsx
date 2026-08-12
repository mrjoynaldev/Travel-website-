import { ArticleCard } from "@/components/public/ArticleCard";
import { PublicShell } from "@/components/public/PublicShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Author() {
  const [, params] = useRoute("/authors/:authorId"); const authorId = params?.authorId ?? "";
  const query = trpc.blog.author.useQuery({ authorId }, { enabled: Boolean(authorId) });
  if (query.isLoading) return <PublicShell><div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div></PublicShell>;
  if (!query.data) return <PublicShell><div className="container py-24 text-center"><p className="font-display text-4xl">This author profile could not be found.</p><Link href="/" className="mt-5 inline-block text-primary underline">Return to the journal</Link></div></PublicShell>;
  const { author, posts } = query.data; const initials = author.display_name.split(" ").map((part: string) => part[0]).join("").slice(0, 2);
  return <PublicShell><section className="border-b border-border bg-[#e8ede6]"><div className="container max-w-5xl py-16 md:py-20"><div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center"><Avatar className="h-20 w-20"><AvatarFallback className="bg-primary text-xl text-primary-foreground">{initials}</AvatarFallback></Avatar><div><p className="font-label text-[10px] text-primary">Contributor</p><h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">{author.display_name}</h1>{author.bio && <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{author.bio}</p>}{author.website_url && <a href={author.website_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-medium text-primary underline">Visit website</a>}</div></div></div></section><section className="container py-14"><p className="font-label text-xs text-primary">Published work</p><h2 className="mt-2 font-display text-4xl font-semibold">Stories by {author.display_name}</h2>{posts.length ? <div className="mt-10 grid gap-x-7 gap-y-12 md:grid-cols-3">{posts.map(post => <ArticleCard key={post.id} post={post} />)}</div> : <p className="mt-8 text-sm text-muted-foreground">No published stories from this author yet.</p>}</section></PublicShell>;
}
