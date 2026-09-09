"use client";

import DashboardLayout from "@/admin-site/components/DashboardLayout";
import { MediaUploadButton } from "@/admin-site/components/MediaUploadButton";
import { PUBLIC_SITE_URL } from "@/admin-site/lib/publicSite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  ArrowDown,
  ArrowUp,
  Clapperboard,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Star,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const VIDEO_ACCEPT = "video/mp4,video/webm";

type Status = "draft" | "published";
type StatusFilter = "all" | Status;

// ————————————————————————————————————————————————————————————————————————
// Shared bits
// ————————————————————————————————————————————————————————————————————————

function Frame({
  title,
  eyebrow,
  intro,
  siteAnchor,
  onNew,
  newLabel,
  children,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  siteAnchor: string;
  onNew: () => void;
  newLabel: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
          <div>
            <p className="font-label text-[10px] text-primary">{eyebrow}</p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`${PUBLIC_SITE_URL}/${siteAnchor}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ExternalLink className="h-4 w-4" /> View on site
            </a>
            <Button onClick={onNew} className="gap-2">
              <Plus className="h-4 w-4" /> {newLabel}
            </Button>
          </div>
        </header>
        <p className="mb-5 max-w-2xl text-sm text-muted-foreground">{intro}</p>
        {children}
      </div>
    </DashboardLayout>
  );
}

function StatStrip({ total, published, drafts }: { total: number; published: number; drafts: number }) {
  const stats = [
    { label: "Total", value: total },
    { label: "Published", value: published },
    { label: "Drafts", value: drafts },
  ];
  return (
    <div className="mb-5 grid grid-cols-3 gap-3">
      {stats.map(stat => (
        <div key={stat.label} className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
          <p className="font-label text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

function FilterTabs({ value, onChange, counts }: { value: StatusFilter; onChange: (v: StatusFilter) => void; counts: Record<StatusFilter, number> }) {
  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Drafts" },
  ];
  return (
    <div className="inline-flex rounded-full border border-border bg-white p-1 shadow-sm">
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${value === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          {tab.label} <span className={`ml-1 text-xs ${value === tab.key ? "opacity-80" : "opacity-60"}`}>{counts[tab.key]}</span>
        </button>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="bg-white pl-9" />
    </div>
  );
}

function IconBtn({ title, onClick, danger, children }: { title: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg border border-border bg-white shadow-sm transition-colors hover:bg-accent ${danger ? "text-muted-foreground hover:text-destructive" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function StatusDot({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "published" ? "bg-emerald-500" : "bg-slate-400"}`} />
      {status === "published" ? "Live" : "Draft"}
    </span>
  );
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">No rating</span>;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
      ))}
    </span>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 block text-xs font-semibold text-foreground">
      {children}
      {hint && <span className="ml-1.5 font-normal text-muted-foreground">{hint}</span>}
    </span>
  );
}

function EmptyState({ icon, title, body, actionLabel, onAction }: { icon: React.ReactNode; title: string; body: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-border bg-white px-6 py-14 text-center shadow-sm">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <p className="mt-2 font-display text-lg font-semibold">{title}</p>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">{body}</p>
      <Button onClick={onAction} className="mt-3 gap-2"><Plus className="h-4 w-4" /> {actionLabel}</Button>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————————————
// Video reviews
// ————————————————————————————————————————————————————————————————————————

type ReviewRecord = {
  id: string;
  customer_name: string;
  tour_slug: string | null;
  video_url: string;
  thumbnail_url: string | null;
  quote: string | null;
  rating: number | null;
  sort_order: number;
  status: Status;
};

const emptyReviewForm = {
  customerName: "",
  tourSlug: "",
  videoUrl: "",
  thumbnailUrl: "",
  quote: "",
  rating: "none",
  sortOrder: "0",
  status: "draft" as Status,
};

function reviewToInput(review: ReviewRecord) {
  return {
    customerName: review.customer_name ?? "",
    tourSlug: review.tour_slug ?? "",
    videoUrl: review.video_url ?? "",
    thumbnailUrl: review.thumbnail_url ?? "",
    quote: review.quote ?? "",
    rating: review.rating ?? null,
    sortOrder: review.sort_order ?? 0,
    status: review.status ?? "draft",
  };
}

function ReviewDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ReviewRecord | null;
  form: typeof emptyReviewForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyReviewForm>>;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6 text-left">
          <p className="font-label text-[10px] text-primary">Video review</p>
          <DialogTitle className="mt-1 font-display text-xl">{editing ? `Edit — ${editing.customer_name}` : "New video review"}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <section>
            <FieldLabel hint="tap to upload a phone clip · MP4/WebM · max 50 MB">Customer video *</FieldLabel>
            {form.videoUrl ? (
              <div className="space-y-2">
                <video src={form.videoUrl} controls preload="metadata" playsInline className="max-h-60 w-full rounded-xl bg-black" />
                <div className="flex flex-wrap gap-2">
                  <MediaUploadButton accept={VIDEO_ACCEPT} folder="reviews" maxMB={50} label="Replace video" onUploaded={asset => setForm(f => ({ ...f, videoUrl: asset.url }))} />
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setForm(f => ({ ...f, videoUrl: "" }))}>
                    <X className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <MediaUploadButton accept={VIDEO_ACCEPT} folder="reviews" maxMB={50} label="Tap to upload video" onUploaded={asset => setForm(f => ({ ...f, videoUrl: asset.url }))} />
            )}
          </section>
          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Customer name *</FieldLabel>
              <Input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="e.g. Priya Sharma" />
            </div>
            <div>
              <FieldLabel hint="optional">Tour</FieldLabel>
              <Input value={form.tourSlug} onChange={e => setForm(f => ({ ...f, tourSlug: e.target.value }))} placeholder="e.g. sundarban-2-days-1-night" />
            </div>
          </section>
          <section>
            <FieldLabel hint="their own words · optional">Quote</FieldLabel>
            <Textarea rows={2} value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} placeholder="What they said about the trip" />
          </section>
          <section>
            <FieldLabel hint="optional">Thumbnail</FieldLabel>
            {form.thumbnailUrl ? (
              <div className="flex items-center gap-3">
                <img src={form.thumbnailUrl} alt="" className="h-16 w-24 rounded-lg object-cover" />
                <div className="flex flex-wrap gap-2">
                  <MediaUploadButton accept={IMAGE_ACCEPT} folder="reviews" label="Replace" onUploaded={asset => setForm(f => ({ ...f, thumbnailUrl: asset.url }))} />
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setForm(f => ({ ...f, thumbnailUrl: "" }))}>
                    <X className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <MediaUploadButton accept={IMAGE_ACCEPT} folder="reviews" label="Tap to upload thumbnail" onUploaded={asset => setForm(f => ({ ...f, thumbnailUrl: asset.url }))} />
            )}
          </section>
          <section className="grid grid-cols-3 gap-4">
            <div>
              <FieldLabel>Rating</FieldLabel>
              <Select value={form.rating} onValueChange={v => setForm(f => ({ ...f, rating: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {[5, 4, 3, 2, 1].map(n => <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Order</FieldLabel>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Status }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-background px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : editing ? "Save review" : "Publish review"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StudioVideoReviews() {
  const reviews = trpc.studio.catalog.reviews.list.useQuery();
  const create = trpc.studio.catalog.reviews.create.useMutation({
    onSuccess: () => { reviews.refetch(); toast.success("Video review added."); },
    onError: e => toast.error(e.message),
  });
  const update = trpc.studio.catalog.reviews.update.useMutation({
    onSuccess: () => { reviews.refetch(); },
    onError: e => toast.error(e.message),
  });
  const remove = trpc.studio.catalog.reviews.remove.useMutation({
    onSuccess: () => { reviews.refetch(); toast.success("Video review deleted."); },
    onError: e => toast.error(e.message),
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ReviewRecord | null>(null);
  const [form, setForm] = useState({ ...emptyReviewForm });
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const ordered = useMemo(() => [...(reviews.data ?? [])] as ReviewRecord[], [reviews.data]);
  const counts = useMemo(() => ({
    all: ordered.length,
    published: ordered.filter(r => r.status === "published").length,
    draft: ordered.filter(r => r.status !== "published").length,
  }), [ordered]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ordered.filter(r =>
      (filter === "all" || r.status === filter) &&
      (!q || `${r.customer_name} ${r.tour_slug ?? ""} ${r.quote ?? ""}`.toLowerCase().includes(q)),
    );
  }, [ordered, filter, search]);

  const openNew = () => { setEditing(null); setForm({ ...emptyReviewForm }); setEditorOpen(true); };
  const openEdit = (review: ReviewRecord) => {
    setEditing(review);
    setForm({
      customerName: review.customer_name ?? "",
      tourSlug: review.tour_slug ?? "",
      videoUrl: review.video_url ?? "",
      thumbnailUrl: review.thumbnail_url ?? "",
      quote: review.quote ?? "",
      rating: review.rating ? String(review.rating) : "none",
      sortOrder: String(review.sort_order ?? 0),
      status: review.status ?? "draft",
    });
    setEditorOpen(true);
  };

  const save = () => {
    if (!form.customerName.trim()) { toast.error("Customer name is required."); return; }
    if (!form.videoUrl.trim()) { toast.error("Upload the customer's video first — tap the upload button."); return; }
    const payload = {
      customerName: form.customerName.trim(),
      tourSlug: form.tourSlug.trim(),
      videoUrl: form.videoUrl.trim(),
      thumbnailUrl: form.thumbnailUrl.trim(),
      quote: form.quote.trim(),
      rating: form.rating === "none" ? null : Number.parseInt(form.rating, 10),
      sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
      status: form.status,
    };
    if (editing) {
      update.mutate({ id: editing.id, data: payload }, { onSuccess: () => { setEditorOpen(false); toast.success("Video review saved."); } });
    } else {
      create.mutate(payload, { onSuccess: () => setEditorOpen(false) });
    }
  };

  const toggleStatus = (review: ReviewRecord) => {
    const next = review.status === "published" ? "draft" : "published";
    update.mutate({ id: review.id, data: { ...reviewToInput(review), status: next } }, {
      onSuccess: () => toast.success(next === "published" ? "Review is now live on the site." : "Review moved back to drafts."),
    });
  };

  const move = async (review: ReviewRecord, dir: -1 | 1) => {
    const idx = ordered.findIndex(r => r.id === review.id);
    const other = ordered[idx + dir];
    if (!other) return;
    let aOrder = other.sort_order ?? 0;
    const bOrder = review.sort_order ?? 0;
    if (aOrder === bOrder) aOrder = bOrder + dir;
    try {
      await update.mutateAsync({ id: review.id, data: { ...reviewToInput(review), sortOrder: aOrder } });
      await update.mutateAsync({ id: other.id, data: { ...reviewToInput(other), sortOrder: bOrder } });
      reviews.refetch();
    } catch {
      toast.error("Could not reorder.");
    }
  };

  const saving = create.isPending || update.isPending;

  return (
    <Frame
      title="Video reviews"
      eyebrow="Showcase · real traveller stories"
      intro="Upload short clips customers share after their trip. Published reviews appear on the homepage — only genuine uploads, never stock footage."
      siteAnchor="#stories"
      onNew={openNew}
      newLabel="New review"
    >
      <StatStrip total={counts.all} published={counts.published} drafts={counts.draft} />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs value={filter} onChange={setFilter} counts={counts} />
        <SearchBox value={search} onChange={setSearch} placeholder="Search name, tour, quote…" />
      </div>

      {reviews.isLoading ? (
        <div className="grid min-h-48 place-items-center rounded-xl border border-border bg-white"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : visible.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((review, i) => {
            const position = ordered.findIndex(r => r.id === review.id) + 1;
            const playing = playingId === review.id;
            return (
              <article key={review.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="relative bg-black">
                  {playing ? (
                    <video src={review.video_url} poster={review.thumbnail_url ?? undefined} controls autoPlay playsInline className="aspect-video w-full" />
                  ) : (
                    <button type="button" onClick={() => setPlayingId(review.id)} className="relative block w-full" aria-label={`Play review by ${review.customer_name}`}>
                      {review.thumbnail_url ? (
                        <img src={review.thumbnail_url} alt="" className="aspect-video w-full object-cover opacity-90" />
                      ) : (
                        <video src={review.video_url} preload="metadata" muted playsInline className="aspect-video w-full object-cover opacity-90" />
                      )}
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
                          <Play className="ml-0.5 h-5 w-5 fill-primary text-primary" />
                        </span>
                      </span>
                      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">#{position}</span>
                    </button>
                  )}
                  {playing && (
                    <button type="button" onClick={() => setPlayingId(null)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white" aria-label="Stop preview">
                      <Pause className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{review.customer_name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{review.tour_slug || "Any tour"}</p>
                    </div>
                    <StatusDot status={review.status} />
                  </div>
                  <div className="mt-2"><Stars rating={review.rating} /></div>
                  {review.quote && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">“{review.quote}”</p>}
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <div className="flex gap-1.5">
                      <IconBtn title="Move up" onClick={() => move(review, -1)}><ArrowUp className="h-4 w-4" /></IconBtn>
                      <IconBtn title="Move down" onClick={() => move(review, 1)}><ArrowDown className="h-4 w-4" /></IconBtn>
                      <IconBtn title={review.status === "published" ? "Unpublish (hide from site)" : "Publish (show on site)"} onClick={() => toggleStatus(review)}>
                        {review.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </IconBtn>
                    </div>
                    <div className="flex gap-1.5">
                      <IconBtn title="Edit" onClick={() => openEdit(review)}><Pencil className="h-4 w-4" /></IconBtn>
                      <IconBtn title="Delete" danger onClick={() => { if (window.confirm(`Delete review by "${review.customer_name}"?`)) remove.mutate({ id: review.id }); }}>
                        <Trash2 className="h-4 w-4" />
                      </IconBtn>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : ordered.length ? (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="No matches"
          body="Nothing matches this filter. Try a different search or status tab."
          actionLabel="Clear search"
          onAction={() => { setSearch(""); setFilter("all"); }}
        />
      ) : (
        <EmptyState
          icon={<Clapperboard className="h-5 w-5" />}
          title="No video reviews yet"
          body="Upload the first customer clip — the homepage stories section stays hidden until one is published."
          actionLabel="Upload first review"
          onAction={openNew}
        />
      )}
      <p className="mt-4 text-xs text-muted-foreground">Tip: the # badge is the homepage order — arrows reorder, the eye toggles Live/Draft instantly.</p>

      <ReviewDialog open={editorOpen} onOpenChange={setEditorOpen} editing={editing} form={form} setForm={setForm} onSave={save} saving={saving} />
    </Frame>
  );
}

// ————————————————————————————————————————————————————————————————————————
// Food menu
// ————————————————————————————————————————————————————————————————————————

type MenuRecord = {
  id: string;
  name: string;
  description: string | null;
  price_note: string | null;
  image_url: string | null;
  category: string | null;
  sort_order: number;
  status: Status;
};

const emptyMenuForm = {
  name: "",
  category: "",
  description: "",
  priceNote: "",
  imageUrl: "",
  sortOrder: "0",
  status: "draft" as Status,
};

function menuToInput(item: MenuRecord) {
  return {
    name: item.name ?? "",
    description: item.description ?? "",
    priceNote: item.price_note ?? "",
    imageUrl: item.image_url ?? "",
    category: item.category ?? "",
    sortOrder: item.sort_order ?? 0,
    status: item.status ?? "draft",
  };
}

function MenuDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: MenuRecord | null;
  form: typeof emptyMenuForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyMenuForm>>;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6 text-left">
          <p className="font-label text-[10px] text-primary">Food menu</p>
          <DialogTitle className="mt-1 font-display text-xl">{editing ? `Edit — ${editing.name}` : "New dish"}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <section>
            <FieldLabel hint="tap to upload a real photo of the plate">Dish photo *</FieldLabel>
            {form.imageUrl ? (
              <div className="flex items-center gap-3">
                <img src={form.imageUrl} alt="" className="h-24 w-32 rounded-xl object-cover shadow-sm" />
                <div className="flex flex-wrap gap-2">
                  <MediaUploadButton accept={IMAGE_ACCEPT} folder="menu" label="Replace" onUploaded={asset => setForm(f => ({ ...f, imageUrl: asset.url }))} />
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}>
                    <X className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <MediaUploadButton accept={IMAGE_ACCEPT} folder="menu" label="Tap to upload photo" onUploaded={asset => setForm(f => ({ ...f, imageUrl: asset.url }))} />
            )}
          </section>
          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Dish name *</FieldLabel>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Bhetki fish curry & rice" />
            </div>
            <div>
              <FieldLabel hint="e.g. Lunch on the boat">Category</FieldLabel>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Breakfast · Lunch · Dinner · Snacks" />
            </div>
          </section>
          <section>
            <FieldLabel hint="what is served, how, where">Description</FieldLabel>
            <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Fresh catch, mustard gravy, steamed rice…" />
          </section>
          <section className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <FieldLabel hint="or “Included”">Price note</FieldLabel>
              <Input value={form.priceNote} onChange={e => setForm(f => ({ ...f, priceNote: e.target.value }))} placeholder="Included" />
            </div>
            <div>
              <FieldLabel>Order</FieldLabel>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Status }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-background px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : editing ? "Save dish" : "Add dish"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StudioFoodMenu() {
  const items = trpc.studio.catalog.foodMenu.list.useQuery();
  const create = trpc.studio.catalog.foodMenu.create.useMutation({
    onSuccess: () => { items.refetch(); toast.success("Menu item added."); },
    onError: e => toast.error(e.message),
  });
  const update = trpc.studio.catalog.foodMenu.update.useMutation({
    onSuccess: () => { items.refetch(); },
    onError: e => toast.error(e.message),
  });
  const remove = trpc.studio.catalog.foodMenu.remove.useMutation({
    onSuccess: () => { items.refetch(); toast.success("Menu item deleted."); },
    onError: e => toast.error(e.message),
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MenuRecord | null>(null);
  const [form, setForm] = useState({ ...emptyMenuForm });
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const ordered = useMemo(() => [...(items.data ?? [])] as MenuRecord[], [items.data]);
  const counts = useMemo(() => ({
    all: ordered.length,
    published: ordered.filter(r => r.status === "published").length,
    draft: ordered.filter(r => r.status !== "published").length,
  }), [ordered]);
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of ordered) if (item.category?.trim()) set.add(item.category.trim());
    return [...set].sort();
  }, [ordered]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ordered.filter(r =>
      (filter === "all" || r.status === filter) &&
      (category === "all" || (r.category ?? "").trim() === category) &&
      (!q || `${r.name} ${r.category ?? ""} ${r.description ?? ""}`.toLowerCase().includes(q)),
    );
  }, [ordered, filter, category, search]);

  const openNew = () => { setEditing(null); setForm({ ...emptyMenuForm }); setEditorOpen(true); };
  const openEdit = (item: MenuRecord) => {
    setEditing(item);
    setForm({
      name: item.name ?? "",
      category: item.category ?? "",
      description: item.description ?? "",
      priceNote: item.price_note ?? "",
      imageUrl: item.image_url ?? "",
      sortOrder: String(item.sort_order ?? 0),
      status: item.status ?? "draft",
    });
    setEditorOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) { toast.error("Dish name is required."); return; }
    if (!form.imageUrl.trim()) { toast.error("Upload a photo of the dish first — tap the upload button."); return; }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      priceNote: form.priceNote.trim(),
      imageUrl: form.imageUrl.trim(),
      category: form.category.trim(),
      sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
      status: form.status,
    };
    if (editing) {
      update.mutate({ id: editing.id, data: payload }, { onSuccess: () => { setEditorOpen(false); toast.success("Menu item saved."); } });
    } else {
      create.mutate(payload, { onSuccess: () => setEditorOpen(false) });
    }
  };

  const toggleStatus = (item: MenuRecord) => {
    const next = item.status === "published" ? "draft" : "published";
    update.mutate({ id: item.id, data: { ...menuToInput(item), status: next } }, {
      onSuccess: () => toast.success(next === "published" ? "Dish is now live on the site." : "Dish moved back to drafts."),
    });
  };

  const move = async (item: MenuRecord, dir: -1 | 1) => {
    const idx = ordered.findIndex(r => r.id === item.id);
    const other = ordered[idx + dir];
    if (!other) return;
    let aOrder = other.sort_order ?? 0;
    const bOrder = item.sort_order ?? 0;
    if (aOrder === bOrder) aOrder = bOrder + dir;
    try {
      await update.mutateAsync({ id: item.id, data: { ...menuToInput(item), sortOrder: aOrder } });
      await update.mutateAsync({ id: other.id, data: { ...menuToInput(other), sortOrder: bOrder } });
      items.refetch();
    } catch {
      toast.error("Could not reorder.");
    }
  };

  const saving = create.isPending || update.isPending;

  return (
    <Frame
      title="Food menu"
      eyebrow="Showcase · what travellers eat"
      intro="Photograph what the kitchen actually serves on tours and stays. Published dishes appear in the homepage food gallery."
      siteAnchor="#food"
      onNew={openNew}
      newLabel="New dish"
    >
      <StatStrip total={counts.all} published={counts.published} drafts={counts.draft} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs value={filter} onChange={setFilter} counts={counts} />
        <SearchBox value={search} onChange={setSearch} placeholder="Search dishes…" />
      </div>
      {categories.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {["all", ...categories].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${category === cat ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-white text-muted-foreground hover:text-foreground"}`}
            >
              {cat === "all" ? "All categories" : cat}
            </button>
          ))}
        </div>
      )}

      {items.isLoading ? (
        <div className="grid min-h-48 place-items-center rounded-xl border border-border bg-white"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : visible.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(item => {
            const position = ordered.findIndex(r => r.id === item.id) + 1;
            return (
              <article key={item.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="relative">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <div className="grid aspect-[4/3] w-full place-items-center bg-muted"><UtensilsCrossed className="h-8 w-8 text-muted-foreground" /></div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">#{position}</span>
                  <span className="absolute right-3 top-3"><StatusDot status={item.status} /></span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-semibold leading-snug">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.category || "Menu"}{item.price_note ? ` · ${item.price_note}` : ""}
                  </p>
                  {item.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>}
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <div className="flex gap-1.5">
                      <IconBtn title="Move up" onClick={() => move(item, -1)}><ArrowUp className="h-4 w-4" /></IconBtn>
                      <IconBtn title="Move down" onClick={() => move(item, 1)}><ArrowDown className="h-4 w-4" /></IconBtn>
                      <IconBtn title={item.status === "published" ? "Unpublish (hide from site)" : "Publish (show on site)"} onClick={() => toggleStatus(item)}>
                        {item.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </IconBtn>
                    </div>
                    <div className="flex gap-1.5">
                      <IconBtn title="Edit" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></IconBtn>
                      <IconBtn title="Delete" danger onClick={() => { if (window.confirm(`Delete "${item.name}"?`)) remove.mutate({ id: item.id }); }}>
                        <Trash2 className="h-4 w-4" />
                      </IconBtn>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : ordered.length ? (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="No matches"
          body="Nothing matches this filter. Try a different search, category or status tab."
          actionLabel="Clear filters"
          onAction={() => { setSearch(""); setFilter("all"); setCategory("all"); }}
        />
      ) : (
        <EmptyState
          icon={<UtensilsCrossed className="h-5 w-5" />}
          title="No dishes yet"
          body="Photograph the first plate — the homepage gallery stays hidden until one is published."
          actionLabel="Add first dish"
          onAction={openNew}
        />
      )}

      <MenuDialog open={editorOpen} onOpenChange={setEditorOpen} editing={editing} form={form} setForm={setForm} onSave={save} saving={saving} />
    </Frame>
  );
}
