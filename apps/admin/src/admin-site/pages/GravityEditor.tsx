"use client";

import DashboardLayout from "@/admin-site/components/DashboardLayout";
import { DeepDive } from "@/admin-site/gravity/DeepDive";
import { runDoctor } from "@/admin-site/gravity/doctor";
import { PostSettingsPanel, type PostDraft } from "@/admin-site/gravity/PostSettingsPanel";
import { blocksToDoc, blocksToHtml, parseGravityDoc } from "@/admin-site/gravity/serialize";
import { useEditorStore } from "@/admin-site/gravity/store";
import { GravityWorkbench } from "@/admin-site/gravity/GravityWorkbench";
import { StatusPill } from "@/admin-site/pages/Studio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Eye, Loader2, Save, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const emptyDraft: PostDraft = { title: "", slug: "", excerpt: "", metaTitle: "", metaDescription: "", canonicalUrl: "", ogImageUrl: "", featuredMediaId: null, categoryIds: [], tagIds: [] };

export function GravityEditor() {
  const params = useParams<{ id: string }>(); const postId = params?.id; const router = useRouter();
  const [draft, setDraft] = useState<PostDraft>(emptyDraft); const [ready, setReady] = useState(!postId); const [featured, setFeatured] = useState(false); const [scheduledAt, setScheduledAt] = useState(""); const [deepDive, setDeepDive] = useState(false);
  const lastSavedHash = useRef("");
  const blocks = useEditorStore(state => state.blocks); const sections = useEditorStore(state => state.sections); const loadDoc = useEditorStore(state => state.loadDoc); const clearAll = useEditorStore(state => state.clearAll);
  const post = trpc.studio.posts.get.useQuery({ id: postId || "00000000-0000-0000-0000-000000000000" }, { enabled: Boolean(postId) });
  const taxonomy = trpc.studio.taxonomy.list.useQuery(); const bootstrap = trpc.studio.bootstrap.useQuery(); const mediaLibrary = trpc.studio.media.list.useQuery({}); const featuredAsset = mediaLibrary.data?.find(asset => asset.id === draft.featuredMediaId); const revisions = trpc.studio.posts.revisions.useQuery({ id: postId || "00000000-0000-0000-0000-000000000000" }, { enabled: Boolean(postId) });

  useEffect(() => {
    if (post.data) {
      const parsed = parseGravityDoc(post.data.content_json);
      const healed = runDoctor(parsed.blocks, parsed.sections);
      loadDoc({ type: "gravity", version: 1, sections: healed.sections, blocks: healed.blocks });
      if (healed.fixes.length) toast.info(`Background doctor tidied the layout: ${healed.fixes.length} fix${healed.fixes.length === 1 ? "" : "es"} applied automatically.`);
      const nextDraft = { title: post.data.title, slug: post.data.slug, excerpt: post.data.excerpt || "", metaTitle: post.data.meta_title || "", metaDescription: post.data.meta_description || "", canonicalUrl: post.data.canonical_url || "", ogImageUrl: post.data.og_image_url || "", featuredMediaId: post.data.featured_media_id || null, categoryIds: post.data.categoryIds || [], tagIds: post.data.tagIds || [] };
      lastSavedHash.current = JSON.stringify({ ...nextDraft, blocks: healed.blocks, sections: healed.sections });
      setDraft(nextDraft); setFeatured(Boolean((post.data as any).featured)); setScheduledAt((post.data as any).scheduled_at ? String((post.data as any).scheduled_at).slice(0, 16) : ""); setReady(true);
    }
  }, [post.data, loadDoc]);

  useEffect(() => { if (!postId && ready) { clearAll(); lastSavedHash.current = JSON.stringify({ ...draft, blocks: [], sections: [] }); } }, [postId, ready, clearAll, draft]);

  const create = trpc.studio.posts.create.useMutation({ onSuccess: data => { toast.success("Gravity draft created."); router.push(`/studio/gravity/${data.id}`); }, onError: error => toast.error(error.message) });
  const update = trpc.studio.posts.update.useMutation({ onSuccess: () => { toast.success("Changes saved and revision recorded."); post.refetch(); revisions.refetch(); }, onError: error => toast.error(error.message) });
  const autosave = trpc.studio.posts.update.useMutation({ onSuccess: () => { lastSavedHash.current = JSON.stringify(buildPayload()); }, onError: () => toast.error("Autosave could not complete. Please use Save changes.") });
  const transition = trpc.studio.posts.transition.useMutation({ onSuccess: () => { toast.success("Workflow state updated."); post.refetch(); }, onError: error => toast.error(error.message) });
  const restore = trpc.studio.posts.restore.useMutation({ onSuccess: () => { toast.success("Revision restored."); post.refetch(); revisions.refetch(); }, onError: error => toast.error(error.message) });
  const toggleFeatured = trpc.studio.posts.toggleFeatured.useMutation({ onSuccess: data => { setFeatured(Boolean(data.featured)); post.refetch(); toast.success(data.featured ? "Marked as featured." : "Removed from featured."); }, onError: error => toast.error(error.message) });
  const schedule = trpc.studio.posts.schedule.useMutation({ onSuccess: data => { post.refetch(); toast.success(data.scheduled_at ? "Publication scheduled." : "Schedule cleared."); }, onError: error => toast.error(error.message) });
  const remove = trpc.studio.posts.remove.useMutation({ onSuccess: () => { toast.success("Post moved to trash."); router.push("/studio/posts"); }, onError: error => toast.error(error.message) });

  const buildPayload = () => ({ ...draft, categoryIds: draft.categoryIds, tagIds: draft.tagIds, contentJson: blocksToDoc(useEditorStore.getState().blocks, useEditorStore.getState().sections), renderedHtml: blocksToHtml(useEditorStore.getState().blocks, useEditorStore.getState().sections) });
  const save = () => { const payload = buildPayload(); if (postId) update.mutate({ id: postId, data: payload }); else create.mutate(payload); };

  useEffect(() => {
    if (!postId || !ready || !draft.title.trim()) return;
    const payload = buildPayload(); const nextHash = JSON.stringify(payload);
    if (nextHash === lastSavedHash.current) return;
    const timer = window.setTimeout(() => autosave.mutate({ id: postId, data: payload, revisionNote: "Autosaved change" }), 1600);
    return () => window.clearTimeout(timer);
  }, [draft, blocks, sections, postId, ready]);

  const toggleId = (field: "categoryIds" | "tagIds", id: string) => setDraft(current => ({ ...current, [field]: current[field].includes(id) ? current[field].filter(item => item !== id) : [...current[field], id] }));
  const role = bootstrap.data?.actor.role; const status = post.data?.status || "draft"; const canPublish = role === "admin" || role === "editor";

  const settingsProps = {
    draft, setDraft, onToggleId: toggleId, taxonomy, postId, canPublish, status, featured, onToggleFeatured: (value: boolean) => postId && toggleFeatured.mutate({ id: postId, featured: value }), featuredAsset, scheduledAt, setScheduledAt, onSchedule: (input: { scheduledAt: string } | { clear: true }) => postId && schedule.mutate({ id: postId, ...input }), scheduledAtDb: post.data ? (post.data as any).scheduled_at : null, schedulePending: schedule.isPending, revisions, role, onRestore: (revisionId: string) => postId && restore.mutate({ postId, revisionId }),
  };

  if (postId && (post.isLoading || !ready)) return <DashboardLayout><div className="grid min-h-[70vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 border-b border-border pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/studio/posts"><Button variant="ghost" size="icon" aria-label="Back to posts"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <div>
              <p className="font-label text-[10px] text-primary">Gravity editor</p>
              <div className="mt-1 flex items-center gap-3"><h1 className="font-display text-3xl font-semibold">{postId ? "Edit gravity draft" : "New gravity draft"}</h1>{postId && <StatusPill state={status} />}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => postId && window.open(`/studio/preview/${postId}`, "_blank")} disabled={!postId}><Eye className="h-4 w-4" />Preview</Button>
            <Button onClick={save} disabled={create.isPending || update.isPending} className="gap-2"><Save className="h-4 w-4" />{postId ? "Save changes" : "Create draft"}</Button>
            {postId && status === "draft" && <Button variant="secondary" disabled={transition.isPending} onClick={() => transition.mutate({ id: postId, status: "review" })} className="gap-2"><Send className="h-4 w-4" />Submit for review</Button>}
            {postId && status === "review" && canPublish && <Button disabled={transition.isPending} onClick={() => transition.mutate({ id: postId, status: "published" })}>Approve & publish</Button>}
            {postId && status === "review" && canPublish && <Button variant="outline" disabled={transition.isPending} onClick={() => transition.mutate({ id: postId, status: "draft" })}>Return to draft</Button>}
            {postId && status === "published" && canPublish && <Button variant="outline" disabled={transition.isPending} onClick={() => transition.mutate({ id: postId, status: "archived" })}>Archive</Button>}
            {postId && canPublish && <Button variant="destructive" disabled={remove.isPending} onClick={() => { if (window.confirm("Move this post to trash? It will be hidden from the public site.")) remove.mutate({ id: postId, confirmed: true }); }}><Trash2 className="h-4 w-4" />Delete</Button>}
          </div>
        </header>
        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <Label htmlFor="gravity-title" className="font-label text-[10px] text-primary">Story title</Label>
              <Input id="gravity-title" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="A clear, specific promise to the reader" className="mt-3 h-auto border-0 px-0 text-3xl font-display font-semibold shadow-none focus-visible:ring-0" />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div><Label htmlFor="gravity-slug" className="text-xs text-muted-foreground">Public URL slug</Label><Input id="gravity-slug" value={draft.slug} onChange={event => setDraft({ ...draft, slug: event.target.value })} placeholder="generated-from-title" className="mt-1.5" /></div>
                <div><Label htmlFor="gravity-excerpt" className="text-xs text-muted-foreground">Reader-facing excerpt</Label><Input id="gravity-excerpt" value={draft.excerpt} onChange={event => setDraft({ ...draft, excerpt: event.target.value })} placeholder="A useful one or two-sentence summary" className="mt-1.5" /></div>
              </div>
            </section>
            <GravityWorkbench onEnterDeepDive={() => setDeepDive(true)} />
          </div>
          <aside><PostSettingsPanel {...settingsProps} /></aside>
        </div>
      </div>
      {deepDive && <DeepDive {...settingsProps} onClose={() => setDeepDive(false)} onSave={save} savePending={create.isPending || update.isPending} onCreate={() => create.mutate(buildPayload())} createPending={create.isPending} onTransition={value => postId && transition.mutate({ id: postId, status: value })} transitionPending={transition.isPending} onDelete={() => { if (postId && window.confirm("Move this post to trash? It will be hidden from the public site.")) remove.mutate({ id: postId, confirmed: true }); }} deletePending={remove.isPending} onOpenPreview={() => postId && window.open(`/studio/preview/${postId}`, "_blank")} />}
    </DashboardLayout>
  );
}
