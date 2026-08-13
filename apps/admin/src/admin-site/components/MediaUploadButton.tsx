"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, UploadCloud } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

type UploadedAsset = { id: string; url: string; filename: string; alt_text: string | null; mime_type: string; folder: string };

const ALLOWED_MIME = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "application/pdf",
  "audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/webm", "video/mp4", "video/webm",
] as const;

export function MediaUploadButton({ accept, folder = "library", label = "Upload", className, onUploaded }: { accept: string; folder?: string; label?: string; className?: string; onUploaded: (asset: UploadedAsset) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = trpc.studio.media.upload.useMutation({ onError: error => toast.error(error.message) });
  const onFile = async (file?: File) => {
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) { toast.error("That file type is not accepted."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Media must be 10 MB or smaller."); return; }
    const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Could not read the selected file.")); reader.readAsDataURL(file); });
    upload.mutate({ filename: file.name, mimeType: file.type as typeof ALLOWED_MIME[number], base64, folder, altText: "" }, { onSuccess: asset => { onUploaded(asset as unknown as UploadedAsset); toast.success("Media uploaded to the library."); } });
  };
  return <>
    <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={event => { onFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
    <Button type="button" variant="outline" size="sm" className={className} disabled={upload.isPending} onClick={() => fileRef.current?.click()}>{upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}{upload.isPending ? "Uploading…" : label}</Button>
  </>;
}
