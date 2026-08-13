"use client";

import { create } from "zustand";
import { uid, type BlockType, type GravityBlock, type GravityDoc, type GravitySection } from "./types";

const GRID = 16;
const SNAP_THRESHOLD = 10;
export const TEXT_HEIGHT = 92;

export type CanvasBounds = { maxX: number; maxY: number };

function snap(x: number, y: number, blocks: GravityBlock[], ignoreId: string, bounds?: CanvasBounds) {
  let nextX = Math.round(x / GRID) * GRID;
  let nextY = Math.round(y / GRID) * GRID;
  for (const block of blocks) {
    if (block.id === ignoreId) continue;
    if (Math.abs(nextX - block.x) < SNAP_THRESHOLD) nextX = block.x;
    if (Math.abs(nextY - block.y) < SNAP_THRESHOLD) nextY = block.y;
  }
  if (bounds) {
    nextX = Math.max(0, Math.min(nextX, Math.max(0, bounds.maxX - 60)));
    nextY = Math.max(0, Math.min(nextY, Math.max(0, bounds.maxY - 40)));
  }
  return { x: nextX, y: nextY };
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
  setBounds: (bounds: CanvasBounds) => void;
  selectBlock: (id: string, additive: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;
  mergeSelection: () => void;
  detachSelection: () => void;
  deleteBlocks: (ids: string[]) => void;
  clearAll: () => void;
};

const pruneEmptySections = (blocks: GravityBlock[], sections: GravitySection[]) =>
  sections.filter(section => blocks.some(block => block.parentId === section.id));

const addBlockAt = (state: EditorState, type: BlockType, x?: number, y?: number): Partial<EditorState> => {
  const cascade = (state.blocks.length * 18) % 120;
  const block: GravityBlock = {
    id: uid("block"),
    type,
    x: x ?? 32 + cascade,
    y: y ?? 40 + cascade,
    width: type === "text" ? 240 : type === "image" ? 260 : type === "video" ? 320 : type === "button" ? 200 : 420,
    content: type === "text" ? "Double-click to edit this text block." : type === "button" ? "Button" : undefined,
  };
  return { blocks: [...state.blocks, block], selected: [block.id] };
};

export const useEditorStore = create<EditorState>(set => ({
  blocks: [],
  sections: [],
  selected: [],
  zoom: 1,
  editingId: null,
  setZoom: zoom => set(state => ({ zoom: typeof zoom === "function" ? zoom(state.zoom) : zoom })),
  setEditing: editingId => set({ editingId }),
  loadDoc: doc => set({ blocks: doc.blocks, sections: doc.sections, selected: [], editingId: null }),
  addBlock: type => set(state => addBlockAt(state, type)),
  addBlockAt: (type, x, y) => set(state => addBlockAt(state, type, x, y)),
  updateBlock: (id, patch) => set(state => ({ blocks: state.blocks.map(block => (block.id === id ? { ...block, ...patch } : block)) })),
  moveBlock: (id, x, y, snapEnabled) =>
    set(state => ({
      blocks: state.blocks.map(block => {
        if (block.id !== id) return block;
        if (!snapEnabled) return { ...block, x, y };
        const next = snap(x, y, state.blocks, id, state.bounds);
        return { ...block, ...next };
      }),
    })),
  setBounds: bounds => set({ bounds }),
  selectBlock: (id, additive) =>
    set(state =>
      additive
        ? { selected: state.selected.includes(id) ? state.selected.filter(item => item !== id) : [...state.selected, id] }
        : { selected: [id] },
    ),
  clearSelection: () => set({ selected: [] }),
  selectAll: () => set(state => ({ selected: state.blocks.map(block => block.id) })),
  mergeSelection: () =>
    set(state => {
      const chosen = state.selected;
      const eligible = chosen.filter(id => state.blocks.some(block => block.id === id && block.parentId === undefined));
      if (eligible.length < 2) return state;
      const section: GravitySection = { id: uid("section"), label: `Section ${state.sections.length + 1}` };
      return {
        blocks: state.blocks.map(block => (eligible.includes(block.id) ? { ...block, parentId: section.id } : block)),
        sections: [...state.sections, section],
        selected: chosen,
      };
    }),
  detachSelection: () =>
    set(state => {
      const blocks = state.blocks.map(block => (state.selected.includes(block.id) ? { ...block, parentId: undefined } : block));
      return { blocks, sections: pruneEmptySections(blocks, state.sections), selected: [] };
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
  clearAll: () => set({ blocks: [], sections: [], selected: [], editingId: null }),
}));
