"use client";

import { ArticleCard, type ArticleCardPost } from "@/components/public/ArticleCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock3, MessageCircle, Phone, Send, Share2 } from "lucide-react";
import { WhatsAppIcon } from "@web/components/icons/WhatsAppIcon";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { businessConfig, buildWhatsAppUrl } from "@web/lib/business";
import { enhanceArticleHtml } from "@web/lib/articleHtml";
import { optimizedImageUrl } from "@web/lib/social-image";
import { toast } from "sonner";
import { trpcClient } from "@web/lib/trpc-client";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string | null;
  updated_at: string | null;
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

export default function ArticleView({ post, related, comments: initialComments, slug }: { post: Post; related?: ArticleCardPost[]; comments: Comment[]; slug: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [submitting, setSubmitting] = useState(false);

  const getSessionHash = (): string | undefined => {
    try {
      const existing = localStorage.getItem("sy_sid");
      if (existing) return existing;
      const sid = (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("sy_sid", sid);
      return sid;
    } catch { return undefined; }
  };
  const isAdminView = () => {
    try {
      return !!localStorage.getItem("sy_token") || !!localStorage.getItem("sy_admin") || document.cookie.includes("admin") || window.location.search.includes("preview") || (document.referrer && new URL(document.referrer).pathname.startsWith("/studio"));
    } catch { return false; }
  };

  useEffect(() => {
    const sid = getSessionHash();
    const admin = isAdminView();
    if (admin) return;
    trpcClient.blog.track.mutate({ postId: post.id, eventType: "article_view", sessionHash: sid, referrerHost: document.referrer ? new URL(document.referrer).hostname : undefined, properties: { is_admin: admin } }).catch(() => undefined);
  }, [post.id]);

  const engagementFlags = useRef({ depth75: false, complete: false });

  useEffect(() => {
    const sid = getSessionHash();
    if (isAdminView()) return;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const ratio = Math.min(1, Math.max(0, window.scrollY / max));
      if (!engagementFlags.current.depth75 && ratio >= 0.75) {
        engagementFlags.current.depth75 = true;
        trpcClient.blog.track.mutate({ postId: post.id, eventType: "scroll_depth", sessionHash: sid, properties: { depth_percent: 75, is_admin: false } }).catch(() => undefined);
      }
      if (!engagementFlags.current.complete && ratio >= 0.95) {
        engagementFlags.current.complete = true;
        trpcClient.blog.track.mutate({ postId: post.id, eventType: "reading_complete", sessionHash: sid, properties: { depth_percent: 100, is_admin: false } }).catch(() => undefined);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [post.id]);

  useEffect(() => {
    if (isAdminView()) return;
    const sid = getSessionHash();
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".gravity-code-copy")) {
        const block = target.closest<HTMLElement>(".gravity-code");
        trpcClient.blog.track.mutate({ postId: post.id, eventType: "code_copy", sessionHash: sid, properties: { lang: block?.dataset.lang ?? null, is_admin: false } }).catch(() => undefined);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [post.id]);

  const readingTime = useMemo(() => Math.max(3, Math.ceil((post.rendered_html.replace(/<[^>]*>/g, " ").split(/\s+/).length ?? 180) / 220)), [post.rendered_html]);
  // Related/Also-read fallback links are injected server-side
  // (injectRelatedLinks in page.tsx) so crawlers and no-JS readers see real
  // <a href> links in the SSR HTML. Client only enhances code blocks here.
  const bodyHtml = useMemo(() => enhanceArticleHtml(post.rendered_html), [post.rendered_html]);

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
      <div className="container max-w-3xl lg:max-w-[760px] pt-10 md:pt-14 lg:pt-16 xl:pt-20"><Link href="/" className="inline-flex items-center gap-2 text-sm lg:text-[14px] font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" />All guides</Link><div className="mt-8 lg:mt-10 flex flex-wrap items-center gap-2">{post.categories.map(category => <span key={category.id} className="font-label text-[10px] lg:text-[11px] text-primary">{category.name}</span>)}</div><h1 className="mt-3 lg:mt-4 font-display text-3xl font-semibold leading-[1.1] lg:leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl xl:text-[3.1rem]">{post.title}</h1>{post.excerpt && <p className="mt-5 lg:mt-6 max-w-2xl lg:max-w-[42rem] text-base lg:text-[18px] leading-7 lg:leading-8 text-muted-foreground sm:text-lg sm:leading-8">{post.excerpt}</p>}<div className="mt-6 lg:mt-8 flex flex-wrap items-center gap-x-2 lg:gap-x-3 gap-y-1 text-sm lg:text-[14.5px] text-muted-foreground"><span>{dateLabel(post.published_at)}</span>{post.updated_at && post.published_at && new Date(post.updated_at).getTime() - new Date(post.published_at).getTime() > 86400000 ? <span>· Updated {dateLabel(post.updated_at)}</span> : null}<span aria-hidden="true">•</span><span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{readingTime} min read</span><span aria-hidden="true">•</span><Button variant="ghost" size="sm" className="h-auto gap-2 p-0 text-primary lg:text-[14.5px]" onClick={share}><Share2 className="h-4 w-4" />Share</Button></div></div>
      <div className="container max-w-3xl lg:max-w-[760px] pb-4 lg:pb-8">{post.featuredMedia && <figure className="mb-10 lg:mb-12"><img src={optimizedImageUrl(post.featuredMedia.url, 1200, 675) || post.featuredMedia.url} alt={post.featuredMedia.alt_text || post.title} className="aspect-[16/9] w-full rounded-2xl lg:rounded-[1.5rem] object-cover shadow-sm lg:shadow-md" width={1200} height={675} fetchPriority="high" />{post.featuredMedia.caption && <figcaption className="mt-2 lg:mt-3 text-xs lg:text-[13px] text-muted-foreground">{post.featuredMedia.caption}</figcaption>}</figure>}<div className="article-prose lg:pt-2" dangerouslySetInnerHTML={{ __html: bodyHtml }} /><div className="mt-12 lg:mt-16 flex flex-wrap gap-2 lg:gap-2.5 border-t border-border pt-7 lg:pt-8">{post.tags.map(tag => <span key={tag.id} className="rounded-full border border-border bg-white px-3 lg:px-3.5 py-1 lg:py-1.5 text-xs lg:text-[13px] text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors">#{tag.name}</span>)}</div><section className="mt-10 lg:mt-12 rounded-[20px] border border-border bg-[#eff4ee] p-6 lg:p-8"><p className="font-label text-[11px] text-primary">Plan this trip</p><h3 className="mt-2 font-display text-xl lg:text-2xl font-semibold tracking-tight">Visiting the Sundarbans soon?</h3><p className="mt-2 text-sm lg:text-[15px] leading-7 text-muted-foreground">One call sorts it — dates, safari slot, stay. Talk to a human, fastest.</p><div className="mt-5 grid gap-2.5 sm:grid-cols-2"><a href={`tel:${businessConfig.phone}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-[#0f4532] transition-colors"><Phone className="h-4 w-4" /> Call {businessConfig.phoneDisplay}</a><a href={buildWhatsAppUrl("Hello Sundarban Yatri, I read your guide and want to plan a trip. Please share tour options.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1fa855] px-5 py-3 text-sm font-semibold text-white hover:bg-[#178a45] transition-colors"><WhatsAppIcon className="h-4 w-4" /> WhatsApp Us</a></div><p className="mt-3 text-xs text-muted-foreground">Outside India? <Link href="/hire" className="font-semibold text-primary hover:underline">Send an enquiry form →</Link></p></section><section className="mt-14 lg:mt-16 rounded-2xl bg-white p-6 lg:p-7 shadow-sm lg:shadow-md border lg:border-border"><div className="flex gap-4 lg:gap-5"><Avatar className="h-12 w-12 lg:h-14 lg:w-14"><AvatarFallback className="bg-primary text-primary-foreground">{authorInitials}</AvatarFallback></Avatar><div>{post.author ? <Link href={`/authors/${post.author.id}`} className="text-sm lg:text-[15px] font-semibold hover:underline">Written by {post.author.display_name}</Link> : <p className="text-sm lg:text-[15px] font-semibold">Written by Sundarban Yatri editorial</p>}{post.author?.bio && <p className="mt-1 text-sm lg:text-[15px] leading-6 lg:leading-7 text-muted-foreground">{post.author.bio}</p>}</div></div></section></div>
    </article>
    <section className="border-t border-border bg-white"><div className="container max-w-3xl lg:max-w-[760px] py-14 lg:py-16 xl:py-20"><div className="flex items-center gap-2 lg:gap-3"><MessageCircle className="h-5 w-5 lg:h-6 lg:w-6 text-primary" /><h2 className="font-display text-2xl lg:text-[1.65rem] font-semibold">Reader conversation</h2></div><p className="mt-2 text-sm lg:text-[15px] leading-6 text-muted-foreground">Comments are reviewed before publication to keep the conversation useful.</p><form className="mt-7 lg:mt-8 grid gap-3 lg:gap-4 rounded-xl border border-border bg-[#f8faf6] p-5 lg:p-6" onSubmit={event => { event.preventDefault(); submitComment(); }}><div className="grid gap-3 sm:grid-cols-2"><Input required value={name} onChange={event => setName(event.target.value)} placeholder="Your name" className="lg:h-11" /><Input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" className="lg:h-11" /></div><Textarea required value={body} onChange={event => setBody(event.target.value)} placeholder="Join the conversation" rows={4} className="lg:text-[15px]" /><div><Button type="submit" disabled={submitting} className="gap-2 lg:h-11 lg:px-5">{submitting ? "Submitting…" : "Submit for review"} <Send className="h-4 w-4" /></Button></div><p className="text-xs lg:text-[13px] leading-5 lg:leading-6 text-muted-foreground">By submitting, you acknowledge the handling of your details under our <Link href="/privacy" className="font-medium text-primary underline underline-offset-2">Privacy policy</Link>.</p></form><div className="mt-8 lg:mt-10 space-y-5 lg:space-y-6">{comments.length ? comments.map(comment => <div key={comment.id} className="border-b border-border pb-5 lg:pb-6"><div className="flex items-center justify-between"><p className="text-sm lg:text-[15px] font-semibold">{comment.author_name}</p><time className="text-xs lg:text-[13px] text-muted-foreground">{new Date(comment.created_at).toLocaleDateString("en-US", { timeZone: "UTC" })}</time></div><p className="mt-2 text-sm lg:text-[15px] leading-6 lg:leading-7 text-muted-foreground">{comment.body}</p></div>) : <p className="py-5 text-sm lg:text-[15px] text-muted-foreground">No approved comments yet. You can be the first to join the conversation.</p>}</div></div></section>
    {(related ?? []).length > 0 && <section className="container max-w-6xl xl:max-w-[1320px] py-14 lg:py-16 xl:py-20"><p className="font-label text-xs lg:text-[11px] text-primary">Continue reading</p><h2 className="mt-2 font-display text-3xl lg:text-[2rem] xl:text-[2.2rem] font-semibold">More Sundarban guides</h2><div className="mt-8 lg:mt-10 grid gap-7 lg:gap-8 xl:gap-9 md:grid-cols-3">{(related ?? []).map(item => <ArticleCard key={item.id} post={item} />)}</div></section>}
  </>;
}
