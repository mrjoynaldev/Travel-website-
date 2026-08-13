"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Eye,
  ImagePlus,
  Layers,
  LayoutTemplate,
  Maximize,
  Minus,
  Minimize2,
  MousePointer2,
  Music2,
  PanelRight,
  Plus,
  Send,
  Settings,
  SquareMousePointer,
  Stethoscope,
  Trash2,
  Type,
  Video,
} from "lucide-react";
import { GravityCanvas } from "./GravityCanvas";
import { runDoctor } from "./doctor";
import { InspectorPanel } from "./Inspector";
import { LayersPanel } from "./LayersPanel";
import { MousePad } from "./MousePad";
import {
  PostSettingsPanel,
  type PostDraft,
  type PostSettingsPanelProps,
} from "./PostSettingsPanel";
import { GravityPreview } from "./Preview";
import { RemotePanel } from "@/admin-site/components/RemotePanel";
import { useEditorStore } from "./store";
import { TemplatesDialog } from "./TemplatesDialog";
import { offsetTemplate, type Template, CANVAS_WIDTH } from "./templates";
import { StatusPill } from "@/admin-site/pages/Studio";
import { toast } from "sonner";

type DeepDiveProps = PostSettingsPanelProps & {
  onClose: () => void;
  onSave: () => void;
  savePending: boolean;
  onCreate: () => void;
  createPending: boolean;
  onTransition: (status: "review" | "published" | "draft" | "archived") => void;
  transitionPending: boolean;
  onDelete: () => void;
  deletePending: boolean;
  onOpenPreview: () => void;
};

export function DeepDive(props: DeepDiveProps) {
  const {
    onClose,
    draft,
    onSave,
    savePending,
    onCreate,
    createPending,
    onTransition,
    transitionPending,
    onDelete,
    deletePending,
    onOpenPreview,
    postId,
    status,
    canPublish,
  } = props;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mouseEnabled, setMouseEnabled] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const zoom = useEditorStore(state => state.zoom);
  const setZoom = useEditorStore(state => state.setZoom);
  const addBlock = useEditorStore(state => state.addBlock);
  const loadDoc = useEditorStore(state => state.loadDoc);
  const sections = useEditorStore(state => state.sections);
  const blocks = useEditorStore(state => state.blocks);
  const selected = useEditorStore(state => state.selected);
  const selectedBlock = blocks.find(
    block => selected.length === 1 && block.id === selected[0]
  );

  const fitZoom = () => {
    if (viewportRef.current)
      setZoom(
        Math.max(
          0.15,
          Math.min(1, (viewportRef.current.clientWidth - 64) / CANVAS_WIDTH)
        )
      );
  };

  const runDoctorNow = () => {
    const state = useEditorStore.getState();
    const healed = runDoctor(state.blocks, state.sections);
    if (!healed.fixes.length) {
      toast.success(
        "The background doctor checked the layout and found everything in place."
      );
      return;
    }
    state.loadDoc({
      type: "gravity",
      version: 1,
      sections: healed.sections,
      blocks: healed.blocks,
    });
    toast.info(
      `The background doctor fixed ${healed.fixes.length} issue${healed.fixes.length === 1 ? "" : "s"}: ${healed.fixes.join(", ")}`
    );
  };

  const useTemplate = (template: Template) => {
    loadDoc(offsetTemplate(template, 0, 0));
    setTemplatesOpen(false);
    toast.success(`${template.name} layout loaded.`);
  };
  const appendTemplate = (template: Template) => {
    const dy = blocks.length
      ? Math.max(0, ...blocks.map(block => block.y + 240))
      : 0;
    const doc = offsetTemplate(template, 0, dy);
    loadDoc({
      type: "gravity",
      version: 1,
      sections: [...sections, ...doc.sections],
      blocks: [...blocks, ...doc.blocks],
    });
    setTemplatesOpen(false);
    toast.success(`${template.name} added below your current layout.`);
  };

  const dockButton =
    "h-10 gap-1.5 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white";

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0c10] text-white">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit deep dive"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/40">
              Deep dive
            </p>
            <h2 className="truncate font-display text-lg font-semibold leading-tight">
              {draft.title || "Untitled gravity draft"}
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {postId && <StatusPill state={status} />}
          <button
            type="button"
            onClick={() => setSettingsOpen(value => !value)}
            className={`flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm font-medium ${settingsOpen ? "bg-white/15 text-white" : "bg-white/5 text-white/80"} hover:bg-white/10 hover:text-white`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={savePending || createPending}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
          >
            {savePending ? "Saving…" : postId ? "Save changes" : "Create draft"}
          </button>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div className="relative flex h-full min-w-0">
          <div className="relative min-w-0 flex-1 overflow-hidden">
            {previewMode ? (
              <div className="h-full overflow-auto">
                <div className="mx-auto max-w-3xl p-8">
                  <GravityPreview />
                </div>
              </div>
            ) : (
              <GravityCanvas viewportRef={viewportRef} hideZoomBar fullHeight />
            )}
            {mouseEnabled && !previewMode && (
              <MousePad viewportRef={viewportRef} />
            )}
            {showLayers && !previewMode && (
              <aside className="absolute left-4 top-4 z-20 h-[calc(100%-8rem)] w-56 overflow-hidden rounded-xl border border-white/10 bg-white text-slate-900 shadow-2xl">
                <LayersPanel />
              </aside>
            )}
            {showInspector && !previewMode && (
              <aside className="absolute right-4 top-4 z-20 max-h-[calc(100%-8rem)] w-60 overflow-y-auto rounded-xl border border-white/10 bg-white text-slate-900 shadow-2xl">
                <InspectorPanel block={selectedBlock} />
              </aside>
            )}
          </div>
          <RemotePanel />
        </div>
      </div>

      <footer className="flex h-16 shrink-0 items-center gap-2 overflow-x-auto border-t border-white/10 px-4">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={dockButton}
          onClick={() => setTemplatesOpen(true)}
        >
          <LayoutTemplate className="h-4 w-4" />
          Templates
        </Button>
        <div className="relative">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={dockButton}
            onClick={() => setAddOpen(value => !value)}
          >
            <Plus className="h-4 w-4" />
            Add block
          </Button>
          {addOpen && (
            <div className="absolute bottom-12 left-0 z-30 flex gap-1 rounded-xl border border-white/10 bg-[#10131a] p-1.5 shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  addBlock("text");
                  setAddOpen(false);
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Type className="h-3.5 w-3.5" />
                Text
              </button>
              <button
                type="button"
                onClick={() => {
                  addBlock("image");
                  setAddOpen(false);
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Image
              </button>
              <button
                type="button"
                onClick={() => {
                  addBlock("video");
                  setAddOpen(false);
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Video className="h-3.5 w-3.5" />
                Video
              </button>
              <button
                type="button"
                onClick={() => {
                  addBlock("audio");
                  setAddOpen(false);
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Music2 className="h-3.5 w-3.5" />
                Audio
              </button>
              <button
                type="button"
                onClick={() => {
                  addBlock("button");
                  setAddOpen(false);
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
              >
                <SquareMousePointer className="h-3.5 w-3.5" />
                Button
              </button>
            </div>
          )}
        </div>
        <span className="mx-1 h-6 w-px shrink-0 bg-white/10" />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={dockButton}
          onClick={() => setShowLayers(value => !value)}
        >
          <Layers className="h-4 w-4" />
          Layers
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={dockButton}
          onClick={() => setShowInspector(value => !value)}
        >
          <PanelRight className="h-4 w-4" />
          Inspector
        </Button>
        <Button
          type="button"
          size="sm"
          variant={previewMode ? "secondary" : "outline"}
          className={dockButton}
          onClick={() => setPreviewMode(value => !value)}
        >
          <Eye className="h-4 w-4" />
          Preview
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={dockButton}
          onClick={() => setMouseEnabled(value => !value)}
        >
          <MousePointer2 className="h-4 w-4" />
          {mouseEnabled ? "Trackpad on" : "Trackpad"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={dockButton}
          onClick={runDoctorNow}
        >
          <Stethoscope className="h-4 w-4" />
          Doctor
        </Button>
        <span className="mx-1 h-6 w-px shrink-0 bg-white/10" />
        <button
          type="button"
          aria-label="Zoom out"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
          onClick={() =>
            setZoom(value =>
              Math.max(0.15, Math.round((value - 0.1) * 100) / 100)
            )
          }
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-12 shrink-0 text-center text-xs tabular-nums text-white/60">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="Zoom in"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
          onClick={() =>
            setZoom(value => Math.min(2, Math.round((value + 0.1) * 100) / 100))
          }
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Fit to view"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
          onClick={fitZoom}
        >
          <Maximize className="h-4 w-4" />
        </button>
        <span className="mx-1 h-6 w-px shrink-0 bg-white/10" />
        <button
          type="button"
          onClick={onOpenPreview}
          className="ml-auto flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
        >
          <Eye className="h-4 w-4" />
          Open published preview
        </button>
      </footer>

      {settingsOpen && (
        <aside className="absolute bottom-16 right-0 top-14 z-40 w-[22rem] max-w-full overflow-y-auto border-l border-white/10 bg-[#10131a] p-4 shadow-2xl">
          <div className="space-y-5">
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-label text-[10px] text-primary">Workflow</p>
              <div className="mt-3 space-y-2">
                {!postId ? (
                  <Button
                    className="w-full gap-2"
                    disabled={createPending}
                    onClick={onCreate}
                  >
                    <Plus className="h-4 w-4" />
                    Create draft
                  </Button>
                ) : (
                  <Button
                    className="w-full gap-2"
                    disabled={savePending}
                    onClick={onSave}
                  >
                    <Type className="h-4 w-4" />
                    Save changes
                  </Button>
                )}
                {postId && status === "draft" && (
                  <Button
                    variant="secondary"
                    className="w-full gap-2"
                    disabled={transitionPending}
                    onClick={() => onTransition("review")}
                  >
                    <Send className="h-4 w-4" />
                    Submit for review
                  </Button>
                )}
                {postId && status === "review" && canPublish && (
                  <Button
                    className="w-full"
                    disabled={transitionPending}
                    onClick={() => onTransition("published")}
                  >
                    Approve & publish
                  </Button>
                )}
                {postId && status === "review" && canPublish && (
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                    disabled={transitionPending}
                    onClick={() => onTransition("draft")}
                  >
                    Return to draft
                  </Button>
                )}
                {postId && status === "published" && canPublish && (
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                    disabled={transitionPending}
                    onClick={() => onTransition("archived")}
                  >
                    Archive
                  </Button>
                )}
                {postId && canPublish && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={deletePending}
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete post
                  </Button>
                )}
              </div>
            </section>
            <PostSettingsPanel {...props} />
          </div>
        </aside>
      )}

      <TemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onUse={useTemplate}
        onAppend={appendTemplate}
      />
    </div>,
    document.body
  );
}
