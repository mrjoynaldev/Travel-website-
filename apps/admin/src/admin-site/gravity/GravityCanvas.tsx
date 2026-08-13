"use client";

import { DndContext, DragOverlay, PointerSensor, useDraggable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Maximize, Minus, MousePointer2, Plus, Unlink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BlockView } from "./BlockView";
import { useEditorStore } from "./store";
import { CANVAS_WIDTH } from "./templates";
import type { GravityBlock, GravitySection } from "./types";

function DraggableBlock({ block, selected }: { block: GravityBlock; selected: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: block.id });
  const selectBlock = useEditorStore(state => state.selectBlock);
  return (
    <div ref={setNodeRef} data-block-id={block.id} onClick={event => { event.stopPropagation(); selectBlock(block.id, event.metaKey || event.ctrlKey || event.shiftKey); }} style={{ position: "absolute", left: block.x, top: block.y, zIndex: selected ? 20 : 10, transform: CSS.Translate.toString(transform), touchAction: "none" }}>
      <BlockView block={block} selected={selected} isDragging={isDragging} listeners={listeners} attributes={attributes} />
    </div>
  );
}

function SectionOverlay({ section, blocks }: { section: GravitySection; blocks: GravityBlock[] }) {
  const detachSelection = useEditorStore(state => state.detachSelection);
  if (!blocks.length) return null;
  const minX = Math.min(...blocks.map(block => block.x)) - 10;
  const minY = Math.min(...blocks.map(block => block.y)) - 34;
  const maxX = Math.max(...blocks.map(block => block.x + block.width)) + 10;
  const maxY = Math.max(...blocks.map(block => block.y + 128)) + 10;
  return (
    <div className="pointer-events-none absolute rounded-xl border border-dashed border-primary/50 bg-primary/5" style={{ left: minX, top: minY, width: Math.max(0, maxX - minX), height: Math.max(0, maxY - minY) }}>
      <div className="pointer-events-auto absolute -top-4 left-3 flex items-center gap-1 rounded-md border border-primary/30 bg-background px-2 py-0.5 text-[10px] font-medium text-primary shadow-sm">
        {section.label}
        <button type="button" className="pointer-events-auto ml-1 inline-flex items-center gap-0.5 text-muted-foreground hover:text-primary" onClick={event => { event.stopPropagation(); detachSelection(); }} title="Detach selected blocks"><Unlink className="h-3 w-3" />Detach</button>
      </div>
    </div>
  );
}

export function GravityCanvas({ viewportRef, hideZoomBar, fullHeight }: { viewportRef?: { current: HTMLDivElement | null }; hideZoomBar?: boolean; fullHeight?: boolean }) {
  const blocks = useEditorStore(state => state.blocks);
  const sections = useEditorStore(state => state.sections);
  const selected = useEditorStore(state => state.selected);
  const selectBlock = useEditorStore(state => state.selectBlock);
  const clearSelection = useEditorStore(state => state.clearSelection);
  const moveBlock = useEditorStore(state => state.moveBlock);
  const setBounds = useEditorStore(state => state.setBounds);
  const addBlockAt = useEditorStore(state => state.addBlockAt);
  const zoom = useEditorStore(state => state.zoom);
  const setZoom = useEditorStore(state => state.setZoom);
  const [activeId, setActiveId] = useState<string | null>(null);
  const ownViewport = useRef<HTMLDivElement>(null);
  const innerViewport = viewportRef ?? ownViewport;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const contentHeight = useMemo(() => Math.max(760, ...blocks.map(block => block.y + 200)), [blocks]);
  const fitZoom = () => {
    const el = innerViewport.current;
    if (el) setZoom(Math.max(0.15, Math.min(1, (el.clientWidth - 64) / CANVAS_WIDTH)));
  };

  useEffect(() => {
    fitZoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setBounds({ maxX: CANVAS_WIDTH - 40, maxY: contentHeight - 40 });
  }, [contentHeight, setBounds]);

  const activeBlock = blocks.find(block => block.id === activeId);
  const sectionGroups = sections.map(section => ({ section, blocks: blocks.filter(block => block.parentId === section.id) }));

  return (
    <div className={`relative border border-white/10 bg-[#0e1116] ${fullHeight ? "h-full rounded-none" : "rounded-xl border-border bg-[#f2f2f0]"}`}>
      <div ref={innerViewport} onPointerDown={() => clearSelection()} onDoubleClick={event => {
        if (event.target === event.currentTarget || (event.target as HTMLElement).classList.contains("gravity-artboard")) {
          const rect = innerViewport.current?.getBoundingClientRect();
          if (rect) addBlockAt("text", (event.clientX - rect.left) / zoom, (event.clientY - rect.top) / zoom);
        }
      }} className={`gravity-artboard overflow-auto p-8 ${fullHeight ? "h-full" : "h-[72vh]"}`}>
        <div className="flex justify-center" style={{ width: CANVAS_WIDTH * zoom, height: contentHeight * zoom }}>
          <div className="gravity-artboard relative rounded-lg border border-border bg-white shadow-sm" style={{ width: CANVAS_WIDTH, height: contentHeight, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
            {!blocks.length && <div className="grid h-full place-items-center"><div className="text-center"><p className="font-display text-xl font-semibold text-muted-foreground">Empty canvas</p><p className="mt-1 text-sm text-muted-foreground">Pick a template, drag blocks from the toolbar, or double-click the artboard to add text.</p></div></div>}
            <DndContext
              sensors={sensors}
              onDragStart={event => setActiveId(String(event.active.id))}
              onDragEnd={event => {
                const id = String(event.active.id);
                const block = blocks.find(item => item.id === id);
                setActiveId(null);
                if (!block) return;
                moveBlock(id, block.x + event.delta.x / zoom, block.y + event.delta.y / zoom, true);
              }}
              onDragCancel={() => setActiveId(null)}
            >
              {sectionGroups.map(({ section, blocks: children }) => <SectionOverlay key={section.id} section={section} blocks={children} />)}
              {blocks.map(block => <DraggableBlock key={block.id} block={block} selected={selected.includes(block.id)} />)}
              <DragOverlay>{activeBlock ? <div className="cursor-grabbing"><BlockView block={activeBlock} selected /></div> : null}</DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>
      {!hideZoomBar && <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border border-border bg-white p-1 shadow-sm">
        <button type="button" aria-label="Zoom out" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted" onClick={() => setZoom(value => Math.max(0.15, Math.round((value - 0.1) * 100) / 100))}><Minus className="h-3.5 w-3.5" /></button>
        <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <button type="button" aria-label="Zoom in" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted" onClick={() => setZoom(value => Math.min(2, Math.round((value + 0.1) * 100) / 100))}><Plus className="h-3.5 w-3.5" /></button>
        <button type="button" aria-label="Fit to view" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted" onClick={fitZoom}><Maximize className="h-3.5 w-3.5" /></button>
        <button type="button" aria-label="Reset to 100%" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted" onClick={() => setZoom(1)}><MousePointer2 className="h-3.5 w-3.5" /></button>
      </div>}
    </div>
  );
}
