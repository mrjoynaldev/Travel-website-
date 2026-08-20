"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarClock, Star, Undo2 } from "lucide-react";
import { MediaUploadButton } from "@/admin-site/components/MediaUploadButton";
import { InlineTaxonomy } from "@/admin-site/components/InlineTaxonomy";

export type PostDraft = { title: string; slug: string; excerpt: string; metaTitle: string; metaDescription: string; canonicalUrl: string; ogImageUrl: string; featuredMediaId: string | null; categoryIds: string[]; tagIds: string[] };

export type PostSettingsPanelProps = {
  draft: PostDraft;
  setDraft: (draft: PostDraft | ((current: PostDraft) => PostDraft)) => void;
  onToggleId: (field: "categoryIds" | "tagIds", id: string) => void;
  taxonomy: { data?: { categories: { id: string; name: string }[]; tags: { id: string; name: string }[] } };
  postId?: string;
  canPublish: boolean;
  status: string;
  featured: boolean;
  onToggleFeatured: (featured: boolean) => void;
  featuredAsset?: { url: string; filename: string } | null;
  scheduledAt: string;
  setScheduledAt: (value: string) => void;
  onSchedule: (input: { scheduledAt: string } | { clear: true }) => void;
  scheduledAtDb?: string | null;
  schedulePending?: boolean;
  revisions: { data?: { id: string; revision_number: number; summary?: string | null }[] };
  role?: string;
  onRestore: (revisionId: string) => void;
};

export function PostSettingsPanel({ draft, setDraft, onToggleId, postId, canPublish, status, featured, onToggleFeatured, featuredAsset, scheduledAt, setScheduledAt, onSchedule, scheduledAtDb, schedulePending, revisions, role, onRestore }: PostSettingsPanelProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-white p-5 text-foreground shadow-sm"><p className="font-label text-[10px] text-primary">Story</p><div className="mt-4 space-y-3"><div><Label className="text-xs text-muted-foreground">Title</Label><Input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="Give this story a title" className="mt-1" /></div><div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={draft.slug} onChange={event => setDraft({ ...draft, slug: event.target.value })} placeholder="url-friendly-slug" className="mt-1" /></div><div><Label className="text-xs text-muted-foreground">Excerpt</Label><Textarea value={draft.excerpt} onChange={event => setDraft({ ...draft, excerpt: event.target.value })} rows={2} placeholder="A short summary shown on cards and in search results." className="mt-1" /></div></div></section>
      <section className="rounded-xl border border-border bg-white p-5 text-foreground shadow-sm"><p className="font-label text-[10px] text-primary">Organization</p><InlineTaxonomy categoryIds={draft.categoryIds} tagIds={draft.tagIds} onToggleCategory={id => onToggleId("categoryIds", id)} onToggleTag={id => onToggleId("tagIds", id)} /></section>
      {postId && canPublish && <section className="rounded-xl border border-border bg-white p-5 text-foreground shadow-sm"><p className="font-label text-[10px] text-primary">Featured & schedule</p><label className="mt-4 flex items-center gap-2 text-sm"><Checkbox checked={featured} onCheckedChange={checked => onToggleFeatured(checked === true)} /><Star className="h-4 w-4 text-primary" />Feature on the homepage</label><div className="mt-4"><Label className="text-xs text-muted-foreground">Featured media</Label><div className="mt-1.5 flex flex-wrap items-center gap-2">{featuredAsset?.url ? <img src={featuredAsset.url} alt="" className="h-12 w-12 rounded-md border border-border object-cover" /> : draft.featuredMediaId ? <div className="grid h-12 w-12 place-items-center rounded-md border border-border bg-muted text-[10px] text-muted-foreground">IMG</div> : null}<MediaUploadButton accept="image/jpeg,image/png,image/webp,image/gif" folder="featured" label={draft.featuredMediaId ? "Replace cover" : "Upload cover"} onUploaded={asset => { setDraft(current => ({ ...current, featuredMediaId: asset.id, ogImageUrl: current.ogImageUrl || asset.url })); }} />{draft.featuredMediaId && <Button type="button" variant="outline" size="sm" onClick={() => setDraft(current => ({ ...current, featuredMediaId: null }))}>Remove</Button>}</div>{featuredAsset?.url && <p className="mt-1 text-xs text-muted-foreground">{featuredAsset.filename}</p>}</div>{["draft", "review"].includes(status) && <div className="mt-4"><Label className="text-xs text-muted-foreground">Schedule publication</Label><input type="datetime-local" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /><div className="mt-2 flex gap-2"><Button size="sm" disabled={schedulePending || !scheduledAt} onClick={() => onSchedule({ scheduledAt: new Date(scheduledAt).toISOString() })}><CalendarClock className="mr-1 h-3.5 w-3.5" />Schedule</Button>{scheduledAtDb && <Button size="sm" variant="outline" disabled={schedulePending} onClick={() => { setScheduledAt(""); onSchedule({ clear: true }); }}>Clear</Button>}</div></div>}</section>}
      <section className="rounded-xl border border-border bg-white p-5 text-foreground shadow-sm"><p className="font-label text-[10px] text-primary">SEO & social</p><div className="mt-4 space-y-3"><div><Label className="text-xs text-muted-foreground">Meta title</Label><Input value={draft.metaTitle} onChange={event => setDraft({ ...draft, metaTitle: event.target.value })} className="mt-1" /></div><div><Label className="text-xs text-muted-foreground">Meta description</Label><Textarea value={draft.metaDescription} onChange={event => setDraft({ ...draft, metaDescription: event.target.value })} rows={3} className="mt-1" /></div><div><Label className="text-xs text-muted-foreground">Canonical URL</Label><Input value={draft.canonicalUrl} onChange={event => setDraft({ ...draft, canonicalUrl: event.target.value })} placeholder="https://…" className="mt-1" /></div></div></section>
      <section className="rounded-xl border border-border bg-[#fbfcfa] p-5 text-foreground"><p className="font-label text-[10px] text-primary">Revision history</p><div className="mt-3 space-y-3">{revisions.data?.slice(0, 5).map(item => <div key={item.id} className="rounded-lg border border-border bg-white p-3"><p className="text-sm font-medium">Revision {item.revision_number}</p><p className="mt-1 text-xs text-muted-foreground">{item.summary || "Saved change"}</p>{(role === "admin" || role === "editor") && postId && <Button variant="ghost" size="sm" className="mt-2 h-auto p-0 text-xs text-primary" onClick={() => onRestore(item.id)}><Undo2 className="mr-1 h-3 w-3" />Restore</Button>}</div>)}{!revisions.data?.length && <p className="text-sm text-muted-foreground">A revision is saved when you update an existing post.</p>}</div></section>
    </div>
  );
}
