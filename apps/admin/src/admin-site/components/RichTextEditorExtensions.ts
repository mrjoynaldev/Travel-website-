import { Node, mergeAttributes } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

// Register the common language pack (javascript, python, bash, sql, etc.).
const lowlight = createLowlight(common);

export const CodeBlock = CodeBlockLowlight.configure({ lowlight });

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|svg|avif)(\?.*)?$/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|oga|m4a|aac|webm|flac)(\?.*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|ogv|mov|m4v)(\?.*)?$/i;
const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/;
const VIMEO_RE = /vimeo\.com\/(\d+)/;

export type PastedUrlKind = "video" | "audio" | "image" | "link";

export function classifyPastedUrl(url: string): PastedUrlKind {
  if (YOUTUBE_RE.test(url) || VIMEO_RE.test(url) || VIDEO_EXT.test(url))
    return "video";
  if (AUDIO_EXT.test(url)) return "audio";
  if (IMAGE_EXT.test(url)) return "image";
  return "link";
}

export function youtubeIdFromUrl(url: string) {
  const match = url.match(YOUTUBE_RE);
  return match ? match[1] : null;
}

export function audioMimeFromUrl(url: string) {
  const ext = url.replace(/[?#].*$/, "").split(".").pop()?.toLowerCase();
  switch (ext) {
    case "wav":
      return "audio/wav";
    case "ogg":
    case "oga":
      return "audio/ogg";
    case "m4a":
    case "aac":
      return "audio/mp4";
    case "webm":
      return "audio/webm";
    case "flac":
      return "audio/flac";
    default:
      return "audio/mpeg";
  }
}

/**
 * Inline audio player. The canonical source is a durable https media URL;
 * the `type` attribute helps the browser pick the right decoder.
 */
export const Audio = Node.create({
  name: "audio",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      type: { default: "audio/mpeg" },
    };
  },
  parseHTML() {
    return [{ tag: "audio" }];
  },
  renderHTML({ HTMLAttributes }) {
    const { src, type } = HTMLAttributes as { src: string; type: string };
    return [
      "audio",
      mergeAttributes({ controls: "true", preload: "metadata" }),
      ["source", { src, type }],
    ];
  },
});

/**
 * Inline video player for direct .mp4/.webm sources (non-YouTube).
 * YouTube/Vimeo use the Youtube extension; this node handles raw files.
 */
export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: undefined },
      poster: { default: undefined },
    };
  },
  parseHTML() {
    return [{ tag: "video" }];
  },
  renderHTML({ HTMLAttributes }) {
    const { src, poster } = HTMLAttributes as {
      src: string;
      type: string;
      poster: string;
    };
    const attrs: Record<string, string> = { controls: "true", preload: "metadata" };
    if (poster) attrs.poster = poster;
    return ["video", attrs, ["source", { src }]];
  },
});

type CtaAttrs = { href: string; text: string; variant: "primary" | "secondary" };

/**
 * Call-to-action button rendered as a styled anchor. Using an <a> keeps the
 * block crawlable, keyboard-accessible, and safe — no script execution.
 */
export const CTAButton = Node.create({
  name: "ctaButton",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      href: { default: "#", renderHTML: () => ({}) },
      text: { default: "Learn more", renderHTML: () => ({}) },
      variant: { default: "primary", renderHTML: () => ({}) },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'a[class~="cta-button"]',
        getAttrs: (el) => {
          const elem = el as HTMLElement;
          const variant = elem.classList.contains("cta-secondary") ? "secondary" : "primary";
          return {
            href: elem.getAttribute("href") || "#",
            text: elem.textContent || "Learn more",
            variant,
          };
        },
      },
    ];
  },
  renderHTML({ node }) {
    const { href, text, variant } = node.attrs as CtaAttrs;
    return [
      "a",
      {
        class: `cta-button cta-${variant}`,
        href,
        target: "_blank",
        rel: "noopener noreferrer",
      },
      text,
    ];
  },
});
