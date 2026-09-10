import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard, type ArticleCardPost } from "@/components/public/ArticleCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { serverTrpc } from "@web/lib/trpc-server";

export const revalidate = 300;

type Props = { params: Promise<{ authorId: string }> };

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatri.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { authorId } = await params;
  try {
    const { author } = await serverTrpc.blog.author.query({ authorId });
    const title = `${author.display_name} — Sundarban Yatri`;
    return {
      title,
      description: author.bio?.trim() || undefined,
      alternates: { canonical: `/authors/${authorId}` },
      openGraph: { type: "profile", siteName: "Sundarban Yatri", locale: "en_US", url: `${siteUrl()}/authors/${authorId}`, title, images: [{ url: `${siteUrl()}/og-default.png`, width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image", images: [`${siteUrl()}/og-default.png`], title },
    };
  } catch {
    return {};
  }
}

export async function generateStaticParams() {
  const { getAllPublishedRefs } = await import("@web/lib/catalogue");
  const { authorIds } = await getAllPublishedRefs();
  return authorIds.length ? authorIds.map(authorId => ({ authorId })) : [{ authorId: "00000000-0000-0000-0000-000000000000" }];
}

export default async function AuthorPage({ params }: Props) {
  const { authorId } = await params;
  let author: { id: string; display_name: string; bio: string | null; avatar_url: string | null; website_url: string | null };
  let posts: ArticleCardPost[] = [];
  try {
    const result = await serverTrpc.blog.author.query({ authorId });
    author = result.author;
    posts = result.posts;
  } catch {
    notFound();
  }
  const initials = author.display_name.split(" ").map((part: string) => part[0]).join("").slice(0, 2);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatri.com";
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/authors/${author.id}#person`,
    name: author.display_name,
    url: `${siteUrl}/authors/${author.id}`,
    image: author.avatar_url || undefined,
    description: author.bio || undefined,
    mainEntityOfPage: `${siteUrl}/authors/${author.id}`,
    ...(author.website_url ? { sameAs: [author.website_url] } : {}),
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
    <section className="border-b border-border bg-[#e8ede6]"><div className="container max-w-5xl py-16 md:py-20"><div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center"><Avatar className="h-20 w-20"><AvatarFallback className="bg-primary text-xl text-primary-foreground">{initials}</AvatarFallback></Avatar><div><p className="font-label text-[10px] text-primary">Local expert & contributor</p><h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">{author.display_name}</h1>{author.bio && <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{author.bio}</p>}{author.website_url && <a href={author.website_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-medium text-primary underline">Visit website</a>}</div></div></div></section>
    <section className="container py-14"><p className="font-label text-xs text-primary">Published guides</p><h2 className="mt-2 font-display text-4xl font-semibold">Guides by {author.display_name}</h2>{posts.length ? <div className="mt-10 grid gap-x-7 gap-y-12 md:grid-cols-3">{posts.map(post => <ArticleCard key={post.id} post={post} />)}</div> : <p className="mt-8 text-sm text-muted-foreground">No published guides from this author yet.</p>}</section>
  </>;
}
