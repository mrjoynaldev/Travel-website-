"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Image as ImageIcon, Music2, Video } from "lucide-react";
import { postTemplates, CANVAS_WIDTH, type Template } from "./templates";
import type { GravityBlock } from "./types";

function MiniPreview({ blocks }: { blocks: GravityBlock[] }) {
  const scale = 150 / CANVAS_WIDTH;
  return (
    <div className="relative h-24 w-full overflow-hidden rounded-md border border-border bg-muted/30">
      {blocks.map(block => {
        const height = (block.type === "text" ? 16 : 46) * scale;
        return (
          <div key={block.id} className="absolute" style={{ left: block.x * scale, top: block.y * scale, width: block.width * scale, height }}>
            {block.type === "text" ? (
              <div className="h-full w-full rounded-[2px] bg-neutral-300" />
            ) : (
              <div className="grid h-full w-full place-items-center rounded-[2px] border border-primary/40 bg-primary/15 text-primary">
                {block.type === "image" ? <ImageIcon className="h-2.5 w-2.5" /> : block.type === "audio" ? <Music2 className="h-2.5 w-2.5" /> : <Video className="h-2.5 w-2.5" />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TemplatesDialog({ open, onClose, onUse, onAppend }: { open: boolean; onClose: () => void; onUse: (template: Template) => void; onAppend: (template: Template) => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle className="font-display text-2xl">Post templates</DialogTitle><DialogDescription>Start from a layout for every kind of story — text, hybrid, image-led, video, or announcement. You can still rearrange everything on the canvas.</DialogDescription></DialogHeader>
        <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-3">
          {postTemplates.map(template => (
            <div key={template.id} className="flex flex-col rounded-xl border border-border bg-white p-3 transition hover:border-primary/50 hover:shadow-sm">
              <MiniPreview blocks={template.blocks} />
              <div className="mt-2 flex items-center gap-2"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{template.category}</span></div>
              <p className="mt-1.5 text-sm font-semibold">{template.name}</p>
              <p className="mt-1 min-h-8 text-xs text-muted-foreground">{template.description}</p>
              <div className="mt-2 flex gap-2">
                <Button type="button" size="sm" className="flex-1" onClick={() => onUse(template)}>Use template</Button>
                <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => onAppend(template)}>Add to canvas</Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
