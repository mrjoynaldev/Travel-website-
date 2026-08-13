"use client";

import { MediaUploadButton } from "@/admin-site/components/MediaUploadButton";
import { trpc } from "@/lib/trpc";
import { Image as ImageIcon, Link2, Loader2, Music2, Video, Youtube } from "lucide-react";
import { useState } from "react";
import { youtubeId } from "./serialize";

export type MediaKind = "image" | "video" | "audio";

const KIND_ACCEPT: Record<MediaKind, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif,image/svg+xml",
  video: "video/mp4,video/webm",
  audio: "audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/webm",
};

const KIND_TINT: Record<MediaKind, string> = {
  image: "bg-[#eef4ea] text-[#1f4d3b]",
  video: "bg-[#f4f0e6] text-[#8a6a2f]",
  audio: "bg-[#e9eef2] text-[#2f4a63]",
};

export function MediaPicker({ kind, url, onChange }: { kind: MediaKind; url?: string; onChange: (url: string) => void }) {
  const media = trpc.studio.media.list.useQuery({});
  const [tab, setTab] = useState<"library" | "link">("library");
  const [draftUrl, setDraftUrl] = useState(url || "");
  const isYt = Boolean(url && youtubeId(url));
  const items = (media.data || []).filter(asset => (kind === "image" ? asset.mime_type.startsWith("image/") : kind === "audio" ? asset.mime_type.startsWith("audio/") : asset.mime_type.startsWith("video/")));

  return (
    <div className="rounded-lg border border-border bg-background p-2">
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setTab("library")} className={`rounded-md px-2 py-1 text-[10px] font-medium ${tab === "library" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Library</button>
        <button type="button" onClick={() => setTab("link")} className={`rounded-md px-2 py-1 text-[10px] font-medium ${tab === "link" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Link</button>
        <MediaUploadButton accept={KIND_ACCEPT[kind]} folder="library" label={kind === "image" ? "Upload image" : `Upload ${kind}`} className="ml-auto h-6 gap-1 px-2 text-[10px]" onUploaded={asset => onChange(asset.url)} />
      </div>
      {tab === "library" && (
        media.isLoading ? <div className="mt-2 grid place-items-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div> : items.length ? (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {items.map(asset => (
              <button type="button" key={asset.id} title={asset.filename} onClick={() => onChange(asset.url)} className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border ${url === asset.url ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
                {asset.mime_type.startsWith("image/") ? <img src={asset.url} alt={asset.filename} className="h-full w-full object-cover" /> : <span className={`grid h-full w-full place-items-center ${KIND_TINT[kind]}`}>{kind === "audio" ? <Music2 className="h-4 w-4" /> : <Video className="h-4 w-4" />}</span>}
              </button>
            ))}
          </div>
        ) : <p className="mt-2 rounded-md bg-muted/40 px-2 py-3 text-center text-[10px] text-muted-foreground">No {kind} files uploaded yet. Upload one or paste a link.</p>
      )}
      {tab === "link" && (
        <div className="mt-2 space-y-1.5">
          <div className="flex gap-1.5">
            <input value={draftUrl} onChange={event => setDraftUrl(event.target.value)} placeholder={kind === "image" ? "Image URL" : kind === "audio" ? "MP3, stream, or YouTube link" : "YouTube, Vimeo or video URL"} className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button type="button" onClick={() => onChange(draftUrl.trim())} className="flex h-7 items-center gap-1 rounded-md bg-primary px-2 text-[10px] font-medium text-primary-foreground"><Link2 className="h-3 w-3" />Apply</button>
          </div>
          {kind === "audio" && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground"><Youtube className="h-3 w-3 text-red-600" />Paste a YouTube link and it plays as an audio-only strip.{isYt ? " Linked — saved as audio." : ""}</p>
          )}
        </div>
      )}
      {url && (
        <button type="button" onClick={() => onChange("")} className="mt-2 flex w-full items-center gap-1.5 text-[10px] text-muted-foreground hover:text-destructive"><ImageIcon className="h-3 w-3" />Clear selected media</button>
      )}
    </div>
  );
}
