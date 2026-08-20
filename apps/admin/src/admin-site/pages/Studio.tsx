"use client";

import DashboardLayout from "@/admin-site/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Boxes,
  Download,
  Film,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Music2,
  PenLine,
  Plus,
  ScrollText,
  Settings2,
  ShieldCheck,
  Tags,
  UploadCloud,
  UsersRound,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

function CreateMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New post
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem asChild>
          <Link href="/studio/posts/new" className="cursor-pointer">
            <PenLine className="mr-2 h-4 w-4" />
            <span>
              <span className="block font-medium">Story</span>
              <span className="block text-xs text-muted-foreground">
                Rich text editor
              </span>
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/studio/gravity" className="cursor-pointer">
            <Boxes className="mr-2 h-4 w-4" />
            <span>
              <span className="block font-medium">Space</span>
              <span className="block text-xs text-muted-foreground">
                Block layout editor
              </span>
            </span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Frame({
  title,
  eyebrow,
  children,
  actions,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const bootstrap = trpc.studio.bootstrap.useQuery();
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
          <div>
            <p className="font-label text-[10px] text-primary">
              {eyebrow || bootstrap.data?.site?.name || "Editorial workspace"}
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
          </div>
          {actions}
        </header>
        {bootstrap.isLoading ? (
          <div className="grid min-h-64 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          children
        )}
      </div>
    </DashboardLayout>
  );
}

const stateStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  review: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  archived: "bg-stone-200 text-stone-700",
};
export const StatusPill = ({ state }: { state: string }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${stateStyles[state] || "bg-muted"}`}
  >
    {state}
  </span>
);

export function StudioOverview() {
  const posts = trpc.studio.posts.list.useQuery({});
  const analytics = trpc.studio.analytics.useQuery({});
  const current = posts.data ?? [];
  const counts = ["draft", "review", "published", "archived"].map(status => ({
    status,
    count: current.filter(post => post.status === status).length,
  }));
  return (
    <Frame
      title="Editorial overview"
      eyebrow="Your publication, at a glance"
      actions={<CreateMenu />}
    >
      <div className="grid gap-4 md:grid-cols-4">
        {counts.map(item => (
          <div
            key={item.status}
            className="rounded-xl border border-border bg-white p-5 shadow-sm"
          >
            <p className="font-label text-[10px] text-muted-foreground">
              {item.status}
            </p>
            <p className="mt-3 font-display text-4xl font-semibold">
              {item.count}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label text-[10px] text-primary">
                Review queue
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                Awaiting an editorial decision
              </h2>
            </div>
            <Link
              href="/studio/posts"
              className="text-sm font-medium text-primary"
            >
              View all
            </Link>
          </div>
          <div className="mt-5 divide-y divide-border">
            {current
              .filter(post => post.status === "review")
              .slice(0, 5)
              .map(post => (
                <Link
                  key={post.id}
                  href={`/studio/posts/${post.id}`}
                  className="flex items-center justify-between gap-4 py-4 hover:text-primary"
                >
                  <div>
                    <p className="font-medium">{post.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Submitted{" "}
                      {post.submitted_at
                        ? new Date(post.submitted_at).toLocaleDateString()
                        : "recently"}
                    </p>
                  </div>
                  <StatusPill state={post.status} />
                </Link>
              ))}
            {!current.some(post => post.status === "review") && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nothing is waiting for review.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-xl bg-[#1b382d] p-6 text-[#edf4ea]">
          <p className="font-label text-[10px] text-[#abc8b2]">Last 30 days</p>
          <p className="mt-3 font-display text-5xl font-semibold">
            {analytics.data?.totalViews ?? 0}
          </p>
          <p className="mt-1 text-sm text-[#c6d5ca]">Measured page views</p>
          <div className="mt-8 border-t border-[#396550] pt-5">
            <p className="text-sm font-medium">
              {analytics.data?.engagementRate ?? 0}% engagement rate
            </p>
            <p className="mt-1 text-xs leading-5 text-[#abc8b2]">
              Engagement is calculated from meaningful reading, scroll, comment,
              and subscription events.
            </p>
          </div>
        </section>
      </div>
    </Frame>
  );
}

type PostFolder =
  | { kind: "all" }
  | { kind: "category"; id: string }
  | { kind: "tag"; id: string };
export function StudioPosts() {
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState<PostFolder>({ kind: "all" });
  const all = trpc.studio.posts.list.useQuery({});
  const taxonomy = trpc.studio.taxonomy.list.useQuery();
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagOpen, setNewTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const createCategory = trpc.studio.taxonomy.createCategory.useMutation({
    onSuccess: data => {
      taxonomy.refetch();
      setNewCategoryName("");
      setNewCategoryOpen(false);
      setFolder({ kind: "category", id: data.id });
      toast.success(`Category "${data.name}" created.`);
    },
    onError: error => toast.error(error.message),
  });
  const createTag = trpc.studio.taxonomy.createTag.useMutation({
    onSuccess: data => {
      taxonomy.refetch();
      setNewTagName("");
      setNewTagOpen(false);
      setFolder({ kind: "tag", id: data.id });
      toast.success(`Tag "#${data.name}" created.`);
    },
    onError: error => toast.error(error.message),
  });
  const folders = useMemo(() => {
    const cats = new Map<string, { name: string; count: number }>();
    const tags = new Map<string, { name: string; count: number }>();
    for (const cat of taxonomy.data?.categories ?? [])
      cats.set(cat.id, { name: cat.name, count: 0 });
    for (const tag of taxonomy.data?.tags ?? [])
      tags.set(tag.id, { name: tag.name, count: 0 });
    for (const post of all.data ?? []) {
      for (const cat of post.categories ?? [])
        cats.set(cat.id, {
          name: cat.name,
          count: (cats.get(cat.id)?.count ?? 0) + 1,
        });
      for (const tag of post.tags ?? [])
        tags.set(tag.id, {
          name: tag.name,
          count: (tags.get(tag.id)?.count ?? 0) + 1,
        });
    }
    return {
      cats: Array.from(cats.entries())
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => b.count - a.count),
      tags: Array.from(tags.entries())
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => b.count - a.count),
    };
  }, [all.data, taxonomy.data]);
  const filtered = useMemo(
    () =>
      (all.data ?? []).filter(
        post =>
          (status === "all" || post.status === status) &&
          (search.trim() === "" ||
            post.title.toLowerCase().includes(search.trim().toLowerCase())) &&
          (folder.kind === "all" ||
            (folder.kind === "category"
              ? (post.categories ?? []).some(cat => cat.id === folder.id)
              : (post.tags ?? []).some(tag => tag.id === folder.id)))
      ),
    [all.data, status, search, folder]
  );
  const isActive = (item: PostFolder) => {
    if (folder.kind !== item.kind) return false;
    if (item.kind === "all") return true;
    return folder.kind !== "all" && folder.id === item.id;
  };
  const FolderButton = ({
    item,
    icon,
    label,
    count,
  }: {
    item: PostFolder;
    icon: React.ReactNode;
    label: string;
    count: number;
  }) => (
    <button
      type="button"
      onClick={() => setFolder(item)}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${isActive(item) ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"}`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <span
        className={`shrink-0 text-xs ${isActive(item) ? "text-primary-foreground/80" : "text-muted-foreground"}`}
      >
        {count}
      </span>
    </button>
  );
  return (
    <Frame
      title="Posts"
      eyebrow="Plan, write, review, publish"
      actions={
        <div className="hidden sm:block">
          <CreateMenu />
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="order-2 min-w-0 h-fit rounded-xl border border-border bg-white p-4 shadow-sm lg:order-1">
          <div className="space-y-1">
            <FolderButton
              item={{ kind: "all" }}
              icon={<FolderOpen className="h-4 w-4" />}
              label="All posts"
              count={all.data?.length ?? 0}
            />
          </div>
          <div className="mt-5 flex items-center justify-between">
            <p className="font-label text-[10px] text-muted-foreground">
              Categories
            </p>
            <button
              type="button"
              className="flex items-center gap-0.5 text-xs font-medium text-primary"
              onClick={() => setNewCategoryOpen(value => !value)}
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>
          <div className="mt-2 space-y-1">
            {newCategoryOpen && (
              <div className="flex gap-1.5 pb-1">
                <Input
                  autoFocus
                  value={newCategoryName}
                  onChange={event => setNewCategoryName(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter")
                      createCategory.mutate({ name: newCategoryName });
                    if (event.key === "Escape") setNewCategoryOpen(false);
                  }}
                  placeholder="Category name"
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={createCategory.isPending || !newCategoryName.trim()}
                  onClick={() =>
                    createCategory.mutate({ name: newCategoryName })
                  }
                >
                  Add
                </Button>
              </div>
            )}
            {folders.cats.map(cat => (
              <FolderButton
                key={cat.id}
                item={{ kind: "category", id: cat.id }}
                icon={<Folder className="h-4 w-4" />}
                label={cat.name}
                count={cat.count}
              />
            ))}
            {!folders.cats.length && !newCategoryOpen && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No categories yet.
              </p>
            )}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <p className="font-label text-[10px] text-muted-foreground">Tags</p>
            <button
              type="button"
              className="flex items-center gap-0.5 text-xs font-medium text-primary"
              onClick={() => setNewTagOpen(value => !value)}
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>
          <div className="mt-2 space-y-1">
            {newTagOpen && (
              <div className="flex gap-1.5 pb-1">
                <Input
                  autoFocus
                  value={newTagName}
                  onChange={event => setNewTagName(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter")
                      createTag.mutate({ name: newTagName });
                    if (event.key === "Escape") setNewTagOpen(false);
                  }}
                  placeholder="Tag name"
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={createTag.isPending || !newTagName.trim()}
                  onClick={() => createTag.mutate({ name: newTagName })}
                >
                  Add
                </Button>
              </div>
            )}
            {folders.tags.map(tag => (
              <FolderButton
                key={tag.id}
                item={{ kind: "tag", id: tag.id }}
                icon={<Tags className="h-4 w-4" />}
                label={`#${tag.name}`}
                count={tag.count}
              />
            ))}
            {!folders.tags.length && !newTagOpen && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No tags yet.
              </p>
            )}
          </div>
        </aside>
        <section className="order-1 min-w-0 lg:order-2">
          <div
            className="mb-3 flex snap-x gap-2 overflow-x-auto pb-1 sm:hidden"
            role="tablist"
            aria-label="Filter by folder"
          >
            <button
              type="button"
              role="tab"
              aria-selected={folder.kind === "all"}
              onClick={() => setFolder({ kind: "all" })}
              className={`shrink-0 snap-start rounded-full border px-3 py-2 text-xs font-medium ${
                folder.kind === "all"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white text-muted-foreground"
              }`}
            >
              All posts
            </button>
            {folders.cats.map(cat => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={folder.kind === "category" && folder.id === cat.id}
                onClick={() =>
                  setFolder({ kind: "category", id: cat.id })
                }
                className={`shrink-0 snap-start rounded-full border px-3 py-2 text-xs font-medium ${
                  folder.kind === "category" && folder.id === cat.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-white text-muted-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search your posts"
              className="w-full max-w-md bg-white"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full bg-white sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <div className="hidden grid-cols-[64px_minmax(0,1fr)_150px] gap-4 border-b border-border bg-[#fbfcfa] px-5 py-3 font-label text-[10px] text-muted-foreground sm:grid">
              <span>Cover</span>
              <span>Story</span>
              <span className="text-right">Actions</span>
            </div>
            {all.isLoading ? (
              <div className="grid min-h-48 place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length ? (
              filtered.map(post => {
                const thumb =
                  post.featuredMedia?.url || post.og_image_url || null;
                return (
                  <div
                    key={post.id}
                    className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 border-b border-border px-4 py-4 last:border-b-0 hover:bg-[#fbfcfa] sm:grid-cols-[64px_minmax(0,1fr)_150px] sm:px-5"
                  >
                    <Link
                      href={`/studio/posts/${post.id}`}
                      className="block h-12 overflow-hidden rounded-lg bg-secondary"
                      aria-label={`Open ${post.title}`}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="grid h-full place-items-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/studio/posts/${post.id}`}
                          className="font-medium hover:text-primary"
                        >
                          <span className="truncate">{post.title}</span>
                        </Link>
                        {(post.categories ?? []).slice(0, 2).map(cat => (
                          <span
                            key={cat.id}
                            className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {post.excerpt || "No excerpt yet"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusPill state={post.status} />
                        <time className="text-xs text-muted-foreground">
                          Updated{" "}
                          {new Date(post.updated_at).toLocaleDateString()}
                        </time>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1 sm:justify-end">
                      <Link href={`/studio/posts/${post.id}`}>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <PenLine className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </Link>
                      <Link href={`/studio/gravity/${post.id}`}>
                        <Button size="sm" className="gap-1.5">
                          <Boxes className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Advanced</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="p-12 text-center text-sm text-muted-foreground">
                No posts match these filters.
              </p>
            )}
          </div>
        </section>
      </div>
      <Link
        href="/studio/posts/new"
        className="fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg sm:hidden"
        aria-label="New post"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </Frame>
  );
}
const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
export function StudioMedia() {
  const [folder, setFolder] = useState("library");
  const [folderFilter, setFolderFilter] = useState("");
  const media = trpc.studio.media.list.useQuery({
    folder: folderFilter || undefined,
  });
  const upload = trpc.studio.media.upload.useMutation({
    onSuccess: () => {
      media.refetch();
      toast.success("Media uploaded to the library.");
    },
    onError: error => toast.error(error.message),
  });
  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "application/pdf",
      "audio/mpeg",
      "audio/wav",
      "audio/mp4",
      "audio/ogg",
      "audio/webm",
      "video/mp4",
      "video/webm",
    ];
    if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast.error("Choose an accepted file smaller than 10 MB.");
      return;
    }
    upload.mutate({
      filename: file.name,
      mimeType: file.type as
        | "image/jpeg"
        | "image/png"
        | "image/webp"
        | "image/gif"
        | "image/svg+xml"
        | "application/pdf"
        | "audio/mpeg"
        | "audio/wav"
        | "audio/mp4"
        | "audio/ogg"
        | "audio/webm"
        | "video/mp4"
        | "video/webm",
      base64: await fileToBase64(file),
      folder: folder.trim() || "library",
      altText: "",
    });
  };
  return (
    <Frame
      title="Media library"
      eyebrow="S3-backed, reusable assets"
      actions={
        <label>
          <input
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf,audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/webm,video/mp4,video/webm"
            onChange={onUpload}
          />
          <Button asChild className="gap-2">
            <span>
              <UploadCloud className="h-4 w-4" />
              Upload asset
            </span>
          </Button>
        </label>
      }
    >
      <p className="mb-5 text-sm text-muted-foreground">
        Images, audio, video, and documents are kept in centralized object
        storage and referenced through durable delivery URLs.
      </p>
      <div className="mb-5 grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Upload into folder
          </p>
          <Input
            value={folder}
            onChange={event => setFolder(event.target.value)}
            placeholder="e.g. issue-01"
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Filter library folder
          </p>
          <Input
            value={folderFilter}
            onChange={event => setFolderFilter(event.target.value)}
            placeholder="All folders"
          />
        </div>
      </div>
      {media.isLoading ? (
        <div className="grid min-h-48 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : media.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {media.data.map(asset => (
            <div
              key={asset.id}
              className="overflow-hidden rounded-xl border border-border bg-white"
            >
              <div className="aspect-[4/3] bg-secondary">
                {asset.mime_type.startsWith("image/") ? (
                  <img
                    src={asset.url}
                    alt={asset.alt_text || ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center gap-2 text-primary">
                    {asset.mime_type.startsWith("audio/") ? (
                      <>
                        <Music2 className="h-7 w-7" />
                        <span className="text-[10px] text-muted-foreground">
                          AUDIO
                        </span>
                      </>
                    ) : asset.mime_type.startsWith("video/") ? (
                      <>
                        <Film className="h-7 w-7" />
                        <span className="text-[10px] text-muted-foreground">
                          VIDEO
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {asset.mime_type}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium">{asset.filename}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.ceil(asset.byte_size / 1024)} KB · {asset.folder}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-white p-14 text-center">
          <UploadCloud className="mx-auto h-7 w-7 text-primary" />
          <p className="mt-3 font-display text-2xl">
            Your library is ready for its first asset.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a supported image or document to reuse it across posts.
          </p>
        </div>
      )}
    </Frame>
  );
}

export function StudioTaxonomy() {
  const taxonomy = trpc.studio.taxonomy.list.useQuery();
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const createCategory = trpc.studio.taxonomy.createCategory.useMutation({
    onSuccess: () => {
      setCategory("");
      taxonomy.refetch();
      toast.success("Category created.");
    },
    onError: error => toast.error(error.message),
  });
  const createTag = trpc.studio.taxonomy.createTag.useMutation({
    onSuccess: () => {
      setTag("");
      taxonomy.refetch();
      toast.success("Tag created.");
    },
    onError: error => toast.error(error.message),
  });
  return (
    <Frame title="Taxonomy" eyebrow="Categories and tags">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <p className="font-label text-[10px] text-primary">Categories</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            Big editorial beats
          </h2>
          <form
            className="mt-5 flex gap-2"
            onSubmit={event => {
              event.preventDefault();
              if (category.trim()) createCategory.mutate({ name: category });
            }}
          >
            <Input
              value={category}
              onChange={event => setCategory(event.target.value)}
              placeholder="e.g. Culture"
            />
            <Button type="submit" disabled={createCategory.isPending}>
              Add
            </Button>
          </form>
          <div className="mt-5 space-y-2">
            {taxonomy.data?.categories.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2"
              >
                <span className="text-sm font-medium">{item.name}</span>
                <span className="font-label text-[10px] text-muted-foreground">
                  /{item.slug}
                </span>
              </div>
            ))}
            {!taxonomy.data?.categories.length && (
              <p className="py-6 text-sm text-muted-foreground">
                No categories yet.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <p className="font-label text-[10px] text-primary">Tags</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            Specific ideas and threads
          </h2>
          <form
            className="mt-5 flex gap-2"
            onSubmit={event => {
              event.preventDefault();
              if (tag.trim()) createTag.mutate({ name: tag });
            }}
          >
            <Input
              value={tag}
              onChange={event => setTag(event.target.value)}
              placeholder="e.g. decision-making"
            />
            <Button type="submit" disabled={createTag.isPending}>
              Add
            </Button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2">
            {taxonomy.data?.tags.map(item => (
              <span
                key={item.id}
                className="rounded-full border border-border px-3 py-1.5 text-sm"
              >
                #{item.name}
              </span>
            ))}
            {!taxonomy.data?.tags.length && (
              <p className="py-6 text-sm text-muted-foreground">No tags yet.</p>
            )}
          </div>
        </section>
      </div>
    </Frame>
  );
}

export function StudioModeration() {
  const queue = trpc.studio.moderation.list.useQuery({ status: "pending" });
  const resolve = trpc.studio.moderation.resolve.useMutation({
    onSuccess: () => {
      queue.refetch();
      toast.success("Comment moderation updated.");
    },
    onError: error => toast.error(error.message),
  });
  return (
    <Frame title="Moderation" eyebrow="Reader conversation">
      <div className="rounded-xl border border-border bg-white shadow-sm">
        {queue.isLoading ? (
          <div className="grid min-h-48 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : queue.data?.length ? (
          queue.data.map(comment => (
            <div
              key={comment.id}
              className="border-b border-border p-5 last:border-b-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">
                    {comment.author_name}{" "}
                    <span className="font-normal text-muted-foreground">
                      on {comment.posts?.title || "an article"}
                    </span>
                  </p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {comment.body}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      resolve.mutate({ id: comment.id, status: "rejected" })
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      resolve.mutate({ id: comment.id, status: "deleted" })
                    }
                  >
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      resolve.mutate({ id: comment.id, status: "approved" })
                    }
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="p-14 text-center text-sm text-muted-foreground">
            The moderation queue is clear.
          </p>
        )}
      </div>
    </Frame>
  );
}

export function StudioAnalytics() {
  const analytics = trpc.studio.analytics.useQuery({});
  return (
    <Frame title="Analytics" eyebrow="Reader engagement">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Page views" value={analytics.data?.totalViews ?? 0} />
        <Metric
          label="Engagement events"
          value={analytics.data?.engagementEvents ?? 0}
        />
        <Metric
          label="Engagement rate"
          value={`${analytics.data?.engagementRate ?? 0}%`}
        />
      </div>
      <section className="mt-7 rounded-xl border border-border bg-white p-6 shadow-sm">
        <p className="font-label text-[10px] text-primary">Top stories</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">
          What readers are engaging with
        </h2>
        <div className="mt-5 divide-y divide-border">
          {analytics.data?.topPosts.length ? (
            analytics.data.topPosts.map((post, index) => (
              <div
                key={post.postId}
                className="grid grid-cols-[32px_1fr_auto] gap-3 py-4"
              >
                <span className="font-display text-xl text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{post.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    /{post.slug || "draft"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{post.views}</p>
                  <p className="text-xs text-muted-foreground">views</p>
                </div>
              </div>
            ))
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Analytics will appear as readers interact with published content.
            </p>
          )}
        </div>
      </section>
    </Frame>
  );
}
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <p className="font-label text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-4xl font-semibold">{value}</p>
    </div>
  );
}

export function StudioTeam() {
  const people = trpc.studio.people.list.useQuery();
  const changeRole = trpc.studio.people.changeRole.useMutation({
    onSuccess: () => {
      people.refetch();
      toast.success("Editorial role updated.");
    },
    onError: error => toast.error(error.message),
  });
  return (
    <Frame title="Editorial team" eyebrow="Role-based access">
      <section className="rounded-xl border border-border bg-white shadow-sm">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <UsersRound className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Publication members
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Admins can manage roles. Authors can edit their own posts;
                Editors can review and publish.
              </p>
            </div>
          </div>
        </div>
        {people.data?.map(member => {
          const profile = (
            member.profiles as unknown as Array<{
              display_name: string | null;
              email: string | null;
            }> | null
          )?.[0];
          return (
            <div
              key={member.id}
              className="flex flex-col gap-3 border-b border-border p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {profile?.display_name || "Editorial member"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {profile?.email || "No email available"}
                </p>
              </div>
              <Select
                value={member.role}
                onValueChange={role =>
                  changeRole.mutate({
                    membershipId: member.id,
                    role: role as "admin" | "editor" | "author",
                  })
                }
              >
                <SelectTrigger className="w-full bg-white sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        })}
        {!people.data?.length && (
          <p className="p-12 text-center text-sm text-muted-foreground">
            No members have signed into this publication yet.
          </p>
        )}
      </section>
    </Frame>
  );
}

export function StudioNotifications() {
  const outbox = trpc.studio.notifications.useQuery();
  return (
    <Frame title="Notification outbox" eyebrow="Role-targeted delivery">
      <p className="mb-5 text-sm text-muted-foreground">
        Workflow actions write auditable notification records. Connect an email
        provider in production to dispatch pending items.
      </p>
      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {outbox.data?.length ? (
          outbox.data.map(item => (
            <div
              key={item.id}
              className="grid gap-2 border-b border-border p-5 last:border-b-0 md:grid-cols-[1fr_150px_120px]"
            >
              <div>
                <p className="text-sm font-semibold">{item.subject}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  To {item.recipient_email}
                </p>
              </div>
              <p className="text-xs capitalize text-muted-foreground">
                {item.event_type.replaceAll("_", " ")}
              </p>
              <StatusPill state={item.status} />
            </div>
          ))
        ) : (
          <p className="p-14 text-center text-sm text-muted-foreground">
            No workflow notifications are waiting.
          </p>
        )}
      </section>
    </Frame>
  );
}

export function StudioSettings() {
  const settings = trpc.studio.settings.get.useQuery();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [locale, setLocale] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [nav, setNav] = useState("[]");
  const update = trpc.studio.settings.update.useMutation({
    onSuccess: () => {
      settings.refetch();
      toast.success("Publication settings saved and audited.");
    },
    onError: error => toast.error(error.message),
  });
  useEffect(() => {
    if (settings.data) {
      setName(settings.data.site.name);
      setDescription(settings.data.site.description || "");
      setDomain(settings.data.site.custom_domain || "");
      setLocale(settings.data.settings?.default_locale || "en");
      setTimezone(settings.data.settings?.timezone || "UTC");
      setNav(JSON.stringify(settings.data.settings?.navigation || [], null, 2));
    }
  }, [settings.data]);
  const save = () => {
    let navigation: Array<{ label: string; path: string }>;
    try {
      navigation = JSON.parse(nav);
      if (!Array.isArray(navigation)) throw new Error();
    } catch {
      toast.error(
        "Navigation must be a JSON array of { label, path } entries."
      );
      return;
    }
    update.mutate({
      name,
      description: description || undefined,
      customDomain: domain || undefined,
      themeSettings: (settings.data?.site.theme_settings || {}) as Record<
        string,
        unknown
      >,
      navigation,
      defaultLocale: locale,
      timezone,
      seoDefaults: (settings.data?.settings?.seo_defaults || {}) as Record<
        string,
        unknown
      >,
      featureFlags: (settings.data?.settings?.feature_flags || {}) as Record<
        string,
        boolean
      >,
    });
  };
  return (
    <Frame
      title="Publication settings"
      eyebrow="Scoped branding, navigation, and controls"
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Publication identity
              </h2>
              <p className="text-sm text-muted-foreground">
                Changes are limited to this publication and recorded in the
                audit trail.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Publication name
              </label>
              <Input
                value={name}
                onChange={event => setName(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <Textarea
                value={description}
                onChange={event => setDescription(event.target.value)}
                rows={3}
                className="mt-1.5 w-full bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Custom domain
              </label>
              <Input
                value={domain}
                onChange={event => setDomain(event.target.value)}
                placeholder="journal.example.com"
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Saving a domain stores the intended host. DNS, TLS, and
                verification remain external operations.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Locale
                </label>
                <Input
                  value={locale}
                  onChange={event => setLocale(event.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Timezone
                </label>
                <Input
                  value={timezone}
                  onChange={event => setTimezone(event.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <Button onClick={save} disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-[#fbfcfa] p-6 shadow-sm">
          <p className="font-label text-[10px] text-primary">Navigation JSON</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            Explicit public links
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use a JSON array such as{" "}
            <code>[&#123;"label":"Topics","path":"/topics"&#125;]</code>.
          </p>
          <Textarea
            value={nav}
            onChange={event => setNav(event.target.value)}
            rows={15}
            className="mt-5 w-full bg-white p-3 font-mono text-xs leading-5"
          />
          <div className="mt-4 rounded-lg border border-[#d6e2d1] bg-[#eff6ec] p-4 text-sm text-[#31513d]">
            Theme and feature-flag records are intentionally stored as
            structured site-scoped configuration. Advanced visual-builder
            controls will use the same safe settings boundary.
          </div>
        </section>
      </div>
    </Frame>
  );
}

export function StudioAudit() {
  const audit = trpc.studio.audit.list.useQuery({});
  return (
    <Frame title="Audit log" eyebrow="Traceable privileged activity">
      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {audit.isLoading ? (
          <div className="grid min-h-48 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : audit.data?.length ? (
          audit.data.map(event => {
            const actor = (
              event.profiles as unknown as Array<{
                display_name?: string | null;
                email?: string | null;
              }> | null
            )?.[0];
            return (
              <div
                key={event.id}
                className="grid gap-3 border-b border-border p-5 last:border-b-0 md:grid-cols-[1.2fr_.7fr_.8fr]"
              >
                <div>
                  <p className="font-medium">
                    {event.action.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {actor?.display_name || actor?.email || "System actor"} ·{" "}
                    {event.resource_type}
                  </p>
                </div>
                <pre className="overflow-x-auto rounded bg-muted p-2 text-[10px] text-muted-foreground">
                  {JSON.stringify(event.metadata)}
                </pre>
                <time className="text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleString()}
                </time>
              </div>
            );
          })
        ) : (
          <p className="p-14 text-center text-sm text-muted-foreground">
            No scoped audit events have been recorded yet.
          </p>
        )}
      </section>
    </Frame>
  );
}

export function StudioCapabilities() {
  const capabilities = trpc.studio.capabilities.list.useQuery();
  const setPolicy = trpc.studio.capabilities.set.useMutation({
    onSuccess: () => {
      capabilities.refetch();
      toast.success("Capability policy updated and audited.");
    },
    onError: error => toast.error(error.message),
  });
  const existing = (role: string, capabilityId: string) =>
    capabilities.data?.policy.find(
      item => item.role === role && item.capability_id === capabilityId
    )?.allowed;
  return (
    <Frame title="Capability policy" eyebrow="Role controls">
      <p className="mb-5 text-sm text-muted-foreground">
        Role permissions are server-enforced today. These scoped policy records
        establish an explicit, audited capability catalog for progressive
        enterprise controls.
      </p>
      <section className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#fbfcfa] font-label text-[10px] text-muted-foreground">
            <tr>
              <th className="p-4">Capability</th>
              <th className="p-4">Risk</th>
              <th className="p-4">Author</th>
              <th className="p-4">Editor</th>
              <th className="p-4">Admin</th>
            </tr>
          </thead>
          <tbody>
            {capabilities.data?.catalog.map(capability => (
              <tr key={capability.id} className="border-t border-border">
                <td className="p-4">
                  <p className="font-medium">{capability.capability_key}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {capability.description}
                  </p>
                </td>
                <td className="p-4 capitalize">{capability.risk_level}</td>
                {(["author", "editor", "admin"] as const).map(role => (
                  <td key={role} className="p-4">
                    <Button
                      size="sm"
                      variant={
                        existing(role, capability.id) === false
                          ? "outline"
                          : "secondary"
                      }
                      onClick={() => {
                        if (
                          window.confirm(
                            `Record ${role} policy for ${capability.capability_key}?`
                          )
                        )
                          setPolicy.mutate({
                            role,
                            capabilityId: capability.id,
                            allowed: existing(role, capability.id) === false,
                            confirmed: true,
                          });
                      }}
                    >
                      {existing(role, capability.id) === false
                        ? "Denied"
                        : "Allowed"}
                    </Button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Frame>
  );
}

export function StudioExport() {
  const [format, setFormat] = useState<"json" | "markdown">("json");
  const exportQuery = trpc.studio.exportContent.useQuery(
    { format },
    { enabled: false }
  );
  const download = async () => {
    const result = await exportQuery.refetch();
    if (!result.data) {
      toast.error("The export could not be prepared.");
      return;
    }
    const blob = new Blob([result.data.content], {
      type: format === "json" ? "application/json" : "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `codereport-global-export.${format === "json" ? "json" : "md"}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Content export downloaded and audited.");
  };
  return (
    <Frame title="Content export" eyebrow="Portable publication data">
      <section className="max-w-2xl rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Download className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Download your publication
            </h2>
            <p className="text-sm text-muted-foreground">
              Export posts, structured content, taxonomy, media metadata, and
              subscriber records scoped to this site.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Select
            value={format}
            onValueChange={value => setFormat(value as "json" | "markdown")}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">Structured JSON</SelectItem>
              <SelectItem value="markdown">Markdown bundle</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={download}
            disabled={exportQuery.isFetching}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exportQuery.isFetching ? "Preparing…" : "Download export"}
          </Button>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          Exports are created on demand; access is restricted to publication
          administrators and every request is audited.
        </p>
      </section>
    </Frame>
  );
}
