"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Braces,
  Combine,
  Copy,
  Eye,
  FileUp,
  ImagePlus,
  Layers,
  LayoutTemplate,
  Maximize,
  Minus,
  Minimize2,
  MousePointer2,
  Music2,
  PanelRight,
  Pencil,
  Plus,
  Puzzle,
  Send,
  Settings,
  SquareMousePointer,
  Stethoscope,
  Trash2,
  Type,
  Unlink,
  Video,
  X,
} from "lucide-react";
import { GravityCanvas } from "./GravityCanvas";
import { ImportDialog } from "./ImportDialog";
import { MobileFlow } from "./MobileFlow";
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
import { useEditorStore } from "./store";
import { TemplatesDialog } from "./TemplatesDialog";
import { offsetTemplate, type Template, CANVAS_WIDTH } from "./templates";
import { StatusPill } from "@/admin-site/pages/Studio";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useMobile";
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
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    document.body.style.overflow = settingsOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [settingsOpen]);
  const zoom = useEditorStore(state => state.zoom);
  const setZoom = useEditorStore(state => state.setZoom);
  const addBlock = useEditorStore(state => state.addBlock);
  const appendBlock = useEditorStore(state => state.appendBlock);
  const loadDoc = useEditorStore(state => state.loadDoc);
  const sections = useEditorStore(state => state.sections);
  const blocks = useEditorStore(state => state.blocks);
  const selected = useEditorStore(state => state.selected);
  const editingId = useEditorStore(state => state.editingId);
  const setEditing = useEditorStore(state => state.setEditing);
  const mergeSelection = useEditorStore(state => state.mergeSelection);
  const detachSelection = useEditorStore(state => state.detachSelection);
  const alignSelection = useEditorStore(state => state.alignSelection);
  const duplicateBlocks = useEditorStore(state => state.duplicateBlocks);
  const deleteBlocks = useEditorStore(state => state.deleteBlocks);
  const selectedBlock = blocks.find(
    block => selected.length === 1 && block.id === selected[0]
  );

  if (!mounted) return null;

  const addOptions = [
    { type: "text", label: "Text", icon: Type },
    { type: "image", label: "Image", icon: ImagePlus },
    { type: "video", label: "Video", icon: Video },
    { type: "audio", label: "Audio", icon: Music2 },
    { type: "button", label: "Button", icon: SquareMousePointer },
    { type: "code", label: "Code", icon: Braces },
    { type: "custom", label: "Custom", icon: Puzzle },
  ] as const;

  const fitZoom = () => {
    if (viewportRef.current)
      setZoom(
        Math.max(
          0.15,
          Math.min(
            1,
            (viewportRef.current.clientWidth - (isMobile ? 40 : 64)) /
              CANVAS_WIDTH
          )
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

  const contextButton =
    "grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/90 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35";
  const inSection = blocks.some(
    block => selected.includes(block.id) && block.parentId
  );
  const flowMode = isMobile && !previewMode;

  const settingsBody = (
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
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0c10] pt-[env(safe-area-inset-top)] text-white">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
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
          <span className="hidden sm:block">
            {postId && <StatusPill state={status} />}
          </span>
          <button
            type="button"
            onClick={() => setSettingsOpen(value => !value)}
            aria-label="Settings"
            className={`flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-sm font-medium sm:px-3 ${settingsOpen ? "bg-white/15 text-white" : "bg-white/5 text-white/80"} hover:bg-white/10 hover:text-white`}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={savePending || createPending}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 text-sm font-semibold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50 sm:px-3"
          >
            {savePending ? "Saving…" : postId ? "Save changes" : "Create draft"}
          </button>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div className="relative h-full min-w-0 overflow-hidden">
          {previewMode ? (
            <div className="h-full overflow-auto">
              <div className="mx-auto max-w-3xl p-8">
                <GravityPreview />
              </div>
            </div>
          ) : isMobile ? (
            <MobileFlow />
          ) : (
            <GravityCanvas
              viewportRef={viewportRef}
              hideZoomBar
              fullHeight
              mobileDocked={false}
            />
          )}
          {mouseEnabled && !previewMode && !isMobile && (
            <MousePad viewportRef={viewportRef} />
          )}
          {showLayers && !previewMode && !isMobile && (
            <aside className="absolute left-4 top-4 z-20 h-[calc(100%-8rem)] w-56 overflow-hidden rounded-xl border border-white/10 bg-white text-slate-900 shadow-2xl">
              <LayersPanel />
            </aside>
          )}
          {showInspector && !previewMode && !isMobile && (
            <aside className="absolute right-4 top-4 z-20 max-h-[calc(100%-8rem)] w-60 overflow-y-auto rounded-xl border border-white/10 bg-white text-slate-900 shadow-2xl">
              <InspectorPanel block={selectedBlock} />
            </aside>
          )}
        </div>

        {isMobile && showLayers && !previewMode && (
          <Drawer open onOpenChange={setShowLayers}>
            <DrawerContent className="border-t border-white/10 bg-[#10131a] pb-[env(safe-area-inset-bottom)] text-white">
              <DrawerHeader>
                <DrawerTitle className="text-white">Layers</DrawerTitle>
              </DrawerHeader>
              <div data-vaul-no-drag className="max-h-[55vh] overflow-y-auto overscroll-contain touch-pan-y px-4 pb-6">
                <LayersPanel />
              </div>
            </DrawerContent>
          </Drawer>
        )}
        {isMobile && showInspector && !previewMode && (
          <Drawer open onOpenChange={setShowInspector}>
            <DrawerContent className="border-t border-white/10 bg-[#10131a] pb-[env(safe-area-inset-bottom)] text-white">
              <DrawerHeader>
                <DrawerTitle className="text-white">Inspector</DrawerTitle>
              </DrawerHeader>
              <div data-vaul-no-drag className="max-h-[60vh] overflow-y-auto overscroll-contain touch-pan-y px-4 pb-6">
                <InspectorPanel block={selectedBlock} />
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      {isMobile && !previewMode && !editingId && !flowMode && selected.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-t border-white/10 bg-[#0d1016] px-3 py-2">
          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/60">
            {selected.length === 1 ? "Block" : `${selected.length} selected`}
          </span>
          {selected.length === 1 && (
            <button
              type="button"
              className={contextButton}
              disabled={selectedBlock?.type !== "text"}
              title="Edit text"
              onClick={() => selectedBlock && setEditing(selectedBlock.id)}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            className={contextButton}
            title="Duplicate"
            onClick={() => duplicateBlocks(selected)}
          >
            <Copy className="h-4 w-4" />
          </button>
          {selected.length > 1 && (
            <button
              type="button"
              className={contextButton}
              title="Merge into section"
              onClick={mergeSelection}
            >
              <Combine className="h-4 w-4" />
            </button>
          )}
          {inSection && (
            <button
              type="button"
              className={contextButton}
              title="Detach from section"
              onClick={detachSelection}
            >
              <Unlink className="h-4 w-4" />
            </button>
          )}
          {selected.length > 1 && (
            <>
              <span className="mx-1 h-6 w-px shrink-0 bg-white/10" />
              <button
                type="button"
                className={contextButton}
                title="Align left"
                onClick={() => alignSelection("left")}
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={contextButton}
                title="Align center"
                onClick={() => alignSelection("center")}
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={contextButton}
                title="Align right"
                onClick={() => alignSelection("right")}
              >
                <AlignRight className="h-4 w-4" />
              </button>
            </>
          )}
          <span className="mx-1 h-6 w-px shrink-0 bg-white/10" />
          <button
            type="button"
            className={`${contextButton} bg-rose-500/15 text-rose-300 hover:bg-rose-500/25`}
            title="Delete"
            onClick={() => deleteBlocks(selected)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <footer className="flex h-16 shrink-0 items-center gap-1.5 overflow-x-auto border-t border-white/10 px-3 max-md:pb-[env(safe-area-inset-bottom)] sm:gap-2 sm:px-4">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={`${dockButton} max-sm:px-2`}
          onClick={() => setTemplatesOpen(true)}
        >
          <LayoutTemplate className="h-4 w-4" />
          <span className="hidden sm:inline">Templates</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={`${dockButton} max-sm:px-2`}
          onClick={() => setImportOpen(true)}
        >
          <FileUp className="h-4 w-4" />
          <span className="hidden sm:inline">Import HTML</span>
        </Button>
        <div className="relative">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={`${dockButton} max-sm:px-2`}
            onClick={() => setAddOpen(value => !value)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add block</span>
          </Button>
          {!isMobile && addOpen && (
            <div className="absolute bottom-12 left-0 z-30 flex gap-1 rounded-xl border border-white/10 bg-[#10131a] p-1.5 shadow-2xl">
              {addOptions.map(option => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => {
                    addBlock(option.type);
                    setAddOpen(false);
                  }}
                  className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <option.icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="mx-1 h-6 w-px shrink-0 bg-white/10" />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={`${dockButton} max-sm:px-2`}
          onClick={() => setShowLayers(value => !value)}
        >
          <Layers className="h-4 w-4" />
          <span className="hidden sm:inline">Layers</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={`${dockButton} max-sm:px-2`}
          onClick={() => setShowInspector(value => !value)}
        >
          <PanelRight className="h-4 w-4" />
          <span className="hidden sm:inline">Inspector</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={previewMode ? "secondary" : "outline"}
          className={`${dockButton} max-sm:px-2`}
          onClick={() => setPreviewMode(value => !value)}
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Preview</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={`${dockButton} hidden max-sm:px-2 sm:flex`}
          onClick={() => setMouseEnabled(value => !value)}
        >
          <MousePointer2 className="h-4 w-4" />
          <span className="hidden sm:inline">
            {mouseEnabled ? "Trackpad on" : "Trackpad"}
          </span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={`${dockButton} max-sm:px-2`}
          onClick={runDoctorNow}
        >
          <Stethoscope className="h-4 w-4" />
          <span className="hidden sm:inline">Doctor</span>
        </Button>
        {!flowMode && (
          <>
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
          </>
        )}
        <span className="mx-1 h-6 w-px shrink-0 bg-white/10" />
        <button
          type="button"
          onClick={onOpenPreview}
          className="ml-auto flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white sm:px-3"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Open published preview</span>
        </button>
      </footer>

      {isMobile && addOpen && (
        <Drawer open onOpenChange={setAddOpen}>
          <DrawerContent className="border-t border-white/10 bg-[#10131a] pb-[env(safe-area-inset-bottom)] text-white">
            <DrawerHeader>
              <DrawerTitle className="text-white">Add block</DrawerTitle>
            </DrawerHeader>
            <div data-vaul-no-drag className="max-h-[70vh] grid grid-cols-2 gap-2 overflow-y-auto overscroll-contain touch-pan-y px-4 pb-6">
              {addOptions.map(option => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => {
                    appendBlock(option.type);
                    setAddOpen(false);
                  }}
                  className="flex h-14 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {settingsOpen && !isMobile && (
        <aside className="absolute bottom-16 right-0 top-14 z-40 w-[22rem] max-w-full overflow-y-auto overscroll-contain border-l border-white/10 bg-[#10131a] p-4 shadow-2xl [-webkit-overflow-scrolling:touch]">
          {settingsBody}
        </aside>
      )}

      {settingsOpen && isMobile && (
        <Drawer open onOpenChange={setSettingsOpen}>
          <DrawerContent className="border-t border-white/10 bg-[#10131a] pb-[env(safe-area-inset-bottom)] text-white">
            <div data-vaul-no-drag className="max-h-[90dvh] overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
              <DrawerHeader className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/10 bg-[#10131a]">
                <DrawerTitle className="text-white">Settings</DrawerTitle>
                <DrawerClose className="rounded-md p-1 text-white/70 transition-colors hover:text-white">
                  <X className="h-4 w-4" />
                </DrawerClose>
              </DrawerHeader>
              <div className="px-4 pb-6">{settingsBody}</div>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <TemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onUse={useTemplate}
        onAppend={appendTemplate}
      />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>,
    document.body
  );
}
