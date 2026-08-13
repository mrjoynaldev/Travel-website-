"use client";

import { DndContext, DragOverlay, PointerSensor, useDraggable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Unlink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BlockView } from "./BlockView";
import { useEditorStore } from "./store";
import type { GravityBlock, GravitySection } from "./types";

function DraggableBlock({ block, selected }: { block: GravityBlock; selected: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: block.id });
  const selectBlock = useEditorStore(state => state.selectBlock);
  return (
    <div ref={setNodeRef} onClick={event => { event.stopPropagation(); selectBlock(block.id, event.metaKey || event.ctrlKey || event.shiftKey); }} style={{ position: "absolute", left: block.x, top: block.y, zIndex: selected ? 20 : 10, transform: CSS.Translate.toString(transform), touchAction: "none" }}>
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
        <button type="button" className="pointer-events-auto ml-1 inline-flex items-center gap-0.5 text-muted-foreground hover:text-primary" onClick={event => { event.stopPropagation(); detachSelection(); }} title="Detach selected blocks">
          <Unlink className="h-3 w-3" />Detach
        </button>
      </div>
    </div>
  );
}

export function GravityCanvas() {
  const blocks = useEditorStore(state => state.blocks);
  const sections = useEditorStore(state => state.sections);
  const selected = useEditorStore(state => state.selected);
  const selectBlock = useEditorStore(state => state.selectBlock);
  const clearSelection = useEditorStore(state => state.clearSelection);
  const moveBlock = useEditorStore(state => state.moveBlock);
  const setBounds = useEditorStore(state => state.setBounds);
  const addBlockAt = useEditorStore(state => state.addBlockAt);
  const [activeId, setActiveId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    const update = () => {
      const el = canvasRef.current;
      if (el) setBounds({ maxX: el.offsetWidth, maxY: el.offsetHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [setBounds]);

  const activeBlock = blocks.find(block => block.id === activeId);
  const sectionGroups = sections.map(section => ({ section, blocks: blocks.filter(block => block.parentId === section.id) }));

  return (
    <DndContext
      sensors={sensors}
      onDragStart={event => setActiveId(String(event.active.id))}
      onDragEnd={event => {
        const id = String(event.active.id);
        const block = blocks.find(item => item.id === id);
        setActiveId(null);
        if (!block) return;
        moveBlock(id, block.x + event.delta.x, block.y + event.delta.y, true);
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <div ref={canvasRef} onPointerDown={() => clearSelection()} onDoubleClick={event => {
        if (event.target === event.currentTarget || (event.target as HTMLElement).classList.contains("gravity-canvas")) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) addBlockAt("text", event.clientX - rect.left, event.clientY - rect.top);
        }
      }} className="gravity-canvas relative min-h-[70vh] overflow-hidden rounded-xl border border-border bg-[radial-gradient(circle,#d8d8d8_1px,transparent_1px)] bg-[length:22px_22px] p-4">
        {!blocks.length && <div className="pointer-events-none grid h-[60vh] place-items-center"><div className="text-center"><p className="font-display text-xl font-semibold text-muted-foreground">Empty canvas</p><p className="mt-1 text-sm text-muted-foreground">Use the toolbar above to add blocks, or double-click anywhere to add text.</p></div></div>}
        {sectionGroups.map(({ section, blocks: children }) => <SectionOverlay key={section.id} section={section} blocks={children} />)}
        {blocks.map(block => <DraggableBlock key={block.id} block={block} selected={selected.includes(block.id)} />)}
        <DragOverlay>{activeBlock ? <div className="cursor-grabbing"><BlockView block={activeBlock} selected /></div> : null}</DragOverlay>
      </div>
    </DndContext>
  );
}
