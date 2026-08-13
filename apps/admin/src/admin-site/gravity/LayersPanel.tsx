"use client";

import { ChevronRight, FileText, Image as ImageIcon, Music2, SquareMousePointer, Video, X } from "lucide-react";
import { useEditorStore } from "./store";

export function LayersPanel() {
  const blocks = useEditorStore(state => state.blocks);
  const sections = useEditorStore(state => state.sections);
  const selected = useEditorStore(state => state.selected);
  const selectBlock = useEditorStore(state => state.selectBlock);
  const deleteBlocks = useEditorStore(state => state.deleteBlocks);

  const ungrouped = blocks.filter(block => !block.parentId);
  const grouped = sections.map(section => ({ section, blocks: blocks.filter(block => block.parentId === section.id) })).filter(group => group.blocks.length);

  const Icon = ({ block }: { block: (typeof blocks)[number] }) => block.type === "image" ? <ImageIcon className="h-3 w-3" /> : block.type === "video" ? <Video className="h-3 w-3" /> : block.type === "audio" ? <Music2 className="h-3 w-3" /> : block.type === "button" ? <SquareMousePointer className="h-3 w-3" /> : <FileText className="h-3 w-3" />;
  const label = (block: (typeof blocks)[number]) => (block.type === "text" ? (block.content || "Text").slice(0, 28) : block.type === "button" ? (block.content || "Button").slice(0, 28) : block.caption || block.url || (block.type === "image" ? "Image" : block.type === "audio" ? "Audio" : "Video"));

  const Row = ({ block, depth }: { block: (typeof blocks)[number]; depth?: number }) => {
    const active = selected.includes(block.id);
    return (
      <div className="group flex items-center gap-1.5 pr-1" style={{ paddingLeft: depth ? (depth - 1) * 16 + 8 : 8 }}>
        <button type="button" onClick={() => selectBlock(block.id, false)} className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 py-1 text-left text-xs ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
          <span className="shrink-0 text-muted-foreground"><Icon block={block} /></span>
          <span className="truncate">{label(block)}</span>
        </button>
        <button type="button" aria-label="Delete block" className="hidden h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground hover:text-destructive group-hover:grid" onClick={() => deleteBlocks([block.id])}><X className="h-3 w-3" /></button>
      </div>
    );
  };

  return (
    <div className="flex max-h-full min-h-0 flex-col rounded-xl border border-border bg-white shadow-sm">
      <p className="flex items-center gap-1.5 border-b border-border px-3 py-2 font-label text-[10px] uppercase tracking-wide text-muted-foreground">Layers {blocks.length > 0 && <span className="text-muted-foreground/60">· {blocks.length}</span>}</p>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5">
        {grouped.map(({ section, blocks: children }) => (
          <div key={section.id} className="rounded-md border border-dashed border-primary/30 bg-primary/5">
            <div className="flex items-center gap-1 px-1.5 py-1 text-[10px] font-medium text-primary"><ChevronRight className="h-3 w-3" />{section.label}</div>
            {children.map(block => <Row key={block.id} block={block} depth={2} />)}
          </div>
        ))}
        {ungrouped.map(block => <Row key={block.id} block={block} depth={1} />)}
        {!blocks.length && <p className="px-3 py-6 text-center text-xs text-muted-foreground">No blocks yet</p>}
      </div>
    </div>
  );
}
