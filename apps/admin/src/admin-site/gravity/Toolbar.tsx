"use client";

import { Button } from "@/components/ui/button";
import { Combine, Eraser, ImagePlus, Layers, LayoutTemplate, Maximize2, MousePointer2, Music2, PanelRight, SquareMousePointer, Trash2, Type, Ungroup, Video } from "lucide-react";
import { useState } from "react";
import { useEditorStore } from "./store";

export function GravityToolbar({ previewing, onTogglePreview, onOpenTemplates, showLayers, onToggleLayers, showInspector, onToggleInspector, onEnterDeepDive }: {
  previewing: boolean;
  onTogglePreview: (previewing: boolean) => void;
  onOpenTemplates: () => void;
  showLayers: boolean;
  onToggleLayers: (show: boolean) => void;
  showInspector: boolean;
  onToggleInspector: (show: boolean) => void;
  onEnterDeepDive?: () => void;
}) {
  const addBlock = useEditorStore(state => state.addBlock);
  const selected = useEditorStore(state => state.selected);
  const blocks = useEditorStore(state => state.blocks);
  const mergeSelection = useEditorStore(state => state.mergeSelection);
  const detachSelection = useEditorStore(state => state.detachSelection);
  const deleteBlocks = useEditorStore(state => state.deleteBlocks);
  const clearAll = useEditorStore(state => state.clearAll);
  const clearSelection = useEditorStore(state => state.clearSelection);
  const [armClear, setArmClear] = useState(false);

  const buttonClass = "h-9 gap-2";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-2 shadow-sm">
      <span className="inline-flex items-center gap-1.5 px-2 font-label text-[10px] uppercase tracking-wide text-muted-foreground"><MousePointer2 className="h-3.5 w-3.5" />Blocks</span>
      <Button type="button" size="sm" variant="outline" className={buttonClass} onClick={() => addBlock("text")}><Type className="h-4 w-4" />Text</Button>
      <Button type="button" size="sm" variant="outline" className={buttonClass} onClick={() => addBlock("image")}><ImagePlus className="h-4 w-4" />Image</Button>
      <Button type="button" size="sm" variant="outline" className={buttonClass} onClick={() => addBlock("video")}><Video className="h-4 w-4" />Video</Button>
      <Button type="button" size="sm" variant="outline" className={buttonClass} onClick={() => addBlock("audio")}><Music2 className="h-4 w-4" />Audio</Button>
      <Button type="button" size="sm" variant="outline" className={buttonClass} onClick={() => addBlock("button")}><SquareMousePointer className="h-4 w-4" />Button</Button>
      <span className="mx-1 h-5 w-px bg-border" />
      <Button type="button" size="sm" variant="outline" className={`${buttonClass} border-primary/40 text-primary`} onClick={onOpenTemplates}><LayoutTemplate className="h-4 w-4" />Templates</Button>
      <span className="mx-1 h-5 w-px bg-border" />
      <Button type="button" size="sm" variant="outline" className={buttonClass} disabled={selected.length < 2} onClick={mergeSelection}><Combine className="h-4 w-4" />Merge section</Button>
      <Button type="button" size="sm" variant="outline" className={buttonClass} disabled={!selected.length || !blocks.some(block => block.parentId && selected.includes(block.id))} onClick={() => { detachSelection(); clearSelection(); }}><Ungroup className="h-4 w-4" />Detach</Button>
      <Button type="button" size="sm" variant="outline" className={buttonClass} disabled={!selected.length} onClick={() => deleteBlocks(selected)}><Trash2 className="h-4 w-4" />Delete</Button>
      <Button type="button" size="sm" variant="outline" className={buttonClass} disabled={!blocks.length} onClick={() => { if (armClear) { clearAll(); setArmClear(false); } else setArmClear(true); }}><Eraser className="h-4 w-4" />{armClear ? "Confirm clear" : "Clear"}</Button>
      <span className="mx-1 h-5 w-px bg-border" />
      <Button type="button" size="sm" variant={showLayers ? "secondary" : "outline"} className={buttonClass} onClick={() => onToggleLayers(!showLayers)}><Layers className="h-4 w-4" />Layers</Button>
      <Button type="button" size="sm" variant={showInspector ? "secondary" : "outline"} className={buttonClass} onClick={() => onToggleInspector(!showInspector)}><PanelRight className="h-4 w-4" />Inspector</Button>
      <Button type="button" size="sm" variant={previewing ? "secondary" : "outline"} className={buttonClass} onClick={() => onTogglePreview(!previewing)}>Preview layout</Button>
      {onEnterDeepDive && <span className="mx-1 h-5 w-px bg-border" />}
      {onEnterDeepDive && <Button type="button" size="sm" variant="outline" className={`${buttonClass} border-primary/40 text-primary`} onClick={onEnterDeepDive}><Maximize2 className="h-4 w-4" />Deep dive</Button>}
    </div>
  );
}
