"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Combine,
  Copy,
  Maximize,
  Minus,
  MousePointer2,
  Plus,
  Trash2,
  Unlink,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BlockView } from "./BlockView";
import { useEditorStore } from "./store";
import { CANVAS_WIDTH } from "./templates";
import type { GravityBlock, GravitySection } from "./types";

const clampZoom = (value: number) =>
  Math.max(0.15, Math.min(2, Math.round(value * 100) / 100));

type Box = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };

function DraggableBlock({
  block,
  selected,
}: {
  block: GravityBlock;
  selected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: block.id });
  const selectBlock = useEditorStore(state => state.selectBlock);
  return (
    <div
      ref={setNodeRef}
      data-block-id={block.id}
      onClick={event => {
        event.stopPropagation();
        selectBlock(block.id, event.metaKey || event.ctrlKey || event.shiftKey);
      }}
      style={{
        position: "absolute",
        left: block.x,
        top: block.y,
        zIndex: selected ? 20 : 10,
        transform: CSS.Translate.toString(transform),
        touchAction: "none",
      }}
    >
      <BlockView
        block={block}
        selected={selected}
        isDragging={isDragging}
        listeners={listeners}
        attributes={attributes}
      />
    </div>
  );
}

function SectionOverlay({
  section,
  blocks,
}: {
  section: GravitySection;
  blocks: GravityBlock[];
}) {
  const detachSelection = useEditorStore(state => state.detachSelection);
  if (!blocks.length) return null;
  const minX = Math.min(...blocks.map(block => block.x)) - 10;
  const minY = Math.min(...blocks.map(block => block.y)) - 34;
  const maxX = Math.max(...blocks.map(block => block.x + block.width)) + 10;
  const maxY = Math.max(...blocks.map(block => block.y + 128)) + 10;
  return (
    <div
      className="pointer-events-none absolute rounded-xl border border-dashed border-primary/50 bg-primary/5"
      style={{
        left: minX,
        top: minY,
        width: Math.max(0, maxX - minX),
        height: Math.max(0, maxY - minY),
      }}
    >
      <div className="pointer-events-auto absolute -top-4 left-3 flex items-center gap-1 rounded-md border border-primary/30 bg-background px-2 py-0.5 text-[10px] font-medium text-primary shadow-sm">
        {section.label}
        <button
          type="button"
          className="pointer-events-auto ml-1 inline-flex items-center gap-0.5 text-muted-foreground hover:text-primary"
          onClick={event => {
            event.stopPropagation();
            detachSelection();
          }}
          title="Detach selected blocks"
        >
          <Unlink className="h-3 w-3" />
          Detach
        </button>
      </div>
    </div>
  );
}

function FloatingActions({ visible }: { visible: boolean }) {
  const selected = useEditorStore(state => state.selected);
  const blocks = useEditorStore(state => state.blocks);
  const duplicateBlocks = useEditorStore(state => state.duplicateBlocks);
  const mergeSelection = useEditorStore(state => state.mergeSelection);
  const detachSelection = useEditorStore(state => state.detachSelection);
  const alignSelection = useEditorStore(state => state.alignSelection);
  const deleteBlocks = useEditorStore(state => state.deleteBlocks);
  if (!visible || !selected.length) return null;
  const inSection = blocks.some(
    block => selected.includes(block.id) && block.parentId
  );
  const alignDisabled = selected.length < 2;
  const btn =
    "grid h-9 w-9 place-items-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35";
  return (
    <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-white/10 bg-[#161922]/95 p-1 shadow-2xl backdrop-blur">
      <button
        type="button"
        className={btn}
        title="Duplicate"
        onClick={() => duplicateBlocks(selected)}
      >
        <Copy className="h-4 w-4" />
      </button>
      {selected.length > 1 && (
        <button
          type="button"
          className={btn}
          title="Merge into section"
          onClick={mergeSelection}
        >
          <Combine className="h-4 w-4" />
        </button>
      )}
      {inSection && (
        <button
          type="button"
          className={btn}
          title="Detach from section"
          onClick={detachSelection}
        >
          <Unlink className="h-4 w-4" />
        </button>
      )}
      <div className="mx-1 h-5 w-px bg-white/10" />
      <button
        type="button"
        className={btn}
        title="Align left"
        disabled={alignDisabled}
        onClick={() => alignSelection("left")}
      >
        <AlignLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        title="Align center"
        disabled={alignDisabled}
        onClick={() => alignSelection("center")}
      >
        <AlignCenter className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        title="Align right"
        disabled={alignDisabled}
        onClick={() => alignSelection("right")}
      >
        <AlignRight className="h-4 w-4" />
      </button>
      <div className="mx-1 h-5 w-px bg-white/10" />
      <button
        type="button"
        className={`${btn} text-rose-400 hover:bg-rose-500/15 hover:text-rose-300`}
        title="Delete"
        onClick={() => deleteBlocks(selected)}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function GravityCanvas({
  viewportRef,
  hideZoomBar,
  fullHeight,
}: {
  viewportRef?: { current: HTMLDivElement | null };
  hideZoomBar?: boolean;
  fullHeight?: boolean;
}) {
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
  const editingId = useEditorStore(state => state.editingId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const ownViewport = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const innerViewport = viewportRef ?? ownViewport;
  const mouseBoxRef = useRef<{ start: Point; cur: Point } | null>(null);
  const touchState = useRef<{
    mode: "pending" | "pan" | "select" | null;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
    timer: number | undefined;
    boxStart: Point | null;
  }>({
    mode: null,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    timer: undefined,
    boxStart: null,
  });
  const pinchRef = useRef<{
    startDist: number;
    startZoom: number;
    rect: DOMRect | null;
  } | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 8 },
    })
  );

  const contentHeight = useMemo(
    () => Math.max(760, ...blocks.map(block => block.y + 200)),
    [blocks]
  );
  const fitZoom = () => {
    const el = innerViewport.current;
    if (el)
      setZoom(
        Math.max(0.15, Math.min(1, (el.clientWidth - 64) / CANVAS_WIDTH))
      );
  };

  useEffect(() => {
    fitZoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setBounds({ maxX: CANVAS_WIDTH - 40, maxY: contentHeight - 40 });
  }, [contentHeight, setBounds]);

  useEffect(() => () => window.clearTimeout(touchState.current.timer), []);

  const toWorld = (clientX: number, clientY: number): Point => {
    const rect = artboardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  };

  const finishBox = (start: Point, end: Point) => {
    const artboard = artboardRef.current;
    if (!artboard) return;
    const left = Math.min(start.x, end.x);
    const right = Math.max(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const bottom = Math.max(start.y, end.y);
    const rect = artboard.getBoundingClientRect();
    const ids: string[] = [];
    artboard.querySelectorAll<HTMLElement>("[data-block-id]").forEach(el => {
      const r = el.getBoundingClientRect();
      const world = {
        left: (r.left - rect.left) / zoom,
        right: (r.right - rect.left) / zoom,
        top: (r.top - rect.top) / zoom,
        bottom: (r.bottom - rect.top) / zoom,
      };
      if (
        world.left < right &&
        world.right > left &&
        world.top < bottom &&
        world.bottom > top
      ) {
        const id = el.dataset.blockId;
        if (id) ids.push(id);
      }
    });
    if (ids.length) {
      ids.forEach((id, index) => selectBlock(id, index > 0));
    } else {
      clearSelection();
    }
  };

  const activeBlock = blocks.find(block => block.id === activeId);
  const sectionGroups = sections.map(section => ({
    section,
    blocks: blocks.filter(block => block.parentId === section.id),
  }));

  return (
    <div
      className={`relative border border-white/10 bg-[#0e1116] ${fullHeight ? "h-full rounded-none" : "rounded-xl border-border bg-[#f2f2f0]"}`}
    >
      <div
        ref={innerViewport}
        onDoubleClick={event => {
          if (
            event.target === event.currentTarget ||
            (event.target as HTMLElement).classList.contains("gravity-artboard")
          ) {
            const rect = innerViewport.current?.getBoundingClientRect();
            if (rect)
              addBlockAt(
                "text",
                (event.clientX - rect.left) / zoom,
                (event.clientY - rect.top) / zoom
              );
          }
        }}
        onPointerDown={event => {
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          if ((event.target as HTMLElement).closest("[data-block-id]")) return;
          clearSelection();
          const start = toWorld(event.clientX, event.clientY);
          mouseBoxRef.current = { start, cur: start };
          setBox({ x: start.x, y: start.y, width: 0, height: 0 });
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            /* noop */
          }
        }}
        onPointerMove={event => {
          if (event.pointerType !== "mouse") return;
          const ref = mouseBoxRef.current;
          if (!ref) return;
          ref.cur = toWorld(event.clientX, event.clientY);
          setBox({
            x: Math.min(ref.start.x, ref.cur.x),
            y: Math.min(ref.start.y, ref.cur.y),
            width: Math.abs(ref.cur.x - ref.start.x),
            height: Math.abs(ref.cur.y - ref.start.y),
          });
        }}
        onPointerUp={event => {
          if (event.pointerType !== "mouse") return;
          const ref = mouseBoxRef.current;
          if (ref) {
            finishBox(ref.start, ref.cur);
            mouseBoxRef.current = null;
          }
          setBox(null);
        }}
        onTouchStart={event => {
          if (event.touches.length === 1) {
            const touch = event.touches[0];
            if ((touch.target as HTMLElement).closest("[data-block-id]"))
              return;
            clearSelection();
            const vp = innerViewport.current;
            const ts = touchState.current;
            ts.mode = "pending";
            ts.startX = touch.clientX;
            ts.startY = touch.clientY;
            ts.scrollLeft = vp?.scrollLeft ?? 0;
            ts.scrollTop = vp?.scrollTop ?? 0;
            ts.boxStart = toWorld(touch.clientX, touch.clientY);
            window.clearTimeout(ts.timer);
            ts.timer = window.setTimeout(() => {
              if (touchState.current.mode === "pending") {
                touchState.current.mode = "select";
                setBox({
                  x: ts.boxStart!.x,
                  y: ts.boxStart!.y,
                  width: 0,
                  height: 0,
                });
              }
            }, 400);
          } else if (event.touches.length === 2) {
            const ts = touchState.current;
            window.clearTimeout(ts.timer);
            ts.mode = null;
            ts.boxStart = null;
            setBox(null);
            const [a, b] = [event.touches[0], event.touches[1]];
            pinchRef.current = {
              startDist: Math.hypot(
                a.clientX - b.clientX,
                a.clientY - b.clientY
              ),
              startZoom: zoom,
              rect: artboardRef.current?.getBoundingClientRect() ?? null,
            };
          }
        }}
        onTouchMove={event => {
          const ts = touchState.current;
          if (event.touches.length === 2 && pinchRef.current) {
            const pinch = pinchRef.current;
            const [a, b] = [event.touches[0], event.touches[1]];
            const dist = Math.hypot(
              a.clientX - b.clientX,
              a.clientY - b.clientY
            );
            if (pinch.startDist > 0) {
              const target = clampZoom(
                pinch.startZoom * (dist / pinch.startDist)
              );
              const midX = (a.clientX + b.clientX) / 2;
              const midY = (a.clientY + b.clientY) / 2;
              setZoom(target);
              const vp = innerViewport.current;
              const rectBefore = pinch.rect;
              if (vp && rectBefore) {
                requestAnimationFrame(() => {
                  const rectAfter =
                    artboardRef.current?.getBoundingClientRect();
                  if (!rectAfter) return;
                  const px = (midX - rectBefore.left) / pinch.startZoom;
                  const py = (midY - rectBefore.top) / pinch.startZoom;
                  vp.scrollLeft += rectAfter.left + px * target - midX;
                  vp.scrollTop += rectAfter.top + py * target - midY;
                });
              }
            }
            return;
          }
          if (event.touches.length !== 1 || !ts.mode) return;
          const touch = event.touches[0];
          const dx = touch.clientX - ts.startX;
          const dy = touch.clientY - ts.startY;
          if (ts.mode === "pending") {
            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
              window.clearTimeout(ts.timer);
              ts.mode = "pan";
            }
            return;
          }
          if (ts.mode === "pan") {
            const vp = innerViewport.current;
            if (vp) {
              vp.scrollLeft = ts.scrollLeft + (ts.startX - touch.clientX);
              vp.scrollTop = ts.scrollTop + (ts.startY - touch.clientY);
            }
            return;
          }
          if (ts.mode === "select" && ts.boxStart) {
            const cur = toWorld(touch.clientX, touch.clientY);
            setBox({
              x: Math.min(ts.boxStart.x, cur.x),
              y: Math.min(ts.boxStart.y, cur.y),
              width: Math.abs(cur.x - ts.boxStart.x),
              height: Math.abs(cur.y - ts.boxStart.y),
            });
          }
        }}
        onTouchEnd={event => {
          const ts = touchState.current;
          window.clearTimeout(ts.timer);
          pinchRef.current = null;
          if (ts.mode === "select" && ts.boxStart) {
            const touch = event.changedTouches[0];
            const cur = touch
              ? toWorld(touch.clientX, touch.clientY)
              : ts.boxStart;
            finishBox(ts.boxStart, cur);
          }
          ts.mode = null;
          ts.boxStart = null;
          setBox(null);
        }}
        onTouchCancel={() => {
          const ts = touchState.current;
          window.clearTimeout(ts.timer);
          pinchRef.current = null;
          ts.mode = null;
          ts.boxStart = null;
          setBox(null);
        }}
        className={`gravity-artboard overflow-auto p-8 ${fullHeight ? "h-full" : "h-[72vh]"}`}
        style={{ touchAction: "none", userSelect: "none" }}
      >
        <div
          className="flex justify-center"
          style={{ width: CANVAS_WIDTH * zoom, height: contentHeight * zoom }}
        >
          <div
            ref={artboardRef}
            className="gravity-artboard relative rounded-lg border border-border bg-white shadow-sm"
            style={{
              width: CANVAS_WIDTH,
              height: contentHeight,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
            {!blocks.length && (
              <div className="grid h-full place-items-center">
                <div className="text-center">
                  <p className="font-display text-xl font-semibold text-muted-foreground">
                    Empty canvas
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pick a template, drag blocks from the toolbar, or
                    double-click the artboard to add text.
                  </p>
                </div>
              </div>
            )}
            <DndContext
              sensors={sensors}
              onDragStart={event => setActiveId(String(event.active.id))}
              onDragEnd={event => {
                const id = String(event.active.id);
                const block = blocks.find(item => item.id === id);
                setActiveId(null);
                if (!block) return;
                moveBlock(
                  id,
                  block.x + event.delta.x / zoom,
                  block.y + event.delta.y / zoom,
                  true
                );
              }}
              onDragCancel={() => setActiveId(null)}
            >
              {sectionGroups.map(({ section, blocks: children }) => (
                <SectionOverlay
                  key={section.id}
                  section={section}
                  blocks={children}
                />
              ))}
              {blocks.map(block => (
                <DraggableBlock
                  key={block.id}
                  block={block}
                  selected={selected.includes(block.id)}
                />
              ))}
              <DragOverlay>
                {activeBlock ? (
                  <div className="cursor-grabbing">
                    <BlockView block={activeBlock} selected />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
            {box && (
              <div
                className="pointer-events-none absolute z-30 rounded-sm border-2 border-[#2563eb] bg-[#2563eb]/10"
                style={{
                  left: box.x,
                  top: box.y,
                  width: box.width,
                  height: box.height,
                }}
              />
            )}
          </div>
        </div>
      </div>
      <FloatingActions visible={!activeId && !editingId} />
      {!hideZoomBar && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border border-border bg-white p-1 shadow-sm">
          <button
            type="button"
            aria-label="Zoom out"
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            onClick={() =>
              setZoom(value =>
                Math.max(0.15, Math.round((value - 0.1) * 100) / 100)
              )
            }
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            onClick={() =>
              setZoom(value =>
                Math.min(2, Math.round((value + 0.1) * 100) / 100)
              )
            }
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Fit to view"
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            onClick={fitZoom}
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Reset to 100%"
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            onClick={() => setZoom(1)}
          >
            <MousePointer2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
