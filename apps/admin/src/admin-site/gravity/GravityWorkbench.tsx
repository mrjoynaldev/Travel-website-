"use client";

import { Compass } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GravityCanvas } from "./GravityCanvas";
import { ImportDialog } from "./ImportDialog";
import { InspectorPanel } from "./Inspector";
import { LayersPanel } from "./LayersPanel";
import { GravityPreview } from "./Preview";
import { useEditorStore } from "./store";
import { TemplatesDialog } from "./TemplatesDialog";
import { offsetTemplate, type Template } from "./templates";
import { GravityToolbar } from "./Toolbar";

export function GravityWorkbench({ onEnterDeepDive }: { onEnterDeepDive?: () => void }) {
  const [view, setView] = useState<"design" | "preview">("design");
  const [showLayers, setShowLayers] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const blocks = useEditorStore(state => state.blocks);
  const sections = useEditorStore(state => state.sections);
  const selected = useEditorStore(state => state.selected);
  const loadDoc = useEditorStore(state => state.loadDoc);
  const selectedBlock = blocks.find(block => selected.length === 1 && block.id === selected[0]);

  const useTemplate = (template: Template) => {
    loadDoc(offsetTemplate(template, 0, 0));
    setTemplatesOpen(false);
    toast.success(`${template.name} layout loaded.`);
  };
  const appendTemplate = (template: Template) => {
    const dy = blocks.length ? Math.max(0, ...blocks.map(block => block.y + 240)) : 0;
    const doc = offsetTemplate(template, 0, dy);
    loadDoc({ type: "gravity", version: 1, sections: [...sections, ...doc.sections], blocks: [...blocks, ...doc.blocks] });
    setTemplatesOpen(false);
    toast.success(`${template.name} added below your current layout.`);
  };

  return (
    <div className="space-y-4">
      <GravityToolbar previewing={view === "preview"} onTogglePreview={open => setView(open ? "preview" : "design")} onOpenTemplates={() => setTemplatesOpen(true)} onOpenImport={() => setImportOpen(true)} showLayers={showLayers} onToggleLayers={setShowLayers} showInspector={showInspector} onToggleInspector={setShowInspector} onEnterDeepDive={onEnterDeepDive} />
      <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground"><Compass className="h-3.5 w-3.5" />Start from a template, then drag blocks on the artboard. Snap guides align nearby blocks; Shift/Ctrl-click to multi-select, then merge into a section. Double-click text to edit, or use the inspector.</p>
      {view === "preview" ? (
        <GravityPreview />
      ) : (
        <div className="flex flex-col gap-4 xl:flex-row">
          {showLayers && <aside className="h-64 w-full shrink-0 overflow-hidden xl:h-[72vh] xl:w-52"><LayersPanel /></aside>}
          <div className="min-w-0 flex-1"><GravityCanvas /></div>
          {showInspector && <aside className="w-full shrink-0 xl:w-60"><InspectorPanel block={selectedBlock} /></aside>}
        </div>
      )}
      <TemplatesDialog open={templatesOpen} onClose={() => setTemplatesOpen(false)} onUse={useTemplate} onAppend={appendTemplate} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
