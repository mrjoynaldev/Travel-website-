"use client";

import { create } from "zustand";
import { CANVAS_WIDTH } from "./templates";
import {
  uid,
  type BlockType,
  type GravityBlock,
  type GravityDoc,
  type GravitySection,
} from "./types";

const GRID = 16;
const SNAP_THRESHOLD = 12;
export const TEXT_HEIGHT = 92;

export type CanvasBounds = { maxX: number; maxY: number };

export const blockHeight = (block: GravityBlock) => {
  if (block.height) return block.height;
  switch (block.type) {
    case "text":
      return TEXT_HEIGHT;
    case "image":
    case "video":
      return 160;
    case "audio":
      return 56;
    case "button":
      return 60;
  }
};

function snap(
  block: GravityBlock,
  x: number,
  y: number,
  blocks: GravityBlock[],
  ignoreId: string,
  bounds?: CanvasBounds
) {
  let bestX = Math.round(x / GRID) * GRID;
  let bestY = Math.round(y / GRID) * GRID;
  let bestDX = SNAP_THRESHOLD;
  let bestDY = SNAP_THRESHOLD;
  for (const other of blocks) {
    if (other.id === ignoreId) continue;
    for (const candidate of [
      { v: other.x, d: Math.abs(x - other.x) },
      { v: other.x + other.width, d: Math.abs(x - (other.x + other.width)) },
      { v: other.x - block.width, d: Math.abs(x + block.width - other.x) },
    ]) {
      if (candidate.d < bestDX) {
        bestDX = candidate.d;
        bestX = candidate.v;
      }
    }
    for (const candidate of [
      { v: other.y, d: Math.abs(y - other.y) },
      {
        v: other.y + blockHeight(other),
        d: Math.abs(y - (other.y + blockHeight(other))),
      },
      {
        v: other.y - blockHeight(block),
        d: Math.abs(y + blockHeight(block) - other.y),
      },
    ]) {
      if (candidate.d < bestDY) {
        bestDY = candidate.d;
        bestY = candidate.v;
      }
    }
  }
  if (bounds) {
    bestX = Math.max(0, Math.min(bestX, Math.max(0, bounds.maxX - 60)));
    bestY = Math.max(0, Math.min(bestY, Math.max(0, bounds.maxY - 40)));
  }
  return { x: bestX, y: bestY };
}

type EditorState = {
  blocks: GravityBlock[];
  sections: GravitySection[];
  selected: string[];
  bounds?: CanvasBounds;
  zoom: number;
  editingId: string | null;
  loadDoc: (doc: GravityDoc) => void;
  setZoom: (zoom: number | ((current: number) => number)) => void;
  setEditing: (id: string | null) => void;
  addBlock: (type: BlockType) => void;
  addBlockAt: (type: BlockType, x: number, y: number) => void;
  updateBlock: (id: string, patch: Partial<GravityBlock>) => void;
  moveBlock: (id: string, x: number, y: number, snapEnabled: boolean) => void;
  resizeBlock: (
    id: string,
    x: number,
    y: number,
    width: number,
    height?: number
  ) => void;
  rotateBlock: (id: string, rotation: number) => void;
  setBounds: (bounds: CanvasBounds) => void;
  selectBlock: (id: string, additive: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;
  mergeSelection: () => void;
  mergeBlocks: (ids: string[]) => void;
  detachSelection: () => void;
  duplicateBlocks: (ids: string[]) => void;
  alignSelection: (alignment: "left" | "center" | "right") => void;
  deleteBlocks: (ids: string[]) => void;
  clearAll: () => void;
};

const pruneEmptySections = (
  blocks: GravityBlock[],
  sections: GravitySection[]
) =>
  sections.filter(section =>
    blocks.some(block => block.parentId === section.id)
  );

const addBlockAt = (
  state: EditorState,
  type: BlockType,
  x?: number,
  y?: number
): Partial<EditorState> => {
  const cascade = (state.blocks.length * 18) % 120;
  const block: GravityBlock = {
    id: uid("block"),
    type,
    x: x ?? 32 + cascade,
    y: y ?? 40 + cascade,
    width:
      type === "text"
        ? 240
        : type === "image"
          ? 260
          : type === "video"
            ? 320
            : type === "button"
              ? 200
              : 420,
    content:
      type === "text"
        ? "Double-click to edit this text block."
        : type === "button"
          ? "Button"
          : undefined,
  };
  return { blocks: [...state.blocks, block], selected: [block.id] };
};

export const useEditorStore = create<EditorState>(set => ({
  blocks: [],
  sections: [],
  selected: [],
  zoom: 1,
  editingId: null,
  setZoom: zoom =>
    set(state => ({
      zoom: typeof zoom === "function" ? zoom(state.zoom) : zoom,
    })),
  setEditing: editingId => set({ editingId }),
  loadDoc: doc =>
    set({
      blocks: doc.blocks,
      sections: doc.sections,
      selected: [],
      editingId: null,
    }),
  addBlock: type => set(state => addBlockAt(state, type)),
  addBlockAt: (type, x, y) => set(state => addBlockAt(state, type, x, y)),
  updateBlock: (id, patch) =>
    set(state => ({
      blocks: state.blocks.map(block =>
        block.id === id ? { ...block, ...patch } : block
      ),
    })),
  moveBlock: (id, x, y, snapEnabled) =>
    set(state => ({
      blocks: state.blocks.map(block => {
        if (block.id !== id) return block;
        if (!snapEnabled) return { ...block, x, y };
        const next = snap(block, x, y, state.blocks, id, state.bounds);
        return { ...block, ...next };
      }),
    })),
  resizeBlock: (id, x, y, width, height) =>
    set(state => ({
      blocks: state.blocks.map(block => {
        if (block.id !== id) return block;
        const w = Math.max(48, Math.round(width));
        const h =
          height === undefined
            ? blockHeight(block)
            : Math.max(24, Math.round(height));
        const left = Math.max(0, Math.min(Math.round(x), CANVAS_WIDTH - w));
        const top = Math.max(0, Math.round(y));
        return { ...block, x: left, y: top, width: w, height: h };
      }),
    })),
  rotateBlock: (id, rotation) =>
    set(state => ({
      blocks: state.blocks.map(block =>
        block.id === id
          ? { ...block, rotation: ((rotation % 360) + 360) % 360 }
          : block
      ),
    })),
  setBounds: bounds => set({ bounds }),
  selectBlock: (id, additive) =>
    set(state =>
      additive
        ? {
            selected: state.selected.includes(id)
              ? state.selected.filter(item => item !== id)
              : [...state.selected, id],
          }
        : { selected: [id] }
    ),
  clearSelection: () => set({ selected: [] }),
  selectAll: () =>
    set(state => ({ selected: state.blocks.map(block => block.id) })),
  mergeSelection: () =>
    set(state => {
      const chosen = state.selected;
      const eligible = chosen.filter(id =>
        state.blocks.some(
          block => block.id === id && block.parentId === undefined
        )
      );
      if (eligible.length < 2) return state;
      const section: GravitySection = {
        id: uid("section"),
        label: `Section ${state.sections.length + 1}`,
      };
      return {
        blocks: state.blocks.map(block =>
          eligible.includes(block.id)
            ? { ...block, parentId: section.id }
            : block
        ),
        sections: [...state.sections, section],
        selected: chosen,
      };
    }),
  mergeBlocks: ids =>
    set(state => {
      const eligible = ids.filter(id =>
        state.blocks.some(
          block => block.id === id && block.parentId === undefined
        )
      );
      if (eligible.length < 2) return state;
      const section: GravitySection = {
        id: uid("section"),
        label: `Section ${state.sections.length + 1}`,
      };
      return {
        blocks: state.blocks.map(block =>
          eligible.includes(block.id)
            ? { ...block, parentId: section.id }
            : block
        ),
        sections: [...state.sections, section],
        selected: [...new Set([...state.selected, ...eligible])],
      };
    }),
  detachSelection: () =>
    set(state => {
      const blocks = state.blocks.map(block =>
        state.selected.includes(block.id)
          ? { ...block, parentId: undefined }
          : block
      );
      return {
        blocks,
        sections: pruneEmptySections(blocks, state.sections),
        selected: [],
      };
    }),
  duplicateBlocks: ids =>
    set(state => {
      const targets = state.blocks.filter(block => ids.includes(block.id));
      if (!targets.length) return state;
      const copies = targets.map(block => ({
        ...block,
        id: uid("block"),
        x: block.x + 24,
        y: block.y + 24,
      }));
      return {
        blocks: [...state.blocks, ...copies],
        selected: copies.map(copy => copy.id),
      };
    }),
  alignSelection: alignment =>
    set(state => {
      const targets = state.blocks.filter(block =>
        state.selected.includes(block.id)
      );
      if (targets.length < 2) return state;
      if (alignment === "left") {
        const minX = Math.min(...targets.map(block => block.x));
        return {
          blocks: state.blocks.map(block =>
            state.selected.includes(block.id) ? { ...block, x: minX } : block
          ),
        };
      }
      if (alignment === "right") {
        const maxRight = Math.max(
          ...targets.map(block => block.x + block.width)
        );
        return {
          blocks: state.blocks.map(block =>
            state.selected.includes(block.id)
              ? { ...block, x: maxRight - block.width }
              : block
          ),
        };
      }
      return {
        blocks: state.blocks.map(block =>
          state.selected.includes(block.id)
            ? { ...block, x: Math.round((CANVAS_WIDTH - block.width) / 2) }
            : block
        ),
      };
    }),
  deleteBlocks: ids =>
    set(state => {
      const blocks = state.blocks.filter(block => !ids.includes(block.id));
      return {
        blocks,
        sections: pruneEmptySections(blocks, state.sections),
        selected: state.selected.filter(id => !ids.includes(id)),
      };
    }),
  clearAll: () =>
    set({ blocks: [], sections: [], selected: [], editingId: null }),
}));
