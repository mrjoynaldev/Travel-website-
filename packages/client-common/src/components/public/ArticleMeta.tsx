import { useEffect } from "react";

type ArticleMetaProps = {
  post: { title: string; slug: string; excerpt: string | null; meta_title: string | null; meta_description: string | null; canonical_url: string | null; og_image_url: string | null; featuredMedia?: { url: string } | null };
};

const setMeta = (selector: string, attributes: Record<string, string>, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) { element = document.createElement("meta"); Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value)); document.head.appendChild(element); }
  element.content = content;
};

export function ArticleMeta({ post }: ArticleMetaProps) {
  useEffect(() => {
    const title = post.meta_title?.trim() || `${post.title} · Fieldnote`;
    const description = post.meta_description?.trim() || post.excerpt?.trim() || "A Fieldnote article.";
    const canonical = post.canonical_url?.trim() || `${window.location.origin}/articles/${post.slug}`;
    const image = post.og_image_url?.trim() || post.featuredMedia?.url;
    document.title = title;
    setMeta('meta[name="description"]', { name: "description" }, description);
    setMeta('meta[property="og:title"]', { property: "og:title" }, title);
    setMeta('meta[property="og:description"]', { property: "og:description" }, description);
    setMeta('meta[property="og:type"]', { property: "og:type" }, "article");
    setMeta('meta[property="og:url"]', { property: "og:url" }, canonical);
    if (image) setMeta('meta[property="og:image"]', { property: "og:image" }, image);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;
  }, [post]);
  return null;
}
