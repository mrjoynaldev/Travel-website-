"use client";

import type { GravityBlock, GravitySection } from "./types";

const CANVAS_WIDTH = 960;
const PAD = 16;
const GAP = 16;
const MIN_HEIGHT: Record<string, number> = { text: 92, image: 150, video: 150, audio: 92, button: 70 };

export type DoctorReport = { blocks: GravityBlock[]; sections: GravitySection[]; fixes: string[] };

const labelOf = (block: GravityBlock) => (block.type === "text" ? "text" : block.type) + " block";

function overlaps(a: GravityBlock, b: GravityBlock) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + (MIN_HEIGHT[b.type] ?? 92) && a.y + (MIN_HEIGHT[a.type] ?? 92) > b.y;
}

export function runDoctor(blocks: GravityBlock[], sections: GravitySection[]): DoctorReport {
  const fixes: string[] = [];
  const sectionIds = new Set(sections.map(section => section.id));
  const next: GravityBlock[] = blocks.map(block => ({ ...block }));

  for (const block of next) {
    if (block.parentId && !sectionIds.has(block.parentId)) {
      block.parentId = undefined;
      fixes.push(`${labelOf(block)} restored as a free block (its section no longer exists)`);
    }
  }

  for (const block of next) {
    const maxX = Math.max(PAD, CANVAS_WIDTH - PAD - block.width);
    const x = Math.min(Math.max(block.x, PAD), maxX);
    if (x !== block.x) {
      block.x = x;
      fixes.push(`${labelOf(block)} pulled back inside the canvas`);
    }
  }

  const groups = new Map<string, GravityBlock[]>();
  for (const block of next) {
    const key = block.parentId ?? "__free__";
    groups.set(key, [...(groups.get(key) ?? []), block]);
  }
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => a.y - b.y);
    for (let i = 1; i < sorted.length; i++) {
      for (let j = 0; j < i; j++) {
        if (overlaps(sorted[j], sorted[i])) {
          const below = sorted[j].y + (MIN_HEIGHT[sorted[j].type] ?? 92) + GAP;
          if (below > sorted[i].y) {
            sorted[i].y = below;
            fixes.push(`${labelOf(sorted[i])} moved below an overlapping neighbour`);
          }
        }
      }
    }
  }

  const deduped = Array.from(new Set(fixes));
  return { blocks: next, sections, fixes: deduped };
}
