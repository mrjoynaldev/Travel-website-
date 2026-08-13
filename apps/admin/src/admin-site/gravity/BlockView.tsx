"use client";

import type { DraggableAttributes, useDraggable } from "@dnd-kit/core";
import { MediaUploadButton } from "@/admin-site/components/MediaUploadButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Pencil, Trash2, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "./store";
import type { GravityBlock } from "./types";

type DraggableListeners = ReturnType<typeof useDraggable>["listeners"];

export function BlockView({ block, selected, isDragging, listeners, attributes }: { block: GravityBlock; selected: boolean; isDragging?: boolean; listeners?: DraggableListeners; attributes?: DraggableAttributes }) {
  const updateBlock = useEditorStore(state => state.updateBlock);
  const deleteBlocks = useEditorStore(state => state.deleteBlocks);
  const [editOpen, setEditOpen] = useState(false);
  const [text, setText] = useState(block.content || "");
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editOpen && block.type === "text") textRef.current?.focus();
  }, [editOpen, block.type]);

  const commitText = () => updateBlock(block.id, { content: text });

  return (
    <div
      {...(attributes || {})}
      {...(listeners || {})}
      onDoubleClick={event => {
        if (block.type === "text") { event.stopPropagation(); setText(block.content || ""); setEditOpen(true); }
      }}
      className={`group relative rounded-xl border bg-white p-3 shadow-sm transition-shadow ${selected ? "border-primary ring-2 ring-primary/30" : "border-border"} ${isDragging ? "opacity-60" : ""}`}
      style={{ width: block.width }}
    >
      <div className="absolute right-1.5 top-1.5 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100" onPointerDown={event => event.stopPropagation()}>
        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground" aria-label="Edit block" onClick={event => { event.stopPropagation(); setEditOpen(value => !value); }}><Pencil className="h-3 w-3" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" aria-label="Delete block" onClick={event => { event.stopPropagation(); deleteBlocks([block.id]); }}><Trash2 className="h-3 w-3" /></Button>
      </div>
      {block.type === "text" && (editOpen ? (
        <textarea ref={textRef} value={text} onChange={event => setText(event.target.value)} onBlur={commitText} rows={4} className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" onPointerDown={event => event.stopPropagation()} />
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{block.content || "Empty text block"}</p>
      ))}
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
      {editOpen && block.type !== "text" && (
        <div className="mt-3 space-y-2 border-t border-border pt-3" onPointerDown={event => event.stopPropagation()}>
          <Input value={block.url || ""} onChange={event => updateBlock(block.id, { url: event.target.value })} placeholder={block.type === "image" ? "Image URL" : "YouTube, Vimeo or video URL"} className="h-8 text-xs" />
          <Input value={block.caption || ""} onChange={event => updateBlock(block.id, { caption: event.target.value })} placeholder="Caption" className="h-8 text-xs" />
          {block.type === "image" && <MediaUploadButton accept="image/jpeg,image/png,image/webp,image/gif" folder="library" label="Upload image" className="h-8 w-full" onUploaded={asset => updateBlock(block.id, { url: asset.url })} />}
        </div>
      )}
    </div>
  );
}
