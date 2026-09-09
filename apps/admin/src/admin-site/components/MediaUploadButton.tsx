"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type UploadedAsset = { id: string; url: string; filename: string; alt_text: string | null; mime_type: string; folder: string };

const ALLOWED_MIME = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "application/pdf",
  "audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/webm", "video/mp4", "video/webm",
] as const;

export function MediaUploadButton({ accept, folder = "library", label = "Upload", className, id, maxMB = 10, onUploaded }: { accept: string; folder?: string; label?: string; className?: string; id?: string; maxMB?: number; onUploaded: (asset: UploadedAsset) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const upload = trpc.studio.media.upload.useMutation({ onError: error => toast.error(error.message) });
  const isImage = accept.split(",").some(type => type.trim().startsWith("image/"));
  const choose = (file?: File) => {
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) { toast.error("That file type is not accepted."); return; }
    if (file.size > maxMB * 1024 * 1024) { toast.error(`Files must be ${maxMB} MB or smaller.`); return; }
    setAltText(""); setCaption("");
    setPending(file);
  };
  const confirmUpload = async () => {
    if (!pending) return;
    const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Could not read the selected file.")); reader.readAsDataURL(pending); });
    upload.mutate(
      { filename: pending.name, mimeType: pending.type as typeof ALLOWED_MIME[number], base64, folder, altText, caption },
      { onSuccess: asset => { setPending(null); onUploaded(asset as unknown as UploadedAsset); toast.success("Media uploaded to the library."); } }
    );
  };
  return <>
    <input ref={fileRef} id={id} type="file" accept={accept} className="hidden" onChange={event => { choose(event.target.files?.[0]); event.currentTarget.value = ""; }} />
    <Button type="button" variant="outline" size="sm" className={className} disabled={upload.isPending} onClick={() => fileRef.current?.click()}>{upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}{upload.isPending ? "Uploading…" : label}</Button>
    <Dialog open={Boolean(pending)} onOpenChange={open => { if (!open && !upload.isPending) setPending(null); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Describe this file</DialogTitle>
          <DialogDescription>{pending?.name}</DialogDescription>
        </DialogHeader>
        {isImage ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="media-alt-text">Alt text</Label>
              <Input id="media-alt-text" value={altText} onChange={event => setAltText(event.target.value)} placeholder="e.g. Developer reviewing code on a laptop" autoFocus onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); confirmUpload(); } }} />
              <p className="mt-1 text-[11px] text-muted-foreground">Describe the image for people who can&apos;t see it — search engines read this too.</p>
            </div>
            <div>
              <Label htmlFor="media-caption">Caption (optional)</Label>
              <Input id="media-caption" value={caption} onChange={event => setCaption(event.target.value)} placeholder="Shown under the image" />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Ready to upload to the {folder} folder (max {maxMB} MB).</p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={upload.isPending} onClick={() => setPending(null)}>Cancel</Button>
          <Button type="button" disabled={upload.isPending} onClick={confirmUpload}>{upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}{upload.isPending ? "Uploading…" : "Upload"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
