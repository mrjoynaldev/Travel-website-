"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, MousePointerClick, Trash2 } from "lucide-react";
import { MediaPicker, type MediaKind } from "./MediaPicker";
import { useEditorStore } from "./store";
import type { GravityBlock } from "./types";

const TYPE_LABEL: Record<GravityBlock["type"], string> = { text: "Text", image: "Image", video: "Video", audio: "Audio", button: "Button", code: "Code", custom: "Custom HTML" };

export function InspectorPanel({ block }: { block: GravityBlock | undefined }) {
  const updateBlock = useEditorStore(state => state.updateBlock);
  const moveBlock = useEditorStore(state => state.moveBlock);
  const deleteBlocks = useEditorStore(state => state.deleteBlocks);

  if (!block) {
    return <div className="rounded-xl border border-border bg-white p-6 text-center shadow-sm"><MousePointerClick className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-xs text-muted-foreground">Select a block on the canvas to inspect and adjust it here.</p></div>;
  }

  const field = "mt-3";
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <p className="flex items-center gap-1.5 border-b border-border px-3 py-2 font-label text-[10px] uppercase tracking-wide text-muted-foreground">Inspector · {TYPE_LABEL[block.type]}</p>
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-[10px] text-muted-foreground">X</Label><Input type="number" value={block.x} onChange={event => moveBlock(block.id, Number(event.target.value), block.y, false)} className="mt-1 h-8" /></div>
          <div><Label className="text-[10px] text-muted-foreground">Y</Label><Input type="number" value={block.y} onChange={event => moveBlock(block.id, block.x, Number(event.target.value), false)} className="mt-1 h-8" /></div>
          <div><Label className="text-[10px] text-muted-foreground">Width</Label><Input type="number" min={80} max={1140} value={block.width} onChange={event => updateBlock(block.id, { width: Number(event.target.value) })} className="mt-1 h-8" /></div>
        </div>
        {block.type === "text" && (
          <>
            <div className={field}><Label className="text-[10px] text-muted-foreground">Style</Label><div className="mt-1 flex flex-wrap gap-1">{([["h2", "Heading"], ["h3", "Subheading"], ["p", "Paragraph"], ["quote", "Quote"], ["list", "List"]] as const).map(([level, label]) => <button key={level} type="button" onClick={() => updateBlock(block.id, { level })} className={`rounded-md px-2.5 py-1 text-xs font-medium ${block.level === level ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{label}</button>)}</div></div>
            <div className={field}><Label className="text-[10px] text-muted-foreground">Content</Label><textarea value={block.content || ""} onChange={event => updateBlock(block.id, { content: event.target.value })} rows={4} className="mt-1 w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          </>
        )}
        {block.type === "button" && (
          <>
            <div className={field}><Label className="text-[10px] text-muted-foreground">Label</Label><Input value={block.content || ""} onChange={event => updateBlock(block.id, { content: event.target.value })} placeholder="e.g. Learn more" className="mt-1 h-8 text-xs" /></div>
            <div className={field}><Label className="text-[10px] text-muted-foreground">Link trigger</Label><Input value={block.link || ""} onChange={event => updateBlock(block.id, { link: event.target.value })} placeholder="https://…" className="mt-1 h-8 text-xs" /></div>
          </>
        )}
        {block.type === "code" && (
          <>
            <div className={field}><Label className="text-[10px] text-muted-foreground">Language</Label><Input value={block.language || ""} onChange={event => updateBlock(block.id, { language: event.target.value })} placeholder="javascript, python, bash…" className="mt-1 h-8 text-xs" /></div>
            <div className={field}><Label className="text-[10px] text-muted-foreground">Code</Label><textarea value={block.content || ""} onChange={event => updateBlock(block.id, { content: event.target.value })} rows={10} placeholder="Paste your code here…" className="mt-1 w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          </>
        )}
        {(block.type === "image" || block.type === "video" || block.type === "audio") && (
          <>
            <div className={field}><Label className="text-[10px] text-muted-foreground">{block.type === "image" ? "Image" : block.type === "audio" ? "Audio" : "Video"}</Label><div className="mt-1"><MediaPicker kind={block.type as MediaKind} url={block.url} onChange={url => updateBlock(block.id, { url })} /></div></div>
            {block.type === "image" && (
              <div className={field}><Label className="text-[10px] text-muted-foreground">Alt text</Label><Input value={block.alt || ""} onChange={event => updateBlock(block.id, { alt: event.target.value })} placeholder="Describe this image for SEO & accessibility" className="mt-1 h-8 text-xs" /><p className="mt-1 text-[10px] text-muted-foreground">Falls back to the caption when empty.</p></div>
            )}
            <div className={field}><Label className="text-[10px] text-muted-foreground">Caption</Label><Input value={block.caption || ""} onChange={event => updateBlock(block.id, { caption: event.target.value })} className="mt-1 h-8 text-xs" /></div>
          </>
        )}
        {block.type === "custom" && (
          <>
            <div className={field}><Label className="text-[10px] text-muted-foreground">Custom HTML</Label><textarea value={block.content || ""} onChange={event => updateBlock(block.id, { content: event.target.value })} rows={10} placeholder={'<div class="my-chart">…</div>'} className="mt-1 w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">Rendered verbatim on the published article. Charts, slides, custom boxes, embeds — anything.</p>
          </>
        )}
        {block.type !== "button" && (
          <div className={field}><Label className="text-[10px] text-muted-foreground">Link trigger</Label><Input value={block.link || ""} onChange={event => updateBlock(block.id, { link: event.target.value })} placeholder="Wraps this block as a click target" className="mt-1 h-8 text-xs" /></div>
        )}
        {block.link && <p className="mt-1.5 flex items-center gap-1 text-[10px] text-primary"><Link2 className="h-3 w-3" />Will link to {block.link}</p>}
        <Button type="button" variant="outline" size="sm" className="mt-4 w-full gap-2 text-destructive hover:text-destructive" onClick={() => deleteBlocks([block.id])}><Trash2 className="h-3.5 w-3.5" />Delete block</Button>
      </div>
    </div>
  );
}
