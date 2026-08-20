"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function InlineTaxonomy({ categoryIds, tagIds, onToggleCategory, onToggleTag }: {
  categoryIds: string[];
  tagIds: string[];
  onToggleCategory: (id: string) => void;
  onToggleTag: (id: string) => void;
}) {
  const taxonomy = trpc.studio.taxonomy.list.useQuery();
  const loading = taxonomy.isPending || taxonomy.isLoading;
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [tagName, setTagName] = useState("");
  const createCategory = trpc.studio.taxonomy.createCategory.useMutation({
    onSuccess: data => { taxonomy.refetch(); onToggleCategory(data.id); setCategoryName(""); setCategoryOpen(false); toast.success(`Category "${data.name}" created and selected.`); },
    onError: error => toast.error(error.message),
  });
  const createTag = trpc.studio.taxonomy.createTag.useMutation({
    onSuccess: data => { taxonomy.refetch(); onToggleTag(data.id); setTagName(""); setTagOpen(false); toast.success(`Tag "#${data.name}" created and selected.`); },
    onError: error => toast.error(error.message),
  });
  return (
    <>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Categories</p>
        <Button type="button" size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-xs text-primary" onClick={() => setCategoryOpen(value => !value)}><Plus className="h-3.5 w-3.5" />New</Button>
      </div>
      {categoryOpen && (
        <div className="mt-2 flex gap-1.5">
          <Input autoFocus value={categoryName} onChange={event => setCategoryName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") createCategory.mutate({ name: categoryName }); if (event.key === "Escape") setCategoryOpen(false); }} placeholder="New category, e.g. Culture" className="h-8 text-xs" />
          <Button type="button" size="sm" className="h-8" disabled={createCategory.isPending || !categoryName.trim()} onClick={() => createCategory.mutate({ name: categoryName })}>Add</Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setCategoryOpen(false)}><X className="h-4 w-4" /></Button>
        </div>
      )}
      <div className="mt-2 space-y-2">
        {loading && <p className="text-xs text-muted-foreground">Loading categories…</p>}
        {taxonomy.isError && <p className="text-xs text-destructive">Couldn't load categories. <button type="button" onClick={() => taxonomy.refetch()} className="underline">Retry</button></p>}
        {taxonomy.data?.categories.map(item => <label key={item.id} className="flex items-center gap-2 text-sm"><Checkbox checked={categoryIds.includes(item.id)} onCheckedChange={() => onToggleCategory(item.id)} />{item.name}</label>)}
        {!loading && !taxonomy.isError && !taxonomy.data?.categories.length && <p className="text-xs text-muted-foreground">No categories yet — create the first one above.</p>}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm font-semibold">Tags</p>
        <Button type="button" size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-xs text-primary" onClick={() => setTagOpen(value => !value)}><Plus className="h-3.5 w-3.5" />New</Button>
      </div>
      {tagOpen && (
        <div className="mt-2 flex gap-1.5">
          <Input autoFocus value={tagName} onChange={event => setTagName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") createTag.mutate({ name: tagName }); if (event.key === "Escape") setTagOpen(false); }} placeholder="New tag, e.g. decision-making" className="h-8 text-xs" />
          <Button type="button" size="sm" className="h-8" disabled={createTag.isPending || !tagName.trim()} onClick={() => createTag.mutate({ name: tagName })}>Add</Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setTagOpen(false)}><X className="h-4 w-4" /></Button>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {loading && <p className="text-xs text-muted-foreground">Loading tags…</p>}
        {taxonomy.isError && <p className="text-xs text-destructive">Couldn't load tags. <button type="button" onClick={() => taxonomy.refetch()} className="underline">Retry</button></p>}
        {taxonomy.data?.tags.map(item => <button type="button" key={item.id} onClick={() => onToggleTag(item.id)} className={`rounded-full border px-2.5 py-1 text-xs ${tagIds.includes(item.id) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>#{item.name}</button>)}
        {!loading && !taxonomy.isError && !taxonomy.data?.tags.length && <p className="text-xs text-muted-foreground">No tags yet — create the first one above.</p>}
      </div>
    </>
  );
}
