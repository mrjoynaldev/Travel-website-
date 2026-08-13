"use client";

import { useRef, useState } from "react";
import { useEditorStore } from "./store";

const SENSITIVITY = 1.4;

type Gesture = { id: number | null; startX: number; startY: number; moved: boolean; grabbing: boolean; blockId: string | null };

export function MousePad({ viewportRef }: { viewportRef: { current: HTMLDivElement | null } }) {
  const padRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture>({ id: null, startX: 0, startY: 0, moved: false, grabbing: false, blockId: null });
  const longPressTimer = useRef<number | null>(null);
  const tapTimer = useRef<number | null>(null);
  const lastTapAt = useRef(0);

  const cancelLongPress = () => { if (longPressTimer.current !== null) { window.clearTimeout(longPressTimer.current); longPressTimer.current = null; } };
  const clearTaps = () => { if (tapTimer.current !== null) { window.clearTimeout(tapTimer.current); tapTimer.current = null; } };

  const blockIdAt = (clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const host = el?.closest?.("[data-block-id]");
    return host ? String(host.getAttribute("data-block-id")) : null;
  };

  const dispatchAt = (clientX: number, clientY: number, type: "click" | "dblclick") => {
    const el = document.elementFromPoint(clientX, clientY);
    if (el) el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const padRect = padRef.current?.getBoundingClientRect();
    if (!padRect) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      setCursor({ x: event.clientX - padRect.left, y: event.clientY - padRect.top });
      const g = gesture.current;
      g.id = event.pointerId; g.startX = event.clientX; g.startY = event.clientY; g.moved = false; g.grabbing = false; g.blockId = null;
      cancelLongPress();
      longPressTimer.current = window.setTimeout(() => {
        const g2 = gesture.current;
        if (g2.id === event.pointerId && pointers.current.size === 1 && !g2.moved) {
          const blockId = blockIdAt(event.clientX, event.clientY);
          if (blockId) { g2.grabbing = true; g2.blockId = blockId; }
        }
      }, 380);
    } else {
      cancelLongPress();
      gesture.current.grabbing = false;
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.pointerType === "mouse" && event.buttons === 0) return;
    const prev = pointers.current.get(event.pointerId);
    if (!prev) return;
    const dx = event.clientX - prev.x;
    const dy = event.clientY - prev.y;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size >= 2) {
      const vp = viewportRef.current;
      if (vp) { vp.scrollLeft -= dx; vp.scrollTop -= dy; }
      return;
    }
    const g = gesture.current;
    if (g.id !== event.pointerId) return;
    if (g.grabbing && g.blockId) {
      const state = useEditorStore.getState();
      const block = state.blocks.find(item => item.id === g.blockId);
      if (block) state.moveBlock(g.blockId, block.x + dx / state.zoom, block.y + dy / state.zoom, false);
      g.moved = true;
    } else {
      const padRect = padRef.current?.getBoundingClientRect();
      if (padRect) setCursor(prevCursor => {
        const base = prevCursor ?? { x: event.clientX - padRect.left, y: event.clientY - padRect.top };
        return { x: Math.min(padRect.width, Math.max(0, base.x + dx * SENSITIVITY)), y: Math.min(padRect.height, Math.max(0, base.y + dy * SENSITIVITY)) };
      });
      const total = Math.hypot(event.clientX - g.startX, event.clientY - g.startY);
      if (total > 10) { g.moved = true; cancelLongPress(); }
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    pointers.current.delete(event.pointerId);
    const g = gesture.current;
    const total = Math.hypot(event.clientX - g.startX, event.clientY - g.startY);
    cancelLongPress();
    if (g.id === event.pointerId && !g.grabbing && !g.moved && total < 10 && pointers.current.size === 0) {
      const clientX = g.startX; const clientY = g.startY;
      const now = Date.now();
      if (now - lastTapAt.current < 320) {
        clearTaps(); lastTapAt.current = 0; dispatchAt(clientX, clientY, "dblclick");
      } else {
        lastTapAt.current = now;
        tapTimer.current = window.setTimeout(() => { tapTimer.current = null; dispatchAt(clientX, clientY, "click"); }, 280);
      }
    }
    g.id = null; g.grabbing = false; g.blockId = null; g.moved = false;
  };

  return (
    <div
      ref={padRef}
      className="absolute inset-0 z-30 select-none"
      style={{ touchAction: "none", cursor: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="pointer-events-none absolute inset-0 bg-sky-400/[0.04]" />
      {cursor && (
        <div className="pointer-events-none absolute z-40" style={{ left: cursor.x, top: cursor.y, transform: "translate(-50%, -50%)" }}>
          <div className="grid h-4 w-4 place-items-center rounded-full border border-white bg-black/60 shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"><div className="h-1.5 w-1.5 rounded-full bg-white" /></div>
        </div>
      )}
    </div>
  );
}
