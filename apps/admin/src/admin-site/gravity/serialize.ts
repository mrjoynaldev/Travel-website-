import { uid, type GravityBlock, type GravityDoc, type GravitySection, type TextRun } from "./types";
import { CANVAS_WIDTH } from "./templates";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function youtubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([\w-]{6,})/);
  return match ? match[1] : null;
}

function videoEmbed(url: string) {
  const youtube = youtubeId(url);
  if (youtube) return `<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${youtube}" title="Embedded video" frameborder="0" allowfullscreen></iframe>`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `<iframe src="https://player.vimeo.com/video/${vimeo[1]}" title="Embedded video" frameborder="0" allowfullscreen></iframe>`;
  return `<video controls preload="metadata"><source src="${escapeHtml(url)}"></video>`;
}

function audioEmbed(url: string) {
  const id = youtubeId(url);
  if (id) return `<iframe class="gravity-audio-youtube" src="https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1" title="Audio" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  return `<audio controls preload="metadata" src="${escapeHtml(url)}">Your browser does not support audio playback.</audio>`;
}

const wrapLink = (html: string, block: GravityBlock) => {
  if (!block.link) return html;
  return `<a class="gravity-block-link" href="${escapeHtml(block.link)}">${html}</a>`;
};

function renderRuns(block: GravityBlock) {
  const runs = block.runs && block.runs.length ? block.runs : block.content ? [{ text: block.content }] : [];
  return runs.map(run => {
    let inner = escapeHtml(run.text);
    if (run.link) {
      const cls = run.button ? "cta-button cta-link" : "gravity-inline-link";
      inner = `<a class="${cls}" href="${escapeHtml(run.link)}">${inner}</a>`;
    }
    if (run.mark && !run.button) inner = `<mark>${inner}</mark>`;
    return inner;
  }).join("");
}

function codeBlockMarkup(block: GravityBlock) {
  const code = block.content || "";
  const lang = (block.language || "code").trim() || "code";
  const copy = `var b=this,n=this.closest('.gravity-code');navigator.clipboard.writeText(n.dataset.code||'').then(function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1500)})`;
  return `<div class="gravity-code" data-code="${escapeHtml(code)}" data-lang="${escapeHtml(lang)}"><div class="gravity-code-head"><span class="gravity-code-lang">${escapeHtml(lang)}</span><button type="button" class="gravity-code-copy" aria-label="Copy code" onclick="${copy}">Copy</button></div><pre><code>${escapeHtml(code)}</code></pre></div>`;
}

function blockMarkup(block: GravityBlock) {
  if (block.type === "image") {
    const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : "";
    return wrapLink(`<figure class="gravity-media"><img src="${escapeHtml(block.url || "")}" alt="${escapeHtml(block.caption || "")}" loading="lazy">${caption}</figure>`, block);
  }
  if (block.type === "video") {
    const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : "";
    return wrapLink(`<figure class="gravity-media">${videoEmbed(block.url || "")}${caption}</figure>`, block);
  }
  if (block.type === "audio") {
    const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : "";
    return wrapLink(`<figure class="gravity-media${youtubeId(block.url || "") ? " gravity-audio-strip" : ""}">${audioEmbed(block.url || "")}${caption}</figure>`, block);
  }
  if (block.type === "text") {
    if (block.level === "list") {
      const items = (block.content || "").split("\n").filter(line => line.trim()).map(line => `<li>${escapeHtml(line)}</li>`).join("");
      return items ? `<ul class="gravity-list">${items}</ul>` : "";
    }
    if (block.level === "quote") {
      return wrapLink(`<blockquote class="gravity-text gravity-quote">${renderRuns(block)}</blockquote>`, block);
    }
    const tag = block.level === "h2" ? "h2" : block.level === "h3" ? "h3" : "p";
    return wrapLink(`<${tag} class="gravity-text">${renderRuns(block)}</${tag}>`, block);
  }
  if (block.type === "button") {
    const href = escapeHtml(block.link || "#");
    return `<p class="gravity-button-wrap"><a class="cta-button cta-primary" href="${href}">${escapeHtml(block.content || "Button")}</a></p>`;
  }
  if (block.type === "code") {
    return codeBlockMarkup(block);
  }
  if (block.type === "custom") {
    return `<div class="gravity-custom">${block.content || ""}</div>`;
  }
  return "";
}

const rowsOverlap = (a: GravityBlock, b: GravityBlock, gap = 24) => Math.min(a.y + 90, b.y + 90) - Math.max(a.y, b.y) > -gap;

function renderSection(children: GravityBlock[]) {
  const sideBySide = children.some((a, index) => children.slice(index + 1).some(b => Math.abs(a.y - b.y) <= 12 && rowsOverlap(a, b)));
  const ordered = [...children].sort((a, b) => (sideBySide ? a.x - b.x : a.y - b.y));
  if (sideBySide) {
    const items = ordered.map(block => `<div class="gravity-cell">${blockMarkup(block)}</div>`).join("");
    return `<section class="gravity-section gravity-grid" style="grid-template-columns:repeat(${ordered.length}, minmax(0, 1fr));gap:1rem">${items}</section>`;
  }
  return `<section class="gravity-section gravity-stack">${ordered.map(blockMarkup).join("")}</section>`;
}

export function blocksToHtml(blocks: GravityBlock[], sections: GravitySection[]) {
  const groups = sections.map(section => ({ section, children: blocks.filter(block => block.parentId === section.id) })).filter(group => group.children.length > 0);
  const free = blocks.filter(block => !block.parentId);
  const top = (item: { y: number } | number) => (typeof item === "number" ? item : item.y);
  const units = [
    ...groups.map(group => ({ kind: "section" as const, group, y: Math.min(...group.children.map(child => child.y)) })),
    ...free.map(block => ({ kind: "block" as const, block, y: block.y })),
  ].sort((a, b) => a.y - b.y);
  return units.map(unit => (unit.kind === "section" ? renderSection(unit.group.children) : blockMarkup(unit.block))).join("\n");
}

export function blocksToDoc(blocks: GravityBlock[], sections: GravitySection[]): GravityDoc {
  return { type: "gravity", version: 1, sections, blocks };
}

export function parseGravityDoc(value: unknown): { blocks: GravityBlock[]; sections: GravitySection[] } {
  if (value && typeof value === "object" && (value as GravityDoc).type === "gravity") {
    return { blocks: (value as GravityDoc).blocks || [], sections: (value as GravityDoc).sections || [] };
  }
  return { blocks: [], sections: [] };
}

export type FlowUnit =
  | { kind: "section"; id: string; blockIds: string[] }
  | { kind: "block"; id: string };

/**
 * Canonical document order used by the published HTML (blocksToHtml) AND the
 * mobile flow editor, so what you reorder on mobile is exactly what readers see.
 * Sections are grouped by their topmost child's y; free blocks join the stream by y.
 */
export function flowOrder(
  blocks: GravityBlock[],
  sections: GravitySection[]
): FlowUnit[] {
  const groups = sections
    .map(section => ({
      section,
      children: blocks.filter(block => block.parentId === section.id),
    }))
    .filter(group => group.children.length > 0);
  const free = blocks.filter(block => !block.parentId);
  const units: FlowUnit[] = [
    ...groups.map(group => ({
      kind: "section" as const,
      id: group.section.id,
      blockIds: group.children.map(child => child.id),
    })),
    ...free.map(block => ({ kind: "block" as const, id: block.id })),
  ];
  const topOf = (unit: FlowUnit): number => {
    const ids = unit.kind === "section" ? unit.blockIds : [unit.id];
    const ys = ids
      .map(id => blocks.find(block => block.id === id)?.y ?? 0)
      .filter(y => y !== undefined);
    return ys.length ? Math.min(...ys) : 0;
  };
  return units.sort((a, b) => topOf(a) - topOf(b));
}

const DEFAULT_WIDTH: Record<string, number> = {
  text: 240,
  image: 260,
  video: 320,
  audio: 320,
  button: 200,
  code: 460,
  custom: 460,
};

const flowHeight = (block: Pick<GravityBlock, "type" | "height">) => {
  if (block.height) return block.height;
  switch (block.type) {
    case "text":
      return 92;
    case "image":
    case "video":
      return 160;
    case "audio":
      return 56;
    case "button":
      return 60;
    case "code":
      return 150;
    case "custom":
      return 180;
  }
};

type PartialBlock = Omit<GravityBlock, "id" | "x" | "y" | "width">;

function parseTextElement(el: Element): PartialBlock {
  const runs: TextRun[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      const t = node.textContent || "";
      if (t.trim()) runs.push({ text: t });
      return;
    }
    if (node.nodeType !== 1) return;
    const n = node as Element;
    const tag = n.tagName.toLowerCase();
    if (tag === "a") {
      const href = n.getAttribute("href") || "";
      const t = n.textContent || "";
      if (t.trim())
        runs.push({
          text: t,
          link: href && href !== "#" ? href : undefined,
          button: n.className.includes("cta-link") || undefined,
        });
      return;
    }
    if (tag === "mark") {
      const t = n.textContent || "";
      if (t.trim()) runs.push({ text: t, mark: true });
      return;
    }
    if (tag === "br") {
      runs.push({ text: "\n" });
      return;
    }
    if (tag === "script" || tag === "style") return;
    for (const c of Array.from(n.childNodes)) walk(c);
  };
  const tag = el.tagName.toLowerCase();
  if (tag === "ul" || tag === "ol") {
    const items = Array.from(el.querySelectorAll(":scope > li"))
      .map(li => (li.textContent || "").trim())
      .filter(Boolean);
    return { type: "text", content: items.join("\n"), runs: undefined, level: "list" };
  }
  for (const c of Array.from(el.childNodes)) walk(c);
  const level =
    tag === "h2"
      ? "h2"
      : tag === "h1" || tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6"
        ? "h3"
        : tag === "blockquote"
          ? "quote"
          : "p";
  return {
    type: "text",
    content: runs.map(r => r.text).join(""),
    runs: runs.length ? runs : undefined,
    level,
  };
}

function elementToBlock(el: Element): PartialBlock | null {
  const cls = typeof el.className === "string" ? el.className : "";
  const tag = el.tagName.toLowerCase();
  if (cls.includes("gravity-custom")) {
    return { type: "custom", content: el.innerHTML || "" };
  }
  if (cls.includes("gravity-code") || tag === "pre") {
    const codeEl = el.querySelector("code") || el;
    const lang = (el.querySelector(".gravity-code-lang")?.textContent || "").trim();
    return { type: "code", content: codeEl.textContent || "", language: lang || undefined };
  }
  if (cls.includes("gravity-button-wrap") || (cls.includes("cta-button") && tag === "a")) {
    const a = tag === "a" ? el : el.querySelector("a.cta-button");
    if (a) {
      const link = a.getAttribute("href") || "";
      return { type: "button", content: a.textContent || "", link: link && link !== "#" ? link : undefined };
    }
  }
  if (cls.includes("gravity-text") || ["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "ul", "ol", "li"].includes(tag)) {
    return parseTextElement(el);
  }
  if (tag === "figure" && cls.includes("gravity-media")) {
    const img = el.querySelector("img");
    const video = el.querySelector("video");
    const audio = el.querySelector("audio");
    const iframe = el.querySelector("iframe");
    const caption = el.querySelector("figcaption")?.textContent || "";
    if (img) return { type: "image", url: img.getAttribute("src") || "", caption };
    if (video) {
      const src = video.querySelector("source")?.getAttribute("src") || video.getAttribute("src") || "";
      return { type: "video", url: src, caption };
    }
    if (audio) return { type: "audio", url: audio.getAttribute("src") || "", caption };
    if (iframe) {
      const src = iframe.getAttribute("src") || "";
      return cls.includes("gravity-audio-strip")
        ? { type: "audio", url: src, caption }
        : { type: "video", url: src, caption };
    }
  }
  if (tag === "img") return { type: "image", url: el.getAttribute("src") || "" };
  if (tag === "video") {
    const src = el.querySelector("source")?.getAttribute("src") || el.getAttribute("src") || "";
    return { type: "video", url: src };
  }
  if (tag === "audio") return { type: "audio", url: el.getAttribute("src") || "" };
  if (tag === "iframe") return { type: "video", url: el.getAttribute("src") || "" };
  const nested = el.querySelector<Element>(".gravity-text, .gravity-custom, .gravity-code, .gravity-button-wrap, .gravity-media, figure, pre, img, video, audio, iframe");
  if (nested && nested !== el) return elementToBlock(nested);
  return null;
}

function sanitizeJsonDoc(doc: GravityDoc): { blocks: GravityBlock[]; sections: GravitySection[] } {
  const ids = new Set<string>();
  const nid = () => {
    let id = uid("block");
    while (ids.has(id)) id = uid("block");
    ids.add(id);
    return id;
  };
  const idOf = (existing?: string) => {
    if (existing && !ids.has(existing)) {
      ids.add(existing);
      return existing;
    }
    return nid();
  };
  const sections = (doc.sections || []).map(section => ({
    id: idOf(section.id),
    label: section.label || "Section",
  }));
  const blocks = (doc.blocks || []).map(block => ({
    ...block,
    id: idOf(block.id),
    parentId: block.parentId ? idOf(block.parentId) : undefined,
  }));
  return { blocks, sections };
}

/**
 * Accepts the exact HTML the published site understands (the CodeReport
 * Gravity block format) OR a raw gravity JSON doc, and rebuilds blocks +
 * sections laid out top-to-bottom in reading order. Used by the canvas
 * "Import" dialog so agent-generated HTML becomes editable blocks.
 */
export function importHtml(html: string, startY = 40): { blocks: GravityBlock[]; sections: GravitySection[] } | null {
  const text = (html || "").trim();
  if (!text) return null;
  if (text.startsWith("{")) {
    try {
      const doc = JSON.parse(text);
      if (doc && doc.type === "gravity") return sanitizeJsonDoc(doc);
    } catch {
      /* fall through to HTML */
    }
  }
  const parsed = new DOMParser().parseFromString(text, "text/html");
  const body = parsed.body;
  if (!body) return null;

  const blocks: GravityBlock[] = [];
  const sections: GravitySection[] = [];
  const ids = new Set<string>();
  const nid = (prefix: string) => {
    let id = uid(prefix);
    while (ids.has(id)) id = uid(prefix);
    ids.add(id);
    return id;
  };
  let y = startY;
  const nextY = (height: number) => {
    const current = y;
    y += height + 24;
    return current;
  };
  const placeBlock = (block: PartialBlock, width: number, parentId?: string) =>
    ({
      ...block,
      id: nid("block"),
      parentId,
      x: Math.round((CANVAS_WIDTH - width) / 2),
      y: nextY(flowHeight(block)),
      width,
    } as GravityBlock);

  const topNodes = Array.from(body.children);
  for (const el of topNodes) {
    const cls = typeof el.className === "string" ? el.className : "";
    const tag = el.tagName.toLowerCase();
    if (cls.includes("gravity-section") && tag === "section") {
      const label =
        el.querySelector("h2, h3")?.textContent?.trim() ||
        `Section ${sections.length + 1}`;
      const cells = Array.from(el.querySelectorAll(":scope > .gravity-cell"));
      const rawBlocks = cells.length
        ? cells.map(cell => elementToBlock(cell)).filter(Boolean) as GravityBlock[]
        : Array.from(el.children).map(child => elementToBlock(child)).filter(Boolean) as GravityBlock[];
      if (!rawBlocks.length) continue;
      const section: GravitySection = { id: nid("section"), label };
      const isGrid = cls.includes("gravity-grid");
      if (isGrid && rawBlocks.length > 1) {
        const cellW = Math.round((CANVAS_WIDTH - 32) / rawBlocks.length);
        const yy = nextY(Math.max(...rawBlocks.map(flowHeight)));
        rawBlocks.forEach((child, index) => {
          blocks.push(placeBlock(child, cellW, section.id));
          const placed = blocks[blocks.length - 1];
          placed.x = 16 + index * cellW;
          placed.y = yy;
        });
      } else {
        for (const child of rawBlocks) {
          blocks.push(placeBlock(child, DEFAULT_WIDTH[child.type] ?? 240, section.id));
        }
      }
      sections.push(section);
      continue;
    }
    const block = elementToBlock(el);
    if (block) {
      blocks.push(placeBlock(block, DEFAULT_WIDTH[block.type] ?? 240));
    }
  }

  if (!blocks.length) return null;
  return { blocks, sections };
}
