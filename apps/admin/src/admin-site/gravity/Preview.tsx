"use client";

import { useMemo } from "react";
import { blocksToHtml } from "./serialize";
import { useEditorStore } from "./store";

export function GravityPreview() {
  const blocks = useEditorStore(state => state.blocks);
  const sections = useEditorStore(state => state.sections);
  const html = useMemo(() => (blocks.length ? blocksToHtml(blocks, sections) : ""), [blocks, sections]);

  return (
    <div className="min-h-[70vh] rounded-xl border border-border bg-white p-6 shadow-sm">
      {html ? (
        <div
          className="space-y-4 [&_img]:max-w-full [&_img]:rounded-lg [&_video]:w-full [&_video]:rounded-lg [&_audio]:w-full [&_iframe]:max-w-full [&_iframe]:rounded-lg [&_figure]:space-y-2 [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground [&_p]:text-sm [&_p]:leading-7 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_.gravity-grid]:grid [&_.gravity-grid]:gap-4 [&_.gravity-cell]:min-w-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="grid min-h-[60vh] place-items-center"><p className="text-sm text-muted-foreground">Add blocks to the canvas to preview the article layout.</p></div>
      )}
    </div>
  );
}
