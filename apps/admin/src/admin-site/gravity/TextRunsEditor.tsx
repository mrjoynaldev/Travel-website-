"use client";

import { Button } from "@/components/ui/button";
import { Highlighter, Link2, Link2Off, MousePointerClick } from "lucide-react";
import { useRef, useState } from "react";
import type { TextRun } from "./types";

type InlineRange = { start: number; end: number; mark?: boolean; link?: string; button?: boolean };

function rangesFromRuns(runs: TextRun[] | undefined, text: string): InlineRange[] {
  if (!runs || !runs.length) return [];
  const ranges: InlineRange[] = [];
  let cursor = 0;
  for (const run of runs) {
    if (run.mark || run.link) ranges.push({ start: cursor, end: cursor + run.text.length, mark: run.mark, link: run.link, button: run.button });
    cursor += run.text.length;
  }
  return ranges;
}

export function runsFromText(text: string, ranges: InlineRange[]): TextRun[] | undefined {
  if (!ranges.length) return undefined;
  const sorted = ranges.filter(range => range.end > range.start).sort((a, b) => a.start - b.start);
  const out: TextRun[] = [];
  let cursor = 0;
  for (const range of sorted) {
    if (range.start > cursor) out.push({ text: text.slice(cursor, range.start) });
    out.push({ text: text.slice(range.start, range.end), mark: range.mark, link: range.link, button: range.button });
    cursor = Math.max(cursor, range.end);
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) });
  return out;
}

function translateRanges(ranges: InlineRange[], oldText: string, newText: string): InlineRange[] {
  let prefix = 0;
  while (prefix < oldText.length && prefix < newText.length && oldText[prefix] === newText[prefix]) prefix++;
  let suffix = 0;
  while (suffix < oldText.length - prefix && suffix < newText.length - prefix && oldText[oldText.length - 1 - suffix] === newText[newText.length - 1 - suffix]) suffix++;
  const delta = newText.length - oldText.length;
  const boundary = oldText.length - suffix;
  return ranges
    .map(range => {
      if (range.end <= prefix) return range;
      if (range.start >= boundary) return { ...range, start: range.start + delta, end: range.end + delta };
      if (range.start < prefix && range.end > prefix) return { ...range, end: prefix };
      return { start: prefix + delta, end: prefix + delta };
    })
    .filter(range => range.end > range.start);
}

function applyToSelection(ranges: InlineRange[], start: number, end: number, patch: Partial<InlineRange>): InlineRange[] {
  const next: InlineRange[] = [];
  for (const range of ranges) {
    if (range.end <= start || range.start >= end) {
      next.push(range);
      continue;
    }
    if (range.start < start) next.push({ ...range, end: start });
    if (range.end > end) next.push({ ...range, start: end });
    const clip = { ...range, start: Math.max(range.start, start), end: Math.min(range.end, end) };
    if (clip.end > clip.start) next.push({ ...clip, ...patch });
  }
  return next.sort((a, b) => a.start - b.start);
}

const normalizeHref = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export function TextRunsEditor({ initialText, initialRuns, onCommit }: {
  initialText: string;
  initialRuns?: TextRun[];
  onCommit: (text: string, runs: TextRun[] | undefined) => void;
}) {
  const [text, setText] = useState(initialText);
  const [ranges, setRanges] = useState<InlineRange[]>(() => rangesFromRuns(initialRuns, initialText));
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkMode, setLinkMode] = useState<"link" | "button">("link");
  const [linkUrl, setLinkUrl] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const suppressBlur = useRef(false);

  const captureSelection = () => {
    const element = document.querySelector<HTMLTextAreaElement>("textarea[data-gravity-text]");
    if (!element) return;
    setSelection({ start: element.selectionStart, end: element.selectionEnd });
  };

  const handleBlur = () => {
    if (suppressBlur.current) {
      suppressBlur.current = false;
      requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>("textarea[data-gravity-text]")?.focus());
      return;
    }
    commit();
  };

  const hasSelection = selection.end > selection.start;

  const applyPatch = (patch: Partial<InlineRange>) => {
    if (!hasSelection) return;
    setRanges(prev => applyToSelection(prev, selection.start, selection.end, patch));
  };

  const toggleMark = () => {
    if (!hasSelection) return;
    setRanges(prev => {
      const overlapped = prev.filter(range => range.start < selection.end && range.end > selection.start);
      const allMarked = overlapped.length > 0 && overlapped.every(range => range.mark);
      return applyToSelection(prev, selection.start, selection.end, allMarked ? { mark: false } : { mark: true });
    });
  };

  const applyLink = () => {
    const href = normalizeHref(linkUrl);
    if (!href || !hasSelection) return;
    applyPatch(linkMode === "button" ? { link: href, button: true } : { link: href });
    setLinkOpen(false);
    setLinkUrl("");
    document.querySelector<HTMLTextAreaElement>("textarea[data-gravity-text]")?.focus();
  };

  const unlink = () => applyPatch({ link: undefined, button: false });

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    setRanges(prev => translateRanges(prev, text, next));
    setText(next);
  };

  const commit = () => {
    onCommit(text, runsFromText(text, ranges));
  };

  return (
    <div className="space-y-2" onPointerDownCapture={() => { suppressBlur.current = true; }}>
      <div className="flex flex-wrap items-center gap-1">
        <Button type="button" size="icon" variant="outline" className="h-7 w-7" disabled={!hasSelection} onClick={toggleMark} title="Highlight selected text" aria-label="Highlight selected text"><Highlighter className="h-3.5 w-3.5" /></Button>
        <Button type="button" size="icon" variant="outline" className="h-7 w-7" disabled={!hasSelection} onClick={() => { setLinkMode("link"); setLinkOpen(true); }} title="Link selected text (turns blue on the site)" aria-label="Link selected text"><Link2 className="h-3.5 w-3.5" /></Button>
        <Button type="button" size="icon" variant="outline" className="h-7 w-7" disabled={!hasSelection} onClick={() => { setLinkMode("button"); setLinkOpen(true); }} title="Turn selected text into a blue button" aria-label="Turn selected text into a button"><MousePointerClick className="h-3.5 w-3.5" /></Button>
        <Button type="button" size="icon" variant="outline" className="h-7 w-7" disabled={!hasSelection} onClick={unlink} title="Remove link from selected text" aria-label="Remove link from selected text"><Link2Off className="h-3.5 w-3.5" /></Button>
        <span className="ml-1 text-[10px] text-muted-foreground">Select text, then highlight, link, or turn it into a button</span>
      </div>
      {linkOpen && (
        <div className="flex gap-1.5">
          <input
            autoFocus
            value={linkUrl}
            onChange={event => setLinkUrl(event.target.value)}
            onKeyDown={event => { if (event.key === "Enter") applyLink(); if (event.key === "Escape") setLinkOpen(false); }}
            placeholder={linkMode === "button" ? "Button target URL, e.g. /pricing" : "Link URL, e.g. https://…"}
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button type="button" size="sm" className="h-8" onClick={applyLink}>Apply</Button>
        </div>
      )}
      <textarea
        data-gravity-text
        autoFocus
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        onSelect={captureSelection}
        onKeyUp={captureSelection}
        onMouseUp={captureSelection}
        rows={4}
        className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
