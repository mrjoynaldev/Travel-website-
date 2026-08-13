"use client";

import type { DraggableAttributes, useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Link2, Music2, Pencil, Trash2, Video, Youtube } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MediaPicker, type MediaKind } from "./MediaPicker";
import { youtubeId } from "./serialize";
import { useEditorStore } from "./store";
import type { GravityBlock } from "./types";

type DraggableListeners = ReturnType<typeof useDraggable>["listeners"];

export function BlockView({ block, selected, isDragging, listeners, attributes }: { block: GravityBlock; selected: boolean; isDragging?: boolean; listeners?: DraggableListeners; attributes?: DraggableAttributes }) {
  const updateBlock = useEditorStore(state => state.updateBlock);
  const deleteBlocks = useEditorStore(state => state.deleteBlocks);
  const editingId = useEditorStore(state => state.editingId);
  const setEditing = useEditorStore(state => state.setEditing);
  const [editOpen, setEditOpen] = useState(false);
  const [text, setText] = useState(block.content || "");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const textEditing = block.type === "text" && editingId === block.id;

  useEffect(() => {
    if (textEditing) { setText(block.content || ""); textRef.current?.focus(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textEditing]);

  const commitText = () => { updateBlock(block.id, { content: text }); setEditing(null); };
  const shell = block.type === "button" ? "group relative rounded-xl border-2 border-dashed border-border bg-transparent p-1.5 transition-shadow" : "group relative rounded-xl border bg-white p-3 shadow-sm transition-shadow";

  return (
    <div
      {...(attributes || {})}
      {...(listeners || {})}
      onDoubleClick={event => {
        if (block.type === "text") { event.stopPropagation(); setText(block.content || ""); setEditing(block.id); }
      }}
      className={`${shell} ${selected ? "border-primary ring-2 ring-primary/30" : ""} ${isDragging ? "opacity-60" : ""}`}
      style={{ width: block.width }}
    >
      <div className="absolute right-1.5 top-1.5 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100" onPointerDown={event => event.stopPropagation()}>
        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground" aria-label="Edit block" onClick={event => { event.stopPropagation(); if (block.type === "text") setEditing(block.id); else setEditOpen(value => !value); }}><Pencil className="h-3 w-3" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" aria-label="Delete block" onClick={event => { event.stopPropagation(); deleteBlocks([block.id]); }}><Trash2 className="h-3 w-3" /></Button>
      </div>
      {block.type === "text" && (textEditing ? (
        <div className="space-y-2">
          <div className="flex gap-1" onPointerDown={event => event.stopPropagation()}>
            {(["h2", "p"] as const).map(level => <button key={level} type="button" onClick={event => { event.stopPropagation(); updateBlock(block.id, { level }); }} className={`rounded-md px-2 py-1 text-[10px] font-medium ${block.level === level ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{level === "h2" ? "Heading" : "Paragraph"}</button>)}
          </div>
          <textarea ref={textRef} value={text} onChange={event => setText(event.target.value)} onBlur={commitText} rows={4} className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" onPointerDown={event => event.stopPropagation()} />
          <Input value={block.link || ""} onChange={event => updateBlock(block.id, { link: event.target.value })} placeholder="Optional link trigger, e.g. https://…" className="h-8 text-xs" onPointerDown={event => event.stopPropagation()} />
        </div>
      ) : (
        <p className={`whitespace-pre-wrap leading-relaxed text-foreground ${block.level === "h2" ? "font-display text-xl font-semibold" : "text-sm"}`}>{block.content || "Empty text block"}</p>
      ))}
      {block.type === "button" && (
        <div className="grid place-items-center">
          <div className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm">{block.content || "Button"}</div>
        </div>
      )}
      {block.type === "image" && (block.url ? (
        <>
          <img src={block.url} alt={block.caption || ""} className="h-32 w-full rounded-lg object-cover" />
          {block.caption && <p className="mt-1.5 text-xs text-muted-foreground">{block.caption}</p>}
        </>
      ) : (
        <div className="grid h-32 place-items-center rounded-lg border border-dashed border-border bg-muted/40"><ImagePlus className="h-5 w-5 text-muted-foreground" /></div>
      ))}
      {block.type === "video" && (block.url ? (
        <>
          {block.url.match(/youtube|youtu\.be|vimeo|\.mp4|\.webm/) ? <div className="h-32 w-full overflow-hidden rounded-lg bg-black"><video src={block.url} className="h-full w-full object-contain" controls /></div> : <div className="grid h-32 place-items-center rounded-lg border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">{block.url}</div>}
          {block.caption && <p className="mt-1.5 text-xs text-muted-foreground">{block.caption}</p>}
        </>
      ) : (
        <div className="grid h-32 place-items-center rounded-lg border border-dashed border-border bg-muted/40"><Video className="h-5 w-5 text-muted-foreground" /></div>
      ))}
      {block.type === "audio" && (block.url ? (
        youtubeId(block.url) ? (
          <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-[#f4f6f8] px-3">
            <Youtube className="h-4 w-4 shrink-0 text-red-600" />
            <span className="min-w-0 truncate text-xs text-muted-foreground">YouTube link · plays as audio-only strip</span>
          </div>
        ) : (
          <>
            <audio src={block.url} controls preload="metadata" className="h-10 w-full" />
            {block.caption && <p className="mt-1.5 text-xs text-muted-foreground">{block.caption}</p>}
          </>
        )
      ) : (
        <div className="grid h-14 place-items-center rounded-lg border border-dashed border-border bg-muted/40"><Music2 className="h-5 w-5 text-muted-foreground" /></div>
      ))}
      {block.link && <p className="mt-1 flex items-center gap-1 text-[10px] text-primary"><Link2 className="h-3 w-3" />Linked to {block.link}</p>}
      {editOpen && block.type !== "text" && (
        <div className="mt-3 space-y-2 border-t border-border pt-3" onPointerDown={event => event.stopPropagation()}>
          {block.type === "button" ? (
            <>
              <Input value={block.content || ""} onChange={event => updateBlock(block.id, { content: event.target.value })} placeholder="Button label, e.g. Learn more" className="h-8 text-xs" />
              <Input value={block.link || ""} onChange={event => updateBlock(block.id, { link: event.target.value })} placeholder="Link URL, e.g. https://codereportglobal.com/pricing" className="h-8 text-xs" />
            </>
          ) : (
            <>
              <MediaPicker kind={block.type as MediaKind} url={block.url} onChange={url => updateBlock(block.id, { url })} />
              <Input value={block.caption || ""} onChange={event => updateBlock(block.id, { caption: event.target.value })} placeholder="Caption" className="h-8 text-xs" />
              <Input value={block.link || ""} onChange={event => updateBlock(block.id, { link: event.target.value })} placeholder="Optional link trigger (wraps this block as a click target)" className="h-8 text-xs" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
