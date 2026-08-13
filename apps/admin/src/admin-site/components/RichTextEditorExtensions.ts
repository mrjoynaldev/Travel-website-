import { Node, mergeAttributes } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

// Register the common language pack (javascript, python, bash, sql, etc.).
const lowlight = createLowlight(common);

export const CodeBlock = CodeBlockLowlight.configure({ lowlight });

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
