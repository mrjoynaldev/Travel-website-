import { ArticleCard } from "@/public-site/components/ArticleCard";
import { ArticleMeta } from "@/public-site/components/ArticleMeta";
import { PublicShell } from "@/public-site/components/PublicShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Clock3, Loader2, MessageCircle, Send, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useRoute } from "wouter";

const dateLabel = (date: string | null) => date ? new Date(date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "Editorial draft";

export default function Article() {
  const [, params] = useRoute("/articles/:slug");
  const slug = params?.slug ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const article = trpc.blog.bySlug.useQuery({ slug }, { enabled: Boolean(slug) });
  const comments = trpc.blog.comments.useQuery({ postId: article.data?.post.id ?? "00000000-0000-0000-0000-000000000000" }, { enabled: Boolean(article.data?.post.id) });
  const submit = trpc.blog.submitComment.useMutation({ onSuccess: () => { setBody(""); toast.success("Comment submitted for moderation."); comments.refetch(); }, onError: error => toast.error(error.message) });
  const track = trpc.blog.track.useMutation();
  const post = article.data?.post;
  useEffect(() => { if (post) track.mutate({ postId: post.id, eventType: "article_view", referrerHost: document.referrer ? new URL(document.referrer).hostname : undefined }); }, [post?.id]);
  const readingTime = useMemo(() => Math.max(3, Math.ceil((post?.rendered_html.replace(/<[^>]*>/g, " ").split(/\s+/).length ?? 180) / 220)), [post?.rendered_html]);
  if (article.isLoading) return <PublicShell><div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div></PublicShell>;
  if (!post || !article.data) return <PublicShell><div className="container py-24 text-center"><p className="font-display text-4xl">This story could not be found.</p><Link href="/" className="mt-5 inline-block text-primary underline">Return to the journal</Link></div></PublicShell>;
  const authorInitials = post.author?.display_name.split(" ").map((part: string) => part[0]).join("").slice(0, 2) || "F";
  return <PublicShell>
    <ArticleMeta post={post} />
    <article>
      <header className="border-b border-border bg-[#e8ede6]"><div className="container max-w-4xl py-12 md:py-20"><Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" />All stories</Link><div className="mt-8 flex flex-wrap items-center gap-2">{post.categories?.map((category: any) => <span key={category.id} className="font-label text-[10px] text-primary">{category.name}</span>)}</div><h1 className="mt-4 font-display text-4xl font-semibold leading-[1.03] tracking-tight sm:text-5xl lg:text-6xl">{post.title}</h1>{post.excerpt && <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{post.excerpt}</p>}<div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-muted-foreground"><span>{dateLabel(post.published_at)}</span><span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{readingTime} min read</span><Button variant="ghost" size="sm" className="h-auto gap-2 p-0 text-primary" onClick={() => navigator.share ? navigator.share({ title: post.title, url: window.location.href }) : navigator.clipboard.writeText(window.location.href).then(() => toast.success("Link copied"))}><Share2 className="h-4 w-4" />Share</Button></div></div></header>
      <div className="container grid max-w-6xl gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_220px]"><div>{post.featuredMedia && <figure className="mb-10"><img src={post.featuredMedia.url} alt={post.featuredMedia.alt_text || ""} className="aspect-[16/9] w-full rounded-2xl object-cover" />{post.featuredMedia.caption && <figcaption className="mt-2 text-xs text-muted-foreground">{post.featuredMedia.caption}</figcaption>}</figure>}<div className="article-prose" dangerouslySetInnerHTML={{ __html: post.rendered_html }} /><div className="mt-12 flex flex-wrap gap-2 border-t border-border pt-7">{post.tags?.map((tag: any) => <span key={tag.id} className="rounded-full border border-border bg-white px-3 py-1 text-xs text-muted-foreground">#{tag.name}</span>)}</div><section className="mt-14 rounded-2xl bg-white p-6 shadow-sm"><div className="flex gap-4"><Avatar className="h-12 w-12"><AvatarFallback className="bg-primary text-primary-foreground">{authorInitials}</AvatarFallback></Avatar><div><p className="text-sm font-semibold">Written by {post.author?.display_name || "Fieldnote editorial"}</p>{post.author?.bio && <p className="mt-1 text-sm leading-6 text-muted-foreground">{post.author.bio}</p>}</div></div></section></div><aside className="h-fit border-l border-border pl-6"><p className="font-label text-[10px] text-primary">In this story</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Take your time. This piece is designed to be read, not skimmed.</p></aside></div>
    </article>
    <section className="border-t border-border bg-white"><div className="container max-w-4xl py-14"><div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /><h2 className="font-display text-3xl font-semibold">Reader conversation</h2></div><p className="mt-2 text-sm text-muted-foreground">Comments are reviewed before publication to keep the conversation useful.</p><form className="mt-7 grid gap-3 rounded-xl border border-border bg-[#f8faf6] p-5" onSubmit={event => { event.preventDefault(); submit.mutate({ postId: post.id, authorName: name, email, body }); }}><div className="grid gap-3 sm:grid-cols-2"><Input required value={name} onChange={event => setName(event.target.value)} placeholder="Your name" /><Input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" /></div><Textarea required value={body} onChange={event => setBody(event.target.value)} placeholder="Join the conversation" rows={4} /><div><Button type="submit" disabled={submit.isPending} className="gap-2">Submit for review <Send className="h-4 w-4" /></Button></div><p className="text-xs leading-5 text-muted-foreground">By submitting, you acknowledge the handling of your details under our <Link href="/privacy" className="font-medium text-primary underline underline-offset-2">Privacy policy</Link>.</p></form><div className="mt-8 space-y-5">{comments.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : comments.data?.length ? comments.data.map(comment => <div key={comment.id} className="border-b border-border pb-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{comment.author_name}</p><time className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</time></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{comment.body}</p></div>) : <p className="py-5 text-sm text-muted-foreground">No approved comments yet. You can start the conversation.</p>}</div></div></section>
    {article.data.related.length > 0 && <section className="container py-14"><p className="font-label text-xs text-primary">Continue reading</p><h2 className="mt-2 font-display text-4xl font-semibold">More from the journal</h2><div className="mt-8 grid gap-7 md:grid-cols-3">{article.data.related.map(item => <ArticleCard key={item.id} post={item} />)}</div></section>}
  </PublicShell>;
}
