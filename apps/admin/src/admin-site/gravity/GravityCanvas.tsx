"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
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
  RotateCw,
  Trash2,
  Unlink,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BlockView } from "./BlockView";
import { blockHeight, useEditorStore } from "./store";
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

function FloatingActions({
  visible,
  precision,
  onTogglePrecision,
}: {
  visible: boolean;
  precision: boolean;
  onTogglePrecision: () => void;
}) {
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
    "grid h-11 w-11 place-items-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35 sm:h-9 sm:w-9";
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
        className={`${btn} ${precision ? "bg-white/15 text-emerald-300" : ""}`}
        title="Precision move (0.3x speed)"
        onClick={onTogglePrecision}
      >
        <MousePointer2 className="h-4 w-4" />
      </button>
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

type HandleName = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const HANDLE_ANCHORS: Record<
  HandleName,
  (w: number, h: number) => { x: number; y: number }
> = {
  nw: (w, h) => ({ x: w, y: h }),
  n: (w, h) => ({ x: w / 2, y: h }),
  ne: (_w, h) => ({ x: 0, y: h }),
  e: (_w, h) => ({ x: 0, y: h / 2 }),
  se: () => ({ x: 0, y: 0 }),
  s: w => ({ x: w / 2, y: 0 }),
  sw: w => ({ x: w, y: 0 }),
  w: (w, h) => ({ x: w, y: h / 2 }),
};

const HANDLE_CURSOR: Record<HandleName, string> = {
  nw: "cursor-nwse-resize",
  se: "cursor-nwse-resize",
  ne: "cursor-nesw-resize",
  sw: "cursor-nesw-resize",
  n: "cursor-ns-resize",
  s: "cursor-ns-resize",
  w: "cursor-ew-resize",
  e: "cursor-ew-resize",
};

const HANDLE_POS: Record<
  HandleName,
  (w: number, h: number) => { left: number; top: number }
> = {
  nw: () => ({ left: -14, top: -14 }),
  n: w => ({ left: w / 2 - 20, top: -14 }),
  ne: w => ({ left: w - 14, top: -14 }),
  e: (w, h) => ({ left: w - 14, top: h / 2 - 20 }),
  se: (w, h) => ({ left: w - 14, top: h - 14 }),
  s: (w, h) => ({ left: w / 2 - 20, top: h - 14 }),
  sw: (_w, h) => ({ left: -14, top: h - 14 }),
  w: (_w, h) => ({ left: -14, top: h / 2 - 20 }),
};

function SelectionFrame({
  block,
  zoom,
  artboardRef,
  viewportEl,
}: {
  block: GravityBlock;
  zoom: number;
  artboardRef: React.RefObject<HTMLDivElement | null>;
  viewportEl: HTMLDivElement | null;
  scrollTick: number;
}) {
  const resizeBlock = useEditorStore(state => state.resizeBlock);
  const rotateBlock = useEditorStore(state => state.rotateBlock);
  const [drag, setDrag] = useState<{
    handle: HandleName;
    startX: number;
    startY: number;
    bx: number;
    by: number;
    bw: number;
    bh: number;
  } | null>(null);
  const [rotateDrag, setRotateDrag] = useState<{
    startX: number;
    startAngle: number;
  } | null>(null);

  const art = artboardRef.current;
  if (!art || !viewportEl) return null;
  const artRect = art.getBoundingClientRect();
  const vpRect = viewportEl.getBoundingClientRect();
  const height = blockHeight(block);
  const rotation = block.rotation ?? 0;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const x = artRect.left - vpRect.left + block.x * zoom;
  const y = artRect.top - vpRect.top + block.y * zoom;
  const w = block.width * zoom;
  const h = height * zoom;

  const onHandleDown =
    (handle: HandleName) => (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      setDrag({
        handle,
        startX: event.clientX,
        startY: event.clientY,
        bx: block.x,
        by: block.y,
        bw: block.width,
        bh: height,
      });
    };
  const onHandleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const dx = (event.clientX - drag.startX) / zoom;
    const dy = (event.clientY - drag.startY) / zoom;
    const dLx = dx * cos + dy * sin;
    const dLy = -dx * sin + dy * cos;
    const hasE = drag.handle.includes("e");
    const hasW = drag.handle.includes("w");
    const hasS = drag.handle.includes("s");
    const hasN = drag.handle.includes("n");
    const nw = Math.max(48, drag.bw + (hasE ? dLx : 0) - (hasW ? dLx : 0));
    const nh = Math.max(24, drag.bh + (hasS ? dLy : 0) - (hasN ? dLy : 0));
    const anchor = HANDLE_ANCHORS[drag.handle](drag.bw, drag.bh);
    const oAx = anchor.x - drag.bw / 2;
    const oAy = anchor.y - drag.bh / 2;
    const cX = drag.bx + drag.bw / 2 + (oAx * cos - oAy * sin);
    const cY = drag.by + drag.bh / 2 + (oAx * sin + oAy * cos);
    const oAx2 = anchor.x - nw / 2;
    const oAy2 = anchor.y - nh / 2;
    const nX = cX - (oAx2 * cos - oAy2 * sin);
    const nY = cY - (oAx2 * sin + oAy2 * cos);
    const bx = nX - ((nw / 2) * cos - (nh / 2) * sin);
    const by = nY - ((nw / 2) * sin + (nh / 2) * cos);
    resizeBlock(block.id, bx, by, nw, nh);
  };
  const onHandleUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* noop */
      }
    }
    setDrag(null);
  };

  const onRotateDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setRotateDrag({ startX: event.clientX, startAngle: rotation });
  };
  const onRotateMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!rotateDrag) return;
    rotateBlock(
      block.id,
      rotateDrag.startAngle + (event.clientX - rotateDrag.startX) * 0.5
    );
  };
  const onRotateUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (rotateDrag) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* noop */
      }
      const angle =
        (((rotateDrag.startAngle + (event.clientX - rotateDrag.startX) * 0.5) %
          360) +
          360) %
        360;
      const snaps = [0, 45, 90, 135, 180, 225, 270, 315];
      const nearest = snaps.reduce((best, snap) =>
        Math.min(Math.abs(angle - snap), 360 - Math.abs(angle - snap)) <
        Math.min(Math.abs(angle - best), 360 - Math.abs(angle - best))
          ? snap
          : best
      );
      if (
        Math.min(Math.abs(angle - nearest), 360 - Math.abs(angle - nearest)) < 4
      ) {
        rotateBlock(block.id, nearest);
      }
    }
    setRotateDrag(null);
  };

  const handles: HandleName[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
  const corner = ["nw", "ne", "sw", "se"] as HandleName[];

  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-[#2563eb]" />
      {handles.map(handle => {
        const pos = HANDLE_POS[handle](w, h);
        return (
          <div
            key={handle}
            className={`pointer-events-auto absolute z-10 grid place-items-center ${corner.includes(handle) ? "h-7 w-7" : "h-7 w-10"} ${HANDLE_CURSOR[handle]}`}
            style={{ left: pos.left, top: pos.top, touchAction: "none" }}
            onPointerDown={onHandleDown(handle)}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
          >
            <div
              className={`${corner.includes(handle) ? "h-3.5 w-3.5 rounded-full" : "h-1 w-4 rounded-full"} bg-[#2563eb] shadow ring-2 ring-white`}
            />
          </div>
        );
      })}
      <div
        className="pointer-events-auto absolute z-10 grid h-9 w-9 place-items-center rounded-full bg-white shadow-lg ring-2 ring-[#2563eb]"
        style={{ left: w / 2 - 18, top: -40, touchAction: "none" }}
        onPointerDown={onRotateDown}
        onPointerMove={onRotateMove}
        onPointerUp={onRotateUp}
        onPointerCancel={onRotateUp}
      >
        <RotateCw className="h-4 w-4 text-[#2563eb]" />
      </div>
      <div
        className="pointer-events-none absolute bg-[#2563eb]/50"
        style={{ left: w / 2 - 1, top: -40, width: 2, height: 40 }}
      />
    </div>
  );
}

export function GravityCanvas({
  viewportRef,
  hideZoomBar,
  fullHeight,
  mobileDocked,
}: {
  viewportRef?: { current: HTMLDivElement | null };
  hideZoomBar?: boolean;
  fullHeight?: boolean;
  mobileDocked?: boolean;
}) {
  const blocks = useEditorStore(state => state.blocks);
  const sections = useEditorStore(state => state.sections);
  const selected = useEditorStore(state => state.selected);
  const selectBlock = useEditorStore(state => state.selectBlock);
  const clearSelection = useEditorStore(state => state.clearSelection);
  const moveBlock = useEditorStore(state => state.moveBlock);
  const mergeBlocks = useEditorStore(state => state.mergeBlocks);
  const setBounds = useEditorStore(state => state.setBounds);
  const addBlockAt = useEditorStore(state => state.addBlockAt);
  const zoom = useEditorStore(state => state.zoom);
  const setZoom = useEditorStore(state => state.setZoom);
  const editingId = useEditorStore(state => state.editingId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [scrollTick, setScrollTick] = useState(0);
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({
    v: [],
    h: [],
  });
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [precisionMode, setPrecisionMode] = useState(false);
  const lastGuidesRef = useRef(0);
  const precisionRef = useRef(false);
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const inertiaRef = useRef(0);
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

  const startInertia = (id: string, vx: number, vy: number, z: number) => {
    if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current);
    let last = performance.now();
    const step = () => {
      const now = performance.now();
      const dt = Math.min(50, now - last);
      last = now;
      const damp = Math.pow(0.92, dt / 16);
      vx *= damp;
      vy *= damp;
      if (Math.abs(vx) < 0.03 && Math.abs(vy) < 0.03) {
        inertiaRef.current = 0;
        return;
      }
      const current = useEditorStore
        .getState()
        .blocks.find(item => item.id === id);
      if (!current) {
        inertiaRef.current = 0;
        return;
      }
      const maxY = Math.max(
        0,
        (useEditorStore.getState().bounds?.maxY ?? 2000) - blockHeight(current)
      );
      const nx = Math.max(
        0,
        Math.min(current.x + (vx * dt) / z, CANVAS_WIDTH - current.width)
      );
      const ny = Math.max(0, Math.min(current.y + (vy * dt) / z, maxY));
      moveBlock(id, nx, ny, false);
      inertiaRef.current = requestAnimationFrame(step);
    };
    inertiaRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    fitZoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = innerViewport.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      let dy = event.deltaY;
      if (event.deltaMode === 1) dy *= 16;
      const factor = Math.exp(-dy * 0.002);
      const startZoom = useEditorStore.getState().zoom;
      const target = clampZoom(startZoom * factor);
      const rectBefore = artboardRef.current?.getBoundingClientRect() ?? null;
      setZoom(target);
      if (rectBefore) {
        requestAnimationFrame(() => {
          const rectAfter = artboardRef.current?.getBoundingClientRect();
          if (!rectAfter) return;
          const mx = event.clientX - el.getBoundingClientRect().left;
          const my = event.clientY - el.getBoundingClientRect().top;
          const px = (mx - rectBefore.left) / startZoom;
          const py = (my - rectBefore.top) / startZoom;
          el.scrollLeft += rectAfter.left + px * target - mx;
          el.scrollTop += rectAfter.top + py * target - my;
        });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [innerViewport, setZoom]);

  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      if (activeId && event.touches.length > 1) precisionRef.current = true;
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    return () => window.removeEventListener("touchstart", onTouchStart);
  }, [activeId]);

  useEffect(() => () => cancelAnimationFrame(inertiaRef.current), []);

  useEffect(() => {
    setBounds({ maxX: CANVAS_WIDTH, maxY: contentHeight });
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
  const dropBlock = dropTarget
    ? blocks.find(block => block.id === dropTarget)
    : undefined;
  const singleSelected =
    selected.length === 1
      ? blocks.find(block => block.id === selected[0])
      : undefined;
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
        onScroll={() => setScrollTick(value => value + 1)}
        className={`gravity-artboard overflow-auto p-3 sm:p-8 ${fullHeight ? "h-full" : "h-[72vh]"}`}
        style={{
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          overscrollBehavior: "none",
        }}
      >
        <div
          style={{
            width: CANVAS_WIDTH * zoom,
            height: contentHeight * zoom,
            marginLeft: "auto",
            marginRight: "auto",
            touchAction: "none",
          }}
        >
          <div
            ref={artboardRef}
            className="gravity-artboard relative rounded-lg border border-border bg-white shadow-sm"
            style={{
              width: CANVAS_WIDTH,
              height: contentHeight,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              touchAction: "none",
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
              onDragStart={(event: DragStartEvent) => {
                setActiveId(String(event.active.id));
                setGuides({ v: [], h: [] });
                setDropTarget(null);
                lastGuidesRef.current = 0;
                precisionRef.current = false;
                lastMoveRef.current = null;
                if (inertiaRef.current) {
                  cancelAnimationFrame(inertiaRef.current);
                  inertiaRef.current = 0;
                }
              }}
              onDragMove={(event: DragMoveEvent) => {
                const id = String(event.active.id);
                const block = blocks.find(item => item.id === id);
                if (!block) return;
                const factor = precisionMode || precisionRef.current ? 0.3 : 1;
                const nx = block.x + (event.delta.x * factor) / zoom;
                const ny = block.y + (event.delta.y * factor) / zoom;
                const v: number[] = [];
                const h: number[] = [];
                for (const other of blocks) {
                  if (other.id === id) continue;
                  for (const c of [
                    other.x,
                    other.x + other.width,
                    other.x - block.width,
                  ])
                    if (Math.abs(nx - c) < 12) v.push(c);
                  for (const c of [
                    other.y,
                    other.y + blockHeight(other),
                    other.y - blockHeight(block),
                  ])
                    if (Math.abs(ny - c) < 12) h.push(c);
                }
                const gx = Math.round(nx / 16) * 16;
                const gy = Math.round(ny / 16) * 16;
                if (Math.abs(nx - gx) < 12) v.push(gx);
                if (Math.abs(ny - gy) < 12) h.push(gy);
                setGuides({ v: [...new Set(v)], h: [...new Set(h)] });
                const guideCount = v.length + h.length;
                if (guideCount > 0 && guideCount !== lastGuidesRef.current) {
                  navigator.vibrate?.(10);
                }
                lastGuidesRef.current = guideCount;
                const centerX = nx + block.width / 2;
                const centerY = ny + blockHeight(block) / 2;
                let target: string | null = null;
                for (const other of blocks) {
                  if (other.id === id || other.parentId !== undefined) continue;
                  if (
                    centerX >= other.x &&
                    centerX <= other.x + other.width &&
                    centerY >= other.y &&
                    centerY <= other.y + blockHeight(other)
                  ) {
                    target = other.id;
                    break;
                  }
                }
                setDropTarget(target);
                const now = performance.now();
                if (lastMoveRef.current) {
                  const dt = Math.max(1, now - lastMoveRef.current.t);
                  velocityRef.current = {
                    x: (event.delta.x - lastMoveRef.current.x) / dt,
                    y: (event.delta.y - lastMoveRef.current.y) / dt,
                  };
                }
                lastMoveRef.current = {
                  x: event.delta.x,
                  y: event.delta.y,
                  t: now,
                };
              }}
              onDragEnd={(event: DragEndEvent) => {
                const id = String(event.active.id);
                const block = blocks.find(item => item.id === id);
                setActiveId(null);
                setGuides({ v: [], h: [] });
                lastGuidesRef.current = 0;
                if (!block) {
                  setDropTarget(null);
                  return;
                }
                const factor = precisionMode || precisionRef.current ? 0.3 : 1;
                moveBlock(
                  id,
                  block.x + (event.delta.x * factor) / zoom,
                  block.y + (event.delta.y * factor) / zoom,
                  true
                );
                if (dropTarget && dropTarget !== id) {
                  mergeBlocks([id, dropTarget]);
                  navigator.vibrate?.([20, 30, 20]);
                }
                setDropTarget(null);
                const speed = Math.hypot(
                  velocityRef.current.x,
                  velocityRef.current.y
                );
                const vx = velocityRef.current.x;
                const vy = velocityRef.current.y;
                lastMoveRef.current = null;
                velocityRef.current = { x: 0, y: 0 };
                if (factor === 1 && speed > 0.6) {
                  startInertia(id, vx, vy, zoom);
                }
              }}
              onDragCancel={() => {
                setActiveId(null);
                setGuides({ v: [], h: [] });
                setDropTarget(null);
                lastGuidesRef.current = 0;
              }}
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
            {guides.v.map((position, index) => (
              <div
                key={`guide-v-${index}`}
                className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-[#f59e0b]"
                style={{ left: position }}
              />
            ))}
            {guides.h.map((position, index) => (
              <div
                key={`guide-h-${index}`}
                className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-[#f59e0b]"
                style={{ top: position }}
              />
            ))}
            {dropBlock && (
              <div
                className="pointer-events-none absolute z-30 flex items-start justify-center rounded-md border-2 border-dashed border-emerald-400"
                style={{
                  left: dropBlock.x,
                  top: dropBlock.y,
                  width: dropBlock.width,
                  height: blockHeight(dropBlock),
                }}
              >
                <span className="mt-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Merge
                </span>
              </div>
            )}
          </div>
        </div>
        {singleSelected && editingId !== singleSelected.id && !activeId && (
          <SelectionFrame
            block={singleSelected}
            zoom={zoom}
            artboardRef={artboardRef}
            viewportEl={innerViewport.current}
            scrollTick={scrollTick}
          />
        )}
      </div>
      <FloatingActions
        visible={!activeId && !editingId && !mobileDocked}
        precision={precisionMode}
        onTogglePrecision={() => setPrecisionMode(value => !value)}
      />
      {precisionMode && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full bg-emerald-500/90 px-3 py-1 text-[11px] font-semibold text-white shadow-lg">
          Precision move · 0.3x
        </div>
      )}
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
