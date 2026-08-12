import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Audio as AudioNode, CodeBlock, CTAButton } from "./RichTextEditorExtensions";
import {
  Braces, Code2, Columns3, Highlighter, ImageIcon, ImagePlus, Link2, List, ListOrdered,
  Loader2, MousePointerClick, Music2, Quote, Redo2, RemoveFormatting, Rows3, Search,
  Sparkles, Strikethrough, Table as TableIcon, Trash2, Underline as UnderlineIcon, Undo2,
  WandSparkles, Youtube as YoutubeIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type EditorValue = { type: string; content?: unknown[]; [key: string]: unknown };
type LibraryAsset = { id: string; url: string; filename: string; alt_text: string | null; mime_type: string; folder: string };

const AUDIO_TYPES = [
  { value: "audio/mpeg", label: "MP3" },
  { value: "audio/mp4", label: "M4A / AAC" },
  { value: "audio/wav", label: "WAV" },
  { value: "audio/ogg", label: "OGG" },
  { value: "audio/webm", label: "WebM" },
];

export function RichTextEditor({ postId, title, initialContent, onChange }: { postId?: string; title: string; initialContent?: EditorValue | null; onChange: (value: { json: EditorValue; html: string }) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [aiAction, setAiAction] = useState<"outline" | "improve" | "meta" | "summarize">("improve");
  const [aiResult, setAiResult] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const [sourceMode, setSourceMode] = useState<"visual" | "json" | "html">("visual");
  const [sourceValue, setSourceValue] = useState("");
  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaHref, setCtaHref] = useState("");
  const [ctaText, setCtaText] = useState("Learn more");
  const [ctaVariant, setCtaVariant] = useState<"primary" | "secondary">("primary");
  const [audioOpen, setAudioOpen] = useState(false);
  const [audioSrc, setAudioSrc] = useState("");
  const [audioType, setAudioType] = useState("audio/mpeg");
  const media = trpc.studio.media.list.useQuery({ search: mediaSearch || undefined }, { enabled: mediaOpen });
  const upload = trpc.studio.media.upload.useMutation({ onSuccess: asset => { insertAsset(asset); toast.success("Image added to the story."); }, onError: error => toast.error(error.message) });
  const ai = trpc.ai.assist.useMutation({ onSuccess: result => setAiResult(result.content), onError: error => toast.error(error.message) });
  const editor = useEditor({ extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }), CodeBlock, Image.configure({ allowBase64: false }), Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }), Placeholder.configure({ placeholder: "Start with the idea. The shape will follow." }), CharacterCount, Underline, Highlight, Table.configure({ resizable: true }), TableRow, TableCell, TableHeader, Youtube.configure({ controls: true, nocookie: true, width: 960, height: 540 }), AudioNode, CTAButton], content: (initialContent as any) || { type: "doc", content: [] }, editorProps: { attributes: { class: "editor-content px-6 py-7" } }, onUpdate: ({ editor }) => onChange({ json: editor.getJSON() as EditorValue, html: editor.getHTML() }) });
  useEffect(() => { if (editor && initialContent) editor.commands.setContent(initialContent as any, { emitUpdate: false }); }, [editor, initialContent]);
  useEffect(() => { if (!editor) return; setSourceValue(sourceMode === "json" ? JSON.stringify(editor.getJSON(), null, 2) : editor.getHTML()); }, [editor, sourceMode]);
  const insertAsset = (asset: LibraryAsset) => { if (asset.mime_type.startsWith("audio/")) { editor?.chain().focus().insertContent({ type: "audio", attrs: { src: asset.url, type: asset.mime_type } }).run(); setMediaOpen(false); toast.success("Audio player embedded."); return; } if (!asset.mime_type.startsWith("image/")) { toast.info("Choose an image to embed it in rich text, or an audio file to add a player."); return; } editor?.chain().focus().setImage({ src: asset.url, alt: asset.alt_text || asset.filename }).run(); setMediaOpen(false); };
  const addLink = () => { const href = window.prompt("Paste a secure https:// link"); if (!href) return; if (!/^https?:\/\//i.test(href)) { toast.error("Please use an http or https URL."); return; } editor?.chain().focus().extendMarkRange("link").setLink({ href }).run(); };
  const uploadFile = async (file?: File) => { if (!file) return; const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]; if (!allowed.includes(file.type)) { toast.error("Choose a JPEG, PNG, WebP, GIF, or SVG image."); return; } if (file.size > 10 * 1024 * 1024) { toast.error("Images must be 10 MB or smaller."); return; } const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Could not read the selected file.")); reader.readAsDataURL(file); }); upload.mutate({ filename: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "image/svg+xml", base64, folder: "editor-images", altText: "" }); };
  const runAi = () => { if (!postId) { toast.info("Save this post first to unlock its AI writing assistant."); return; } const content = editor?.getText().trim(); if (!content) { toast.info("Add a little draft text first, then ask the assistant for help."); return; } ai.mutate({ postId, action: aiAction, title: title || "Untitled post", content }); };
  const applySource = () => { if (!editor) return; try { if (sourceMode === "json") { const parsed = JSON.parse(sourceValue); if (!parsed || typeof parsed !== "object" || !("type" in parsed)) throw new Error("A structured document must include a type."); editor.commands.setContent(parsed); } else { if (/<\s*(script|object|embed|style)\b/i.test(sourceValue) || /on\w+\s*=/i.test(sourceValue)) throw new Error("Scripts, embeds, event handlers, and style tags are not allowed in controlled HTML mode."); editor.commands.setContent(sourceValue); } toast.success("Source applied to the structured document. Saving will sanitize the resulting HTML on the server."); setSourceMode("visual"); } catch (error) { toast.error(error instanceof Error ? error.message : "The source could not be applied."); } };
  const insertCta = () => { const href = ctaHref.trim(); if (!/^https?:\/\//i.test(href)) { toast.error("Enter a full http or https URL for the button."); return; } editor?.chain().focus().insertContent({ type: "ctaButton", attrs: { href, text: ctaText.trim() || "Learn more", variant: ctaVariant } }).run(); setCtaOpen(false); setCtaHref(""); setCtaText("Learn more"); setCtaVariant("primary"); toast.success("Call-to-action button added."); };
  const insertAudio = () => { const src = audioSrc.trim(); if (!/^https?:\/\//i.test(src)) { toast.error("Enter a full http or https audio URL (for example an uploaded MP3)."); return; } editor?.chain().focus().insertContent({ type: "audio", attrs: { src, type: audioType } }).run(); setAudioOpen(false); setAudioSrc(""); setAudioType("audio/mpeg"); toast.success("Audio player added."); };
  const insertVideo = () => { const url = window.prompt("Paste a YouTube or Vimeo URL"); if (!url) return; try { editor?.chain().focus().setYoutubeVideo({ src: url }).run(); toast.success("Video embedded."); } catch { toast.error("That video URL could not be embedded. Use a YouTube or Vimeo link."); } };
  const toolbar = (label: string, active: boolean, onClick: () => void, icon: React.ReactNode) => <Button type="button" variant={active ? "secondary" : "ghost"} size="icon" className="h-8 w-8" title={label} aria-label={label} onClick={onClick}>{icon}</Button>;
  const inTable = editor?.isActive("table") || false;
  return <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-[#fbfcfa] px-3 py-2">
      {toolbar("Undo", false, () => editor?.chain().focus().undo().run(), <Undo2 className="h-4 w-4" />)}
      {toolbar("Redo", false, () => editor?.chain().focus().redo().run(), <Redo2 className="h-4 w-4" />)}
      <span className="mx-1 h-5 w-px bg-border" />
      {toolbar("Heading", editor?.isActive("heading") || false, () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), <span className="text-xs font-bold">H2</span>)}
      {toolbar("Bold", editor?.isActive("bold") || false, () => editor?.chain().focus().toggleBold().run(), <span className="font-serif text-sm font-bold">B</span>)}
      {toolbar("Italic", editor?.isActive("italic") || false, () => editor?.chain().focus().toggleItalic().run(), <span className="font-serif text-sm italic">I</span>)}
      {toolbar("Underline", editor?.isActive("underline") || false, () => editor?.chain().focus().toggleUnderline().run(), <UnderlineIcon className="h-4 w-4" />)}
      {toolbar("Strikethrough", editor?.isActive("strike") || false, () => editor?.chain().focus().toggleStrike().run(), <Strikethrough className="h-4 w-4" />)}
      {toolbar("Highlight", editor?.isActive("highlight") || false, () => editor?.chain().focus().toggleHighlight().run(), <Highlighter className="h-4 w-4" />)}
      <span className="mx-1 h-5 w-px bg-border" />
      {toolbar("Quote", editor?.isActive("blockquote") || false, () => editor?.chain().focus().toggleBlockquote().run(), <Quote className="h-4 w-4" />)}
      {toolbar("Bullet list", editor?.isActive("bulletList") || false, () => editor?.chain().focus().toggleBulletList().run(), <List className="h-4 w-4" />)}
      {toolbar("Numbered list", editor?.isActive("orderedList") || false, () => editor?.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-4 w-4" />)}
      {toolbar("Code block", editor?.isActive("codeBlock") || false, () => editor?.chain().focus().toggleCodeBlock().run(), <Code2 className="h-4 w-4" />)}
      <span className="mx-1 h-5 w-px bg-border" />
      {toolbar("Insert table", inTable, () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), <TableIcon className="h-4 w-4" />)}
      {toolbar("Add row", false, () => editor?.chain().focus().addRowAfter().run(), <Rows3 className="h-4 w-4" />)}
      {toolbar("Add column", false, () => editor?.chain().focus().addColumnAfter().run(), <Columns3 className="h-4 w-4" />)}
      {toolbar("Delete table", false, () => editor?.chain().focus().deleteTable().run(), <Trash2 className="h-4 w-4" />)}
      <span className="mx-1 h-5 w-px bg-border" />
      {toolbar("Add link", editor?.isActive("link") || false, addLink, <Link2 className="h-4 w-4" />)}
      {toolbar("Call-to-action button", false, () => setCtaOpen(true), <MousePointerClick className="h-4 w-4" />)}
      {toolbar("Audio player", false, () => setAudioOpen(true), <Music2 className="h-4 w-4" />)}
      {toolbar("Video (YouTube/Vimeo)", false, insertVideo, <YoutubeIcon className="h-4 w-4" />)}
      {toolbar("Choose from media library", false, () => setMediaOpen(true), <ImageIcon className="h-4 w-4" />)}
      {toolbar("Upload image", false, () => fileRef.current?.click(), <ImagePlus className="h-4 w-4" />)}
      <span className="mx-1 h-5 w-px bg-border" />
      {toolbar("JSON source", sourceMode === "json", () => setSourceMode(sourceMode === "json" ? "visual" : "json"), <Braces className="h-4 w-4" />)}
      {toolbar("Controlled HTML", sourceMode === "html", () => setSourceMode(sourceMode === "html" ? "visual" : "html"), <Code2 className="h-4 w-4" />)}
      {toolbar("Clear formatting", false, () => editor?.chain().focus().unsetAllMarks().clearNodes().run(), <RemoveFormatting className="h-4 w-4" />)}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" className="hidden" onChange={event => { uploadFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
    </div>
    {sourceMode === "visual" ? <EditorContent editor={editor} /> : <div className="p-5"><p className="mb-3 text-xs text-muted-foreground">{sourceMode === "json" ? "Structured source is the canonical editor representation." : "Controlled HTML is converted back to structured content and sanitized again during server save."}</p><textarea value={sourceValue} onChange={event => setSourceValue(event.target.value)} className="min-h-[360px] w-full rounded-lg border border-border bg-[#101b15] p-4 font-mono text-xs leading-5 text-[#e5f1e5]" spellCheck={false} /><div className="mt-3 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setSourceMode("visual")}>Cancel</Button><Button type="button" onClick={applySource}>Apply to document</Button></div></div>}
    <div className="flex items-center justify-between border-t border-border bg-[#fbfcfa] px-5 py-2 text-xs text-muted-foreground"><span>{editor?.storage.characterCount.words() ?? 0} words</span><span>{editor?.storage.characterCount.characters() ?? 0} characters</span></div>
    <div className="border-t border-[#cad8c5] bg-[#eef4ea] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></span><div><p className="text-sm font-semibold">Writing companion</p><p className="text-xs text-muted-foreground">Suggestions stay in the editor until you choose to use them.</p></div></div><div className="flex gap-2"><select value={aiAction} onChange={event => setAiAction(event.target.value as typeof aiAction)} className="h-9 rounded-md border border-border bg-white px-2 text-sm"><option value="outline">Build outline</option><option value="improve">Suggest improvements</option><option value="meta">Write SEO metadata</option><option value="summarize">Summarize draft</option></select><Button type="button" size="sm" onClick={runAi} disabled={ai.isPending} className="gap-2">{ai.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}Ask AI</Button></div></div>{aiResult && <div className="mt-4 rounded-lg border border-[#cbd8c5] bg-white p-4 text-sm"><div className="mb-2 flex items-center justify-between"><p className="font-label text-[10px] text-primary">AI suggestion</p><Button type="button" variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(aiResult).then(() => toast.success("Suggestion copied"))}>Copy</Button></div><Streamdown>{aiResult}</Streamdown></div>}</div>

    <Dialog open={mediaOpen} onOpenChange={setMediaOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle className="font-display text-2xl">Choose from the media library</DialogTitle><DialogDescription>Reusable images and audio are stored securely. Images embed inline; audio files add a playable player.</DialogDescription></DialogHeader><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={mediaSearch} onChange={event => setMediaSearch(event.target.value)} placeholder="Search filenames" className="pl-10" /></div><div className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">{media.isLoading ? <div className="col-span-full grid min-h-32 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : media.data?.filter(asset => asset.mime_type.startsWith("image/") || asset.mime_type.startsWith("audio/")).map(asset => <button type="button" key={asset.id} onClick={() => insertAsset(asset)} className="overflow-hidden rounded-lg border border-border text-left transition hover:border-primary hover:ring-2 hover:ring-primary/15">{asset.mime_type.startsWith("image/") ? <img src={asset.url} alt={asset.alt_text || ""} className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] w-full place-items-center bg-secondary text-primary"><Music2 className="h-8 w-8" /></div>}<span className="block truncate px-2 py-2 text-xs font-medium">{asset.filename}</span><span className="block truncate px-2 pb-2 text-[10px] text-muted-foreground">{asset.folder}</span></button>)}{!media.isLoading && !media.data?.some(asset => asset.mime_type.startsWith("image/") || asset.mime_type.startsWith("audio/")) && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No reusable images or audio match this search.</p>}</div></DialogContent></Dialog>

    <Dialog open={ctaOpen} onOpenChange={setCtaOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="font-display text-2xl">Call-to-action button</DialogTitle><DialogDescription>Add a styled button that links readers to an external page or another story.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label>Button text</Label><Input value={ctaText} onChange={event => setCtaText(event.target.value)} placeholder="e.g. Read the guide" className="mt-1.5" /></div><div><Label>Destination URL</Label><Input value={ctaHref} onChange={event => setCtaHref(event.target.value)} placeholder="https://…" className="mt-1.5" /></div><div><Label>Style</Label><Select value={ctaVariant} onValueChange={value => setCtaVariant(value as "primary" | "secondary")}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="primary">Primary (filled)</SelectItem><SelectItem value="secondary">Secondary (outline)</SelectItem></SelectContent></Select></div><div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setCtaOpen(false)}>Cancel</Button><Button onClick={insertCta}>Add button</Button></div></div></DialogContent></Dialog>

    <Dialog open={audioOpen} onOpenChange={setAudioOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="font-display text-2xl">Audio player</DialogTitle><DialogDescription>Embed a song, podcast clip, or audio note using a direct media URL.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label>Audio URL</Label><Input value={audioSrc} onChange={event => setAudioSrc(event.target.value)} placeholder="https://…/audio.mp3" className="mt-1.5" /><p className="mt-1.5 text-xs text-muted-foreground">Tip: upload an audio file to the media library, then paste its URL here.</p></div><div><Label>Format</Label><Select value={audioType} onValueChange={setAudioType}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{AUDIO_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></div><div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setAudioOpen(false)}>Cancel</Button><Button onClick={insertAudio}>Add player</Button></div></div></DialogContent></Dialog>

    {upload.isPending && <div className="absolute"><Loader2 className="animate-spin" /></div>}
  </div>;
}
