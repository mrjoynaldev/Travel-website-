"use client";

import { ArticleCard, type ArticleCardPost } from "@/components/public/ArticleCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock3, MessageCircle, Send, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trpcClient } from "@web/lib/trpc-client";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string | null;
  rendered_html: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  author: { id: string; display_name: string; bio: string | null } | null;
  featuredMedia: { url: string; alt_text: string | null; caption: string | null } | null;
  categories: Array<{ id: string; name: string; slug: string }>;
  tags: Array<{ id: string; name: string; slug: string }>;
};

type Comment = { id: string; parent_id: string | null; author_name: string; body: string; created_at: string };

const dateLabel = (date: string | null) => date ? new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "Editorial draft";

export default function ArticleView({ post, related, comments: initialComments, slug }: { post: Post; related: ArticleCardPost[]; comments: Comment[]; slug: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    trpcClient.blog.track.mutate({ postId: post.id, eventType: "article_view", referrerHost: document.referrer ? new URL(document.referrer).hostname : undefined }).catch(() => undefined);
  }, [post.id]);

  const readingTime = useMemo(() => Math.max(3, Math.ceil((post.rendered_html.replace(/<[^>]*>/g, " ").split(/\s+/).length ?? 180) / 220)), [post.rendered_html]);

  const submitComment = async () => {
    if (!name.trim() || !email.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      await trpcClient.blog.submitComment.mutate({ postId: post.id, authorName: name.trim(), email: email.trim(), body: body.trim() });
      setBody("");
      toast.success("Comment submitted for moderation.");
      const updated = await trpcClient.blog.comments.query({ postId: post.id });
      setComments(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Your comment could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  const share = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: post.title, url }).catch(() => undefined);
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success("Link copied"));
    }
  };

  const authorInitials = post.author?.display_name.split(" ").map((part: string) => part[0]).join("").slice(0, 2) || "F";

  return <>
    <article>
      <div className="container max-w-3xl pt-10 md:pt-14"><Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" />All stories</Link><div className="mt-8 flex flex-wrap items-center gap-2">{post.categories.map(category => <span key={category.id} className="font-label text-[10px] text-primary">{category.name}</span>)}</div><h1 className="mt-3 font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">{post.title}</h1>{post.excerpt && <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">{post.excerpt}</p>}<div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"><span>{dateLabel(post.published_at)}</span><span aria-hidden="true">•</span><span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{readingTime} min read</span><span aria-hidden="true">•</span><Button variant="ghost" size="sm" className="h-auto gap-2 p-0 text-primary" onClick={share}><Share2 className="h-4 w-4" />Share</Button></div></div>
      <div className="container max-w-3xl pb-4">{post.featuredMedia && <figure className="mb-10"><img src={post.featuredMedia.url} alt={post.featuredMedia.alt_text || ""} className="aspect-[16/9] w-full rounded-2xl object-cover" />{post.featuredMedia.caption && <figcaption className="mt-2 text-xs text-muted-foreground">{post.featuredMedia.caption}</figcaption>}</figure>}<div className="article-prose" dangerouslySetInnerHTML={{ __html: post.rendered_html }} /><div className="mt-12 flex flex-wrap gap-2 border-t border-border pt-7">{post.tags.map(tag => <span key={tag.id} className="rounded-full border border-border bg-white px-3 py-1 text-xs text-muted-foreground">#{tag.name}</span>)}</div><section className="mt-14 rounded-2xl bg-white p-6 shadow-sm"><div className="flex gap-4"><Avatar className="h-12 w-12"><AvatarFallback className="bg-primary text-primary-foreground">{authorInitials}</AvatarFallback></Avatar><div><p className="text-sm font-semibold">Written by {post.author?.display_name || "CodeReport Global editorial"}</p>{post.author?.bio && <p className="mt-1 text-sm leading-6 text-muted-foreground">{post.author.bio}</p>}</div></div></section></div>
    </article>
    <section className="border-t border-border bg-white"><div className="container max-w-3xl py-14"><div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /><h2 className="font-display text-2xl font-semibold">Reader conversation</h2></div><p className="mt-2 text-sm text-muted-foreground">Comments are reviewed before publication to keep the conversation useful.</p><form className="mt-7 grid gap-3 rounded-xl border border-border bg-[#f8faf6] p-5" onSubmit={event => { event.preventDefault(); submitComment(); }}><div className="grid gap-3 sm:grid-cols-2"><Input required value={name} onChange={event => setName(event.target.value)} placeholder="Your name" /><Input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" /></div><Textarea required value={body} onChange={event => setBody(event.target.value)} placeholder="Join the conversation" rows={4} /><div><Button type="submit" disabled={submitting} className="gap-2">{submitting ? "Submitting…" : "Submit for review"} <Send className="h-4 w-4" /></Button></div><p className="text-xs leading-5 text-muted-foreground">By submitting, you acknowledge the handling of your details under our <Link href="/privacy" className="font-medium text-primary underline underline-offset-2">Privacy policy</Link>.</p></form><div className="mt-8 space-y-5">{comments.length ? comments.map(comment => <div key={comment.id} className="border-b border-border pb-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{comment.author_name}</p><time className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString("en-US", { timeZone: "UTC" })}</time></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{comment.body}</p></div>) : <p className="py-5 text-sm text-muted-foreground">No approved comments yet. You can be the first to join the conversation.</p>}</div></div></section>
    {related.length > 0 && <section className="container max-w-6xl py-14"><p className="font-label text-xs text-primary">Continue reading</p><h2 className="mt-2 font-display text-3xl font-semibold">More from the journal</h2><div className="mt-8 grid gap-7 md:grid-cols-3">{related.map(item => <ArticleCard key={item.id} post={item} />)}</div></section>}
  </>;
}
