"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUp, Loader2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { importHtml } from "./serialize";
import { blockHeight, useEditorStore } from "./store";

export function ImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"replace" | "append">("append");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const importDoc = useEditorStore(state => state.importDoc);

  const run = (content: string) => {
    const state = useEditorStore.getState();
    const bottom = state.blocks.length
      ? Math.max(...state.blocks.map(block => block.y + blockHeight(block))) + 24
      : 40;
    const result = importHtml(content, mode === "append" ? bottom : 40);
    if (!result || !result.blocks.length) {
      toast.error(
        "Could not read any blocks. Use the Gravity HTML block format or a gravity JSON doc."
      );
      return;
    }
    importDoc(result.blocks, result.sections, mode);
    toast.success(
      `Imported ${result.blocks.length} block${result.blocks.length === 1 ? "" : "s"}${result.sections.length ? ` across ${result.sections.length} section${result.sections.length === 1 ? "" : "s"}` : ""}.`
    );
    setText("");
    onClose();
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const content = await file.text();
      run(content);
    } catch {
      toast.error("Could not read that file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import HTML into the canvas</DialogTitle>
          <DialogDescription>
            Paste agent-generated HTML (the Gravity HTML block format) or a
            gravity JSON doc, or upload a .html/.json file. Every recognized block
            becomes an editable block on the artboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              Upload .html or .json file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".html,.htm,.json,.txt"
              className="hidden"
              onChange={event => {
                onFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileUp className="h-3.5 w-3.5" />
              Blocks replace or append below your current layout.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Mode</span>
            {(["append", "replace"] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  mode === option
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={event => setText(event.target.value)}
            rows={12}
            placeholder={`<p class="gravity-text">Write agent-generated blocks here…</p>\n<div class="gravity-code">…</div>`}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!text.trim()}
              onClick={() => run(text)}
            >
              Import blocks
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}