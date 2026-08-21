"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  ArrowDown,
  ArrowUp,
  Captions,
  Copy,
  Trash2,
  Type,
} from "lucide-react";
import { MediaPicker, type MediaKind } from "./MediaPicker";
import { TextRunsEditor } from "./TextRunsEditor";
import { useEditorStore } from "./store";
import type { GravityBlock } from "./types";

const TYPE_LABEL: Record<GravityBlock["type"], string> = {
  text: "Text",
  image: "Image",
  video: "Video",
  audio: "Audio",
  button: "Button",
  code: "Code",
  custom: "Custom HTML",
};

export function MobileBlockSheet({
  blockId,
  onClose,
}: {
  blockId: string | null;
  onClose: () => void;
}) {
  const block = useEditorStore(state =>
    state.blocks.find(item => item.id === blockId)
  );
  const updateBlock = useEditorStore(state => state.updateBlock);
  const moveUnit = useEditorStore(state => state.moveUnit);
  const duplicateBlocks = useEditorStore(state => state.duplicateBlocks);
  const deleteBlocks = useEditorStore(state => state.deleteBlocks);
  const setEditing = useEditorStore(state => state.setEditing);

  if (!blockId || !block) return null;

  const unitId = block.parentId ?? block.id;
  const open = Boolean(blockId && block);

  const action =
    "grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/90 transition-colors hover:bg-white/10";

  return (
    <Drawer open={open} onOpenChange={value => !value && onClose()}>
      <DrawerContent className="max-h-[85vh] overflow-y-auto border-t border-white/10 bg-[#10131a] pb-[env(safe-area-inset-bottom)] text-white">
        <DrawerHeader>
          <DrawerTitle className="text-white">
            {TYPE_LABEL[block.type]} block
          </DrawerTitle>
          <DrawerDescription className="text-white/50">
            Editing happens here on the go.
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-5 px-4 pb-6">
          {block.type === "text" && (
            <>
              <div>
                <Label className="text-[10px] text-white/50">Style</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {([["h2", "Heading"], ["h3", "Subhead"], ["p", "Paragraph"], ["quote", "Quote"], ["list", "List"]] as const).map(([level, label]) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateBlock(block.id, { level })}
                      className={`h-10 flex-1 whitespace-nowrap rounded-lg px-2 text-sm font-medium transition-colors ${
                        block.level === level
                          ? "bg-white text-black"
                          : "bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-white/50">Content</Label>
                <div className="mt-1.5 rounded-lg border border-white/10 bg-white/5">
                  <TextRunsEditor
                    initialText={block.content || ""}
                    initialRuns={block.runs}
                    onCommit={(text, runs) =>
                      updateBlock(block.id, {
                        content: text,
                        runs: runs ?? undefined,
                      })
                    }
                  />
                </div>
              </div>
            </>
          )}
          {block.type === "button" && (
            <>
              <div>
                <Label className="text-[10px] text-white/50">Label</Label>
                <Input
                  value={block.content || ""}
                  onChange={event =>
                    updateBlock(block.id, { content: event.target.value })
                  }
                  placeholder="e.g. Learn more"
                  className="mt-1.5 h-11 border-white/10 bg-white/5 text-white"
                />
              </div>
              <div>
                <Label className="text-[10px] text-white/50">Link trigger</Label>
                <Input
                  value={block.link || ""}
                  onChange={event =>
                    updateBlock(block.id, { link: event.target.value })
                  }
                  placeholder="https://…"
                  className="mt-1.5 h-11 border-white/10 bg-white/5 text-white"
                />
              </div>
            </>
          )}
          {block.type === "code" && (
            <>
              <div>
                <Label className="text-[10px] text-white/50">Language</Label>
                <Input
                  value={block.language || ""}
                  onChange={event =>
                    updateBlock(block.id, { language: event.target.value })
                  }
                  placeholder="javascript, python, bash…"
                  className="mt-1.5 h-11 border-white/10 bg-white/5 text-white"
                />
              </div>
              <div>
                <Label className="text-[10px] text-white/50">Code</Label>
                <textarea
                  value={block.content || ""}
                  onChange={event =>
                    updateBlock(block.id, { content: event.target.value })
                  }
                  rows={10}
                  placeholder="Paste your code here…"
                  className="mt-1.5 w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
            </>
          )}
          {block.type === "custom" && (
            <>
              <div>
                <Label className="text-[10px] text-white/50">Custom HTML</Label>
                <textarea
                  value={block.content || ""}
                  onChange={event =>
                    updateBlock(block.id, { content: event.target.value })
                  }
                  rows={10}
                  placeholder={'<div class="my-chart">…</div>'}
                  className="mt-1.5 w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div>
                <Label className="text-[10px] text-white/50">Link trigger</Label>
                <Input
                  value={block.link || ""}
                  onChange={event =>
                    updateBlock(block.id, { link: event.target.value })
                  }
                  placeholder="https://…"
                  className="mt-1.5 h-11 border-white/10 bg-white/5 text-white"
                />
              </div>
            </>
          )}
          {(block.type === "image" ||
            block.type === "video" ||
            block.type === "audio") && (
            <>
              <div>
                <Label className="text-[10px] text-white/50">
                  {TYPE_LABEL[block.type]}
                </Label>
                <div className="mt-1.5">
                  <MediaPicker
                    kind={block.type as MediaKind}
                    url={block.url}
                    onChange={url => updateBlock(block.id, { url })}
                  />
                </div>
              </div>
              {block.type === "image" && (
                <div>
                  <Label className="text-[10px] text-white/50">Alt text</Label>
                  <Input
                    value={block.alt || ""}
                    onChange={event =>
                      updateBlock(block.id, { alt: event.target.value })
                    }
                    placeholder="Describe this image for SEO & accessibility"
                    className="mt-1.5 h-11 border-white/10 bg-white/5 text-white"
                  />
                  <p className="mt-1 text-[10px] text-white/40">
                    Falls back to the caption when empty.
                  </p>
                </div>
              )}
              <div>
                <Label className="text-[10px] text-white/50">Caption</Label>
                <Input
                  value={block.caption || ""}
                  onChange={event =>
                    updateBlock(block.id, { caption: event.target.value })
                  }
                  placeholder="Optional caption"
                  className="mt-1.5 h-11 border-white/10 bg-white/5 text-white"
                />
              </div>
            </>
          )}
          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              className={action}
              title="Move up"
              aria-label="Move block up"
              onClick={() => moveUnit(unitId, -1)}
            >
              <ArrowUp className="h-5 w-5" />
            </button>
            <button
              type="button"
              className={action}
              title="Move down"
              aria-label="Move block down"
              onClick={() => moveUnit(unitId, 1)}
            >
              <ArrowDown className="h-5 w-5" />
            </button>
            <button
              type="button"
              className={action}
              title="Duplicate"
              aria-label="Duplicate block"
              onClick={() => duplicateBlocks([block.id])}
            >
              <Copy className="h-5 w-5" />
            </button>
            {block.type === "text" && (
              <button
                type="button"
                className={action}
                title="Edit text"
                aria-label="Edit text"
                onClick={() => {
                  setEditing(block.id);
                  onClose();
                }}
              >
                <Type className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-rose-500/30 bg-rose-500/15 text-rose-300 transition-colors hover:bg-rose-500/25"
              title="Delete block"
              aria-label="Delete block"
              onClick={() => {
                deleteBlocks([block.id]);
                onClose();
              }}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-white/40">
            <Captions className="h-3.5 w-3.5" />
            Hold the grip handle on a block to drag it into a new position.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}