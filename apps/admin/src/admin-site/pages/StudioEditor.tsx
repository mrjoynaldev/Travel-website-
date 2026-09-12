"use client";

import { RichTextEditor } from "@/admin-site/components/RichTextEditor";
import { MediaUploadButton } from "@/admin-site/components/MediaUploadButton";
import { SeoHint } from "@/admin-site/components/SeoHint";
import { InlineTaxonomy } from "@/admin-site/components/InlineTaxonomy";
import DashboardLayout from "@/admin-site/components/DashboardLayout";
import { StatusPill } from "@/admin-site/pages/Studio";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Archive,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Loader2,
  Save,
  Send,
  Settings2,
  Star,
  Trash2,
  Undo2,
  ListChecks,
  Plus,
  ImagePlus,
  Check,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRouteId } from "@/admin-site/lib/useRouteId";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { publicArticleUrl } from "@/admin-site/lib/publicSite";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/useMobile";

type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  contentJson: { type: string; content?: unknown[] };
  renderedHtml: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImageUrl: string;
  featuredMediaId: string | null;
  categoryIds: string[];
  tagIds: string[];
};
const emptyDraft: Draft = {
  title: "",
  slug: "",
  excerpt: "",
  contentJson: { type: "doc", content: [] },
  renderedHtml: "",
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  ogImageUrl: "",
  featuredMediaId: null,
  categoryIds: [],
  tagIds: [],
};

export function StudioEditor() {
  const postId = useRouteId();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [ready, setReady] = useState(!postId);
  const [featured, setFeatured] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const lastSavedHash = useRef("");
  const slugTouched = useRef(false);
  const isMobile = useIsMobile();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const post = trpc.studio.posts.get.useQuery(
    { id: postId || "00000000-0000-0000-0000-000000000000" },
    { enabled: Boolean(postId) }
  );
  const bootstrap = trpc.studio.bootstrap.useQuery();
  const mediaLibrary = trpc.studio.media.list.useQuery({});
  const featuredAsset = mediaLibrary.data?.find(
    asset => asset.id === draft.featuredMediaId
  );
  const revisions = trpc.studio.posts.revisions.useQuery(
    { id: postId || "00000000-0000-0000-0000-000000000000" },
    { enabled: Boolean(postId) }
  );
  useEffect(() => {
    if (post.data) {
      const nextDraft = {
        title: post.data.title,
        slug: post.data.slug,
        excerpt: post.data.excerpt || "",
        contentJson: post.data.content_json as Draft["contentJson"],
        renderedHtml: post.data.rendered_html,
        metaTitle: post.data.meta_title || "",
        metaDescription: post.data.meta_description || "",
        canonicalUrl: post.data.canonical_url || "",
        ogImageUrl: post.data.og_image_url || "",
        featuredMediaId: post.data.featured_media_id || null,
        categoryIds: post.data.categoryIds || [],
        tagIds: post.data.tagIds || [],
      };
      lastSavedHash.current = JSON.stringify(nextDraft);
      setDraft(nextDraft);
      setFeatured(Boolean((post.data as any).featured));
      setScheduledAt(
        (post.data as any).scheduled_at
          ? String((post.data as any).scheduled_at).slice(0, 16)
          : ""
      );
      setReady(true);
      slugTouched.current = Boolean(post.data.slug);
    }
  }, [post.data]);

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

  useEffect(() => {
    if (!slugTouched.current && draft.title.trim() && !draft.slug.trim()) {
      setDraft(current => ({ ...current, slug: slugify(draft.title) }));
    }
  }, [draft.title]);
  const create = trpc.studio.posts.create.useMutation({
    onSuccess: data => {
      toast.success("Draft created.");
      router.push(`/studio/posts/${data.id}`);
    },
    onError: error => toast.error(error.message),
  });
  const update = trpc.studio.posts.update.useMutation({
    onSuccess: () => {
      lastSavedHash.current = JSON.stringify(draft);
      toast.success("Changes saved and revision recorded.");
      post.refetch();
      revisions.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const autosave = trpc.studio.posts.update.useMutation({
    onSuccess: () => {
      lastSavedHash.current = JSON.stringify(draft);
    },
    onError: () =>
      toast.error("Autosave could not complete. Please use Save changes."),
  });
  const transition = trpc.studio.posts.transition.useMutation({
    onSuccess: data => {
      if (data.status === "published") {
        toast.success(`Published live: ${publicArticleUrl(data.slug)}`, {
          duration: 10000,
          action: {
            label: "Copy URL",
            onClick: () => {
              navigator.clipboard
                .writeText(publicArticleUrl(data.slug))
                .then(() => toast.success("Live URL copied to clipboard."));
            },
          },
        });
      } else {
        toast.success("Workflow state updated.");
      }
      post.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const restore = trpc.studio.posts.restore.useMutation({
    onSuccess: () => {
      toast.success("Revision restored.");
      post.refetch();
      revisions.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const toggleFeatured = trpc.studio.posts.toggleFeatured.useMutation({
    onSuccess: data => {
      setFeatured(Boolean(data.featured));
      post.refetch();
      toast.success(
        data.featured ? "Marked as featured." : "Removed from featured."
      );
    },
    onError: error => toast.error(error.message),
  });
  const schedule = trpc.studio.posts.schedule.useMutation({
    onSuccess: data => {
      post.refetch();
      toast.success(
        data.scheduled_at ? "Publication scheduled." : "Schedule cleared."
      );
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.studio.posts.remove.useMutation({
    onSuccess: () => {
      toast.success("Post moved to trash.");
      router.push("/studio/posts");
    },
    onError: error => toast.error(error.message),
  });
  const save = () => {
    const payload = {
      ...draft,
      categoryIds: draft.categoryIds,
      tagIds: draft.tagIds,
    };
    if (postId) update.mutate({ id: postId, data: payload });
    else create.mutate(payload);
  };
  useEffect(() => {
    if (!postId || !ready || !draft.title.trim() || autosave.isPending) return;
    const nextHash = JSON.stringify(draft);
    if (nextHash === lastSavedHash.current) return;
    const timer = window.setTimeout(
      () =>
        autosave.mutate({
          id: postId,
          data: {
            ...draft,
            categoryIds: draft.categoryIds,
            tagIds: draft.tagIds,
          },
          revisionNote: "Autosaved change",
        }),
      1600
    );
    return () => window.clearTimeout(timer);
  }, [draft, postId, ready]);
  const toggleId = (field: "categoryIds" | "tagIds", id: string) =>
    setDraft(current => ({
      ...current,
      [field]: current[field].includes(id)
        ? current[field].filter(item => item !== id)
        : [...current[field], id],
    }));
  const role = bootstrap.data?.actor.role;
  const status = post.data?.status || "draft";
  const canPublish = role === "admin" || role === "editor";

  const sidebarContent = (
    <>
      <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <p className="font-label text-[10px] text-primary">Organization</p>
        <InlineTaxonomy
          categoryIds={draft.categoryIds}
          tagIds={draft.tagIds}
          onToggleCategory={id => toggleId("categoryIds", id)}
          onToggleTag={id => toggleId("tagIds", id)}
        />
      </section>
      {postId && canPublish && (
        <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="font-label text-[10px] text-primary">
            Featured & schedule
          </p>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <Checkbox
              checked={featured}
              onCheckedChange={checked =>
                toggleFeatured.mutate({
                  id: postId,
                  featured: checked === true,
                })
              }
            />
            <Star className="h-4 w-4 text-primary" />
            Feature on the homepage
          </label>
          {["draft", "review"].includes(status) && (
            <div className="mt-4">
              <Label className="text-xs text-muted-foreground">
                Schedule publication
              </Label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={event => setScheduledAt(event.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  disabled={schedule.isPending || !scheduledAt}
                  onClick={() =>
                    schedule.mutate({
                      id: postId,
                      scheduledAt: new Date(scheduledAt).toISOString(),
                    })
                  }
                >
                  <CalendarClock className="mr-1 h-3.5 w-3.5" />
                  Schedule
                </Button>
                {(post.data as any)?.scheduled_at && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={schedule.isPending}
                    onClick={() => {
                      setScheduledAt("");
                      schedule.mutate({ id: postId, clear: true });
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>
      )}
      <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <p className="font-label text-[10px] text-primary">SEO & social</p>
        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Meta title</Label>
            <Input
              value={draft.metaTitle}
              onChange={event =>
                setDraft({ ...draft, metaTitle: event.target.value })
              }
              className="mt-1"
            />
            <SeoHint
              value={draft.metaTitle}
              max={60}
              ideal="CTR format: [Exact error/problem] + Fix, keyword first, ≤60 chars — match the real search phrasing"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Meta description
            </Label>
            <Textarea
              value={draft.metaDescription}
              onChange={event =>
                setDraft({
                  ...draft,
                  metaDescription: event.target.value,
                })
              }
              rows={3}
              className="mt-1"
            />
            <SeoHint
              value={draft.metaDescription}
              min={120}
              max={160}
              ideal="name the exact error in the first words, then the fix — 150–160 characters shows fully in Google"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Canonical URL
            </Label>
            <Input
              value={draft.canonicalUrl}
              onChange={event =>
                setDraft({ ...draft, canonicalUrl: event.target.value })
              }
              placeholder="https://…"
              className="mt-1"
            />
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-[#fbfcfa] p-5">
        <p className="font-label text-[10px] text-primary">
          Revision history
        </p>
        <div className="mt-3 space-y-3">
          {revisions.data?.slice(0, 5).map(item => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-white p-3"
            >
              <p className="text-sm font-medium">
                Revision {item.revision_number}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.summary || "Saved change"}
              </p>
              {(role === "admin" || role === "editor") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-auto p-0 text-xs text-primary"
                  onClick={() =>
                    postId &&
                    restore.mutate({ postId, revisionId: item.id })
                  }
                >
                  <Undo2 className="mr-1 h-3 w-3" />
                  Restore
                </Button>
              )}
            </div>
          ))}
          {!revisions.data?.length && (
            <p className="text-sm text-muted-foreground">
              A revision is saved when you update an existing post.
            </p>
          )}
        </div>
      </section>
    </>
  );

  const publishRequired = [
    { done: Boolean(draft.title.trim()), label: "Add a clear title" },
    { done: draft.categoryIds.length > 0, label: "Choose a category" },
    {
      done: (draft.contentJson.content?.length ?? 0) > 0,
      label: "Write some content",
    },
  ];
  const publishRecommended = [
    { done: Boolean(draft.featuredMediaId), label: "Add a cover image" },
    { done: Boolean(draft.excerpt.trim()), label: "Write a short excerpt" },
  ];
  const publishReady = publishRequired.every(item => item.done);
  const publishPost = () => {
    setPublishOpen(false);
    const targetStatus = canPublish ? "published" : "review";
    if (postId) {
      save();
      transition.mutate({ id: postId, status: targetStatus });
    } else {
      create.mutate(
        { ...draft, categoryIds: draft.categoryIds, tagIds: draft.tagIds },
        {
          onSuccess: data => {
            transition.mutate({ id: data.id, status: targetStatus });
            router.push("/studio/posts");
          },
        }
      );
    }
  };

  const actionBar = (
    <div className="grid grid-cols-3 gap-2 p-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => setSettingsOpen(true)}
        className="h-11 gap-2"
      >
        <Settings2 className="h-4 w-4" />
        Settings
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={save}
        disabled={create.isPending || update.isPending}
        className="h-11 gap-2"
      >
        <Save className="h-4 w-4" />
        Save draft
      </Button>
      <Button
        type="button"
        onClick={() => setPublishOpen(true)}
        className="h-11 gap-2"
      >
        <Send className="h-4 w-4" />
        Publish
      </Button>
    </div>
  );

  const publishChecks = [...publishRequired, ...publishRecommended];
  if (postId && (post.isLoading || !ready))
    return (
      <DashboardLayout>
        <div className="grid min-h-[70vh] place-items-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 border-b border-border pb-4 xl:mb-6 xl:flex-row xl:items-center xl:justify-between xl:pb-5">
          <div className="flex items-center gap-3">
            <Link href="/studio/posts">
              <Button variant="ghost" size="icon" aria-label="Back to posts">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <p className="font-label text-[10px] text-primary">Editor</p>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="font-display text-2xl font-semibold xl:text-3xl">
                  {postId ? "Edit post" : "New post"}
                </h1>
                {postId && <StatusPill state={status} />}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {postId && status === "published" && (
              <>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    window.open(publicArticleUrl(draft.slug), "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden md:inline">View live</span>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(publicArticleUrl(draft.slug))
                      .then(() => toast.success("Live URL copied to clipboard."));
                  }}
                >
                  <Copy className="h-4 w-4" />
                  <span className="hidden md:inline">Copy URL</span>
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                postId && window.open(`/studio/preview/${postId}`, "_blank")
              }
              disabled={!postId}
            >
              <Eye className="h-4 w-4" />
              <span className="hidden md:inline">Preview</span>
            </Button>
            <Button
              onClick={save}
              disabled={create.isPending || update.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {postId ? (
                <span className="hidden md:inline">Save changes</span>
              ) : (
                "Create draft"
              )}
            </Button>
            {postId && status === "draft" && (
              <Button
                variant="secondary"
                disabled={transition.isPending}
                onClick={() =>
                  transition.mutate({ id: postId, status: "review" })
                }
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                <span className="hidden md:inline">Submit for review</span>
              </Button>
            )}
            {postId && status === "review" && canPublish && (
              <Button
                disabled={transition.isPending}
                onClick={() =>
                  transition.mutate({ id: postId, status: "published" })
                }
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden md:inline">Approve & publish</span>
              </Button>
            )}
            {postId && status === "review" && canPublish && (
              <Button
                variant="outline"
                disabled={transition.isPending}
                onClick={() =>
                  transition.mutate({ id: postId, status: "draft" })
                }
                className="gap-2"
              >
                <Undo2 className="h-4 w-4" />
                <span className="hidden md:inline">Return to draft</span>
              </Button>
            )}
            {postId && status === "published" && canPublish && (
              <Button
                variant="outline"
                disabled={transition.isPending}
                onClick={() =>
                  transition.mutate({ id: postId, status: "archived" })
                }
                className="gap-2"
              >
                <Archive className="h-4 w-4" />
                <span className="hidden md:inline">Archive</span>
              </Button>
            )}
            {postId && canPublish && (
              <Button
                variant="destructive"
                disabled={remove.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Move this post to trash? It will be hidden from the public site."
                    )
                  )
                    remove.mutate({ id: postId, confirmed: true });
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden md:inline">Delete</span>
              </Button>
            )}
          </div>
        </header>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-7 xl:grid-cols-[minmax(0,1fr)_290px]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <Label
                htmlFor="post-title"
                className="font-label text-[10px] text-primary"
              >
                Story title
              </Label>
              <Input
                id="post-title"
                value={draft.title}
                onChange={event =>
                  setDraft({ ...draft, title: event.target.value })
                }
                placeholder="A clear, specific promise to the reader"
                className="mt-3 h-auto border-0 px-0 text-3xl font-display font-semibold shadow-none focus-visible:ring-0"
              />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <Label
                    htmlFor="post-slug"
                    className="text-xs text-muted-foreground"
                  >
                    Public URL slug
                  </Label>
                  <Input
                    id="post-slug"
                    value={draft.slug}
                    onChange={event => {
                      slugTouched.current = true;
                      setDraft({ ...draft, slug: event.target.value });
                    }}
                    placeholder="auto-generated from the title"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="post-excerpt"
                    className="text-xs text-muted-foreground"
                  >
                    Reader-facing excerpt
                  </Label>
                  <Input
                    id="post-excerpt"
                    value={draft.excerpt}
                    onChange={event =>
                      setDraft({ ...draft, excerpt: event.target.value })
                    }
                    placeholder="A useful one or two-sentence summary"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </section>
            <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor="post-cover"
                  className="font-label text-[10px] text-primary"
                >
                  Cover image · wide 16:9 works best
                </Label>
                {draft.featuredMediaId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() =>
                      setDraft(current => ({
                        ...current,
                        featuredMediaId: null,
                      }))
                    }
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => document.getElementById("inline-cover-upload")?.click()}
                  className="grid h-24 w-36 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground transition hover:border-primary hover:text-primary"
                  aria-label="Upload a cover image"
                >
                  {featuredAsset?.url ? (
                    <img
                      src={featuredAsset.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-1.5 px-2 text-center">
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-[10px]">Add cover</span>
                    </span>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <MediaUploadButton
                    id="inline-cover-upload"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    folder="featured"
                    label={draft.featuredMediaId ? "Replace cover" : "Upload cover"}
                    onUploaded={asset => {
                      setDraft(current => ({
                        ...current,
                        featuredMediaId: asset.id,
                        ogImageUrl: current.ogImageUrl || asset.url,
                      }));
                    }}
                  />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    The cover shows on the homepage, lists, and when your story
                    is shared. Stories with a cover perform dramatically better.
                  </p>
                </div>
              </div>
            </section>
            <RichTextEditor
              postId={postId}
              title={draft.title}
              initialContent={draft.contentJson}
              onChange={value =>
                setDraft(current => ({
                  ...current,
                  contentJson: value.json,
                  renderedHtml: value.html,
                }))
              }
            />
          </div>
          <aside className="hidden space-y-5 xl:block">
            {sidebarContent}
          </aside>
        </div>
      </div>
      <div
        className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:backdrop-blur sm:hidden"
        aria-label="Editor actions"
      >
        {actionBar}
      </div>
      <div
        className="fixed inset-x-0 bottom-0 z-30 hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur sm:block xl:hidden"
        aria-label="Editor actions"
      >
        {actionBar}
      </div>
      <div className="h-16 xl:hidden" aria-hidden />
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>Post settings</SheetTitle>
            <SheetDescription>
              Everything else about this post.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5">{sidebarContent}</div>
        </SheetContent>
      </Sheet>
      <Sheet open={publishOpen} onOpenChange={setPublishOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>Ready to publish?</SheetTitle>
            <SheetDescription>
              A quick checklist before this story goes live.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-2">
            {publishChecks.map(item => {
              const isRequired = publishRequired.some(
                check => check.label === item.label
              );
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-lg border border-border bg-white p-3"
                >
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                      item.done
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {item.done ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                  </span>
                  <span className="flex-1 text-sm font-medium">
                    {item.label}
                  </span>
                  {!isRequired && (
                    <span className="text-[10px] text-muted-foreground">
                      optional
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={save}
              disabled={create.isPending || update.isPending}
              className="h-11"
            >
              Save draft
            </Button>
            <Button
              type="button"
              onClick={publishPost}
              disabled={!publishReady || transition.isPending}
              className="h-11 gap-2"
            >
              {transition.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {canPublish ? "Publish now" : "Submit for review"}
            </Button>
          </div>
          {!publishReady && (
            <p className="text-center text-xs text-muted-foreground">
              Complete the required steps above to publish.
            </p>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
