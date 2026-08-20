"use client";

import type { DraggableAttributes, useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Braces,
  Check,
  Copy,
  ImagePlus,
  Link2,
  Music2,
  Pencil,
  Puzzle,
  Trash2,
  Video,
  Youtube,
} from "lucide-react";
import { useState } from "react";
import { MediaPicker, type MediaKind } from "./MediaPicker";
import { youtubeId } from "./serialize";
import { useEditorStore } from "./store";
import { TextRunsEditor } from "./TextRunsEditor";
import type { GravityBlock } from "./types";

type DraggableListeners = ReturnType<typeof useDraggable>["listeners"];

function TextRuns({ block }: { block: GravityBlock }) {
  const runs =
    block.runs && block.runs.length
      ? block.runs
      : block.content
        ? [{ text: block.content }]
        : [];
  return (
    <>
      {runs.map((run, index) => {
        let node: React.ReactNode = <span key={index}>{run.text}</span>;
        if (run.link) {
          const className = run.button
            ? "inline-block rounded-md bg-[#2563eb] px-3 py-1 text-sm font-semibold text-white no-underline"
            : "font-medium text-[#2563eb] underline underline-offset-2";
          node = (
            <a
              key={index}
              href={run.link}
              className={className}
              onClick={event => event.preventDefault()}
            >
              {run.text}
            </a>
          );
        }
        if (run.mark && !run.button)
          node = (
            <mark key={index} className="rounded bg-amber-200 px-0.5">
              {run.text}
            </mark>
          );
        return node;
      })}
    </>
  );
}

export function BlockView({
  block,
  selected,
  isDragging,
  listeners,
  attributes,
  fullWidth,
}: {
  block: GravityBlock;
  selected: boolean;
  isDragging?: boolean;
  listeners?: DraggableListeners;
  attributes?: DraggableAttributes;
  fullWidth?: boolean;
}) {
  const updateBlock = useEditorStore(state => state.updateBlock);
  const deleteBlocks = useEditorStore(state => state.deleteBlocks);
  const editingId = useEditorStore(state => state.editingId);
  const setEditing = useEditorStore(state => state.setEditing);
  const [editOpen, setEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const textEditing = block.type === "text" && editingId === block.id;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(block.content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable in some contexts */
    }
  };

  const shell =
    block.type === "button"
      ? "group relative rounded-xl border-2 border-dashed border-border bg-transparent p-1.5 transition-shadow"
      : "group relative rounded-xl border bg-white p-3 shadow-sm transition-shadow";

  return (
    <div
      {...(attributes || {})}
      {...(listeners || {})}
      onDoubleClick={event => {
        if (block.type === "text") {
          event.stopPropagation();
          setEditing(block.id);
        }
      }}
      className={`${shell} ${selected ? "border-primary ring-2 ring-primary/30" : ""} ${isDragging ? "opacity-60" : ""}`}
      style={{
        width: fullWidth ? "100%" : block.width,
        transform: block.rotation ? `rotate(${block.rotation}deg)` : undefined,
        transformOrigin: "center",
      }}
    >
      <div
        className="absolute right-1.5 top-1.5 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        onPointerDown={event => event.stopPropagation()}
      >
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-muted-foreground"
          aria-label="Edit block"
          onClick={event => {
            event.stopPropagation();
            if (block.type === "text") setEditing(block.id);
            else setEditOpen(value => !value);
          }}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          aria-label="Delete block"
          onClick={event => {
            event.stopPropagation();
            deleteBlocks([block.id]);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {block.type === "text" &&
        (textEditing ? (
          <div
            className="space-y-2"
            onPointerDown={event => event.stopPropagation()}
          >
            <div
              className="flex gap-1"
              onPointerDown={event => event.stopPropagation()}
            >
              {(["h2", "p"] as const).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={event => {
                    event.stopPropagation();
                    updateBlock(block.id, { level });
                  }}
                  className={`rounded-md px-2 py-1 text-[10px] font-medium ${block.level === level ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {level === "h2" ? "Heading" : "Paragraph"}
                </button>
              ))}
            </div>
            <TextRunsEditor
              initialText={block.content || ""}
              initialRuns={block.runs}
              onCommit={(text, runs) => {
                updateBlock(block.id, {
                  content: text,
                  runs: runs ?? undefined,
                });
                setEditing(null);
              }}
            />
            <Input
              value={block.link || ""}
              onChange={event =>
                updateBlock(block.id, { link: event.target.value })
              }
              placeholder="Optional link trigger, e.g. https://…"
              className="h-8 text-xs"
              onPointerDown={event => event.stopPropagation()}
            />
          </div>
        ) : (
          <p
            className={`whitespace-pre-wrap leading-relaxed text-foreground ${block.level === "h2" ? "font-display text-xl font-semibold" : "text-sm"}`}
          >
            {block.content ? <TextRuns block={block} /> : "Empty text block"}
          </p>
        ))}
      {block.type === "button" && (
        <div className="grid place-items-center">
          <div className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm">
            {block.content || "Button"}
          </div>
        </div>
      )}
      {block.type === "image" &&
        (block.url ? (
          <>
            <img
              src={block.url}
              alt={block.caption || ""}
              className="h-32 w-full rounded-lg object-cover"
            />
            {block.caption && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {block.caption}
              </p>
            )}
          </>
        ) : (
          <div className="grid h-32 place-items-center rounded-lg border border-dashed border-border bg-muted/40">
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          </div>
        ))}
      {block.type === "video" &&
        (block.url ? (
          <>
            {block.url.match(/youtube|youtu\.be|vimeo|\.mp4|\.webm/) ? (
              <div className="h-32 w-full overflow-hidden rounded-lg bg-black">
                <video
                  src={block.url}
                  className="h-full w-full object-contain"
                  controls
                />
              </div>
            ) : (
              <div className="grid h-32 place-items-center rounded-lg border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                {block.url}
              </div>
            )}
            {block.caption && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {block.caption}
              </p>
            )}
          </>
        ) : (
          <div className="grid h-32 place-items-center rounded-lg border border-dashed border-border bg-muted/40">
            <Video className="h-5 w-5 text-muted-foreground" />
          </div>
        ))}
      {block.type === "audio" &&
        (block.url ? (
          youtubeId(block.url) ? (
            <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-[#f4f6f8] px-3">
              <Youtube className="h-4 w-4 shrink-0 text-red-600" />
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                YouTube link · plays as audio-only strip
              </span>
            </div>
          ) : (
            <>
              <audio
                src={block.url}
                controls
                preload="metadata"
                className="h-10 w-full"
              />
              {block.caption && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {block.caption}
                </p>
              )}
            </>
          )
        ) : (
          <div className="grid h-14 place-items-center rounded-lg border border-dashed border-border bg-muted/40">
            <Music2 className="h-5 w-5 text-muted-foreground" />
          </div>
        ))}
      {block.type === "code" && (
        <div className="overflow-hidden rounded-lg border border-[#2a3541] bg-[#0f1a20]">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-3 py-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
              <Braces className="h-3 w-3" />
              {block.language || "code"}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          </div>
          <pre className="max-h-64 overflow-auto p-3 text-xs leading-relaxed text-emerald-100/90">
            <code>{block.content || "// paste your code here"}</code>
          </pre>
        </div>
      )}
      {block.type === "custom" && (
        <div className="overflow-hidden rounded-lg border border-dashed border-[#2a3541] bg-[#0d1117]/40">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-3 py-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
              <Puzzle className="h-3 w-3" />
              Custom HTML
            </span>
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                setEditOpen(value => !value);
              }}
              className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Pencil className="h-3 w-3" /> Edit HTML
            </button>
          </div>
          {block.content ? (
            <div
              className="gravity-custom-canvas [&_iframe]:max-w-full [&_img]:max-w-full [&_table]:w-full [&_svg]:max-w-full"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          ) : (
            <div className="grid h-24 place-items-center text-xs text-white/40">
              Embed any custom HTML — charts, slides, boxes, embeds.
            </div>
          )}
        </div>
      )}
      {block.link && (
        <p className="mt-1 flex items-center gap-1 text-[10px] text-primary">
          <Link2 className="h-3 w-3" />
          Linked to {block.link}
        </p>
      )}
      {editOpen && block.type !== "text" && (
        <div
          className="mt-3 space-y-2 border-t border-border pt-3"
          onPointerDown={event => event.stopPropagation()}
        >
          {block.type === "button" ? (
            <>
              <Input
                value={block.content || ""}
                onChange={event =>
                  updateBlock(block.id, { content: event.target.value })
                }
                placeholder="Button label, e.g. Learn more"
                className="h-8 text-xs"
              />
              <Input
                value={block.link || ""}
                onChange={event =>
                  updateBlock(block.id, { link: event.target.value })
                }
                placeholder="Link URL, e.g. https://codereportglobal.com/pricing"
                className="h-8 text-xs"
              />
            </>
          ) : block.type === "code" ? (
            <>
              <Input
                value={block.language || ""}
                onChange={event =>
                  updateBlock(block.id, { language: event.target.value })
                }
                placeholder="Language, e.g. javascript, python, bash"
                className="h-8 text-xs"
              />
              <textarea
                value={block.content || ""}
                onChange={event =>
                  updateBlock(block.id, { content: event.target.value })
                }
                rows={8}
                placeholder="Paste your code here…"
                className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Input
                value={block.link || ""}
                onChange={event =>
                  updateBlock(block.id, { link: event.target.value })
                }
                placeholder="Optional link trigger (wraps this block as a click target)"
                className="h-8 text-xs"
              />
            </>
          ) : block.type === "custom" ? (
            <>
              <textarea
                value={block.content || ""}
                onChange={event =>
                  updateBlock(block.id, { content: event.target.value })
                }
                rows={8}
                placeholder={'<div class="my-chart">…your custom HTML…</div>'}
                className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Input
                value={block.link || ""}
                onChange={event =>
                  updateBlock(block.id, { link: event.target.value })
                }
                placeholder="Optional link trigger (wraps this block as a click target)"
                className="h-8 text-xs"
              />
            </>
          ) : (
            <>
              <MediaPicker
                kind={block.type as MediaKind}
                url={block.url}
                onChange={url => updateBlock(block.id, { url })}
              />
              <Input
                value={block.caption || ""}
                onChange={event =>
                  updateBlock(block.id, { caption: event.target.value })
                }
                placeholder="Caption"
                className="h-8 text-xs"
              />
              <Input
                value={block.link || ""}
                onChange={event =>
                  updateBlock(block.id, { link: event.target.value })
                }
                placeholder="Optional link trigger (wraps this block as a click target)"
                className="h-8 text-xs"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
