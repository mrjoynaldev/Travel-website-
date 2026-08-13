import type { GravityBlock, GravityDoc, GravitySection } from "./types";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function videoEmbed(url: string) {
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (youtube) return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${youtube[1]}" title="Embedded video" frameborder="0" allowfullscreen></iframe>`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `<iframe src="https://player.vimeo.com/video/${vimeo[1]}" title="Embedded video" frameborder="0" allowfullscreen></iframe>`;
  return `<video controls preload="metadata"><source src="${escapeHtml(url)}"></video>`;
}

function blockMarkup(block: GravityBlock) {
  if (block.type === "image") {
    const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : "";
    return `<figure class="gravity-media"><img src="${escapeHtml(block.url || "")}" alt="${escapeHtml(block.caption || "")}" loading="lazy">${caption}</figure>`;
  }
  if (block.type === "video") {
    const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : "";
    return `<figure class="gravity-media">${videoEmbed(block.url || "")}${caption}</figure>`;
  }
  return `<p class="gravity-text">${escapeHtml(block.content || "")}</p>`;
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
